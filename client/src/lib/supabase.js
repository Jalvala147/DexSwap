import { createClient } from '@supabase/supabase-js'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from './constants'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

const OWNER_SELECT = 'id, username, avatar_url'
const CARD_WITH_OWNER = `*, owner:profiles!owner_id(${OWNER_SELECT})`

async function attachOwners(cards) {
  if (!cards?.length) return cards || []

  // Prefer embedded owner from join; fall back to batch lookup
  if (cards.some((c) => c.owner !== undefined)) {
    return cards.map((c) => ({ ...c, owner: c.owner || null }))
  }

  const ownerIds = [...new Set(cards.filter((c) => c.owner_id).map((c) => c.owner_id))]
  if (!ownerIds.length) {
    return cards.map((card) => ({ ...card, owner: null }))
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(OWNER_SELECT)
    .in('id', ownerIds)

  if (error || !profiles) {
    return cards.map((card) => ({ ...card, owner: null }))
  }

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
  return cards.map((card) => ({
    ...card,
    owner: card.owner_id ? profileMap[card.owner_id] || null : null,
  }))
}

async function fetchCards(queryBuilder) {
  const { data, error } = await queryBuilder
  if (error) {
    // Fallback without embed if FK/relationship is missing
    if (/relationship|foreign key|Could not find/i.test(error.message || '')) {
      return null
    }
    throw error
  }
  return attachOwners(data || [])
}

async function fetchCardsSafe(buildWithOwner, buildPlain) {
  const withOwner = await fetchCards(buildWithOwner())
  if (withOwner) return withOwner
  const { data, error } = await buildPlain()
  if (error) throw error
  return attachOwners(data || [])
}

export const cardsService = {
  async getAll() {
    return fetchCardsSafe(
      () =>
        supabase.from('cards').select(CARD_WITH_OWNER).order('created_at', { ascending: false }),
      () => supabase.from('cards').select('*').order('created_at', { ascending: false })
    )
  },

  async getById(id) {
    let { data: card, error } = await supabase
      .from('cards')
      .select(CARD_WITH_OWNER)
      .eq('id', id)
      .single()

    if (error && /relationship|foreign key|Could not find/i.test(error.message || '')) {
      const fallback = await supabase.from('cards').select('*').eq('id', id).single()
      if (fallback.error) throw fallback.error
      card = fallback.data
      error = null
    }

    if (error) throw error
    const [withOwner] = await attachOwners([card])
    return withOwner
  },

  async getByOwner(ownerId) {
    return fetchCardsSafe(
      () =>
        supabase
          .from('cards')
          .select(CARD_WITH_OWNER)
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false }),
      () =>
        supabase
          .from('cards')
          .select('*')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false })
    )
  },

  async getAvailable() {
    return fetchCardsSafe(
      () =>
        supabase
          .from('cards')
          .select(CARD_WITH_OWNER)
          .eq('is_available', true)
          .order('created_at', { ascending: false }),
      () =>
        supabase
          .from('cards')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false })
    )
  },

  async create(cardData) {
    const cleanData = { ...cardData }
    if (cleanData.owner_id === null || cleanData.owner_id === undefined) {
      delete cleanData.owner_id
    }

    const { data: card, error } = await supabase
      .from('cards')
      .insert([cleanData])
      .select('*')
      .single()

    if (error) throw error
    const [withOwner] = await attachOwners([card])
    return withOwner
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    const [withOwner] = await attachOwners([data])
    return withOwner
  },

  async delete(id) {
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) throw error
    return true
  },

  validateImageFile(file) {
    if (!file) return { ok: false, error: 'No se seleccionó imagen' }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { ok: false, error: 'Formato no válido. Usa JPG, PNG, WebP o GIF.' }
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: 'La imagen supera 5 MB. Comprimela e inténtalo de nuevo.' }
    }
    return { ok: true }
  },

  async uploadImage(file) {
    const check = this.validateImageFile(file)
    if (!check.ok) throw new Error(check.error)

    const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('cards').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

    if (uploadError) {
      throw new Error(`Error al subir imagen: ${uploadError.message}`)
    }

    const { data } = supabase.storage.from('cards').getPublicUrl(fileName)
    return data.publicUrl
  },
}

export const purchasesService = {
  async getByUser(userId) {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
}

export const profilesService = {
  async getById(id) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async getByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
    if (error) throw error
    return data
  },

  async upsert(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([profileData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

const TRADE_SELECT = `
  *,
  sender:profiles!sender_id(id, username, avatar_url),
  receiver:profiles!receiver_id(id, username, avatar_url),
  card_offered:cards!card_offered_id(*),
  card_requested:cards!card_requested_id(*)
`

export const tradesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('trades')
      .select(TRADE_SELECT)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getByUser(userId) {
    const { data, error } = await supabase
      .from('trades')
      .select(TRADE_SELECT)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(tradeData) {
    const { data, error } = await supabase
      .from('trades')
      .insert([{ ...tradeData, status: 'pending' }])
      .select(TRADE_SELECT)
      .single()
    if (error) throw error
    return data
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('trades')
      .update({ status })
      .eq('id', id)
      .select(TRADE_SELECT)
      .single()
    if (error) throw error
    return data
  },

  /**
   * Accept must go through RPC so ownership swap is atomic under RLS.
   * Non-atomic client-side swaps are intentionally not used.
   */
  async acceptTrade(tradeId) {
    const { data, error } = await supabase.rpc('accept_trade', { trade_id: tradeId })
    if (error) {
      const msg = error.message || String(error)
      if (/function .* does not exist|Could not find the function/i.test(msg) || error.code === 'PGRST202') {
        throw new Error(
          'Falta el RPC accept_trade en Supabase. Créalo como security definer para intercambiar dueños de forma atómica.'
        )
      }
      throw new Error(msg)
    }
    return data ?? true
  },
}

export const tradeMessagesService = {
  async getByTrade(tradeId) {
    const { data, error } = await supabase
      .from('trade_messages')
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async send({ trade_id, sender_id, content }) {
    const { data, error } = await supabase
      .from('trade_messages')
      .insert([{ trade_id, sender_id, content }])
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  subscribeToTrade(tradeId, onChange) {
    return supabase
      .channel(`trade-messages-${tradeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_messages',
          filter: `trade_id=eq.${tradeId}`,
        },
        onChange
      )
      .subscribe()
  },
}

export const marketplaceService = {
  async purchaseCard({ card_id }) {
    const { data, error } = await supabase.rpc('purchase_card', { card_id })
    if (error) throw error
    return data
  },
}

export default supabase
