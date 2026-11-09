-- ============================================================
-- Signage Control Panel — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── devices ────────────────────────────────────────────────
create table if not exists devices (
  id         uuid primary key default uuid_generate_v4(),
  nama       text not null,
  lokasi     text not null,
  status     text not null default 'offline' check (status in ('online', 'offline')),
  last_seen  timestamptz,
  created_at timestamptz default now()
);

-- ─── contents ───────────────────────────────────────────────
create table if not exists contents (
  id         uuid primary key default uuid_generate_v4(),
  judul      text not null,
  tipe       text not null check (tipe in ('image', 'video', 'url', 'text')),
  payload    text,           -- URL atau path file atau teks konten
  created_at timestamptz default now()
);

-- ─── device_playlists ───────────────────────────────────────
create table if not exists device_playlists (
  id          uuid primary key default uuid_generate_v4(),
  device_id   uuid not null references devices(id) on delete cascade,
  content_id  uuid not null references contents(id) on delete cascade,
  order_index integer not null default 0,
  duration    integer not null default 10,  -- seconds
  created_at  timestamptz default now(),
  unique(device_id, content_id)
);

-- ─── Indexes ────────────────────────────────────────────────
create index if not exists idx_devices_status on devices(status);
create index if not exists idx_playlist_device on device_playlists(device_id, order_index);

-- ─── Row Level Security (optional — disable for service key) ─
-- alter table devices enable row level security;
-- alter table contents enable row level security;
-- alter table device_playlists enable row level security;
