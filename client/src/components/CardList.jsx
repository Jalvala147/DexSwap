import { useState } from 'react'
import Card from './Card'
import './CardList.css'

function CardList({ cards, onUpdate, searchQuery, currentUser }) {
  const [filter, setFilter] = useState('all')

  const filteredCards = cards.filter(card => {
    if (filter === 'available') return card.is_available === true
    if (filter === 'sold') return card.is_available === false
    return true
  })

  return (
    <div className="card-list-container">
      {searchQuery && (
        <div className="search-results-info glass">
          <p>Search results for: <strong>"{searchQuery}"</strong> ({filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'})</p>
        </div>
      )}
      
      <div className="filter-bar glass">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Cards
        </button>
        <button 
          className={filter === 'available' ? 'active' : ''}
          onClick={() => setFilter('available')}
        >
          Available
        </button>
        <button 
          className={filter === 'sold' ? 'active' : ''}
          onClick={() => setFilter('sold')}
        >
          Not Available
        </button>
      </div>

      {filteredCards.length === 0 ? (
        <div className="empty-state glass">
          <p>
            {searchQuery 
              ? `No cards found matching "${searchQuery}". Try a different search!`
              : 'No cards found. Be the first to upload one!'}
          </p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredCards.map(card => (
            <Card 
              key={card.id} 
              card={card} 
              onUpdate={onUpdate}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CardList
