# DEXswap

Mercado online de cartas Pokémon TCG: publica, compra e intercambia con otros coleccionistas.

## Stack

- **Frontend**: React 18 + Vite + React Router
- **Auth / DB / Storage**: Supabase (Auth, Postgres, Realtime, Storage)
- **Pagos**: PayPal (sandbox) vía Express local o Vercel serverless (`api/paypal/*`)
- **Legacy local**: Express + SQLite (`server/`) — solo desarrollo / proxy PayPal; el producto usa Supabase

## Setup

### 1. Dependencias

```bash
npm run install-all
```

### 2. Variables de entorno

**Client** (`client/.env`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Server / PayPal** (`server/.env` o Vercel env):

```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

### 3. Supabase

1. Crea tablas `profiles`, `cards`, `trades`, `trade_messages`, `purchases` con RLS.
2. Bucket de Storage público `cards`.
3. RPCs `security definer`: `purchase_card(card_id uuid)` y `accept_trade(trade_id uuid)`.
4. Opcional: aplica `supabase/migrations/001_element_column.sql` para filtrar por tipo Pokémon.

### 4. Arranque

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- API PayPal local: http://localhost:3001  

## Rutas (SPA)

| Ruta | Vista |
|------|--------|
| `/` | Inicio + recientes |
| `/browse` | Catálogo / búsqueda |
| `/upload` | Publicar (auth) |
| `/my-cards` | Tus publicaciones |
| `/profile` | Intercambios y cuenta |
| `/element/:id` | Filtro por tipo |

## Flujos clave

- **Compra**: el cliente verifica disponibilidad/precio → PayPal create/capture → RPC `purchase_card`. La compra simulada solo aparece en desarrollo.
- **Intercambio**: oferta + chat; aceptar solo vía RPC `accept_trade` (atómico).
- **Tipos**: al subir una carta Pokémon puedes etiquetar el tipo; el menú lateral filtra por `element` (o coincidencia de texto).

## Deploy (Vercel)

`vercel.json` construye `client/` y reescribe rutas SPA a `index.html`. Las funciones en `api/paypal/` manejan PayPal en producción.
