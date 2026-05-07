import { useEffect, useState } from 'react'
import { cardsService, tradesService, tradeMessagesService } from '../lib/supabase'
import './TradeModal.css'

function TradeModal({ isOpen, onClose, currentUser, requestedCard, onTradeCreated }) {
  const [myCards, setMyCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (!currentUser?.id) return
    setLoading(true)
    cardsService
      .getByOwner(currentUser.id)
      .then((cards) => setMyCards(cards || []))
      .catch((e) => {
        console.error('Error loading my cards:', e)
        setMyCards([])
      })
      .finally(() => setLoading(false))
  }, [isOpen, currentUser?.id])

  if (!isOpen) return null

  const receiverId = requestedCard?.owner_id
  const canSubmit =
    !!selectedOfferId && !!receiverId && !submitting && currentUser?.id && requestedCard?.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    if (currentUser.id === receiverId) {
      alert("You can't trade with yourself.")
      return
    }

    setSubmitting(true)
    try {
      const trade = await tradesService.create({
        sender_id: currentUser.id,
        receiver_id: receiverId,
        card_offered_id: selectedOfferId,
        card_requested_id: requestedCard.id
      })

      const text = message.trim()
      if (text) {
        await tradeMessagesService.send({
          trade_id: trade.id,
          sender_id: currentUser.id,
          content: text
        })
      }

      alert('Trade proposed. You can continue in Profile → Trades.')
      if (typeof onTradeCreated === 'function') onTradeCreated(trade)
      onClose()
    } catch (err) {
      alert('Error creating trade: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="trade-modal-overlay" onClick={onClose}>
      <div className="trade-modal glass-strong" onClick={(e) => e.stopPropagation()}>
        <div className="trade-modal-header">
          <h2>Propose trade</h2>
          <button className="trade-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="trade-modal-body">
          <div className="trade-summary glass">
            <div className="trade-summary-title">Requested listing</div>
            <div className="trade-summary-line">{requestedCard?.name || 'Card'}</div>
            <div className="trade-summary-line muted">Price: ${requestedCard?.price ?? '—'}</div>
          </div>

          <form onSubmit={handleSubmit} className="trade-form">
            <div className="form-group">
              <label>Your offered card</label>
              <select
                value={selectedOfferId}
                onChange={(e) => setSelectedOfferId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">
                  {loading ? 'Loading your cards…' : 'Select one of your cards'}
                </option>
                {myCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_available ? '' : '(not available)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add details (condition, shipping, etc.)"
                rows={4}
              />
            </div>

            <div className="trade-actions">
              <button type="button" onClick={onClose} className="secondary">
                Cancel
              </button>
              <button type="submit" disabled={!canSubmit}>
                {submitting ? 'Sending…' : 'Send trade offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TradeModal

