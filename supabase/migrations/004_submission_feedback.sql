-- Avis admin/expert sur les maquettes envoyées

alter table public.audios
  add column if not exists review_feedback text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

-- Admin peut écouter les fichiers privés des maquettes
drop policy if exists "Admin lit fichiers audio" on storage.objects;
create policy "Admin lit fichiers audio"
  on storage.objects for select
  using (bucket_id = 'audio-files' and public.is_admin());
