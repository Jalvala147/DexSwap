import './HomePage.css'

function HomePage({ onUploadClick, onBrowseClick, totalCards, availableCards }) {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section glass-strong">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon"></span>
            Welcome to DEXswap
          </h1>
          <p className="hero-subtitle">
            Buy, sell, and trade your favorite Pokémon TCG cards on DEXswap — the online marketplace for collectors and players.
          </p>
          <p className="hero-seo-line">
            Mercado de cartas Pokémon: compra, venta, intercambio y colección de cartas holográficas, rarezas y expansiones del juego de cartas coleccionables (TCG).
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={onUploadClick}>
              Upload Your First Card
            </button>
            <button className="btn-large" onClick={onBrowseClick}>
              Browse All Cards
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
          <div className="stat-label">Total Cards</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon" aria-hidden="true">•</div>
          <div className="stat-value">{availableCards || 0}</div>
          <div className="stat-label">Available</div>
        </div>
      </section>

      {/* Primary Actions */}
      <section className="actions-section">
        <h2 className="section-title">Get started</h2>
        <div className="actions-grid">
          <button className="action-card glass" onClick={onUploadClick}>
            <div className="action-title">Upload a card</div>
            <div className="action-desc">List something you want to sell or trade</div>
          </button>
          <button className="action-card glass" onClick={onBrowseClick}>
            <div className="action-title">Browse listings</div>
            <div className="action-desc">Find cards from other collectors</div>
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage

