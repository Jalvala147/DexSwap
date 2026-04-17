import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: log Supabase config (remove in production)
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials! Check your .env file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Cards service
export const cardsService = {
  // Get all cards with owner info
  async getAll() {
    // First get all cards
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching cards:', error)
      throw error
    }

    // Get unique owner IDs
    const ownerIds = [...new Set(cards.filter(c => c.owner_id).map(c => c.owner_id))]
    
    if (ownerIds.length > 0) {
      // Fetch profiles for these owners
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', ownerIds)
      
      if (!profilesError && profiles) {
        // Create a map for quick lookup
        const profileMap = {}
        profiles.forEach(p => { profileMap[p.id] = p })
        
        // Attach owner to each card
        return cards.map(card => ({
          ...card,
          owner: card.owner_id ? profileMap[card.owner_id] || null : null
        }))
      }
    }

    return cards.map(card => ({ ...card, owner: null }))
  },

  // Get a single card by ID
  async getById(id) {
    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error

    // Fetch owner profile if exists
    if (card.owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', card.owner_id)
        .single()
      
      card.owner = profile || null
    } else {
      card.owner = null
    }

    return card
  },

  // Get cards by owner
  async getByOwner(ownerId) {
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Fetch owner profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', ownerId)
      .single()

    return cards.map(card => ({ ...card, owner: profile || null }))
  },

  // Get available cards
  async getAvailable() {
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Get unique owner IDs
    const ownerIds = [...new Set(cards.filter(c => c.owner_id).map(c => c.owner_id))]
    
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', ownerIds)
      
      if (profiles) {
        const profileMap = {}
        profiles.forEach(p => { profileMap[p.id] = p })
        
        return cards.map(card => ({
          ...card,
          owner: card.owner_id ? profileMap[card.owner_id] || null : null
        }))
      }
    }

    return cards.map(card => ({ ...card, owner: null }))
  },

  // Create a new card
  async create(cardData) {
    // Clean the data - remove undefined/null owner_id
    const cleanData = { ...cardData }
    if (cleanData.owner_id === null || cleanData.owner_id === undefined) {
      delete cleanData.owner_id
    }
    
    console.log('Creating card with data:', cleanData)
    
    const { data: card, error } = await supabase
      .from('cards')
      .insert([cleanData])
      .select('*')
      .single()
    
    if (error) {
      console.error('Error creating card:', error)
      throw error
    }

    // Fetch owner profile if owner_id exists
    if (card.owner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', card.owner_id)
        .single()
      
      card.owner = profile || null
    } else {
      card.owner = null
    }

    return card
  },

  // Update a card
  async update(id, updates) {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a card
  async delete(id) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Upload card image to Supabase Storage
  async uploadImage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}` // Store directly in bucket root

    console.log('Uploading image:', fileName, 'Size:', file.size)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cards')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Image upload failed: ${uploadError.message}`)
    }

    console.log('Upload successful:', uploadData)

    const { data } = supabase.storage
      .from('cards')
      .getPublicUrl(filePath)

    console.log('Public URL:', data.publicUrl)

    return data.publicUrl
  }
}

// Profiles service
export const profilesService = {
  // Get profile by ID
  async getById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Get profile by username
  async getByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error) throw error
    return data
  },

  // Create or update profile
  async upsert(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([profileData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update profile
  async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Trades service
export const tradesService = {
  // Get all trades
  async getAll() {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        sender:profiles!sender_id(id, username, avatar_url),
        receiver:profiles!receiver_id(id, username, avatar_url),
        card_offered:cards!card_offered_id(*),
        card_requested:cards!card_requested_id(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get trades for a user (sent or received)
  async getByUser(userId) {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        sender:profiles!sender_id(id, username, avatar_url),
        receiver:profiles!receiver_id(id, username, avatar_url),
        card_offered:cards!card_offered_id(*),
        card_requested:cards!card_requested_id(*)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Create a trade offer
  async create(tradeData) {
    const { data, error } = await supabase
      .from('trades')
      .insert([{
        ...tradeData,
        status: 'pending'
      }])
      .select(`
        *,
        sender:profiles!sender_id(id, username, avatar_url),
        receiver:profiles!receiver_id(id, username, avatar_url),
        card_offered:cards!card_offered_id(*),
        card_requested:cards!card_requested_id(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Update trade status (accept, reject, cancel)
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('trades')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        sender:profiles!sender_id(id, username, avatar_url),
        receiver:profiles!receiver_id(id, username, avatar_url),
        card_offered:cards!card_offered_id(*),
        card_requested:cards!card_requested_id(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  // Accept a trade (updates both cards' owners)
  async acceptTrade(tradeId) {
    // First get the trade details
    const { data: trade, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single()
    
    if (fetchError) throw fetchError

    // Update the trade status
    const { error: updateError } = await supabase
      .from('trades')
      .update({ status: 'accepted' })
      .eq('id', tradeId)
    
    if (updateError) throw updateError

    // Swap card ownership
    const { error: swap1Error } = await supabase
      .from('cards')
      .update({ owner_id: trade.receiver_id })
      .eq('id', trade.card_offered_id)
    
    if (swap1Error) throw swap1Error

    const { error: swap2Error } = await supabase
      .from('cards')
      .update({ owner_id: trade.sender_id })
      .eq('id', trade.card_requested_id)
    
    if (swap2Error) throw swap2Error

    return true
  }
}

// Auth helpers
export const authService = {
  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Sign up with email
  async signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in with email
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export default supabase

