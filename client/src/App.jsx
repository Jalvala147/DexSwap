import { useState, useEffect, useCallback, useMemo } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { cardsService, supabase } from './lib/supabase'
import { filterCardsByQuery, getElementById } from './lib/constants'
import { useAuth } from './context/AuthContext'
import { useToast } from './context/ToastContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ElementPage from './components/ElementPage'
import HomePage from './components/HomePage'
import CardList from './components/CardList'
import UploadCard from './components/UploadCard'
import ProfilePage from './components/ProfilePage'
import './App.css'

function applyRealtimeChange(prev, payload) {
  const { eventType, new: next, old } = payload
  if (eventType === 'INSERT' && next) {
    if (prev.some((c) => c.id === next.id)) return prev
    return [{ ...next, owner: next.owner || null }, ...prev]
  }
  if (eventType === 'UPDATE' && next) {
    return prev.map((c) => (c.id === next.id ? { ...c, ...next, owner: c.owner } : c))
  }
  if (eventType === 'DELETE' && old) {
    return prev.filter((c) => c.id !== old.id)
  }
  return prev
}

function AppShell() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user, loading: authLoading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const fetchCards = useCallback(async () => {
    try {
      setFetchError(null)
      const data = await cardsService.getAll()
      setCards(data || [])
    } catch (error) {
      console.error('Error fetching cards:', error)
      setCards([])
      setFetchError(error.message || 'No se pudieron cargar las cartas')
      toast.error('No se pudieron cargar las cartas')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await cardsService.getAll()
        if (!cancelled) {
          setCards(data || [])
          setFetchError(null)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching cards:', error)
          setCards([])
          setFetchError(error.message || 'No se pudieron cargar las cartas')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel('cards-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards' },
        (payload) => {
          setCards((prev) => applyRealtimeChange(prev, payload))
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  const displayCards = useMemo(() => filterCardsByQuery(cards, searchQuery), [cards, searchQuery])

  const availableCount = useMemo(
    () => cards.filter((c) => c.is_available).length,
    [cards]
  )

  const currentView = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/browse')) return 'browse'
    if (path.startsWith('/upload')) return 'upload'
    if (path.startsWith('/my-cards')) return 'my-cards'
    if (path.startsWith('/profile')) return 'profile'
    if (path.startsWith('/element')) return 'element'
    return 'home'
  }, [location.pathname])

  const handleCardAdded = (newCard) => {
    setCards((prev) => {
      if (prev.some((c) => c.id === newCard.id)) return prev
      return [newCard, ...prev]
    })
    navigate('/browse')
    toast.success('Publicación creada')
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    navigate('/browse')
  }

  const handleViewChange = (view) => {
    const routes = {
      home: '/',
      browse: '/browse',
      upload: '/upload',
      'my-cards': '/my-cards',
      profile: '/profile',
    }
    if (view === 'home') setSearchQuery('')
    navigate(routes[view] || '/')
  }

  const handleUploadClick = () => {
    navigate('/upload')
  }

  const handleElementSelect = (element) => {
    setSidebarOpen(false)
    navigate(`/element/${element.id}`)
  }

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading glass">
          <p>Cargando DEXswap…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar
        onUploadClick={handleUploadClick}
        onSearch={handleSearch}
        currentView={currentView}
        onViewChange={handleViewChange}
        onSidebarToggle={() => setSidebarOpen((o) => !o)}
        searchQuery={searchQuery}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onElementSelect={handleElementSelect}
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <HomePage
                onUploadClick={handleUploadClick}
                onBrowseClick={() => handleViewChange('browse')}
                totalCards={cards.length}
                availableCards={availableCount}
              />
              {!loading && cards.length > 0 && (
                <section className="home-listings">
                  <div className="page-header glass">
                    <h2>Publicaciones recientes</h2>
                    <p>{availableCount} disponibles de {cards.length}</p>
                  </div>
                  <CardList
                    cards={cards.slice(0, 8)}
                    onUpdate={fetchCards}
                    searchQuery=""
                    currentUser={user}
                  />
                </section>
              )}
            </>
          }
        />
        <Route
          path="/browse"
          element={
            loading ? (
              <div className="loading glass">
                <p>Cargando cartas…</p>
              </div>
            ) : fetchError && cards.length === 0 ? (
              <div className="empty-state glass">
                <p>{fetchError}</p>
                <button type="button" className="btn-primary" onClick={fetchCards}>
                  Reintentar
                </button>
              </div>
            ) : (
              <>
                {searchQuery && (
                  <div className="page-header glass">
                    <h2>Resultados</h2>
                    <p>
                      {displayCards.length} coincidencia{displayCards.length === 1 ? '' : 's'} para “
                      {searchQuery}”
                    </p>
                  </div>
                )}
                <CardList
                  cards={displayCards}
                  onUpdate={fetchCards}
                  searchQuery={searchQuery}
                  currentUser={user}
                />
              </>
            )
          }
        />
        <Route
          path="/upload"
          element={
            user ? (
              <div className="upload-container">
                <UploadCard onCardAdded={handleCardAdded} currentUserId={user.id} />
              </div>
            ) : (
              <div className="empty-state glass">
                <p>Inicia sesión para publicar una carta o mercancía.</p>
              </div>
            )
          }
        />
        <Route
          path="/my-cards"
          element={
            <>
              <div className="page-header glass">
                <h2>Mis Cartas</h2>
                <p>
                  {user
                    ? `Tienes ${cards.filter((c) => c.owner_id === user.id).length} publicaciones`
                    : 'Inicia sesión para ver tus cartas'}
                </p>
              </div>
              {user ? (
                <CardList
                  cards={cards.filter((c) => c.owner_id === user.id)}
                  onUpdate={fetchCards}
                  searchQuery=""
                  currentUser={user}
                />
              ) : (
                <div className="empty-state glass">
                  <p>Por favor, inicia sesión para ver tus cartas</p>
                </div>
              )}
            </>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/element/:elementId"
          element={
            <ElementRoute cards={cards} loading={loading} onUpdate={fetchCards} currentUser={user} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function ElementRoute({ cards, loading, onUpdate, currentUser }) {
  const { elementId } = useParams()
  const navigate = useNavigate()
  const element = getElementById(elementId)

  if (!element) {
    return <Navigate to="/" replace />
  }

  return (
    <ElementPage
      element={element}
      cards={cards}
      loading={loading}
      onUpdate={onUpdate}
      currentUser={currentUser}
      onBack={() => navigate('/')}
    />
  )
}

export default AppShell
