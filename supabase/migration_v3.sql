-- ============================================================
-- InDue — Migrazione alla versione 3: sezione Animali 🐾
-- Esegui questo script UNA volta in: Dashboard -> SQL Editor
-- ============================================================

-- 1) Nuova categoria per le attività legate agli animali --------
insert into public.categories (name, emoji, color, sort_order)
select 'Animali', '🐾', '#8A6D3B', 5
where not exists (select 1 from public.categories where name = 'Animali');

-- 2) Anagrafica degli animali -----------------------------------
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🐶',
  breed text,                 -- razza / specie
  birth_date date,
  notes text,                 -- cibo preferito, allergie, microchip, veterinario...
  created_at timestamptz not null default now()
);

-- 3) Libretto sanitario: visite, vaccini, trattamenti ----------
create table public.pet_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  event_type text not null,   -- 'Visita veterinaria', 'Vaccino', 'Antiparassitario', ...
  event_date date not null,
  notes text,
  next_due date,              -- prossima scadenza (es. richiamo vaccino)
  created_at timestamptz not null default now()
);

create index pet_events_pet_idx on public.pet_events (pet_id, event_date desc);

-- 4) Sicurezza ---------------------------------------------------
alter table public.pets       enable row level security;
alter table public.pet_events enable row level security;

create policy "gestione pets" on public.pets
  for all to authenticated using (true) with check (true);
create policy "gestione pet_events" on public.pet_events
  for all to authenticated using (true) with check (true);
