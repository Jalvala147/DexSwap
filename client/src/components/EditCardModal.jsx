import { useState } from 'react'
import { cardsService } from '../lib/supabase'
import './EditCardModal.css'

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

function EditCardModal({ card, isOpen, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: card.name || '',
    rarity: card.rarity || '',
    condition: card.condition || '',
    price: card.price || '',
    image: null
  })
  const [preview, setPreview] = useState(card.image_url || null)
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let imageUrl = card.image_url

      // Upload new image if provided
      if (formData.image) {
        try {
          imageUrl = await cardsService.uploadImage(formData.image)
          console.log('Image uploaded successfully:', imageUrl)
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          alert(`Image upload failed: ${uploadError.message}\n\nMake sure you have created a "cards" storage bucket in Supabase and set it to public.`)
          setSaving(false)
          return
        }
      }

      // Update the card
      await cardsService.update(card.id, {
        name: formData.name,
        rarity: formData.rarity,
        condition: formData.condition,
        price: parseFloat(formData.price),
        image_url: imageUrl
      })

      alert('Card updated successfully!')
      onUpdate()
      onClose()
    } catch (error) {
      alert('Error updating card: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal glass-strong" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>Edit Card</h2>

        <form onSubmit={handleSubmit}>
          <div className="edit-form-grid">
            <div className="form-section">
              <div className="form-group">
                <label>Card Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Rarity</label>
                <select
                  name="rarity"
                  value={formData.rarity}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Rarity</option>
                  {RARITY_OPTIONS.map(rarity => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Condition</option>
                  {CONDITION_OPTIONS.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="image-section">
              <div className="form-group">
                <label>Card Image</label>
                <div className="image-upload-area">
                  {preview ? (
                    <div className="image-preview">
                      <img src={preview} alt="Card preview" />
                      <button 
                        type="button" 
                        className="change-image-btn"
                        onClick={() => document.getElementById('edit-image-input').click()}
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="upload-placeholder"
                      onClick={() => document.getElementById('edit-image-input').click()}
                    >
                      <span className="upload-icon">📷</span>
                      <span>Click to upload image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="edit-image-input"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCardModal

