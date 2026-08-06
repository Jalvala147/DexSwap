/** Shared marketplace constants */

export const RARITY_OPTIONS = [
  'Common',
  'Uncommon',
  'Rare',
  'Holo Rare',
  'Ultra Rare',
  'Secret Rare',
  'Legendary',
]

export const CONDITION_OPTIONS = [
  'Mint',
  'Near Mint',
  'Excellent',
  'Good',
  'Played',
  'Poor',
]

/** Pokémon TCG type filters — symbols used when PNG assets are missing */
export const POKEMON_ELEMENTS = [
  { id: 'fire', name: 'Fuego', image: '/elements/fire.png', color: '#FF6B4A', symbol: '🔥' },
  { id: 'water', name: 'Agua', image: '/elements/water.png', color: '#3BB4E8', symbol: '💧' },
  { id: 'electric', name: 'Eléctrico', image: '/elements/electric.png', color: '#F5C518', symbol: '⚡' },
  { id: 'grass', name: 'Planta', image: '/elements/grass.png', color: '#3D9B5F', symbol: '🌿' },
  { id: 'ice', name: 'Hielo', image: '/elements/ice.png', color: '#7DD3E8', symbol: '❄️' },
  { id: 'fighting', name: 'Lucha', image: '/elements/fighting.png', color: '#C45C4A', symbol: '🥊' },
  { id: 'poison', name: 'Veneno', image: '/elements/poison.png', color: '#8B5CF6', symbol: '☠️' },
  { id: 'ground', name: 'Tierra', image: '/elements/ground.png', color: '#C4883A', symbol: '🪨' },
  { id: 'flying', name: 'Volador', image: '/elements/flying.png', color: '#7EB8E0', symbol: '🪶' },
  { id: 'psychic', name: 'Psíquico', image: '/elements/psychic.png', color: '#D45A9A', symbol: '🔮' },
]

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function getElementById(id) {
  return POKEMON_ELEMENTS.find((e) => e.id === id) || null
}

export function matchesElement(card, element) {
  if (!card || !element) return false
  const elId = element.id?.toLowerCase()
  const elName = element.name?.toLowerCase()
  if (card.element && String(card.element).toLowerCase() === elId) return true
  const haystack = `${card.name || ''} ${card.description || ''} ${card.rarity || ''}`.toLowerCase()
  return Boolean(elName && haystack.includes(elName))
}

export function filterCardsByQuery(cards, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return cards
  return cards.filter((card) => {
    const fields = [
      card.name,
      card.rarity,
      card.condition,
      card.element,
      card.category,
      card.merch_type,
      card.merch_brand,
      card.owner?.username,
    ]
    return fields.some((f) => f && String(f).toLowerCase().includes(q))
  })
}
