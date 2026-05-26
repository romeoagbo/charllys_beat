-- Profils utilisateurs
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catalogue audios
create table if not exists public.audios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  price_fcfa integer not null default 1000 check (price_fcfa >= 0),
  duration_seconds numeric,
  file_path text not null,
  preview_path text,
  cover_path text,
  file_size bigint,
  mime_type text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audios_profile_fkey foreign key (user_id) references public.profiles (id)
);

create index if not exists audios_user_id_idx on public.audios (user_id);
create index if not exists audios_category_idx on public.audios (category);
create index if not exists audios_status_created_idx on public.audios (status, created_at desc);

-- Auto-création profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profils pour utilisateurs déjà inscrits
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists audios_updated_at on public.audios;
create trigger audios_updated_at
  before update on public.audios
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.audios enable row level security;

drop policy if exists "Profils visibles par tous" on public.profiles;
drop policy if exists "Utilisateur modifie son profil" on public.profiles;
drop policy if exists "Audios publiés visibles par tous" on public.audios;
drop policy if exists "Utilisateur crée ses audios" on public.audios;
drop policy if exists "Utilisateur modifie ses audios" on public.audios;
drop policy if exists "Utilisateur supprime ses audios" on public.audios;

create policy "Profils visibles par tous"
  on public.profiles for select
  using (true);

create policy "Utilisateur modifie son profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Audios publiés visibles par tous"
  on public.audios for select
  using (status = 'published' or auth.uid() = user_id);

create policy "Utilisateur crée ses audios"
  on public.audios for insert
  with check (auth.uid() = user_id);

create policy "Utilisateur modifie ses audios"
  on public.audios for update
  using (auth.uid() = user_id);

create policy "Utilisateur supprime ses audios"
  on public.audios for delete
  using (auth.uid() = user_id);

-- Buckets Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'audio-files',
    'audio-files',
    false,
    52428800,
    array['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-wav', 'audio/webm']
  ),
  (
    'audio-previews',
    'audio-previews',
    true,
    52428800,
    array['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-wav', 'audio/webm']
  ),
  (
    'audio-covers',
    'audio-covers',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies Storage : audio-files (privé)
drop policy if exists "Propriétaire lit ses fichiers audio" on storage.objects;
drop policy if exists "Propriétaire upload fichiers audio" on storage.objects;
drop policy if exists "Propriétaire supprime fichiers audio" on storage.objects;
drop policy if exists "Previews lisibles par tous" on storage.objects;
drop policy if exists "Propriétaire upload previews" on storage.objects;
drop policy if exists "Propriétaire supprime previews" on storage.objects;
drop policy if exists "Covers lisibles par tous" on storage.objects;
drop policy if exists "Propriétaire upload covers" on storage.objects;
drop policy if exists "Propriétaire supprime covers" on storage.objects;

create policy "Propriétaire lit ses fichiers audio"
  on storage.objects for select
  using (bucket_id = 'audio-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Propriétaire upload fichiers audio"
  on storage.objects for insert
  with check (bucket_id = 'audio-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Propriétaire supprime fichiers audio"
  on storage.objects for delete
  using (bucket_id = 'audio-files' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policies Storage : audio-previews (public lecture)
create policy "Previews lisibles par tous"
  on storage.objects for select
  using (bucket_id = 'audio-previews');

create policy "Propriétaire upload previews"
  on storage.objects for insert
  with check (bucket_id = 'audio-previews' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Propriétaire supprime previews"
  on storage.objects for delete
  using (bucket_id = 'audio-previews' and auth.uid()::text = (storage.foldername(name))[1]);

-- Policies Storage : audio-covers (public lecture)
create policy "Covers lisibles par tous"
  on storage.objects for select
  using (bucket_id = 'audio-covers');

create policy "Propriétaire upload covers"
  on storage.objects for insert
  with check (bucket_id = 'audio-covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Propriétaire supprime covers"
  on storage.objects for delete
  using (bucket_id = 'audio-covers' and auth.uid()::text = (storage.foldername(name))[1]);
