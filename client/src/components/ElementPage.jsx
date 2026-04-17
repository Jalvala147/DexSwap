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
          ← Back
        </button>
        <div className="element-header-content">
          <div 
            className="element-header-icon"
            style={{ color: element.color }}
          >
            {element.icon}
          </div>
          <div>
            <h1 className="element-title">{element.name} Type</h1>
            <p className="element-description">
              Explore all {element.name.toLowerCase()} type Pokemon cards
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading glass">
          <p>Loading {element.name} cards...</p>
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

