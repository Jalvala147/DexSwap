import { useState, useEffect } from 'react'
import { cardsService, supabase } from './lib/supabase'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ElementPage from './components/ElementPage'
import HomePage from './components/HomePage'
import CardList from './components/CardList'
import UploadCard from './components/UploadCard'
import './App.css'

function App() {
  const [cards, setCards] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCards, setFilteredCards] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedElement, setSelectedElement] = useState(null)

  const { user, profile } = useAuth()

  useEffect(() => {
    fetchCards()

    // Set up real-time subscription for cards
    const cardsSubscription = supabase
      .channel('cards-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cards' },
        (payload) => {
          console.log('Card change detected:', payload)
          fetchCards() // Refresh cards on any change
        }
      )
      .subscribe()

    return () => {
      if (cardsSubscription) cardsSubscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = cards.filter(card => 
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.rarity && card.rarity.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (card.condition && card.condition.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCards(filtered)
    } else {
      setFilteredCards([]) // Empty means show all cards
    }
  }, [searchQuery, cards])

  const fetchCards = async () => {
    try {
      const data = await cardsService.getAll()
      setCards(data || [])
      setFilteredCards(data || [])
    } catch (error) {
      console.error('Error fetching cards:', error)
      setCards([])
      setFilteredCards([])
    } finally {
      setLoading(false)
    }
  }

  const handleCardAdded = (newCard) => {
    setCards([newCard, ...cards])
    setFilteredCards([newCard, ...filteredCards])
    setShowUpload(false)
    setCurrentView('home')
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setCurrentView('browse')
  }

  const handleViewChange = (view) => {
    setCurrentView(view)
    setShowUpload(false)
    if (view === 'home') {
      setSearchQuery('')
    }
  }

  const handleUploadClick = () => {
    setShowUpload(!showUpload)
    if (!showUpload) {
      setCurrentView('upload')
    }
  }

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleElementSelect = (element) => {
    setSelectedElement(element)
    setCurrentView('element')
    setSidebarOpen(false)
  }

  const handleBackFromElement = () => {
    setSelectedElement(null)
    setCurrentView('home')
  }

  // Filter cards for "My Cards" view
  const getDisplayCards = () => {
    if (currentView === 'my-cards' && user) {
      return cards.filter(card => card.owner_id === user.id)
    }
    if (searchQuery && filteredCards.length > 0) {
      return filteredCards
    }
    if (searchQuery) {
      return []
    }
    return cards
  }

  return (
    <div className="app">
      <Navbar 
        onUploadClick={handleUploadClick}
        onSearch={handleSearch}
        currentView={currentView}
        onViewChange={handleViewChange}
        onSidebarToggle={handleSidebarToggle}
      />

      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onElementSelect={handleElementSelect}
      />

      {showUpload && (
        <div className="upload-container">
          <UploadCard 
            onCardAdded={handleCardAdded} 
            currentUserId={user?.id}
          />
        </div>
      )}

      {currentView === 'element' && selectedElement ? (
        <ElementPage 
          element={selectedElement}
          onBack={handleBackFromElement}
        />
      ) : loading ? (
        <div className="loading glass">
          <p>Loading cards...</p>
        </div>
      ) : currentView === 'my-cards' ? (
        <>
          <div className="page-header glass">
            <h2>📦 My Cards</h2>
            <p>{user ? `You have ${getDisplayCards().length} cards` : 'Sign in to see your cards'}</p>
          </div>
          {user ? (
            <CardList 
              cards={getDisplayCards()} 
              onUpdate={fetchCards}
              searchQuery=""
              currentUser={user}
            />
          ) : (
            <div className="empty-state glass">
              <p>Please sign in to view your cards</p>
            </div>
          )}
        </>
      ) : currentView === 'home' && cards.length === 0 ? (
        <HomePage 
          onUploadClick={handleUploadClick}
          onBrowseClick={() => handleViewChange('browse')}
          totalCards={cards.length}
          availableCards={cards.filter(c => c.is_available).length}
        />
      ) : currentView === 'home' && !searchQuery ? (
        <>
          <HomePage 
            onUploadClick={handleUploadClick}
            onBrowseClick={() => handleViewChange('browse')}
            totalCards={cards.length}
            availableCards={cards.filter(c => c.is_available).length}
          />
          <CardList 
            cards={cards} 
            onUpdate={fetchCards}
            searchQuery={searchQuery}
            currentUser={user}
          />
        </>
      ) : (
        <CardList 
          cards={getDisplayCards()} 
          onUpdate={fetchCards}
          searchQuery={searchQuery}
          currentUser={user}
        />
      )}
    </div>
  )
}

export default App
