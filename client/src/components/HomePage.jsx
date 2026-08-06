import './HomePage.css'

function HomePage({ onUploadClick, onBrowseClick, totalCards, availableCards }) {
  return (
    <div className="homepage">
      <section className="hero-section" aria-label="DEXswap">
        <div className="hero-backdrop" aria-hidden="true" />
        <div className="hero-content">
          <img src="/dexswap.png" alt="" className="hero-mark" />
          <p className="hero-brand">DEXswap</p>
          <h1 className="hero-title">Tu mesa de intercambio Pokémon</h1>
          <p className="hero-subtitle">
            Publica, compra e intercambia cartas TCG con coleccionistas de verdad.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary btn-large" onClick={onUploadClick}>
              Publicar
            </button>
            <button type="button" className="btn-large hero-secondary" onClick={onBrowseClick}>
              Explorar
            </button>
          </div>
          {(totalCards > 0 || availableCards > 0) && (
            <p className="hero-meta">
              {availableCards} disponibles · {totalCards} en el mercado
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default HomePage
