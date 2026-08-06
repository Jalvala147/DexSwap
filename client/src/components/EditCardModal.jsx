import { useState } from 'react'
import { cardsService } from '../lib/supabase'
import { CONDITION_OPTIONS, POKEMON_ELEMENTS, RARITY_OPTIONS } from '../lib/constants'
import { useToast } from '../context/ToastContext'
import './EditCardModal.css'

function EditCardModal({ card, isOpen, onClose, onUpdate }) {
  const isMerch = card.category === 'merch'
  const [formData, setFormData] = useState({
    name: card.name || '',
    rarity: card.rarity || '',
    condition: card.condition || '',
    element: card.element || '',
    price: card.price || '',
    merch_type: card.merch_type || '',
    merch_condition: card.merch_condition || '',
    merch_brand: card.merch_brand || '',
    image: null,
  })
  const [preview, setPreview] = useState(card.image_url || null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const check = cardsService.validateImageFile(file)
    if (!check.ok) {
      toast.error(check.error)
      e.target.value = ''
      return
    }
    setFormData((prev) => ({ ...prev, image: file }))
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const price = parseFloat(formData.price)
    if (!formData.name.trim() || !Number.isFinite(price) || price <= 0) {
      toast.error('Nombre y precio válido son obligatorios')
      return
    }

    setSaving(true)
    try {
      let imageUrl = card.image_url

      if (formData.image) {
        imageUrl = await cardsService.uploadImage(formData.image)
      }

      const updates = {
        name: formData.name.trim(),
        price,
        image_url: imageUrl,
      }

      if (isMerch) {
        updates.merch_type = formData.merch_type || null
        updates.merch_condition = formData.merch_condition || null
        updates.merch_brand = formData.merch_brand || null
      } else {
        updates.rarity = formData.rarity
        updates.condition = formData.condition
        if (formData.element) updates.element = formData.element
      }

      try {
        await cardsService.update(card.id, updates)
      } catch (err) {
        if (updates.element && /element|column/i.test(err.message || '')) {
          delete updates.element
          await cardsService.update(card.id, updates)
          toast.warn('Guardado sin tipo — añade la columna `element` en Supabase.')
        } else {
          throw err
        }
      }

      toast.success('Publicación actualizada')
      onUpdate()
      onClose()
    } catch (error) {
      toast.error(error.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal glass-strong" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <h2>Editar {isMerch ? 'mercancía' : 'carta'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="edit-form-grid">
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="edit-name">Nombre</label>
                <input
                  id="edit-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={120}
                />
              </div>

              {!isMerch ? (
                <>
                  <div className="form-group">
                    <label htmlFor="edit-rarity">Rareza</label>
                    <select
                      id="edit-rarity"
                      name="rarity"
                      value={formData.rarity}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccionar Rareza</option>
                      {RARITY_OPTIONS.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {rarity}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-condition">Estado</label>
                    <select
                      id="edit-condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccionar Estado</option>
                      {CONDITION_OPTIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-element">Tipo</label>
                    <select
                      id="edit-element"
                      name="element"
                      value={formData.element}
                      onChange={handleChange}
                    >
                      <option value="">Sin especificar</option>
                      {POKEMON_ELEMENTS.map((el) => (
                        <option key={el.id} value={el.id}>
                          {el.symbol} {el.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="edit-merch-type">Tipo</label>
                    <input
                      id="edit-merch-type"
                      type="text"
                      name="merch_type"
                      value={formData.merch_type}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-merch-condition">Estado</label>
                    <input
                      id="edit-merch-condition"
                      type="text"
                      name="merch_condition"
                      value={formData.merch_condition}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-merch-brand">Marca</label>
                    <input
                      id="edit-merch-brand"
                      type="text"
                      name="merch_brand"
                      value={formData.merch_brand}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="edit-price">Precio ($)</label>
                <input
                  id="edit-price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            <div className="image-section">
              <div className="form-group">
                <label>Imagen</label>
                <div className="image-upload-area">
                  {preview ? (
                    <div className="image-preview">
                      <img src={preview} alt="Vista previa" />
                      <button
                        type="button"
                        className="change-image-btn"
                        onClick={() => document.getElementById('edit-image-input').click()}
                      >
                        Cambiar Imagen
                      </button>
                    </div>
                  ) : (
                    <div
                      className="upload-placeholder"
                      onClick={() => document.getElementById('edit-image-input').click()}
                    >
                      <span>Haz clic para subir una imagen</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="edit-image-input"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="save-btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCardModal
