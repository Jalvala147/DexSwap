import { useState, useEffect } from 'react'
import { POKEMON_ELEMENTS } from '../lib/constants'
import './Sidebar.css'

function ElementIcon({ element }) {
  const [imgFailed, setImgFailed] = useState(false)

  if (imgFailed) {
    return (
      <span className="element-symbol" style={{ color: element.color }} aria-hidden="true">
        {element.symbol}
      </span>
    )
  }

  return (
    <img
      src={element.image}
      alt=""
      className="element-image"
      loading="lazy"
      onError={() => setImgFailed(true)}
    />
  )
}

function Sidebar({ isOpen, onClose, onElementSelect }) {
  const [selectedElement, setSelectedElement] = useState(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleElementClick = (element) => {
    setSelectedElement(element.id)
    if (onElementSelect) onElementSelect(element)
    onClose()
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-hidden={!isOpen}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Tipos Pokémon</h2>
          <button type="button" className="sidebar-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="sidebar-content">
          <div className="elements-grid">
            {POKEMON_ELEMENTS.map((element) => (
              <button
                key={element.id}
                type="button"
                className={`element-card ${selectedElement === element.id ? 'selected' : ''}`}
                onClick={() => handleElementClick(element)}
                style={{ '--element-color': element.color }}
              >
                <div className="element-icon">
                  <ElementIcon element={element} />
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
