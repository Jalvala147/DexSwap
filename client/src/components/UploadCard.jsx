import { useState } from 'react'
import { cardsService } from '../lib/supabase'
import './UploadCard.css'

const RARITY_OPTIONS = [
  'Common',
  'Uncommon', 
  'Rare',
  'Holo Rare',
  'Ultra Rare',
  'Secret Rare',
  'Legendary'
]

const CONDITION_OPTIONS = [
  'Mint',
  'Near Mint',
  'Excellent',
  'Good',
  'Played',
  'Poor'
]

function UploadCard({ onCardAdded, currentUserId }) {
  const [formData, setFormData] = useState({
    category: 'pokemon', // 'pokemon' | 'merch'
    name: '',
    rarity: '',
    condition: '',
    price: '',
    merch_type: '',
    merch_condition: '',
    merch_brand: '',
    image: null
  })
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const isPokemon = formData.category === 'pokemon'
    const requiredOk =
      !!formData.name && !!formData.price && (!isPokemon || (!!formData.rarity && !!formData.condition))

    if (!requiredOk) {
      alert('Por favor, completa todos los campos obligatorios')
      return
    }

    setUploading(true)

    try {
      let imageUrl = null

      // Upload image if provided
      if (formData.image) {
        try {
          imageUrl = await cardsService.uploadImage(formData.image)
          console.log('Image uploaded successfully:', imageUrl)
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          const continueWithout = window.confirm(
            `Image upload failed: ${uploadError.message}\n\nDo you want to continue without an image?`
          )
          if (!continueWithout) {
            setUploading(false)
            return
          }
        }
      }

      // Build card data - only include owner_id if we have one
      const cardData = {
        category: formData.category,
        name: formData.name,
        rarity: isPokemon ? formData.rarity : null,
        condition: isPokemon ? formData.condition : null,
        price: parseFloat(formData.price),
        image_url: imageUrl,
        is_available: true,
        merch_type: isPokemon ? null : (formData.merch_type || null),
        merch_condition: isPokemon ? null : (formData.merch_condition || null),
        merch_brand: isPokemon ? null : (formData.merch_brand || null)
      }

      // Only add owner_id if user is logged in
      if (currentUserId) {
        cardData.owner_id = currentUserId
      }

      // Create the card in Supabase
      const newCard = await cardsService.create(cardData)

      alert('¡Carta subida exitosamente!')
      onCardAdded(newCard)
      
      // Reset form
      setFormData({
        category: 'pokemon',
        name: '',
        rarity: '',
        condition: '',
        price: '',
        merch_type: '',
        merch_condition: '',
        merch_brand: '',
        image: null
      })
      setPreview(null)
      e.target.reset()
    } catch (error) {
      alert('Error al subir la carta: ' + error.message)
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
              <label>Categoría *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="pokemon">Carta Pokémon</option>
                <option value="merch">Mercancía</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="ej., Pikachu VMAX / Peluche / Carpeta"
                required
              />
            </div>

            {formData.category === 'pokemon' ? (
              <div className="form-group">
                <label>Rareza *</label>
                <select
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleChange}
                  required={formData.category === 'pokemon'}
                >
                  <option value="">Seleccionar Rareza</option>
                  {RARITY_OPTIONS.map(rarity => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Tipo de mercancía</label>
                <input
                  type="text"
                  name="merch_type"
                  value={formData.merch_type}
                  onChange={handleChange}
                  placeholder="ej., Peluche, Carpeta, Figura"
                />
              </div>
            )}

            {formData.category === 'pokemon' ? (
              <div className="form-group">
                <label>Estado *</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required={formData.category === 'pokemon'}
                >
                  <option value="">Seleccionar Estado</option>
                  {CONDITION_OPTIONS.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Estado de mercancía</label>
                <input
                  type="text"
                  name="merch_condition"
                  value={formData.merch_condition}
                  onChange={handleChange}
                  placeholder="ej., Nuevo, Como nuevo, Usado"
                />
              </div>
            )}

            {formData.category === 'merch' && (
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  name="merch_brand"
                  value={formData.merch_brand}
                  onChange={handleChange}
                  placeholder="ej., Pokémon Center"
                />
              </div>
            )}

            <div className="form-group">
              <label>Precio ($) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="image-section">
            <div className="form-group">
              <label>Imagen de la Carta</label>
              <div className="image-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="image-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-button">
                  {preview ? 'Cambiar Imagen' : 'Elegir Imagen'}
                </label>
                {preview && (
                  <div className="image-preview">
                    <img src={preview} alt="Preview" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={uploading}>
            {uploading ? 'Subiendo...' : 'Subir Carta'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UploadCard
