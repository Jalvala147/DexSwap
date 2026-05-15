import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import './Navbar.css'

function Navbar({ onUploadClick, onSearch, currentView, onViewChange, onSidebarToggle }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // 'upload' | null
  const [signingOut, setSigningOut] = useState(false)

  const { user, profile, signOut } = useAuth()

  useEffect(() => {
    // If user becomes available while auth modal is open, we can safely close it.
    if (user && showAuthModal) setShowAuthModal(false)
  }, [user, showAuthModal])

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  const handleUpload = () => {
    if (!user) {
      setPendingAction('upload')
      setShowAuthModal(true)
      return
    }
    if (onUploadClick) {
      onUploadClick()
    }
    setIsMenuOpen(false)
  }

  const handleAuthSuccess = () => {
    if (pendingAction === 'upload' && onUploadClick) {
      onUploadClick()
    }
    setPendingAction(null)
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setSigningOut(false)
    }
  }

  const displayName = profile?.username || user?.email?.split('@')[0] || 'User'

  return (
    <>
      <nav className="navbar glass-strong">
        <div className="navbar-container">
          {/* Sidebar Toggle */}
          <button 
            className="sidebar-toggle"
            onClick={() => onSidebarToggle && onSidebarToggle()}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          {/* Logo/Brand */}
          <div className="navbar-brand" onClick={() => onViewChange && onViewChange('home')}>
            <img src="/dexswap.ico" alt="Pokemon Marketplace" className="brand-icon" />
          </div>

          {/* Search Bar */}
          <form className="navbar-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Buscar cartas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">Buscar</button>
          </form>

          {/* Navigation Links */}
          <div className="navbar-links">
            <button 
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => onViewChange && onViewChange('home')}
            >
              Inicio
            </button>
            <button 
              className={`nav-link ${currentView === 'browse' ? 'active' : ''}`}
              onClick={() => onViewChange && onViewChange('browse')}
            >
              Explorar
            </button>
            <button 
              className="nav-link upload-link"
              onClick={handleUpload}
            >
              Subir
            </button>
            {user && (
              <button 
                className={`nav-link ${currentView === 'my-cards' ? 'active' : ''}`}
                onClick={() => onViewChange && onViewChange('my-cards')}
              >
                Mis Cartas
              </button>
            )}
          </div>

          {/* User Section */}
          <div className="navbar-user">
            {user ? (
              <div className="user-menu-container">
                <button 
                  className="user-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="user-avatar">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} />
                    ) : (
                      '👤'
                    )}
                  </span>
                  <span className="user-name">{displayName}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown glass">
                    <div className="dropdown-header">
                      <span className="dropdown-email">{user.email}</span>
                    </div>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        onViewChange && onViewChange('my-cards')
                        setShowUserMenu(false)
                      }}
                    >
                      Mis Cartas
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        onViewChange && onViewChange('profile')
                        setShowUserMenu(false)
                      }}
                    >
                      Perfil
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item logout"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      {signingOut ? 'Cerrando sesión…' : 'Cerrar Sesión'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                className="login-button"
                onClick={() => setShowAuthModal(true)}
              >
                Iniciar Sesión
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu glass">
            <button 
              className={`mobile-nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => {
                onViewChange && onViewChange('home')
                setIsMenuOpen(false)
              }}
            >
              Inicio
            </button>
            <button 
              className={`mobile-nav-link ${currentView === 'browse' ? 'active' : ''}`}
              onClick={() => {
                onViewChange && onViewChange('browse')
                setIsMenuOpen(false)
              }}
            >
              Explorar
            </button>
            <button 
              className="mobile-nav-link"
              onClick={() => {
                handleUpload()
                setIsMenuOpen(false)
              }}
            >
              Subir
            </button>
            {user && (
              <button 
                className={`mobile-nav-link ${currentView === 'my-cards' ? 'active' : ''}`}
                onClick={() => {
                  onViewChange && onViewChange('my-cards')
                  setIsMenuOpen(false)
                }}
              >
                Mis Cartas
              </button>
            )}
            <div className="mobile-menu-divider"></div>
            {user ? (
              <>
                <div className="mobile-user-info">
                  <span className="user-avatar" aria-hidden="true">•</span>
                  <div className="mobile-user-details">
                    <span className="mobile-user-name">{displayName}</span>
                    <span className="mobile-user-email">{user.email}</span>
                  </div>
                </div>
                <button 
                  className="mobile-nav-link logout"
                  onClick={() => {
                    handleSignOut()
                    setIsMenuOpen(false)
                  }}
                  disabled={signingOut}
                >
                  {signingOut ? 'Cerrando sesión…' : 'Cerrar Sesión'}
                </button>
              </>
            ) : (
              <button 
                className="mobile-login-button"
                onClick={() => {
                  setShowAuthModal(true)
                  setIsMenuOpen(false)
                }}
              >
                Iniciar Sesión / Registrarse
              </button>
            )}
          </div>
        )}
      </nav>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false)
          setPendingAction(null)
        }}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  )
}

export default Navbar
