import { useState } from 'react'
import { cardsService } from '../lib/supabase'
import { CONDITION_OPTIONS, POKEMON_ELEMENTS, RARITY_OPTIONS } from '../lib/constants'
import { useToast } from '../context/ToastContext'
import './UploadCard.css'

const emptyForm = {
  category: 'pokemon',
  name: '',
  rarity: '',
  condition: '',
  element: '',
  price: '',
  merch_type: '',
  merch_condition: '',
  merch_brand: '',
  image: null,
}

function UploadCard({ onCardAdded, currentUserId }) {
  const [formData, setFormData] = useState(emptyForm)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')
  const toast = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const check = cardsService.validateImageFile(file)
    if (!check.ok) {
      setFormError(check.error)
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

    const isPokemon = formData.category === 'pokemon'
    const price = parseFloat(formData.price)
    const requiredOk =
      !!formData.name.trim() &&
      Number.isFinite(price) &&
      price > 0 &&
      (!isPokemon || (!!formData.rarity && !!formData.condition))

    if (!requiredOk) {
      setFormError('Completa los campos obligatorios. El precio debe ser mayor a 0.')
      return
    }

    if (!currentUserId) {
      setFormError('Debes iniciar sesión para publicar.')
      return
    }

    setUploading(true)
    setFormError('')

    try {
      let imageUrl = null

      if (formData.image) {
        try {
          imageUrl = await cardsService.uploadImage(formData.image)
        } catch (uploadError) {
          const continueWithout = window.confirm(
            `${uploadError.message}\n\n¿Continuar sin imagen?`
          )
          if (!continueWithout) {
            setUploading(false)
            return
          }
        }
      }

      const cardData = {
        category: formData.category,
        name: formData.name.trim(),
        rarity: isPokemon ? formData.rarity : null,
        condition: isPokemon ? formData.condition : null,
        element: isPokemon ? formData.element || null : null,
        price,
        image_url: imageUrl,
        is_available: true,
        merch_type: isPokemon ? null : formData.merch_type || null,
        merch_condition: isPokemon ? null : formData.merch_condition || null,
        merch_brand: isPokemon ? null : formData.merch_brand || null,
        owner_id: currentUserId,
      }

      const newCard = await cardsService.create(cardData)
      setFormData(emptyForm)
      setPreview(null)
      e.target.reset()
      onCardAdded(newCard)
    } catch (error) {
      const msg = error.message || 'Error al subir'
      // Soft-fail if element column missing in older schemas
      if (/element|column/i.test(msg) && formData.element) {
        try {
          const { element: _el, ...withoutElement } = {
            category: formData.category,
            name: formData.name.trim(),
            rarity: formData.category === 'pokemon' ? formData.rarity : null,
            condition: formData.category === 'pokemon' ? formData.condition : null,
            price,
            image_url: null,
            is_available: true,
            merch_type: formData.category === 'pokemon' ? null : formData.merch_type || null,
            merch_condition: formData.category === 'pokemon' ? null : formData.merch_condition || null,
            merch_brand: formData.category === 'pokemon' ? null : formData.merch_brand || null,
            owner_id: currentUserId,
          }
          if (formData.image) {
            withoutElement.image_url = await cardsService.uploadImage(formData.image).catch(() => null)
          }
          const newCard = await cardsService.create(withoutElement)
          toast.warn('Publicado. Añade la columna `element` en Supabase para filtrar por tipo.')
          setFormData(emptyForm)
          setPreview(null)
          onCardAdded(newCard)
          return
        } catch (retryErr) {
          setFormError(retryErr.message)
          toast.error(retryErr.message)
          return
        }
      }
      setFormError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-card glass-strong">
      <h2>Subir publicación</h2>
      <form onSubmit={handleSubmit}>
        <div className="upload-form-grid">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="upload-category">Categoría *</label>
              <select
                id="upload-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="pokemon">Carta Pokémon</option>
                <option value="merch">Mercancía</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="upload-name">Nombre *</label>
              <input
                id="upload-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ej., Pikachu VMAX / Peluche / Carpeta"
                required
                maxLength={120}
              />
            </div>

            {formData.category === 'pokemon' ? (
              <>
                <div className="form-group">
                  <label htmlFor="upload-rarity">Rareza *</label>
                  <select
                    id="upload-rarity"
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
                  <label htmlFor="upload-condition">Estado *</label>
                  <select
                    id="upload-condition"
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
                  <label htmlFor="upload-element">Tipo</label>
                  <select
                    id="upload-element"
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
                  <label htmlFor="upload-merch-type">Tipo de mercancía</label>
                  <input
                    id="upload-merch-type"
                    type="text"
                    name="merch_type"
                    value={formData.merch_type}
                    onChange={handleChange}
                    placeholder="ej., Peluche, Carpeta, Figura"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="upload-merch-condition">Estado</label>
                  <input
                    id="upload-merch-condition"
                    type="text"
                    name="merch_condition"
                    value={formData.merch_condition}
                    onChange={handleChange}
                    placeholder="ej., Nuevo, Como nuevo, Usado"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="upload-merch-brand">Marca</label>
                  <input
                    id="upload-merch-brand"
                    type="text"
                    name="merch_brand"
                    value={formData.merch_brand}
                    onChange={handleChange}
                    placeholder="ej., Pokémon Center"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="upload-price">Precio ($) *</label>
              <input
                id="upload-price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                max="999999"
                required
              />
            </div>
          </div>

          <div className="image-section">
            <div className="form-group">
              <label htmlFor="image-upload">Imagen (máx. 5 MB)</label>
              <div className="image-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  id="image-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-button">
                  {preview ? 'Cambiar Imagen' : 'Elegir Imagen'}
                </label>
                {preview && (
                  <div className="image-preview">
                    <img src={preview} alt="Vista previa" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? 'Subiendo…' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UploadCard
