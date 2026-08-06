import { useEffect, useState } from 'react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { cardsService, marketplaceService } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import './PurchaseModal.css'

const isDev = import.meta.env.DEV

function PurchaseModal({ card, onClose, onPurchaseComplete }) {
  const [paypalStatus, setPaypalStatus] = useState({ loading: true, enabled: false, clientId: null })
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    fetch('/api/paypal/client-id')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setPaypalStatus({
          loading: false,
          enabled: Boolean(data.enabled && data.clientId),
          clientId: data.clientId || null,
        })
      })
      .catch(() => {
        if (cancelled) return
        setPaypalStatus({ loading: false, enabled: false, clientId: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const assertStillAvailable = async () => {
    const fresh = await cardsService.getById(card.id)
    if (!fresh?.is_available) {
      throw new Error('Esta carta ya no está disponible')
    }
    if (Number(fresh.price) !== Number(card.price)) {
      throw new Error(`El precio cambió a $${fresh.price}. Cierra y vuelve a intentar.`)
    }
    return fresh
  }

  const completeOwnership = async (orderID) => {
    try {
      await marketplaceService.purchaseCard({ card_id: card.id })
    } catch (dbErr) {
      const msg = dbErr?.message || String(dbErr)
      throw new Error(
        orderID
          ? `Pago OK (orden ${orderID}), pero falló transferir la carta: ${msg}`
          : msg
      )
    }
  }

  const handleSimulatedPurchase = async () => {
    if (!isDev) return
    if (!window.confirm(`Simular compra de "${card.name}" por $${card.price}? (solo desarrollo)`)) {
      return
    }
    setBusy(true)
    try {
      await assertStillAvailable()
      await completeOwnership()
      toast.success('Compra simulada completada')
      onPurchaseComplete()
      onClose()
    } catch (e) {
      toast.error(e?.message || String(e))
    } finally {
      setBusy(false)
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
              <p className="purchase-muted">Paga de forma segura con PayPal.</p>
              <PayPalButtons
                disabled={busy}
                style={{ layout: 'vertical', label: 'paypal' }}
                createOrder={async () => {
                  await assertStillAvailable()
                  const res = await fetch('/api/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount: Number(card.price),
                      currency: 'USD',
                      cardId: card.id,
                    }),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'No se pudo crear la orden')
                  return data.id
                }}
                onApprove={async (data) => {
                  setBusy(true)
                  try {
                    const res = await fetch('/api/paypal/capture-order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderID: data.orderID }),
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error || 'No se pudo capturar el pago')
                    await completeOwnership(data.orderID)
                    toast.success('Pago capturado. ¡La carta es tuya!')
                    onPurchaseComplete()
                    onClose()
                  } catch (e) {
                    toast.error(e?.message || String(e))
                  } finally {
                    setBusy(false)
                  }
                }}
                onError={(err) => {
                  console.error(err)
                  toast.error('Error en PayPal. Inténtalo de nuevo.')
                }}
              />
            </div>
          </PayPalScriptProvider>
        ) : (
          <p className="purchase-muted">
            PayPal no está activo. Configura <code>PAYPAL_CLIENT_ID</code> y{' '}
            <code>PAYPAL_CLIENT_SECRET</code> en el servidor.
          </p>
        )}

        {isDev && (
          <>
            <div className="purchase-divider">o (dev)</div>
            <button
              type="button"
              className="purchase-sim-btn"
              onClick={handleSimulatedPurchase}
              disabled={busy}
            >
              Compra simulada (solo Supabase)
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PurchaseModal
