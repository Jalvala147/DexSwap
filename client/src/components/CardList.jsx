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
          <p>Resultados para: <strong>"{searchQuery}"</strong> ({filteredCards.length} {filteredCards.length === 1 ? 'carta' : 'cartas'})</p>
        </div>
      )}
      
      <div className="filter-bar glass">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button 
          className={filter === 'available' ? 'active' : ''}
          onClick={() => setFilter('available')}
        >
          Disponibles
        </button>
        <button 
          className={filter === 'sold' ? 'active' : ''}
          onClick={() => setFilter('sold')}
        >
          No Disponibles
        </button>
      </div>

      {filteredCards.length === 0 ? (
        <div className="empty-state glass">
          <p>
            {searchQuery 
              ? `No se encontraron cartas para "${searchQuery}". ¡Prueba otra búsqueda!`
              : 'No se encontraron cartas. ¡Sé el primero en subir una!'}
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
