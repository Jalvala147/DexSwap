const paypal = require('../lib/paypal')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!paypal.isConfigured() || !process.env.PAYPAL_CLIENT_ID) {
    return res.status(503).json({
      enabled: false,
      error: 'PayPal no está configurado (variables de entorno en Vercel)',
    })
  }

  return res.status(200).json({
    enabled: true,
    clientId: process.env.PAYPAL_CLIENT_ID,
    sandbox: paypal.SANDBOX,
  })
}
