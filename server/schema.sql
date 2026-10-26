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
