import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import './Navbar.css'

function Navbar({ onUploadClick, onSearch, currentView, onViewChange, onSidebarToggle }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const { user, profile, signOut } = useAuth()

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  const handleUpload = () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    if (onUploadClick) {
      onUploadClick()
    }
    setIsMenuOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Error signing out:', error)
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
            ⚡
          </button>

          {/* Logo/Brand */}
          <div className="navbar-brand" onClick={() => onViewChange && onViewChange('home')}>
            <img src="/dexswap.ico" alt="Pokemon Marketplace" className="brand-icon" />
          </div>

          {/* Search Bar */}
          <form className="navbar-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍
            </button>
          </form>

          {/* Navigation Links */}
          <div className="navbar-links">
            <button 
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => onViewChange && onViewChange('home')}
            >
              🏠 Home
            </button>
            <button 
              className={`nav-link ${currentView === 'browse' ? 'active' : ''}`}
              onClick={() => onViewChange && onViewChange('browse')}
            >
              🎴 Browse
            </button>
            <button 
              className="nav-link upload-link"
              onClick={handleUpload}
            >
              ➕ Upload
            </button>
            {user && (
              <button 
                className={`nav-link ${currentView === 'my-cards' ? 'active' : ''}`}
                onClick={() => onViewChange && onViewChange('my-cards')}
              >
                📦 My Cards
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
                      📦 My Cards
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        onViewChange && onViewChange('profile')
                        setShowUserMenu(false)
                      }}
                    >
                      ⚙️ Settings
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item logout"
                      onClick={handleSignOut}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                className="login-button"
                onClick={() => setShowAuthModal(true)}
              >
                🔐 Login
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
              🏠 Home
            </button>
            <button 
              className={`mobile-nav-link ${currentView === 'browse' ? 'active' : ''}`}
              onClick={() => {
                onViewChange && onViewChange('browse')
                setIsMenuOpen(false)
              }}
            >
              🎴 Browse Cards
            </button>
            <button 
              className="mobile-nav-link"
              onClick={() => {
                handleUpload()
                setIsMenuOpen(false)
              }}
            >
              ➕ Upload Card
            </button>
            {user && (
              <button 
                className={`mobile-nav-link ${currentView === 'my-cards' ? 'active' : ''}`}
                onClick={() => {
                  onViewChange && onViewChange('my-cards')
                  setIsMenuOpen(false)
                }}
              >
                📦 My Cards
              </button>
            )}
            <div className="mobile-menu-divider"></div>
            {user ? (
              <>
                <div className="mobile-user-info">
                  <span className="user-avatar">👤</span>
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
                >
                  🚪 Sign Out
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
                🔐 Login / Sign Up
              </button>
            )}
          </div>
        )}
      </nav>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}

export default Navbar
