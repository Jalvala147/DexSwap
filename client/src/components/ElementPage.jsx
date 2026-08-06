import { useMemo } from 'react'
import { matchesElement } from '../lib/constants'
import CardList from './CardList'
import './ElementPage.css'

function ElementPage({ element, cards = [], loading, onUpdate, currentUser, onBack }) {
  const filtered = useMemo(() => {
    if (!element) return []
    return (cards || []).filter((card) => matchesElement(card, element))
  }, [cards, element])

  if (!element) return null

  return (
    <div className="element-page">
      <div
        className="element-header glass-strong"
        style={{ '--element-color': element.color }}
      >
        <button type="button" className="back-button" onClick={onBack}>
          ← Volver
        </button>
        <div className="element-header-content">
          <div className="element-header-icon" style={{ color: element.color }} aria-hidden="true">
            {element.symbol}
          </div>
          <div>
            <h1 className="element-title">Tipo {element.name}</h1>
            <p className="element-description">
              {loading
                ? `Cargando cartas tipo ${element.name.toLowerCase()}…`
                : `${filtered.length} publicación${filtered.length === 1 ? '' : 'es'}`}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading glass">
          <p>Cargando cartas tipo {element.name}…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass">
          <p>
            No hay publicaciones etiquetadas como {element.name}. Al subir una carta Pokémon puedes
            elegir el tipo.
          </p>
        </div>
      ) : (
        <CardList cards={filtered} onUpdate={onUpdate} searchQuery="" currentUser={currentUser} />
      )}
    </div>
  )
}

export default ElementPage
