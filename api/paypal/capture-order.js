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
    const { orderID } = body
    if (!orderID) {
      return res.status(400).json({ error: 'orderID requerido' })
    }
    const captureData = await paypal.captureOrder(orderID)
    return res.status(200).json({ ok: true, capture: captureData })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message || 'Error capturando pago' })
  }
}
