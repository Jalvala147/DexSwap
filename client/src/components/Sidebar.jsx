import { useState, useEffect } from 'react'
import './Sidebar.css'

const POKEMON_ELEMENTS = [
  { id: 'fire', name: 'Fuego', image: '/elements/fire.png', color: '#FF4444' },
  { id: 'water', name: 'Agua', image: '/elements/water.png', color: '#00D4FF' },
  { id: 'electric', name: 'Eléctrico', image: '/elements/electric.png', color: '#FFB800' },
  { id: 'grass', name: 'Planta', image: '/elements/grass.png', color: '#10B981' },
  { id: 'ice', name: 'Hielo', image: '/elements/ice.png', color: '#60E5FF' },
  { id: 'fighting', name: 'Lucha', image: '/elements/fighting.png', color: '#FF6B6B' },
  { id: 'poison', name: 'Veneno', image: '/elements/poison.png', color: '#A855F7' },
  { id: 'ground', name: 'Tierra', image: '/elements/ground.png', color: '#D97706' },
  { id: 'flying', name: 'Volador', image: '/elements/flying.png', color: '#93C5FD' },
  { id: 'psychic', name: 'Psíquico', image: '/elements/psychic.png', color: '#EC4899' }
]

function Sidebar({ isOpen, onClose, onElementSelect }) {
  const [selectedElement, setSelectedElement] = useState(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleElementClick = (element) => {
    setSelectedElement(element.id)
    if (onElementSelect) {
      onElementSelect(element)
    }
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Elementos Pokémon</h2>
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        <div className="sidebar-content">
          <div className="elements-grid">
            {POKEMON_ELEMENTS.map((element) => (
              <button
                key={element.id}
                className={`element-card ${selectedElement === element.id ? 'selected' : ''}`}
                onClick={() => handleElementClick(element)}
                style={{ '--element-color': element.color }}
              >
                                <div className="element-icon">
                  <img
                    src={element.image}
                    alt={element.name}
                    className="element-image"
                  />
                </div>

                <div className="element-name">{element.name}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar