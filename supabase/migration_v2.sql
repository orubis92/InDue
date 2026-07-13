-- ============================================================
-- InDue — Migrazione alla versione 2
-- Esegui questo script UNA volta in: Dashboard -> SQL Editor
-- (dopo aver già eseguito schema.sql in passato)
-- ============================================================

-- 1) Nuove colonne sulle attività ------------------------------
-- repeat_days: ogni quanti giorni si ripete (null = non ricorrente)
-- done_by: chi l'ha completata ("chi ha fatto cosa")
alter table public.tasks add column if not exists repeat_days int;
alter table public.tasks add column if not exists done_by uuid references public.profiles (id);

-- 2) Liste riutilizzabili (es. valigia per le vacanze) ---------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🧳',
  category_id uuid references public.categories (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);

alter table public.templates      enable row level security;
alter table public.template_items enable row level security;

create policy "gestione templates" on public.templates
  for all to authenticated using (true) with check (true);
create policy "gestione template_items" on public.template_items
  for all to authenticated using (true) with check (true);

-- 3) Iscrizioni alle notifiche push ----------------------------
-- Ogni riga è un dispositivo che ha attivato le notifiche.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "gestione proprie iscrizioni" on public.push_subscriptions
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
