import { useState } from 'react'
import { cardsService } from '../lib/supabase'
import EditCardModal from './EditCardModal'
import TradeModal from './TradeModal'
import PurchaseModal from './PurchaseModal'
import './Card.css'

function Card({ card, onUpdate, currentUser }) {
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const handleOpenPurchase = () => {
    if (!currentUser) {
      alert('Inicia sesión para comprar')
      return
    }

    if (currentUser.id === card.owner_id) {
      alert('No puedes comprar tu propia carta')
      return
    }

    setShowPurchaseModal(true)
  }

  const handleProposeTrade = () => {
    if (!currentUser) {
      alert('Please sign in to propose trades')
      return
    }
    setShowTradeModal(true)
  }

  const isAvailable = card.is_available
  const ownerName = card.owner?.username || 'Unknown'
  const isOwner = currentUser && currentUser.id === card.owner_id

  // Get rarity color for badge
  const getRarityColor = (rarity) => {
    const colors = {
      'common': '#9ca3af',
      'uncommon': '#22c55e',
      'rare': '#3b82f6',
      'holo rare': '#8b5cf6',
      'ultra rare': '#f59e0b',
      'secret rare': '#ef4444',
      'legendary': '#ec4899'
    }
    return colors[rarity?.toLowerCase()] || '#9ca3af'
  }

  // Get condition color
  const getConditionColor = (condition) => {
    const colors = {
      'mint': '#22c55e',
      'near mint': '#84cc16',
      'excellent': '#eab308',
      'good': '#f97316',
      'played': '#ef4444',
      'poor': '#991b1b'
    }
    return colors[condition?.toLowerCase()] || '#9ca3af'
  }

  return (
    <>
      <div className={`card glass-strong ${!isAvailable ? 'sold' : ''} ${isOwner ? 'owned' : ''}`}>
        {isOwner && (
          <div className="owner-badge">Your Card</div>
        )}
        
        {card.image_url ? (
          <div className="card-image">
            <img src={card.image_url} alt={card.name} />
          </div>
        ) : (
          <div className="card-image no-image">
            <span className="no-image-icon" aria-hidden="true">•</span>
            <span className="no-image-text">No Image</span>
          </div>
        )}
        
        <div className="card-content">
          <h3>{card.name}</h3>
          
          <div className="card-badges">
            {card.rarity && (
              <span 
                className="badge rarity-badge"
                style={{ backgroundColor: getRarityColor(card.rarity) }}
              >
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
          </div>
          
          <div className="card-info">
            <div className="price-section">
              <span className="price-label">Price:</span>
              <span className="price">${card.price}</span>
            </div>

            <div className="seller-info">
              <span>Owner: {ownerName}</span>
            </div>
          </div>

          {isAvailable && !isOwner ? (
            <div className="card-actions">
              <div className="action-buttons">
                <button 
                  onClick={handleOpenPurchase} 
                  className="buy-button"
                >
                  Comprar — ${card.price}
                </button>
                <button 
                  onClick={handleProposeTrade} 
                  className="bid-button"
                >
                  Propose Trade
                </button>
              </div>
            </div>
          ) : isOwner ? (
            <div className="owner-actions">
              <button 
                onClick={() => setShowEditModal(true)}
                className="edit-button"
              >
                Edit
              </button>
              <button 
                onClick={async () => {
                  try {
                    await cardsService.update(card.id, { is_available: !isAvailable })
                    onUpdate()
                  } catch (error) {
                    alert('Error: ' + error.message)
                  }
                }}
                className={`toggle-availability ${isAvailable ? 'available' : 'unavailable'}`}
              >
                {isAvailable ? 'Mark unavailable' : 'Mark available'}
              </button>
            </div>
          ) : (
            <div className="sold-badge">
              <span>Not Available</span>
            </div>
          )}
        </div>
      </div>

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
          onTradeCreated={() => {
            setShowTradeModal(false)
          }}
        />
      )}
    </>
  )
}

export default Card

