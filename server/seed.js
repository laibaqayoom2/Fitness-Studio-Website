import fs from 'node:fs'
import pool from './db.js'
import { hashPassword } from './passwords.js'
import { CLASSES, DEMO_USERS, PLANS, TRAINERS } from './seed-data.js'

await pool.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))
// safe to run twice; CASCADE clears booking/session rows that reference these
await pool.query('TRUNCATE booking_items, bookings, sessions, users, classes, trainers, plans RESTART IDENTITY CASCADE')

for (const c of CLASSES) {
  await pool.query(
    'INSERT INTO classes (day, time, name, coach, category, spots, capacity) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [c.day, c.time, c.name, c.coach, c.category, c.spots, c.capacity])
}
for (const t of TRAINERS) {
  await pool.query('INSERT INTO trainers (name, role, img, bio) VALUES ($1,$2,$3,$4)',
    [t.name, t.role, t.img, t.bio])
}
for (const p of PLANS) {
  await pool.query(
    'INSERT INTO plans (name, price, note, featured, button, perks) VALUES ($1,$2,$3,$4,$5,$6)',
    [p.name, p.price, p.note, p.featured, p.button, p.perks])
}

for (const user of DEMO_USERS) {
  const passwordHash = await hashPassword(user.password)
  const { rows: [row] } = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id',
    [user.name, user.email, passwordHash, user.role])

  if (user.trainer) {
    await pool.query('UPDATE trainers SET user_id = $1 WHERE name = $2', [row.id, user.trainer])
  }
}

console.log('Seeded', CLASSES.length, 'classes,', TRAINERS.length, 'trainers,', PLANS.length, 'plans,', DEMO_USERS.length, 'users')
await pool.end()
