// Applies schema.sql without touching any data. Every statement is
// idempotent (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS), so this
// is safe to run repeatedly on a database that already has data.
// Deliberately does NOTHING that seed.js does (no TRUNCATE, no reseeding).
import fs from 'node:fs'
import pool from './db.js'

await pool.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))
console.log('Schema applied. Existing data was kept.')
await pool.end()
