-- Numéro de téléphone à l'inscription

alter table public.profiles
  add column if not exists phone text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, phone)
  values (
    new.id,
    split_part(new.email, '@', 1),
    nullif(trim(new.raw_user_meta_data->>'phone'), '')
  );
  return new;
end;
$$;
