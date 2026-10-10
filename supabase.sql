-- SITE HUGO & MATHEO — À exécuter dans Supabase > SQL Editor.
-- Les demandes sont publiquement insérables, mais seules les personnes inscrites dans site_admins peuvent les lire/modifier/supprimer.
create extension if not exists pgcrypto;

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company text not null check (company in ('hugo','matheo','indifferent')),
  service text not null check (service in ('Tonte de pelouse','Débroussaillage','Taille de haies','Élagage','Plantation et entretien','Autre demande')),
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  phone text not null check (char_length(trim(phone)) between 6 and 30),
  preferred_date date not null check (preferred_date >= current_date),
  city text not null check (char_length(trim(city)) between 2 and 120),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'pending' check (status in ('pending','accepted','declined','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
alter table public.appointments enable row level security;

-- Autorise un administrateur à vérifier uniquement sa propre présence dans la liste des admins.
drop policy if exists "Admins can read own admin entry" on public.site_admins;
create policy "Admins can read own admin entry" on public.site_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Formulaire public : INSERT seulement et statut obligatoirement en attente.
drop policy if exists "Anyone can submit pending appointment" on public.appointments;
create policy "Anyone can submit pending appointment" on public.appointments
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and company in ('hugo','matheo','indifferent')
    and service in ('Tonte de pelouse','Débroussaillage','Taille de haies','Élagage','Plantation et entretien','Autre demande')
    and preferred_date >= current_date
  );

-- Lecture, mise à jour et suppression réservées aux utilisateurs autorisés.
drop policy if exists "Admins can read appointments" on public.appointments;
create policy "Admins can read appointments" on public.appointments
  for select to authenticated using (
    exists (select 1 from public.site_admins a where a.user_id = (select auth.uid()))
  );
drop policy if exists "Admins can update appointments" on public.appointments;
create policy "Admins can update appointments" on public.appointments
  for update to authenticated using (
    exists (select 1 from public.site_admins a where a.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.site_admins a where a.user_id = (select auth.uid()))
  );
drop policy if exists "Admins can delete appointments" on public.appointments;
create policy "Admins can delete appointments" on public.appointments
  for delete to authenticated using (
    exists (select 1 from public.site_admins a where a.user_id = (select auth.uid()))
  );

-- Accès API minimum nécessaires. Les politiques RLS restent la protection principale.
grant usage on schema public to anon, authenticated;
grant insert on public.appointments to anon, authenticated;
grant select, update, delete on public.appointments to authenticated;
grant select on public.site_admins to authenticated;

-- APRÈS avoir créé un utilisateur dans Supabase > Authentication > Users,
-- récupérez son UUID puis exécutez cette commande en remplaçant l'UUID :
-- insert into public.site_admins (user_id) values ('UUID-DE-L-UTILISATEUR');
-- Répétez la commande pour le deuxième administrateur.
