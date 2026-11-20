-- ============================================================
-- Wedding Live Guest Gallery — Supabase Schema + RLS + Realtime
-- Jalankan script ini di Supabase Dashboard -> SQL Editor
-- ============================================================

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 40),
  table_number text check (table_number is null or char_length(table_number) <= 20),
  idea_tag text check (idea_tag is null or idea_tag in ('candid', 'decor', 'group', 'highlight')),
  cloudinary_public_id text not null,
  image_url text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Index untuk urutan terbaru & pagination cepat
create index if not exists idx_photos_visible_created_at
  on public.photos (is_visible, created_at desc);

-- Grant hak akses eksplisit untuk role Supabase API
grant usage on schema public to anon, authenticated, service_role;
grant select on public.photos to anon, authenticated;
grant select, insert, update, delete on public.photos to service_role;

-- Aktifkan Row Level Security (RLS)
alter table public.photos enable row level security;

-- Tamu undangan TANPA LOGIN hanya boleh membaca foto yang is_visible = true
-- (INSERT/UPDATE/DELETE dilakukan aman lewat Next.js API Route memakai service_role)
drop policy if exists "Public can read visible photos" on public.photos;
create policy "Public can read visible photos"
  on public.photos
  for select
  to anon, authenticated
  using (is_visible = true);

-- Aktifkan Realtime agar pill "X foto baru" & moderasi bekerja live
alter publication supabase_realtime add table public.photos;
