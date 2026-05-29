-- Achats d'audios (paiement Fedapay)

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  audio_id uuid not null references public.audios (id) on delete cascade,
  amount_fcfa integer not null check (amount_fcfa >= 0),
  fedapay_transaction_id text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'canceled', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_audio_id_idx on public.purchases (audio_id);
create index if not exists purchases_fedapay_idx on public.purchases (fedapay_transaction_id);
create unique index if not exists purchases_user_audio_approved_idx
  on public.purchases (user_id, audio_id)
  where status = 'approved';

drop trigger if exists purchases_updated_at on public.purchases;
create trigger purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

alter table public.purchases enable row level security;

drop policy if exists "User voit ses achats" on public.purchases;
drop policy if exists "User crée ses achats" on public.purchases;
drop policy if exists "User ou admin met à jour achats" on public.purchases;

create policy "User voit ses achats"
  on public.purchases for select
  using (auth.uid() = user_id or public.is_admin());

create policy "User crée ses achats"
  on public.purchases for insert
  with check (auth.uid() = user_id and status = 'pending');

create policy "User ou admin met à jour achats"
  on public.purchases for update
  using (auth.uid() = user_id or public.is_admin());
