import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { tradesService, tradeMessagesService } from '../lib/supabase'
import './ProfilePage.css'

function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [tab, setTab] = useState('trades') // 'trades' | 'account'

  const [trades, setTrades] = useState([])
  const [loadingTrades, setLoadingTrades] = useState(true)
  const [selectedTradeId, setSelectedTradeId] = useState(null)

  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingTrade, setUpdatingTrade] = useState(false)

  const [editingUsername, setEditingUsername] = useState(profile?.username || '')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    setEditingUsername(profile?.username || '')
  }, [profile?.username])

  const selectedTrade = useMemo(
    () => trades.find(t => t.id === selectedTradeId) || null,
    [trades, selectedTradeId]
  )

  const fetchTrades = async () => {
    if (!user) return
    setLoadingTrades(true)
    try {
      const data = await tradesService.getByUser(user.id)
      setTrades(data || [])
      if (!selectedTradeId && data?.length) setSelectedTradeId(data[0].id)
    } catch (e) {
      console.error('Error fetching trades:', e)
      setTrades([])
    } finally {
      setLoadingTrades(false)
    }
  }

  const fetchMessages = async (tradeId) => {
    if (!tradeId || !user) return
    setLoadingMessages(true)
    try {
      const data = await tradeMessagesService.getByTrade(tradeId)
      setMessages(data || [])
    } catch (e) {
      console.error('Error fetching messages:', e)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    fetchTrades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (!selectedTradeId) return
    fetchMessages(selectedTradeId)
  }, [selectedTradeId])

  useEffect(() => {
    if (!selectedTradeId) return
    const subscription = tradeMessagesService.subscribeToTrade(selectedTradeId, (payload) => {
      if (payload?.eventType === 'INSERT' && payload?.new) {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      }
    })
    return () => {
      try {
        subscription?.unsubscribe?.()
      } catch {
        // ignore
      }
    }
  }, [selectedTradeId])

  const handleSendMessage = async () => {
    if (!user || !selectedTradeId) return
    const text = messageText.trim()
    if (!text) return

    setSending(true)
    try {
      const inserted = await tradeMessagesService.send({
        trade_id: selectedTradeId,
        sender_id: user.id,
        content: text
      })
      setMessages(prev => (prev.some(m => m.id === inserted.id) ? prev : [...prev, inserted]))
      setMessageText('')
    } catch (e) {
      alert('Error sending message: ' + e.message)
    } finally {
      setSending(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    const username = editingUsername.trim()
    if (!username) return
    setSavingProfile(true)
    try {
      await updateProfile({ username })
      alert('Profile updated')
    } catch (e) {
      alert('Error updating profile: ' + e.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAcceptTrade = async () => {
    if (!user || !selectedTrade) return
    if (selectedTrade.status !== 'pending') return
    if (selectedTrade.receiver_id !== user.id) {
      alert('Solo el dueño de la carta solicitada puede aceptar el intercambio.')
      return
    }
    if (!window.confirm('¿Aceptar el intercambio? Las dos cartas cambiarán de dueño.')) return

    setUpdatingTrade(true)
    try {
      await tradesService.acceptTrade(selectedTrade.id)
      await fetchTrades()
      await fetchMessages(selectedTrade.id)
      alert('Intercambio aceptado.')
    } catch (e) {
      const msg = e?.message || String(e)
      alert(
        'Error al aceptar: ' +
          msg +
          '\n\nSi no existe la función, crea en Supabase el RPC `accept_trade(trade_id uuid)` (security definer).'
      )
    } finally {
      setUpdatingTrade(false)
    }
  }

  const handleRejectTrade = async () => {
    if (!user || !selectedTrade) return
    if (selectedTrade.status !== 'pending') return
    if (selectedTrade.receiver_id !== user.id) {
      alert('Only the receiver can reject a trade.')
      return
    }
    if (!window.confirm('Reject this trade?')) return

    setUpdatingTrade(true)
    try {
      await tradesService.updateStatus(selectedTrade.id, 'rejected')
      await fetchTrades()
      alert('Trade rejected.')
    } catch (e) {
      alert('Error rejecting trade: ' + e.message)
    } finally {
      setUpdatingTrade(false)
    }
  }

  const handleCancelTrade = async () => {
    if (!user || !selectedTrade) return
    if (selectedTrade.status !== 'pending') return
    if (selectedTrade.sender_id !== user.id) {
      alert('Only the sender can cancel a trade.')
      return
    }
    if (!window.confirm('Cancel this trade?')) return

    setUpdatingTrade(true)
    try {
      await tradesService.updateStatus(selectedTrade.id, 'cancelled')
      await fetchTrades()
      alert('Trade cancelled.')
    } catch (e) {
      alert('Error cancelling trade: ' + e.message)
    } finally {
      setUpdatingTrade(false)
    }
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-header glass">
          <h2>Profile</h2>
          <p>Please sign in to view your profile and trades.</p>
        </div>
      </div>
    )
  }

  const title = profile?.username || user.email

  return (
    <div className="profile-page">
      <div className="profile-header glass-strong">
        <div className="profile-title">
          <h2>{title}</h2>
          <p className="profile-subtitle">{user.email}</p>
        </div>
        <div className="profile-tabs">
          <button className={tab === 'trades' ? 'active' : ''} onClick={() => setTab('trades')}>
            Trades
          </button>
          <button className={tab === 'account' ? 'active' : ''} onClick={() => setTab('account')}>
            Account
          </button>
        </div>
      </div>

      {tab === 'account' ? (
        <div className="account-panel glass">
          <div className="form-row">
            <label>Username</label>
            <input value={editingUsername} onChange={(e) => setEditingUsername(e.target.value)} />
          </div>
          <button disabled={savingProfile} onClick={handleSaveProfile}>
            {savingProfile ? 'Saving…' : 'Save'}
          </button>
        </div>
      ) : (
        <div className="trades-layout">
          <div className="trades-list glass">
            <div className="trades-list-header">
              <h3>Your trades</h3>
              <button onClick={fetchTrades} disabled={loadingTrades}>Refresh</button>
            </div>

            {loadingTrades ? (
              <div className="muted">Loading…</div>
            ) : trades.length === 0 ? (
              <div className="muted">No trades yet. Propose a trade from a listing to start a chat.</div>
            ) : (
              <div className="trades-items">
                {trades.map(t => {
                  const other =
                    t.sender_id === user.id ? t.receiver : t.sender
                  const otherName = other?.username || 'User'
                  const requestedName = t.card_requested?.name || 'Card'
                  const offeredName = t.card_offered?.name || '—'
                  return (
                    <button
                      key={t.id}
                      className={`trade-item ${t.id === selectedTradeId ? 'active' : ''}`}
                      onClick={() => setSelectedTradeId(t.id)}
                    >
                      <div className="trade-top">
                        <span className="trade-with">With {otherName}</span>
                        <span className={`trade-status status-${t.status}`}>{t.status}</span>
                      </div>
                      <div className="trade-cards">
                        <span className="trade-line">Requested: {requestedName}</span>
                        <span className="trade-line">Offered: {offeredName}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="trade-chat glass-strong">
            {!selectedTrade ? (
              <div className="muted">Select a trade to view chat.</div>
            ) : (
              <>
                <div className="trade-chat-header">
                  <div>
                    <div className="trade-chat-title">Trade chat</div>
                    <div className="trade-chat-meta">
                      {selectedTrade.card_requested?.name || 'Card'}
                    </div>
                  </div>
                  <div className="trade-chat-actions">
                    {selectedTrade.status === 'pending' && selectedTrade.receiver_id === user.id && (
                      <>
                        <button disabled={updatingTrade} onClick={handleRejectTrade} className="danger">
                          Reject
                        </button>
                        <button disabled={updatingTrade} onClick={handleAcceptTrade}>
                          Accept
                        </button>
                      </>
                    )}
                    {selectedTrade.status === 'pending' && selectedTrade.sender_id === user.id && (
                      <button disabled={updatingTrade} onClick={handleCancelTrade} className="danger">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="trade-chat-messages">
                  {loadingMessages ? (
                    <div className="muted">Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div className="muted">No messages yet. Say hello.</div>
                  ) : (
                    messages.map(m => (
                      <div
                        key={m.id}
                        className={`chat-msg ${m.sender_id === user.id ? 'mine' : 'theirs'}`}
                      >
                        <div className="chat-bubble">{m.content}</div>
                        <div className="chat-time">
                          {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="trade-chat-input">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write a message…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage()
                    }}
                  />
                  <button disabled={sending || !messageText.trim()} onClick={handleSendMessage}>
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage

