-- Profils experts publics (catalogue experts)

create table if not exists public.experts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  display_name text not null,
  avatar_url text,
  specialty text not null,
  bio text,
  city text,
  rating numeric(3, 1) not null default 5.0 check (rating >= 0 and rating <= 5),
  services jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experts_specialty_idx on public.experts (specialty);
create index if not exists experts_active_idx on public.experts (is_active);

drop trigger if exists experts_updated_at on public.experts;
create trigger experts_updated_at
  before update on public.experts
  for each row execute function public.set_updated_at();

alter table public.experts enable row level security;

drop policy if exists "Experts actifs visibles par tous" on public.experts;
drop policy if exists "Admin gère les experts" on public.experts;

create policy "Experts actifs visibles par tous"
  on public.experts for select
  using (is_active = true or public.is_admin());

create policy "Admin gère les experts"
  on public.experts for all
  using (public.is_admin())
  with check (public.is_admin());

-- Données de démonstration
insert into public.experts (display_name, specialty, bio, city, rating, services)
select * from (values
  (
    'Kofi Mensah',
    'Mixage & Mastering',
    'Ingénieur son avec 12 ans d''expérience en Afrobeats et Hip-Hop. Spécialiste du mix vocal et des basses profondes.',
    'Lomé, Togo',
    4.9::numeric,
    '[
      {"name": "Avis professionnel", "price_fcfa": 2000},
      {"name": "Mixage", "price_fcfa": 15000},
      {"name": "Mastering", "price_fcfa": 20000}
    ]'::jsonb
  ),
  (
    'Amina Bello',
    'Production vocale',
    'Coach vocale et productrice R&B/Gospel. Accompagne les artistes de la maquette à la prise finale.',
    'Cotonou, Bénin',
    4.8::numeric,
    '[
      {"name": "Avis professionnel", "price_fcfa": 2000},
      {"name": "Coaching vocal", "price_fcfa": 10000},
      {"name": "Production complète", "price_fcfa": null, "on_quote": true}
    ]'::jsonb
  ),
  (
    'Jean-Paul Dossou',
    'Beatmaking & Arrangement',
    'Beatmaker et arrangeur. Crée des instrumentales sur mesure et peaufine vos productions Afrobeats.',
    'Abidjan, Côte d''Ivoire',
    4.7::numeric,
    '[
      {"name": "Avis professionnel", "price_fcfa": 2000},
      {"name": "Arrangement", "price_fcfa": 12000},
      {"name": "Production complète", "price_fcfa": null, "on_quote": true}
    ]'::jsonb
  ),
  (
    'Fatou Diarra',
    'Mastering & Sound Design',
    'Experte mastering pour streaming et radio. Optimise vos titres pour Spotify, Apple Music et les clubs.',
    'Dakar, Sénégal',
    5.0::numeric,
    '[
      {"name": "Avis professionnel", "price_fcfa": 2000},
      {"name": "Mastering", "price_fcfa": 20000},
      {"name": "Sound design", "price_fcfa": 8000}
    ]'::jsonb
  )
) as v(display_name, specialty, bio, city, rating, services)
where not exists (
  select 1 from public.experts e where e.display_name = v.display_name
);
