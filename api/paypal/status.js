const paypal = require('../lib/paypal')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  return res.status(200).json({
    enabled: paypal.isConfigured(),
    sandbox: paypal.SANDBOX,
  })
}
