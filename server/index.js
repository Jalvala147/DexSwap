require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paypal = require('./paypal');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('pokemon_marketplace.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Cards table
    db.run(`CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      seller_id TEXT,
      seller_name TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Bids table
    db.run(`CREATE TABLE IF NOT EXISTS bids (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )`);

    // Purchases table
    db.run(`CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )`);
  });
}

// API Routes

// Get all cards
app.get('/api/cards', (req, res) => {
  db.all('SELECT * FROM cards ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get single card with bids
app.get('/api/cards/:id', (req, res) => {
  const cardId = req.params.id;
  
  db.get('SELECT * FROM cards WHERE id = ?', [cardId], (err, card) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!card) {
      res.status(404).json({ error: 'Card not found' });
    } else {
      // Get bids for this card
      db.all('SELECT * FROM bids WHERE card_id = ? ORDER BY amount DESC, created_at DESC', [cardId], (err, bids) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({ ...card, bids: bids || [] });
        }
      });
    }
  });
});

// Upload a new card
app.post('/api/cards', upload.single('image'), (req, res) => {
  const { name, description, price, seller_id, seller_name } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const cardId = uuidv4();

  if (!name || !price || !seller_name) {
    return res.status(400).json({ error: 'Name, price, and seller name are required' });
  }

  db.run(
    'INSERT INTO cards (id, name, description, price, image_url, seller_id, seller_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [cardId, name, description, parseFloat(price), imageUrl, seller_id || 'anonymous', seller_name, 'available'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ 
          id: cardId, 
          name, 
          description, 
          price: parseFloat(price), 
          image_url: imageUrl,
          seller_id: seller_id || 'anonymous',
          seller_name,
          status: 'available'
        });
      }
    }
  );
});

// Place a bid
app.post('/api/bids', (req, res) => {
  const { card_id, user_id, user_name, amount } = req.body;

  if (!card_id || !user_name || !amount) {
    return res.status(400).json({ error: 'Card ID, user name, and amount are required' });
  }

  // Check if card exists and is available
  db.get('SELECT * FROM cards WHERE id = ? AND status = ?', [card_id, 'available'], (err, card) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!card) {
      return res.status(404).json({ error: 'Card not found or not available' });
    }

    const bidId = uuidv4();
    db.run(
      'INSERT INTO bids (id, card_id, user_id, user_name, amount) VALUES (?, ?, ?, ?, ?)',
      [bidId, card_id, user_id || 'anonymous', user_name, parseFloat(amount)],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({ 
            id: bidId, 
            card_id, 
            user_id: user_id || 'anonymous', 
            user_name, 
            amount: parseFloat(amount) 
          });
        }
      }
    );
  });
});

// Buy a card
app.post('/api/purchases', (req, res) => {
  const { card_id, buyer_id, buyer_name, amount } = req.body;

  if (!card_id || !buyer_name || !amount) {
    return res.status(400).json({ error: 'Card ID, buyer name, and amount are required' });
  }

  // Check if card exists and is available
  db.get('SELECT * FROM cards WHERE id = ? AND status = ?', [card_id, 'available'], (err, card) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!card) {
      return res.status(404).json({ error: 'Card not found or not available' });
    }

    const purchaseId = uuidv4();
    
    // Start transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Create purchase
      db.run(
        'INSERT INTO purchases (id, card_id, buyer_id, buyer_name, amount) VALUES (?, ?, ?, ?, ?)',
        [purchaseId, card_id, buyer_id || 'anonymous', buyer_name, parseFloat(amount)],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
        }
      );

      // Update card status
      db.run(
        'UPDATE cards SET status = ? WHERE id = ?',
        ['sold', card_id],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          db.run('COMMIT', (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ 
              id: purchaseId, 
              card_id, 
              buyer_id: buyer_id || 'anonymous', 
              buyer_name, 
              amount: parseFloat(amount) 
            });
          });
        }
      );
    });
  });
});

// Get bids for a card
app.get('/api/cards/:id/bids', (req, res) => {
  const cardId = req.params.id;
  
  db.all('SELECT * FROM bids WHERE card_id = ? ORDER BY amount DESC, created_at DESC', [cardId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// --- PayPal (Sandbox / Live): crea y captura órdenes; el secreto solo en servidor ---
app.get('/api/paypal/status', (req, res) => {
  res.json({
    enabled: paypal.isConfigured(),
    sandbox: paypal.SANDBOX,
  });
});

app.get('/api/paypal/client-id', (req, res) => {
  if (!paypal.isConfigured() || !process.env.PAYPAL_CLIENT_ID) {
    return res.status(503).json({
      enabled: false,
      error: 'PayPal no está configurado en el servidor (.env)',
    });
  }
  res.json({
    enabled: true,
    clientId: process.env.PAYPAL_CLIENT_ID,
    sandbox: paypal.SANDBOX,
  });
});

app.post('/api/paypal/create-order', async (req, res) => {
  try {
    if (!paypal.isConfigured()) {
      return res.status(503).json({ error: 'PayPal no configurado' });
    }
    const { amount, currency = 'USD', cardId } = req.body || {};
    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }
    const order = await paypal.createOrder({
      amountValue: Number(amount),
      currencyCode: currency,
      cardId: cardId || '',
    });
    res.json({ id: order.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Error creando orden PayPal' });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    if (!paypal.isConfigured()) {
      return res.status(503).json({ error: 'PayPal no configurado' });
    }
    const { orderID } = req.body || {};
    if (!orderID) {
      return res.status(400).json({ error: 'orderID requerido' });
    }
    const captureData = await paypal.captureOrder(orderID);
    res.json({ ok: true, capture: captureData });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Error capturando pago' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

