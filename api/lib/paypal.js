/**
 * Lógica PayPal Sandbox compartida por Express local y Vercel Serverless.
 */
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET

const SANDBOX = true
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'

function isConfigured() {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET)
}

async function getAccessToken() {
  if (!isConfigured()) {
    throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET')
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString(
    'base64'
  )
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(
      data.error_description || data.error || data.message || JSON.stringify(data)
    )
  }
  return data.access_token
}

async function createOrder({ amountValue, currencyCode = 'USD', cardId = '' }) {
  const token = await getAccessToken()
  const n = typeof amountValue === 'number' ? amountValue : parseFloat(amountValue)
  if (Number.isNaN(n) || n <= 0) throw new Error('Invalid amount')

  const value = n.toFixed(2)

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          ...(cardId ? { reference_id: cardId, custom_id: cardId } : {}),
          amount: {
            currency_code: currencyCode,
            value,
          },
        },
      ],
    }),
  })
  const order = await res.json()
  if (!res.ok) {
    console.error('PayPal create order error:', order)
    const msg =
      order.message ||
      (Array.isArray(order.details) &&
        order.details.map((d) => d.issue || d.description).join('; ')) ||
      JSON.stringify(order)
    throw new Error(msg)
  }
  return order
}

async function captureOrder(orderID) {
  const token = await getAccessToken()
  const res = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )
  const capture = await res.json()
  if (!res.ok) {
    console.error('PayPal capture error:', capture)
    const msg =
      capture.message ||
      (Array.isArray(capture.details) &&
        capture.details.map((d) => d.issue || d.description).join('; ')) ||
      JSON.stringify(capture)
    throw new Error(msg)
  }
  return capture
}

module.exports = {
  SANDBOX,
  isConfigured,
  createOrder,
  captureOrder,
}
