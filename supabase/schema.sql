-- ============================================================
-- InDue — Schema database Supabase
-- Esegui questo script una sola volta in: Dashboard -> SQL Editor
-- ============================================================

-- 1) PROFILI ---------------------------------------------------
-- Un profilo per ciascuno di voi due, collegato all'account di login.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  color text not null default '#0F6B66'   -- colore personale (chip "assegnato a")
);

-- Crea automaticamente il profilo quando viene creato un utente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) CATEGORIE -------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '📌',
  color text not null default '#6B7280',
  sort_order int not null default 0
);

-- Categorie di partenza (modificale liberamente)
insert into public.categories (name, emoji, color, sort_order) values
  ('Casa',    '🏠', '#0F6B66', 1),
  ('Spesa',   '🛒', '#7C5CBF', 2),
  ('Vacanza', '🏖️', '#E8A63C', 3),
  ('Varie',   '📌', '#6B7280', 4);

-- 3) ATTIVITÀ --------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  category_id uuid references public.categories (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,  -- null = "di entrambi"
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create index tasks_done_idx on public.tasks (done, created_at desc);

-- 4) SICUREZZA (Row Level Security) ----------------------------
-- L'app è privata per voi due: qualunque utente AUTENTICATO può
-- leggere e scrivere tutto. Per questo è FONDAMENTALE disattivare
-- le registrazioni pubbliche (vedi README, passo 3).
alter table public.profiles  enable row level security;
alter table public.categories enable row level security;
alter table public.tasks      enable row level security;

create policy "lettura profili"   on public.profiles  for select to authenticated using (true);
create policy "modifica proprio profilo" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "lettura categorie" on public.categories for select to authenticated using (true);
create policy "gestione categorie" on public.categories for all to authenticated
  using (true) with check (true);

create policy "lettura attività"  on public.tasks for select to authenticated using (true);
create policy "creazione attività" on public.tasks for insert to authenticated
  with check (created_by = auth.uid());
create policy "modifica attività" on public.tasks for update to authenticated
  using (true) with check (true);
create policy "eliminazione attività" on public.tasks for delete to authenticated using (true);

-- 5) REALTIME --------------------------------------------------
-- Pubblica le modifiche alla tabella tasks: è ciò che tiene
-- sincronizzati i vostri dispositivi in tempo reale.
alter publication supabase_realtime add table public.tasks;
