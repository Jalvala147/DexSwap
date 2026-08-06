import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import './Navbar.css'

function Navbar({
  onUploadClick,
  onSearch,
  currentView,
  onViewChange,
  onSidebarToggle,
  searchQuery: externalQuery = '',
}) {
  const [searchQuery, setSearchQuery] = useState(externalQuery)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  const { user, profile, signOut } = useAuth()

  useEffect(() => {
    setSearchQuery(externalQuery)
  }, [externalQuery])

  useEffect(() => {
    if (user && showAuthModal) setShowAuthModal(false)
  }, [user, showAuthModal])

  useEffect(() => {
    if (!showUserMenu) return
    const onDocClick = () => setShowUserMenu(false)
    const timer = setTimeout(() => document.addEventListener('click', onDocClick), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', onDocClick)
    }
  }, [showUserMenu])

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) onSearch(searchQuery.trim())
    setIsMenuOpen(false)
  }

  const handleUpload = () => {
    if (!user) {
      setPendingAction('upload')
      setShowAuthModal(true)
      return
    }
    if (onUploadClick) onUploadClick()
    setIsMenuOpen(false)
  }

  const handleAuthSuccess = ({ mode } = {}) => {
    if (mode === 'signup') return
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
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => onSidebarToggle && onSidebarToggle()}
            aria-label="Abrir tipos Pokémon"
          >
            ☰
          </button>

          <button
            type="button"
            className="navbar-brand"
            onClick={() => onViewChange && onViewChange('home')}
            aria-label="DEXswap inicio"
          >
            <img src="/dexswap.ico" alt="" className="brand-icon" />
            <span className="brand-text">DEXswap</span>
          </button>

          <form className="navbar-search" onSubmit={handleSearch} role="search">
            <input
              type="search"
              placeholder="Buscar cartas…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Buscar cartas"
            />
            <button type="submit" className="search-button">
              Buscar
            </button>
          </form>

          <div className="navbar-links">
            <button
              type="button"
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => onViewChange && onViewChange('home')}
            >
              Inicio
            </button>
            <button
              type="button"
              className={`nav-link ${currentView === 'browse' ? 'active' : ''}`}
              onClick={() => onViewChange && onViewChange('browse')}
            >
              Explorar
            </button>
            <button type="button" className="nav-link upload-link" onClick={handleUpload}>
              Subir
            </button>
            {user && (
              <button
                type="button"
                className={`nav-link ${currentView === 'my-cards' ? 'active' : ''}`}
                onClick={() => onViewChange && onViewChange('my-cards')}
              >
                Mis Cartas
              </button>
            )}
          </div>

          <div className="navbar-user">
            {user ? (
              <div className="user-menu-container" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="user-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                >
                  <span className="user-avatar">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" />
                    ) : (
                      <span aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="user-name">{displayName}</span>
                  <span className="dropdown-arrow" aria-hidden="true">
                    ▼
                  </span>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown glass">
                    <div className="dropdown-header">
                      <span className="dropdown-email">{user.email}</span>
                    </div>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        onViewChange && onViewChange('my-cards')
                        setShowUserMenu(false)
                      }}
                    >
                      Mis Cartas
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        onViewChange && onViewChange('profile')
                        setShowUserMenu(false)
                      }}
                    >
                      Perfil
                    </button>
                    <div className="dropdown-divider" />
                    <button
                      type="button"
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
              <button type="button" className="login-button" onClick={() => setShowAuthModal(true)}>
                Iniciar Sesión
              </button>
            )}
          </div>

          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menú"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu glass">
            <button
              type="button"
              className={`mobile-nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => {
                onViewChange && onViewChange('home')
                setIsMenuOpen(false)
              }}
            >
              Inicio
            </button>
            <button
              type="button"
              className={`mobile-nav-link ${currentView === 'browse' ? 'active' : ''}`}
              onClick={() => {
                onViewChange && onViewChange('browse')
                setIsMenuOpen(false)
              }}
            >
              Explorar
            </button>
            <button
              type="button"
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
                type="button"
                className={`mobile-nav-link ${currentView === 'my-cards' ? 'active' : ''}`}
                onClick={() => {
                  onViewChange && onViewChange('my-cards')
                  setIsMenuOpen(false)
                }}
              >
                Mis Cartas
              </button>
            )}
            <div className="mobile-menu-divider" />
            {user ? (
              <>
                <div className="mobile-user-info">
                  <span className="user-avatar" aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <div className="mobile-user-details">
                    <span className="mobile-user-name">{displayName}</span>
                    <span className="mobile-user-email">{user.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => {
                    onViewChange && onViewChange('profile')
                    setIsMenuOpen(false)
                  }}
                >
                  Perfil
                </button>
                <button
                  type="button"
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
                type="button"
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
