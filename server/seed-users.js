import fs from 'node:fs'
import pool from './db.js'
import { hashPassword } from './passwords.js'
import { DEMO_USERS } from './seed-data.js'

// Applies schema changes and upserts demo accounts without clearing existing
// classes, trainers, bookings or registrations.
await pool.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))

for (const user of DEMO_USERS) {
  const passwordHash = await hashPassword(user.password)
  const { rows: [row] } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role
     RETURNING id`,
    [user.name, user.email, passwordHash, user.role])

  if (user.trainer) {
    await pool.query('UPDATE trainers SET user_id = $1 WHERE name = $2', [row.id, user.trainer])
  }
}

console.log('Upserted', DEMO_USERS.length, 'demo users')
await pool.end()
