-- VIBE CUT MEN'S SALON — Supabase schema
-- This file matches the fresh VIBE CUT database used by the current project.

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  is_popular boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete restrict,
  service_name text not null,
  price numeric(10,2) not null check (price >= 0),
  appointment_date date not null,
  appointment_time time not null,
  customer_name text not null,
  phone text not null,
  email text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists appointments_date_time_idx
  on public.appointments (appointment_date, appointment_time);

create unique index if not exists appointments_active_slot_unique
  on public.appointments (appointment_date, appointment_time)
  where status in ('pending','confirmed');

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null unique check (weekday between 0 and 6),
  is_open boolean not null default true,
  start_time time,
  end_time time
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  blocked_time time not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (blocked_date, blocked_time)
);

create table if not exists public.salon_settings (
  id uuid primary key default gen_random_uuid(),
  salon_name text not null default 'VIBE CUT MEN''S SALON',
  salon_email text,
  salon_phone text,
  salon_whatsapp text,
  salon_address text default 'Tirupati, Andhra Pradesh, India',
  slot_interval_minutes integer not null default 30,
  booking_notice_hours integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.salon_settings enable row level security;
alter table public.admin_users enable row level security;

-- Public booking needs to read services and availability.
drop policy if exists "Anyone can read active services" on public.services;
create policy "Anyone can read active services" on public.services
for select to anon, authenticated using (is_active = true);

drop policy if exists "Anyone can create appointments" on public.appointments;
create policy "Anyone can create appointments" on public.appointments
for insert to anon, authenticated with check (status = 'pending');

-- Existing public availability reads are retained for the client booking flow.
drop policy if exists "Anyone can read appointments" on public.appointments;
create policy "Anyone can read appointments" on public.appointments
for select to anon, authenticated using (true);

drop policy if exists "Anyone can read business hours" on public.business_hours;
create policy "Anyone can read business hours" on public.business_hours
for select to anon, authenticated using (true);

drop policy if exists "Anyone can read blocked dates" on public.blocked_dates;
create policy "Anyone can read blocked dates" on public.blocked_dates
for select to anon, authenticated using (true);

drop policy if exists "Anyone can read blocked slots" on public.blocked_slots;
create policy "Anyone can read blocked slots" on public.blocked_slots
for select to anon, authenticated using (true);

drop policy if exists "Anyone can read salon settings" on public.salon_settings;
create policy "Anyone can read salon settings" on public.salon_settings
for select to anon, authenticated using (true);

-- Admin mutations/read access.
drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services" on public.services
for all to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can update appointments" on public.appointments;
create policy "Admins can update appointments" on public.appointments
for update to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can delete appointments" on public.appointments;
create policy "Admins can delete appointments" on public.appointments
for delete to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage business hours" on public.business_hours;
create policy "Admins can manage business hours" on public.business_hours
for all to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage blocked dates" on public.blocked_dates;
create policy "Admins can manage blocked dates" on public.blocked_dates
for all to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage blocked slots" on public.blocked_slots;
create policy "Admins can manage blocked slots" on public.blocked_slots
for all to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Admins can manage salon settings" on public.salon_settings;
create policy "Admins can manage salon settings" on public.salon_settings
for all to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "Users can read their own admin row" on public.admin_users;
create policy "Users can read their own admin row" on public.admin_users
for select to authenticated using (auth.uid() = user_id);

create unique index if not exists appointments_active_slot_unique
  on public.appointments (appointment_date, appointment_time)
  where status in ('pending','confirmed');
