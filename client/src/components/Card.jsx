import { useState } from 'react'
import { cardsService } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import EditCardModal from './EditCardModal'
import TradeModal from './TradeModal'
import PurchaseModal from './PurchaseModal'
import './Card.css'

function Card({ card, onUpdate, currentUser }) {
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [toggling, setToggling] = useState(false)
  const toast = useToast()

  const handleOpenPurchase = () => {
    if (!currentUser) {
      toast.warn('Inicia sesión para comprar')
      return
    }
    if (currentUser.id === card.owner_id) {
      toast.warn('No puedes comprar tu propia carta')
      return
    }
    setShowPurchaseModal(true)
  }

  const handleProposeTrade = () => {
    if (!currentUser) {
      toast.warn('Inicia sesión para proponer intercambios')
      return
    }
    setShowTradeModal(true)
  }

  const handleToggleAvailability = async () => {
    if (toggling) return
    setToggling(true)
    try {
      await cardsService.update(card.id, { is_available: !card.is_available })
      toast.success(card.is_available ? 'Marcada como no disponible' : 'Marcada como disponible')
      onUpdate()
    } catch (error) {
      toast.error(error.message || 'Error al actualizar')
    } finally {
      setToggling(false)
    }
  }

  const isAvailable = card.is_available
  const ownerName = card.owner?.username || 'Desconocido'
  const isOwner = currentUser && currentUser.id === card.owner_id

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#9ca3af',
      uncommon: '#22c55e',
      rare: '#3b82f6',
      'holo rare': '#8b5cf6',
      'ultra rare': '#f59e0b',
      'secret rare': '#ef4444',
      legendary: '#ec4899',
    }
    return colors[rarity?.toLowerCase()] || '#9ca3af'
  }

  const getConditionColor = (condition) => {
    const colors = {
      mint: '#22c55e',
      'near mint': '#84cc16',
      excellent: '#eab308',
      good: '#f97316',
      played: '#ef4444',
      poor: '#991b1b',
    }
    return colors[condition?.toLowerCase()] || '#9ca3af'
  }

  return (
    <>
      <article className={`card glass-strong ${!isAvailable ? 'sold' : ''} ${isOwner ? 'owned' : ''}`}>
        {isOwner && <div className="owner-badge">Tu Carta</div>}

        {card.image_url ? (
          <div className="card-image">
            <img src={card.image_url} alt={card.name} loading="lazy" />
          </div>
        ) : (
          <div className="card-image no-image">
            <span className="no-image-icon" aria-hidden="true">
              •
            </span>
            <span className="no-image-text">Sin Imagen</span>
          </div>
        )}

        <div className="card-content">
          <h3>{card.name}</h3>

          <div className="card-badges">
            {card.rarity && (
              <span className="badge rarity-badge" style={{ backgroundColor: getRarityColor(card.rarity) }}>
                {card.rarity}
              </span>
            )}
            {card.condition && (
              <span
                className="badge condition-badge"
                style={{ backgroundColor: getConditionColor(card.condition) }}
              >
                {card.condition}
              </span>
            )}
            {card.merch_type && <span className="badge condition-badge">{card.merch_type}</span>}
          </div>

          <div className="card-info">
            <div className="price-section">
              <span className="price-label">Precio:</span>
              <span className="price">${card.price}</span>
            </div>
            <div className="seller-info">
              <span>Dueño: {ownerName}</span>
            </div>
          </div>

          {isAvailable && !isOwner ? (
            <div className="card-actions">
              <div className="action-buttons">
                <button type="button" onClick={handleOpenPurchase} className="buy-button">
                  Comprar — ${card.price}
                </button>
                <button type="button" onClick={handleProposeTrade} className="bid-button">
                  Proponer Intercambio
                </button>
              </div>
            </div>
          ) : isOwner ? (
            <div className="owner-actions">
              <button type="button" onClick={() => setShowEditModal(true)} className="edit-button">
                Editar
              </button>
              <button
                type="button"
                onClick={handleToggleAvailability}
                disabled={toggling}
                className={`toggle-availability ${isAvailable ? 'available' : 'unavailable'}`}
              >
                {toggling ? '…' : isAvailable ? 'Marcar no disponible' : 'Marcar disponible'}
              </button>
            </div>
          ) : (
            <div className="sold-badge">
              <span>No Disponible</span>
            </div>
          )}
        </div>
      </article>

      {showPurchaseModal && (
        <PurchaseModal
          card={card}
          onClose={() => setShowPurchaseModal(false)}
          onPurchaseComplete={() => {
            onUpdate()
            setShowPurchaseModal(false)
          }}
        />
      )}

      {showEditModal && (
        <EditCardModal
          card={card}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={onUpdate}
        />
      )}

      {showTradeModal && (
        <TradeModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          currentUser={currentUser}
          requestedCard={card}
          onTradeCreated={() => setShowTradeModal(false)}
        />
      )}
    </>
  )
}

export default Card
