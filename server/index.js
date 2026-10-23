import 'dotenv/config'
import express from 'express'
import pool from './db.js'

const app = express()
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/classes', async (req, res) => {
  const { day } = req.query
  const { rows } = day
    ? await pool.query('SELECT * FROM classes WHERE day = $1 ORDER BY id', [day])
    : await pool.query('SELECT * FROM classes ORDER BY id')
  res.json(rows)
})
app.get('/api/trainers', async (req, res) => res.json((await pool.query('SELECT * FROM trainers ORDER BY id')).rows))
app.get('/api/plans', async (req, res) => res.json((await pool.query('SELECT * FROM plans ORDER BY id')).rows))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
})

app.listen(process.env.PORT || 3000, () => console.log('API running on http://localhost:3000'))