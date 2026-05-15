import './HomePage.css'

function HomePage({ onUploadClick, onBrowseClick, totalCards, availableCards }) {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section glass-strong">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon"></span>
            Bienvenido a DEXswap
          </h1>
          <p className="hero-subtitle">
            Compra, vende e intercambia tus cartas Pokémon TCG favoritas en DEXswap — el mercado en línea para coleccionistas y jugadores.
          </p>
          <p className="hero-seo-line">
            Mercado de cartas Pokémon: compra, venta, intercambio y colección de cartas holográficas, rarezas y expansiones del juego de cartas coleccionables (TCG).
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={onUploadClick}>
              Sube tu primera carta
            </button>
            <button className="btn-large" onClick={onBrowseClick}>
              Explorar todas las cartas
            </button>
          </div>
        </div>
      </section>

      <section className="seo-section glass" aria-labelledby="seo-heading">
        <h2 id="seo-heading" className="seo-heading">
          Pokémon TCG en DEXswap
        </h2>
        <p className="seo-text">
          Explora un <strong>marketplace</strong> dedicado al <strong>trading card game</strong> de Pokémon: publica tus cartas, encuentra ofertas y conecta con otros <strong>coleccionistas</strong>. Busca por nombre, rareza o estado y haz crecer tu colección con confianza.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="stats-section">
        <div className="stat-card glass">
          <div className="stat-icon" aria-hidden="true">•</div>
          <div className="stat-value">{totalCards || 0}</div>
          <div className="stat-label">Total de Cartas</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon" aria-hidden="true">•</div>
          <div className="stat-value">{availableCards || 0}</div>
          <div className="stat-label">Disponibles</div>
        </div>
      </section>

      {/* Primary Actions */}
      <section className="actions-section">
        <h2 className="section-title">Comenzar</h2>
        <div className="actions-grid">
          <button className="action-card glass" onClick={onUploadClick}>
            <div className="action-title">Subir una carta</div>
            <div className="action-desc">Publica algo que quieras vender o intercambiar</div>
          </button>
          <button className="action-card glass" onClick={onBrowseClick}>
            <div className="action-title">Explorar publicaciones</div>
            <div className="action-desc">Encuentra cartas de otros coleccionistas</div>
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage

