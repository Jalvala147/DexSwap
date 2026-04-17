# Pokemon Card Marketplace

A beautiful Pokemon card marketplace with Apple-inspired liquid glass (glassmorphism) design. Sellers can upload cards, and users can place bids or buy cards directly.

## Features

- 🎴 **Card Upload**: Sellers can upload Pokemon cards with images, descriptions, and prices
- 💰 **Bidding System**: Users can place bids on cards
- 🛒 **Buy Now**: Users can purchase cards instantly at the listed price
- 🎨 **Glassmorphism UI**: Beautiful Apple-inspired liquid glass design with animated gradients
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite
- **File Upload**: Multer

## Setup Instructions

### 1. Install Dependencies

From the root directory, run:

```bash
npm run install-all
```

This will install dependencies for the root, server, and client.

### 2. Start the Application

Run both the server and client simultaneously:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Start server
npm run server

# Terminal 2 - Start client
npm run client
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Project Structure

```
pokemon/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   └── package.json
├── server/                # Express backend
│   ├── index.js          # Server entry point
│   ├── uploads/          # Uploaded images (created automatically)
│   └── package.json
└── package.json          # Root package.json
```

## API Endpoints

- `GET /api/cards` - Get all cards
- `GET /api/cards/:id` - Get a single card with bids
- `POST /api/cards` - Upload a new card (multipart/form-data)
- `POST /api/bids` - Place a bid on a card
- `POST /api/purchases` - Buy a card
- `GET /api/cards/:id/bids` - Get all bids for a card

## Usage

1. **Upload a Card**: Click "Upload Card" button, fill in the details, upload an image, and submit
2. **Place a Bid**: Click "Place Bid" on any available card, enter your name and bid amount
3. **Buy Now**: Enter your name and click "Buy Now" to purchase at the listed price
4. **Filter Cards**: Use the filter buttons to view all cards, available cards, or sold cards

## Database

The application uses SQLite with the following tables:
- `cards` - Stores card information
- `bids` - Stores bid information
- `purchases` - Stores purchase information

The database file (`pokemon_marketplace.db`) is created automatically on first run.

## Notes

- Images are stored in the `server/uploads/` directory
- The database file is created in the `server/` directory
- All prices and bids are stored as decimal numbers

