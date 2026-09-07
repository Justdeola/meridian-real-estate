-- Meridian real-estate platform schema

create table if not exists settings (
  key text primary key,
  value text not null
);

insert into settings (key, value) values ('new_listing_days', '14')
on conflict (key) do nothing;

create table if not exists property_types (
  id serial primary key,
  slug text unique not null,
  name text not null,
  category text not null,
  sort_order int not null default 0
);

create table if not exists amenities (
  id serial primary key,
  slug text unique not null,
  name text not null,
  icon text not null default 'Check',
  sort_order int not null default 0
);

create table if not exists agencies (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text not null default '',
  logo_url text,
  cover_url text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  country text not null default 'Nigeria',
  lat double precision,
  lng double precision,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists agents (
  id text primary key,
  user_id text unique,
  agency_id text references agencies(id) on delete set null,
  slug text unique not null,
  name text not null,
  title text,
  bio text not null default '',
  image_url text,
  email text,
  phone text,
  years_experience int not null default 0,
  is_verified boolean not null default false,
  specializations text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id text primary key,
  role text not null default 'CLIENT',
  display_name text,
  phone text,
  avatar_url text,
  agent_id text references agents(id) on delete set null,
  agency_id text references agencies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists properties (
  id text primary key,
  slug text unique not null,
  title text not null,
  description text not null,
  listing_type text not null,
  property_type_id int not null references property_types(id),
  status text not null default 'DRAFT',
  price numeric not null,
  currency text not null default 'NGN',
  bedrooms int,
  bathrooms int,
  toilets int,
  parking int,
  size_sqm numeric,
  land_size_sqm numeric,
  year_built int,
  address text,
  area text,
  city text,
  state text,
  country text not null default 'Nigeria',
  lat double precision,
  lng double precision,
  agent_id text references agents(id) on delete set null,
  agency_id text references agencies(id) on delete set null,
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  rejection_reason text,
  views int not null default 0,
  published_at timestamptz,
  available_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists property_images (
  id serial primary key,
  property_id text not null references properties(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  is_primary boolean not null default false
);

create table if not exists property_amenities (
  property_id text not null references properties(id) on delete cascade,
  amenity_id int not null references amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

create table if not exists favorites (
  user_id text not null,
  property_id text not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table if not exists inquiries (
  id text primary key,
  user_id text,
  property_id text not null references properties(id) on delete cascade,
  agent_id text references agents(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  contact_method text not null default 'EMAIL',
  status text not null default 'OPEN',
  agent_response text,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id text primary key,
  user_id text not null,
  property_id text not null references properties(id) on delete cascade,
  agent_id text references agents(id) on delete set null,
  preferred_date date not null,
  preferred_time text not null,
  scheduled_at timestamptz,
  message text,
  status text not null default 'PENDING',
  agent_note text,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id text primary key,
  user_id text not null,
  agent_id text references agents(id) on delete cascade,
  agency_id text references agencies(id) on delete cascade,
  rating int not null,
  body text,
  created_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating >= 1 and rating <= 5),
  constraint reviews_target check (
    (agent_id is not null and agency_id is null)
    or (agent_id is null and agency_id is not null)
  )
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  title text not null,
  body text,
  type text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists saved_searches (
  id text primary key,
  user_id text not null,
  name text not null,
  params text not null,
  alerts_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists property_views (
  id serial primary key,
  property_id text not null references properties(id) on delete cascade,
  user_id text,
  created_at timestamptz not null default now()
);

create table if not exists property_status_history (
  id serial primary key,
  property_id text not null references properties(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text,
  note text,
  created_at timestamptz not null default now()
);

create unique index if not exists reviews_user_agent_uidx
  on reviews (user_id, agent_id) where agent_id is not null;
create unique index if not exists reviews_user_agency_uidx
  on reviews (user_id, agency_id) where agency_id is not null;

create index if not exists properties_status_idx on properties (status);
create index if not exists properties_type_idx on properties (property_type_id);
create index if not exists properties_listing_type_idx on properties (listing_type);
create index if not exists properties_price_idx on properties (price);
create index if not exists properties_city_idx on properties (city);
create index if not exists properties_state_idx on properties (state);
create index if not exists properties_area_idx on properties (area);
create index if not exists properties_created_idx on properties (created_at desc);
create index if not exists properties_agent_idx on properties (agent_id);
create index if not exists properties_agency_idx on properties (agency_id);
create index if not exists properties_featured_idx on properties (is_featured) where is_featured = true;
create index if not exists properties_slug_idx on properties (slug);
create index if not exists properties_published_idx on properties (published_at desc);

create index if not exists property_images_property_idx on property_images (property_id, sort_order);
create index if not exists favorites_property_idx on favorites (property_id);
create index if not exists favorites_user_idx on favorites (user_id);
create index if not exists inquiries_agent_idx on inquiries (agent_id, created_at desc);
create index if not exists inquiries_user_idx on inquiries (user_id, created_at desc);
create index if not exists inquiries_property_idx on inquiries (property_id);
create index if not exists appointments_agent_idx on appointments (agent_id, preferred_date);
create index if not exists appointments_user_idx on appointments (user_id, preferred_date);
create index if not exists notifications_user_idx on notifications (user_id, is_read, created_at desc);
create index if not exists agents_agency_idx on agents (agency_id);
create index if not exists agents_slug_idx on agents (slug);
create index if not exists agencies_slug_idx on agencies (slug);
create index if not exists property_views_property_idx on property_views (property_id);
create index if not exists saved_searches_user_idx on saved_searches (user_id);
