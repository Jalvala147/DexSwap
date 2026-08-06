import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login') // login | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signIn, signUp, resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'reset') {
        await resetPassword(email.trim())
        setMessage('Te enviamos un enlace para restablecer la contraseña.')
        return
      }

      if (mode === 'login') {
        await signIn(email.trim(), password)
        if (typeof onAuthSuccess === 'function') onAuthSuccess({ mode: 'login' })
        onClose()
        return
      }

      if (!username.trim()) {
        setError('El nombre de usuario es obligatorio')
        return
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        return
      }

      const data = await signUp(email.trim(), password, username.trim())
      if (data?.session) {
        if (typeof onAuthSuccess === 'function') onAuthSuccess({ mode: 'login' })
        onClose()
      } else {
        setMessage('¡Revisa tu correo para confirmar la cuenta e inicia sesión después!')
        if (typeof onAuthSuccess === 'function') onAuthSuccess({ mode: 'signup' })
      }
    } catch (err) {
      setError(err.message || 'Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setMessage('')
  }

  if (!isOpen) return null

  const title =
    mode === 'login'
      ? 'Bienvenido de nuevo'
      : mode === 'signup'
        ? 'Únete a DEXswap'
        : 'Recuperar acceso'

  const subtitle =
    mode === 'login'
      ? 'Inicia sesión en tu cuenta'
      : mode === 'signup'
        ? 'Crea tu cuenta de coleccionista'
        : 'Te enviaremos un enlace a tu email'

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal glass-strong" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <div className="auth-header">
          <img src="/dexswap.ico" alt="" className="auth-logo-img" />
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="auth-username">Nombre de usuario</label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Elige un nombre de usuario"
                required
                maxLength={32}
                autoComplete="username"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'reset' && (
            <div className="form-group">
              <label htmlFor="auth-password">Contraseña</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <button type="submit" className="auth-submit btn-primary" disabled={loading}>
            {loading
              ? '…'
              : mode === 'login'
                ? 'Iniciar Sesión'
                : mode === 'signup'
                  ? 'Crear Cuenta'
                  : 'Enviar enlace'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' && (
            <>
              <p>
                <button type="button" onClick={() => switchMode('reset')} className="switch-mode-btn">
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
              <p>
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="switch-mode-btn">
                  Regístrate
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => switchMode('login')} className="switch-mode-btn">
                Inicia Sesión
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p>
              <button type="button" onClick={() => switchMode('login')} className="switch-mode-btn">
                Volver a iniciar sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
