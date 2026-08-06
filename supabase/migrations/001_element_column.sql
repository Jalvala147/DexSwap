-- Optional: Pokémon type filter for marketplace listings
-- Run in Supabase SQL editor if the column does not exist yet.

alter table public.cards
  add column if not exists element text;

create index if not exists cards_element_idx on public.cards (element);

comment on column public.cards.element is 'Pokémon TCG type id: fire, water, electric, grass, ice, fighting, poison, ground, flying, psychic';
