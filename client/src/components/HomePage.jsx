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
          <div className="stat-icon">📊</div>
          <div className="stat-value">{totalCards || 0}</div>
          <div className="stat-label">Total Cards</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{availableCards || 0}</div>
          <div className="stat-label">Available</div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">New</div>
          <div className="stat-label">Today</div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card glass" onClick={onUploadClick}>
            <div className="action-icon">📤</div>
            <div className="action-title">Upload Card</div>
            <div className="action-desc">Sell your Pokemon cards</div>
          </button>
          <button className="action-card glass">
            <div className="action-icon">🔍</div>
            <div className="action-title">Search Cards</div>
            <div className="action-desc">Find specific cards</div>
          </button>
          <button className="action-card glass">
            <div className="action-icon">💎</div>
            <div className="action-title">Featured</div>
            <div className="action-desc">Popular cards</div>
          </button>
          <button className="action-card glass">
            <div className="action-icon">⚡</div>
            <div className="action-title">Hot Deals</div>
            <div className="action-desc">Best prices</div>
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage

