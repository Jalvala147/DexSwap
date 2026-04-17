import { useState } from 'react'
import { cardsService } from '../lib/supabase'
import EditCardModal from './EditCardModal'
import './Card.css'

function Card({ card, onUpdate, currentUser }) {
  const [showTradeForm, setShowTradeForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  const handleBuy = async () => {
    if (!currentUser) {
      alert('Please sign in to purchase cards')
      return
    }

    if (currentUser.id === card.owner_id) {
      alert("You can't buy your own card!")
      return
    }

    if (window.confirm(`Buy "${card.name}" for $${card.price}?`)) {
      setPurchasing(true)
      try {
        // Transfer ownership to the buyer
        await cardsService.update(card.id, {
          owner_id: currentUser.id,
          is_available: false
        })
        alert('Purchase successful! The card is now yours.')
        onUpdate()
      } catch (error) {
        alert('Error purchasing card: ' + error.message)
      } finally {
        setPurchasing(false)
      }
    }
  }

  const handleProposeTrade = () => {
    if (!currentUser) {
      alert('Please sign in to propose trades')
      return
    }
    setShowTradeForm(!showTradeForm)
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
            <span className="no-image-icon">🎴</span>
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
                  onClick={handleBuy} 
                  className="buy-button"
                  disabled={purchasing}
                >
                  {purchasing ? 'Processing...' : `Buy Now $${card.price}`}
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
                ✏️ Edit Card
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
                {isAvailable ? '🔒 Mark Unavailable' : '🔓 Mark Available'}
              </button>
            </div>
          ) : (
            <div className="sold-badge">
              <span>Not Available</span>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditCardModal
          card={card}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}

export default Card

