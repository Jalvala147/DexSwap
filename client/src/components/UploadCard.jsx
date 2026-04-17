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
    name: '',
    rarity: '',
    condition: '',
    price: '',
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
    
    if (!formData.name || !formData.price || !formData.rarity || !formData.condition) {
      alert('Please fill in all required fields')
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
        name: formData.name,
        rarity: formData.rarity,
        condition: formData.condition,
        price: parseFloat(formData.price),
        image_url: imageUrl,
        is_available: true
      }

      // Only add owner_id if user is logged in
      if (currentUserId) {
        cardData.owner_id = currentUserId
      }

      // Create the card in Supabase
      const newCard = await cardsService.create(cardData)

      alert('Card uploaded successfully!')
      onCardAdded(newCard)
      
      // Reset form
      setFormData({
        name: '',
        rarity: '',
        condition: '',
        price: '',
        image: null
      })
      setPreview(null)
      e.target.reset()
    } catch (error) {
      alert('Error uploading card: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-card glass-strong">
      <h2>Upload a Pokemon Card</h2>
      <form onSubmit={handleSubmit}>
        <div className="upload-form-grid">
          <div className="form-section">
            <div className="form-group">
              <label>Card Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Pikachu VMAX"
                required
              />
            </div>

            <div className="form-group">
              <label>Rarity *</label>
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
              <label>Condition *</label>
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
              <label>Price ($) *</label>
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
              <label>Card Image</label>
              <div className="image-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="image-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-button">
                  {preview ? 'Change Image' : 'Choose Image'}
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
            {uploading ? 'Uploading...' : 'Upload Card'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UploadCard
