import { useEffect, useState } from 'react'
import { cardsService, tradesService, tradeMessagesService } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import './TradeModal.css'

function TradeModal({ isOpen, onClose, currentUser, requestedCard, onTradeCreated }) {
  const [myCards, setMyCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return
    setLoading(true)
    setSelectedOfferId('')
    setMessage('')
    cardsService
      .getByOwner(currentUser.id)
      .then((cards) => setMyCards((cards || []).filter((c) => c.is_available && c.id !== requestedCard?.id)))
      .catch(() => setMyCards([]))
      .finally(() => setLoading(false))
  }, [isOpen, currentUser?.id, requestedCard?.id])

  if (!isOpen) return null

  const receiverId = requestedCard?.owner_id
  const canSubmit =
    !!selectedOfferId && !!receiverId && !submitting && currentUser?.id && requestedCard?.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    if (currentUser.id === receiverId) {
      toast.warn('No puedes intercambiar contigo mismo.')
      return
    }

    setSubmitting(true)
    try {
      const trade = await tradesService.create({
        sender_id: currentUser.id,
        receiver_id: receiverId,
        card_offered_id: selectedOfferId,
        card_requested_id: requestedCard.id,
      })

      const text = message.trim()
      if (text) {
        await tradeMessagesService.send({
          trade_id: trade.id,
          sender_id: currentUser.id,
          content: text,
        })
      }

      toast.success('Intercambio propuesto. Síguelo en Perfil → Intercambios.')
      if (typeof onTradeCreated === 'function') onTradeCreated(trade)
      onClose()
    } catch (err) {
      toast.error('Error al crear el intercambio: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="trade-modal-overlay" onClick={onClose}>
      <div className="trade-modal glass-strong" onClick={(e) => e.stopPropagation()}>
        <div className="trade-modal-header">
          <h2>Proponer intercambio</h2>
          <button type="button" className="trade-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="trade-modal-body">
          <div className="trade-summary glass">
            <div className="trade-summary-title">Carta solicitada</div>
            <div className="trade-summary-line">{requestedCard?.name || 'Carta'}</div>
            <div className="trade-summary-line muted">Precio: ${requestedCard?.price ?? '—'}</div>
          </div>

          <form onSubmit={handleSubmit} className="trade-form">
            <div className="form-group">
              <label htmlFor="trade-offer">Tu carta ofrecida</label>
              <select
                id="trade-offer"
                value={selectedOfferId}
                onChange={(e) => setSelectedOfferId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">
                  {loading
                    ? 'Cargando tus cartas…'
                    : myCards.length
                      ? 'Selecciona una de tus cartas'
                      : 'No tienes cartas disponibles'}
                </option>
                {myCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trade-message">Mensaje (opcional)</label>
              <textarea
                id="trade-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Agrega detalles (estado, envío, etc.)"
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="trade-actions">
              <button type="button" onClick={onClose} className="secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={!canSubmit || myCards.length === 0}>
                {submitting ? 'Enviando…' : 'Enviar oferta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TradeModal
