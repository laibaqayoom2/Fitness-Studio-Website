CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY, day TEXT NOT NULL, time TEXT NOT NULL, name TEXT NOT NULL,
  coach TEXT NOT NULL, category TEXT NOT NULL, spots INTEGER NOT NULL CHECK (spots >= 0),
  capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0)
);

-- Keeps existing databases (created before `capacity` was added) in sync.
ALTER TABLE classes ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 0;
UPDATE classes SET capacity = spots WHERE capacity = 0;

CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, img TEXT NOT NULL, bio TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trainers_user_id_idx ON trainers (user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL, note TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false, button TEXT NOT NULL, perks TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings (user_id);

CREATE TABLE IF NOT EXISTS booking_items (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  spots INTEGER NOT NULL CHECK (spots > 0),
  UNIQUE (booking_id, class_id)
);
CREATE INDEX IF NOT EXISTS booking_items_booking_id_idx ON booking_items (booking_id);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages (created_at DESC);

-- Orders: one checkout session per order. Amounts are stored in minor units
-- (cents) to match the Stripe API. `stripe_session_id` is the reconciliation key
-- shared with the webhook; UNIQUE stops duplicate sessions from being attached.
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- refunded: a settled payment was returned by the admin; the membership is
  -- revoked but the money trail stays in Stripe's refund receipt.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled', 'refunded')),
  stripe_session_id TEXT UNIQUE,
  amount_total INTEGER NOT NULL CHECK (amount_total >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
-- Existing databases may predate the refunded status; normalize the constraint.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'canceled', 'refunded'));
-- Orders with no Stripe session yet (e.g. Stripe not configured) are allowed:
-- `stripe_session_id` is nullable and only set when Checkout is created.
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

-- The product, its price and the quantity are captured at purchase time so a
-- later price change in `plans` never rewrites past orders.
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  plan_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_amount INTEGER NOT NULL CHECK (unit_amount >= 0)
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
