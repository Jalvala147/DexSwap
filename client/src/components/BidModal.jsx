import './BidModal.css'

function BidModal({ card, highestBid, buyerName, bidAmount, onBuyerNameChange, onBidAmountChange, onBid, onClose }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onBid()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-strong" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Hacer una Oferta</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="card-preview">
            <h3>{card.name}</h3>
            <p>Precio Actual: <strong>${card.price}</strong></p>
            {highestBid > 0 && (
              <p>Oferta Más Alta: <strong>${highestBid.toFixed(2)}</strong></p>
            )}
            {highestBid === 0 && (
              <p className="no-bids">Sin ofertas. ¡Sé el primero!</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tu Nombre</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => onBuyerNameChange(e.target.value)}
                placeholder="Ingresa tu nombre"
                required
              />
            </div>

            <div className="form-group">
              <label>Monto de la Oferta</label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => onBidAmountChange(e.target.value)}
                placeholder={`Min: $${(highestBid || card.price * 0.9).toFixed(2)}`}
                min={highestBid || card.price * 0.9}
                step="0.01"
                required
              />
              {highestBid > 0 && (
                <p className="hint">Tu oferta debe ser mayor a ${highestBid.toFixed(2)}</p>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancelar
              </button>
              <button type="submit" className="submit-button">
                Hacer Oferta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BidModal

