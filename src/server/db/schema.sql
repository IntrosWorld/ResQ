create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_primary text not null default '#0f766e',
  brand_accent text not null default '#f59e0b',
  created_at timestamptz not null default now()
);

create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists floors (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  name text not null,
  level_index integer not null,
  bounds jsonb not null default '{"minX":0,"minY":0,"maxX":900,"maxY":560}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists floor_maps (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('sample','dwg','dxf','svg','image')),
  import_status text not null check (import_status in ('ready','needs_converter','unsupported','failed')),
  message text not null,
  asset_url text,
  segments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists graph_nodes (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  label text not null,
  node_type text not null check (node_type in ('room','pathway','corridor','junction','staircase','exit','extinguisher','camera','sensor','actuator','ble_beacon','qr_checkpoint')),
  x double precision not null,
  y double precision not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists graph_edges (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  from_node_id uuid not null references graph_nodes(id) on delete cascade,
  to_node_id uuid not null references graph_nodes(id) on delete cascade,
  distance double precision not null check (distance > 0),
  status text not null default 'open' check (status in ('open','blocked')),
  created_at timestamptz not null default now()
);

create table if not exists people_locations (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  label text not null,
  role text not null check (role in ('guest','staff','contractor','unknown')),
  ble_node_id uuid references graph_nodes(id) on delete set null,
  qr_node_id uuid references graph_nodes(id) on delete set null,
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  updated_at timestamptz not null default now()
);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references floors(id) on delete cascade,
  status text not null default 'active' check (status in ('active','contained','closed')),
  summary text not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists hazards (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  floor_id uuid not null references floors(id) on delete cascade,
  hazard_type text not null check (hazard_type in ('fire','smoke','gas','structural','security','other')),
  label text not null,
  node_id uuid references graph_nodes(id) on delete set null,
  x double precision not null,
  y double precision not null,
  radius double precision not null check (radius > 0),
  severity text not null check (severity in ('low','medium','high','critical')),
  active boolean not null default true,
  source text not null default 'manual',
  confidence double precision,
  created_at timestamptz not null default now()
);

create table if not exists response_actions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  action_type text not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending','running','complete','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
