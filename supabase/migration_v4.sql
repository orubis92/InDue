-- ============================================================
-- InDue — Migrazione alla versione 4
-- Esegui questo script UNA volta in: Dashboard -> SQL Editor
-- ============================================================

-- 1) Orario personale del promemoria mattutino (ora italiana, 0-23)
alter table public.profiles add column if not exists reminder_hour int not null default 8;

-- 2) Foto allegate ad attività e libretto sanitario
alter table public.tasks      add column if not exists photo_path text;
alter table public.pet_events add column if not exists photo_path text;

-- 3) Bucket di archiviazione per le foto -----------------------
-- Le foto sono leggibili da chi ha il link (percorsi casuali non
-- indovinabili); caricare ed eliminare richiede il login.
insert into storage.buckets (id, name, public)
values ('foto', 'foto', true)
on conflict (id) do nothing;

create policy "foto lettura" on storage.objects
  for select using (bucket_id = 'foto');
create policy "foto caricamento" on storage.objects
  for insert to authenticated with check (bucket_id = 'foto');
create policy "foto eliminazione" on storage.objects
  for delete to authenticated using (bucket_id = 'foto');
