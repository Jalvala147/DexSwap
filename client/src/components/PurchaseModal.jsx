import { useEffect, useState } from 'react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { marketplaceService } from '../lib/supabase'
import './PurchaseModal.css'

function PurchaseModal({ card, onClose, onPurchaseComplete }) {
  const [paypalStatus, setPaypalStatus] = useState({ loading: true, enabled: false, clientId: null })

  useEffect(() => {
    fetch('/api/paypal/client-id')
      .then((r) => r.json())
      .then((data) => {
        setPaypalStatus({
          loading: false,
          enabled: Boolean(data.enabled && data.clientId),
          clientId: data.clientId || null,
        })
      })
      .catch(() => {
        setPaypalStatus({ loading: false, enabled: false, clientId: null })
      })
  }, [])

  const handleSimulatedPurchase = async () => {
    if (!window.confirm(`Simular compra en Supabase de "${card.name}" por $${card.price}? (sin PayPal)`)) {
      return
    }
    try {
      await marketplaceService.purchaseCard({ card_id: card.id })
      alert('Compra simulada OK (RPC purchase_card).')
      onPurchaseComplete()
      onClose()
    } catch (e) {
      alert(e?.message || String(e))
    }
  }

  return (
    <div className="purchase-modal-overlay" onClick={onClose} role="presentation">
      <div className="purchase-modal glass-strong" onClick={(e) => e.stopPropagation()}>
        <div className="purchase-modal-header">
          <h2>Comprar</h2>
          <button type="button" className="purchase-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <p className="purchase-summary">
          <strong>{card.name}</strong>
          <span className="purchase-price">${card.price}</span>
        </p>

        {paypalStatus.loading ? (
          <p className="purchase-muted">Comprobando PayPal…</p>
        ) : paypalStatus.enabled && paypalStatus.clientId ? (
          <PayPalScriptProvider
            options={{
              clientId: paypalStatus.clientId,
              currency: 'USD',
              intent: 'capture',
            }}
          >
            <div className="paypal-zone">
              <p className="purchase-muted">Sandbox: inicia sesión con una cuenta compradora de prueba.</p>
              <PayPalButtons
                style={{ layout: 'vertical', label: 'paypal' }}
                createOrder={async () => {
                  const res = await fetch('/api/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount: card.price,
                      currency: 'USD',
                      cardId: card.id,
                    }),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'No se pudo crear la orden')
                  return data.id
                }}
                onApprove={async (data) => {
                  try {
                    const res = await fetch('/api/paypal/capture-order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderID: data.orderID }),
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error || 'No se pudo capturar el pago')
                    try {
                      await marketplaceService.purchaseCard({ card_id: card.id })
                    } catch (dbErr) {
                      alert(
                        `PayPal OK (orden ${data.orderID}), pero falló actualizar Supabase: ${dbErr?.message || dbErr}. Revisa el RPC purchase_card.`
                      )
                      return
                    }
                    alert(`Pago PayPal capturado (sandbox). ID orden: ${data.orderID}`)
                    onPurchaseComplete()
                    onClose()
                  } catch (e) {
                    alert(e?.message || String(e))
                  }
                }}
                onError={(err) => {
                  console.error(err)
                  alert('Error en PayPal: revisa la consola.')
                }}
              />
            </div>
          </PayPalScriptProvider>
        ) : (
          <p className="purchase-muted">
            PayPal no está activo en el servidor. Arranca el backend (puerto 3001) y configura{' '}
            <code>PAYPAL_CLIENT_ID</code> y <code>PAYPAL_CLIENT_SECRET</code> en <code>server/.env</code>.
          </p>
        )}

        <div className="purchase-divider">o</div>
        <button type="button" className="purchase-sim-btn" onClick={handleSimulatedPurchase}>
          Compra simulada (solo Supabase)
        </button>
      </div>
    </div>
  )
}

export default PurchaseModal
