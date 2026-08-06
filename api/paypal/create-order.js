const paypal = require('../lib/paypal')

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  try {
    const raw = typeof req.body === 'string' ? req.body : ''
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!paypal.isConfigured()) {
      return res.status(503).json({ error: 'PayPal no configurado' })
    }
    const body = parseBody(req)
    const { amount, currency = 'USD', cardId } = body
    if (!cardId || typeof cardId !== 'string') {
      return res.status(400).json({ error: 'cardId requerido' })
    }
    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Monto inválido' })
    }
    // Amount still comes from the client; verify price/availability in the app
    // before createOrder, and complete ownership only after capture + RPC.
    const order = await paypal.createOrder({
      amountValue: Number(amount),
      currencyCode: currency,
      cardId,
    })
    return res.status(200).json({ id: order.id })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message || 'Error creando orden PayPal' })
  }
}
