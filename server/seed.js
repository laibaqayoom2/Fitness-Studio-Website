import fs from 'node:fs'
import pool from './db.js'
import { CLASSES, TRAINERS, PLANS } from './seed-data.js'

await pool.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))
await pool.query('TRUNCATE classes, trainers, plans RESTART IDENTITY') // safe to run twice

for (const c of CLASSES) {
  await pool.query(
    'INSERT INTO classes (day, time, name, coach, category, spots) VALUES ($1,$2,$3,$4,$5,$6)',
    [c.day, c.time, c.name, c.coach, c.category, c.spots])
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
console.log('Seeded', CLASSES.length, 'classes,', TRAINERS.length, 'trainers,', PLANS.length, 'plans')
await pool.end()