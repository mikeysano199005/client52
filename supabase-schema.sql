-- OTT Store - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text default 'user' check (role in ('user', 'admin')),
  wallet_balance decimal(10,2) default 0,
  referral_code text unique,
  referred_by uuid references users(id),
  phone text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Plans
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  image_url text,
  badge text,
  price_variants jsonb not null default '[]',
  stock_count integer default 0,
  rating decimal(3,1) default 0,
  review_count integer default 0,
  active boolean default true,
  featured boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Account Stock (for auto-delivery)
create table if not exists account_stock (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  variant_label text,
  email text,
  password text,
  profile_number text,
  extra_info text,
  status text default 'available' check (status in ('available', 'reserved', 'used')),
  order_id uuid,
  added_at timestamptz default now(),
  used_at timestamptz
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references users(id),
  plan_id uuid references plans(id),
  plan_name text,
  plan_variant jsonb,
  account_id uuid references account_stock(id),
  status text default 'payment_submitted' check (status in ('payment_submitted', 'under_verification', 'processing', 'delivered', 'cancelled')),
  amount decimal(10,2) not null,
  coupon_code text,
  discount_amount decimal(10,2) default 0,
  payment_method text default 'upi',
  payment_proof_url text,
  payment_utr text,
  wallet_used decimal(10,2) default 0,
  notes text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Wallet Transactions
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type text check (type in ('credit', 'debit')),
  amount decimal(10,2) not null,
  reason text,
  reference_id text,
  created_at timestamptz default now()
);

-- Coupons
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text check (discount_type in ('flat', 'percent')),
  discount_value decimal(10,2) not null,
  min_order_amount decimal(10,2) default 0,
  usage_limit integer default 1,
  used_count integer default 0,
  first_order_only boolean default false,
  expiry_at timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);

-- Referrals
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references users(id),
  referred_id uuid references users(id),
  reward_amount decimal(10,2) default 20,
  status text default 'pending' check (status in ('pending', 'credited')),
  order_id uuid references orders(id),
  created_at timestamptz default now()
);

-- Reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  plan_id uuid references plans(id),
  name text,
  rating integer check (rating between 1 and 5),
  body text,
  image_url text,
  verified boolean default false,
  active boolean default true,
  admin_reply text,
  created_at timestamptz default now()
);

-- Banners
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  link text,
  button_text text default 'Shop Now',
  active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Site Settings
create table if not exists settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Admin Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text,
  message text,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

-- Sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Default settings
insert into settings (key, value) values
  ('site_name', 'DIGITAL OTT'),
  ('site_tagline', 'Premium OTT Subscriptions at Best Prices'),
  ('whatsapp_number', '919999999999'),
  ('telegram_username', 'ottsupport'),
  ('telegram_bot_token', ''),
  ('telegram_admin_chat_id', ''),
  ('upi_id', 'yourupi@paytm'),
  ('upi_name', 'DIGITAL OTT'),
  ('referral_reward', '20'),
  ('currency_symbol', '₹')
on conflict (key) do nothing;

-- Default admin user (password: Admin@123 - CHANGE THIS)
insert into users (name, email, password_hash, role, referral_code)
values (
  'Admin',
  'admin@digitalott.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PVvPvu',
  'admin',
  'ADMIN001'
) on conflict (email) do nothing;

-- Sample plans
insert into plans (name, category, description, badge, price_variants, rating, review_count, featured, sort_order) values
(
  'Netflix Premium',
  'OTT',
  'Stream unlimited movies, TV shows, and Netflix Originals in 4K Ultra HD. Available on all your devices anytime, anywhere.',
  'HOT',
  '[{"label":"1 Month","months":1,"price":149,"original_price":799,"quality":"4K Ultra HD","access":"1 Screen"},{"label":"3 Months","months":3,"price":399,"original_price":2397,"quality":"4K Ultra HD","access":"1 Screen"},{"label":"6 Months","months":6,"price":749,"original_price":4794,"quality":"4K Ultra HD","access":"1 Screen"},{"label":"12 Months","months":12,"price":1299,"original_price":9588,"quality":"4K Ultra HD","access":"1 Screen"}]',
  4.8,
  245,
  true,
  1
),
(
  'Amazon Prime',
  'OTT',
  'Unlimited streaming of movies, TV shows, Amazon Originals. Includes Prime Music, Prime Reading, and fast delivery benefits.',
  'NEW',
  '[{"label":"1 Month","months":1,"price":99,"original_price":299,"quality":"Full HD","access":"1 Screen"},{"label":"3 Months","months":3,"price":249,"original_price":897,"quality":"Full HD","access":"1 Screen"},{"label":"12 Months","months":12,"price":799,"original_price":1499,"quality":"Full HD","access":"1 Screen"}]',
  4.7,
  189,
  true,
  2
),
(
  'Jio Hotstar',
  'OTT',
  'Stream live sports, blockbusters, and Disney+ content. Enjoy IPL, Premier League, and Disney Originals in Full HD.',
  'BEST VALUE',
  '[{"label":"1 Month","months":1,"price":59,"original_price":299,"quality":"Full HD","access":"2 Screens"},{"label":"3 Months","months":3,"price":149,"original_price":897,"quality":"Full HD","access":"2 Screens"},{"label":"12 Months","months":12,"price":499,"original_price":3588,"quality":"Full HD","access":"2 Screens"}]',
  4.6,
  312,
  true,
  3
),
(
  'YouTube Premium',
  'OTT',
  'Ad-free YouTube, background play, YouTube Music Premium, and YouTube Originals. Enjoy unlimited downloads.',
  null,
  '[{"label":"1 Month","months":1,"price":89,"original_price":189,"quality":"4K","access":"1 Account"},{"label":"3 Months","months":3,"price":229,"original_price":567,"quality":"4K","access":"1 Account"},{"label":"12 Months","months":12,"price":799,"original_price":2268,"quality":"4K","access":"1 Account"}]',
  4.5,
  156,
  false,
  4
),
(
  'Zee5 Premium',
  'OTT',
  'Watch latest Bollywood movies, TV serials, ZEE5 Originals, and live TV in HD quality.',
  null,
  '[{"label":"1 Month","months":1,"price":49,"original_price":199,"quality":"Full HD","access":"1 Screen"},{"label":"3 Months","months":3,"price":129,"original_price":597,"quality":"Full HD","access":"1 Screen"},{"label":"12 Months","months":12,"price":449,"original_price":2388,"quality":"Full HD","access":"1 Screen"}]',
  4.4,
  98,
  false,
  5
),
(
  'OTT Mega Combo',
  'Combos',
  'Get Netflix + Amazon Prime + Jio Hotstar all in one bundle. Best value combo for unlimited entertainment.',
  'BEST DEAL',
  '[{"label":"1 Month","months":1,"price":299,"original_price":1397,"quality":"Mix","access":"3 Platforms"},{"label":"3 Months","months":3,"price":799,"original_price":4191,"quality":"Mix","access":"3 Platforms"},{"label":"6 Months","months":6,"price":1499,"original_price":8382,"quality":"Mix","access":"3 Platforms"}]',
  4.9,
  421,
  true,
  6
)
on conflict do nothing;
