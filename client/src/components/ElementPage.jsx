import { useState, useEffect } from 'react'
import axios from 'axios'
import CardList from './CardList'
import './ElementPage.css'

function ElementPage({ element, onBack }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCards()
  }, [element])

  const fetchCards = async () => {
    try {
      const response = await axios.get('/api/cards')
      // Filter cards by element (in a real app, this would be done on the backend)
      // For now, we'll filter by name/description containing the element name
      const allCards = response.data
      const filteredCards = allCards.filter(card => 
        card.name.toLowerCase().includes(element.name.toLowerCase()) ||
        (card.description && card.description.toLowerCase().includes(element.name.toLowerCase()))
      )
      setCards(filteredCards)
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!element) {
    return null
  }

  return (
    <div className="element-page">
      <div className="element-header glass-strong">
        <button className="back-button" onClick={onBack}>
          ← Volver
        </button>
        <div className="element-header-content">
          <div 
            className="element-header-icon"
            style={{ color: element.color }}
          >
            {element.icon}
          </div>
          <div>
            <h1 className="element-title">Tipo {element.name}</h1>
            <p className="element-description">
              Explora todas las cartas Pokémon tipo {element.name.toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading glass">
          <p>Cargando cartas tipo {element.name}...</p>
        </div>
      ) : (
        <CardList 
          cards={cards} 
          onUpdate={fetchCards}
          searchQuery=""
        />
      )}
    </div>
  )
}

export default ElementPage

