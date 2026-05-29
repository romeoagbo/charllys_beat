-- Rôles utilisateurs + types d'audio (catalogue vs envoi expert)

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('admin', 'user', 'expert'));

alter table public.audios
  add column if not exists kind text not null default 'catalog'
  check (kind in ('catalog', 'submission'));

alter table public.audios drop constraint if exists audios_status_check;
alter table public.audios
  add constraint audios_status_check
  check (status in ('draft', 'published', 'archived', 'pending', 'reviewed'));

-- Audios existants = catalogue publié
update public.audios set kind = 'catalog' where kind is null;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_expert_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'expert')
  );
$$;

-- RLS audios
drop policy if exists "Audios publiés visibles par tous" on public.audios;
drop policy if exists "Utilisateur crée ses audios" on public.audios;
drop policy if exists "Utilisateur modifie ses audios" on public.audios;
drop policy if exists "Utilisateur supprime ses audios" on public.audios;

create policy "Lecture audios"
  on public.audios for select
  using (
    (kind = 'catalog' and status = 'published')
    or auth.uid() = user_id
    or public.is_expert_or_admin()
  );

create policy "Admin publie catalogue"
  on public.audios for insert
  with check (
    auth.uid() = user_id
    and kind = 'catalog'
    and public.is_admin()
  );

create policy "Utilisateur envoie aux experts"
  on public.audios for insert
  with check (
    auth.uid() = user_id
    and kind = 'submission'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'user'
    )
  );

create policy "Propriétaire ou admin modifie audios"
  on public.audios for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Propriétaire ou admin supprime audios"
  on public.audios for delete
  using (auth.uid() = user_id or public.is_admin());
