import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import pool from './db.js'
import { attachUser, createSession, destroySession, requireAuth, requireRole } from './auth.js'
import { hashPassword, verifyPassword } from './passwords.js'
import { env } from './config.js'
import { getStripeClient, createCheckoutSession, constructWebhookEvent, resolveCheckoutAction, retrieveCheckoutSession, resolveResumeAction } from './stripe.js'
import {
  parseCheckoutInput,
  createOrder,
  markOrderPaid,
  markOrderCanceled,
  getOrderForUser,
} from './orders.js'

const app = express()
const port = env.PORT
const allowedOrigins = Array.isArray(env.CLIENT_ORIGIN)
  ? env.CLIENT_ORIGIN
  : String(env.CLIENT_ORIGIN).split(',').map((s) => s.trim()).filter(Boolean)
const clientOrigin = allowedOrigins[0] || 'http://localhost:5173'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ROLES = ['member', 'manager', 'admin']
const PLAN_BUTTONS = ['dark', 'primary', 'light']
const EDIT_ROLES = ['manager', 'admin']
const CONTACT_TOPICS = ['free-trial', 'membership', 'personal-training', 'group-classes', 'other']
const CONTACT_STATUSES = ['new', 'read']

// Trainer photos arrive as compressed data URLs; every other route stays small.
const jsonSmall = express.json({ limit: '100kb' })
const jsonPhoto = express.json({ limit: '4mb' })
// Stripe signs the webhook payload over the exact bytes it sent, so this route
// needs the raw body instead of a parsed JSON body.
const webhooksRaw = express.raw({ type: 'application/json' })

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }))
app.use(cookieParser())
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks')) return webhooksRaw(req, res, next)
  const parser = req.method !== 'GET' && req.path.startsWith('/api/trainers') ? jsonPhoto : jsonSmall
  parser(req, res, next)
})
app.use('/api', attachUser)

app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({ error: err.message || 'Something went wrong.' })
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const cleanString = (value) => (typeof value === 'string' ? value.trim() : '')

function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }
}

function positiveId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function parseClass(body) {
  const day = cleanString(body?.day)
  const time = cleanString(body?.time)
  const name = cleanString(body?.name)
  const coach = cleanString(body?.coach)
  const category = cleanString(body?.category)
  const spots = body?.spots
  const capacity = body?.capacity

  if (!DAYS.includes(day)) return { error: 'Choose a valid day.' }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: 'Time must use HH:MM.' }
  if (!name || name.length > 120) return { error: 'Class name is required (120 characters max).' }
  if (!coach || coach.length > 120) return { error: 'Coach is required (120 characters max).' }
  if (!category || category.length > 60) return { error: 'Category is required (60 characters max).' }
  if (!Number.isInteger(spots) || spots < 0) return { error: 'Open spots must be a whole number of 0 or more.' }
  if (!Number.isInteger(capacity) || capacity < 1) return { error: 'Capacity must be a whole number of 1 or more.' }
  if (spots > capacity) return { error: 'Open spots cannot exceed capacity.' }

  return { value: { day, time, name, coach, category, spots, capacity } }
}

function parseTrainer(body) {
  const name = cleanString(body?.name)
  const role = cleanString(body?.role)
  const img = cleanString(body?.img)
  const bio = cleanString(body?.bio)

  if (!name || name.length > 120) return { error: 'Trainer name is required (120 characters max).' }
  if (!role || role.length > 120) return { error: 'Trainer role is required (120 characters max).' }
  if (!img || img.length > 3_000_000) return { error: 'Upload a photo for this trainer.' }

  const dataUrl = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/.exec(img)
  if (dataUrl) {
    const bytes = Math.floor((dataUrl[2].length * 3) / 4)
    if (bytes > 2 * 1024 * 1024) {
      return { error: 'Trainer photo must be 2 MB or smaller after resizing.' }
    }
  } else if (img.length > 255 || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(img) || img.includes('..')) {
    return { error: 'Upload a PNG, JPG or WebP photo.' }
  }

  if (!bio || bio.length > 2000) return { error: 'Trainer bio is required (2000 characters max).' }

  return { value: { name, role, img, bio } }
}

function parseContact(body) {
  const name = cleanString(body?.name)
  const email = cleanString(body?.email).toLowerCase()
  const phone = cleanString(body?.phone)
  const topic = cleanString(body?.topic)
  const message = cleanString(body?.message)
  const consent = body?.consent === true

  if (!name || name.length > 120) return { error: 'Please enter your name (120 characters max).' }
  if (!emailPattern.test(email) || email.length > 320) return { error: 'Please enter a valid email address.' }
  if (phone && (phone.length > 40 || !/^[0-9+()\s.-]{5,40}$/.test(phone))) {
    return { error: 'Please enter a valid phone number or leave it blank.' }
  }
  if (!CONTACT_TOPICS.includes(topic)) return { error: 'Choose what you are interested in.' }
  if (message.length < 10 || message.length > 3000) {
    return { error: 'Message must be between 10 and 3000 characters.' }
  }
  if (!consent) return { error: 'Please agree to be contacted about your enquiry.' }

  return { value: { name, email, phone, topic, message } }
}

const contactSubmissions = new Map()
function contactRateLimited(ip) {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000
  const maxRequests = 5
  const recent = (contactSubmissions.get(ip) ?? []).filter((time) => now - time < windowMs)

  if (recent.length >= maxRequests) {
    contactSubmissions.set(ip, recent)
    return true
  }

  recent.push(now)
  contactSubmissions.set(ip, recent)

  if (contactSubmissions.size > 500) {
    for (const [key, times] of contactSubmissions) {
      if (!times.some((time) => now - time < windowMs)) contactSubmissions.delete(key)
    }
  }
  return false
}

function parsePlan(body) {
  const name = cleanString(body?.name)
  const price = body?.price
  const note = cleanString(body?.note)
  const featured = Boolean(body?.featured)
  const button = cleanString(body?.button)
  const perks = Array.isArray(body?.perks)
    ? body.perks.map((perk) => cleanString(perk)).filter(Boolean)
    : []

  if (!name || name.length > 80) return { error: 'Plan name is required (80 characters max).' }
  if (!Number.isInteger(price) || price < 0) return { error: 'Price must be a whole number of 0 or more.' }
  if (!note || note.length > 300) return { error: 'Plan note is required (300 characters max).' }
  if (!PLAN_BUTTONS.includes(button)) return { error: 'Choose a valid button style.' }
  if (perks.length === 0 || perks.length > 20) return { error: 'Add between 1 and 20 perks.' }
  if (perks.some((perk) => perk.length > 200)) return { error: 'Each perk must be 200 characters max.' }

  return { value: { name, price, note, featured, button, perks } }
}

function parseBooking(body) {
  const name = cleanString(body?.name)
  const email = cleanString(body?.email).toLowerCase()

  if (!name) return { error: 'Please enter your name.' }
  if (name.length > 200) return { error: 'Name is too long.' }
  if (!emailPattern.test(email)) return { error: 'Please enter a valid email address.' }
  if (email.length > 320) return { error: 'Email is too long.' }
  if (!Array.isArray(body?.items) || body.items.length === 0) return { error: 'Choose at least one class.' }
  if (body.items.length > 20) return { error: 'Too many classes in one booking.' }

  const items = []
  const seen = new Set()
  for (const item of body.items) {
    const classId = item?.classId
    const spots = item?.spots
    if (!Number.isInteger(classId) || classId <= 0 || !Number.isInteger(spots) || spots <= 0) {
      return { error: 'Invalid booking selection.' }
    }
    if (seen.has(classId)) return { error: 'Each class can only appear once in a booking.' }
    seen.add(classId)
    items.push({ classId, spots })
  }

  return { name, email, items }
}

// ---------- Auth ----------

app.post('/api/auth/signup', async (req, res) => {
  const name = cleanString(req.body?.name)
  const email = cleanString(req.body?.email).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!name || name.length > 200) return res.status(400).json({ error: 'Please enter your name (200 characters max).' })
  if (!emailPattern.test(email) || email.length > 320) return res.status(400).json({ error: 'Please enter a valid email address.' })
  if (password.length < 8 || password.length > 200) return res.status(400).json({ error: 'Password must be 8 to 200 characters.' })

  const existing = await pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email])
  if (existing.rowCount) return res.status(409).json({ error: 'An account with that email already exists.' })

  const passwordHash = await hashPassword(password)
  const { rows: [user] } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1,$2,$3,'member')
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash])

  await createSession(res, user.id)
  res.status(201).json({ user: toUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const email = cleanString(req.body?.email).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' })

  const { rows: [user] } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])
  const valid = user ? await verifyPassword(password, user.password_hash) : false
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' })

  await createSession(res, user.id)
  res.json({ user: toUser(user) })
})

app.post('/api/auth/logout', async (req, res) => {
  await destroySession(req, res)
  res.json({ ok: true })
})

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user ? toUser(req.user) : null })
})

// ---------- Public content ----------

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/classes', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, day, time, name, coach, category, spots, capacity FROM classes ORDER BY id')
  res.json(rows)
})

app.get('/api/trainers', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, role, img, bio, (user_id IS NOT NULL) AS has_account FROM trainers ORDER BY id')
  res.json(rows)
})

app.get('/api/plans', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM plans ORDER BY id')
  res.json(rows)
})

app.post('/api/contact', async (req, res) => {
  // Honeypot: silently accept bot submissions without storing them.
  if (cleanString(req.body?.website)) {
    return res.status(201).json({ ok: true, reference: 'MSG-RECEIVED' })
  }
  if (contactRateLimited(req.ip)) {
    return res.status(429).json({ error: 'Too many messages sent. Please try again in a few minutes.' })
  }

  const parsed = parseContact(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const c = parsed.value
  const { rows: [row] } = await pool.query(
    `INSERT INTO contact_messages (name, email, phone, topic, message)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, name, created_at`,
    [c.name, c.email, c.phone, c.topic, c.message])

  res.status(201).json({
    ok: true,
    reference: `MSG-${String(row.id).padStart(4, '0')}`,
    name: row.name,
    createdAt: row.created_at,
  })
})

// ---------- Dashboard (manager/admin) ----------

app.get('/api/dashboard', requireRole(...EDIT_ROLES), async (req, res) => {
  const isAdmin = req.user.role === 'admin'
  const empty = { rows: [{}] }

  const [
    classResult,
    bookingResult,
    trainerPlanResult,
    userResult,
    messageResult,
    trendResult,
    recentResult,
    topClassResult,
    todayResult,
    orderResult,
  ] = await Promise.all([
    pool.query(`
      SELECT COUNT(*)::int AS classes,
             COALESCE(SUM(capacity), 0)::int AS capacity,
             COALESCE(SUM(spots), 0)::int AS open_spots,
             COALESCE(SUM(GREATEST(capacity - spots, 0)), 0)::int AS booked_spots
      FROM classes`),
    pool.query(`
      SELECT COUNT(DISTINCT b.id)::int AS bookings,
             COALESCE(SUM(bi.spots), 0)::int AS booking_spots
      FROM bookings b
      LEFT JOIN booking_items bi ON bi.booking_id = b.id`),
    pool.query(`
      SELECT (SELECT COUNT(*)::int FROM trainers) AS trainers,
             (SELECT COUNT(*)::int FROM plans) AS plans`),
    isAdmin
      ? pool.query(`
          SELECT COUNT(*)::int AS users,
                 COUNT(*) FILTER (WHERE role = 'member')::int AS members,
                 COUNT(*) FILTER (WHERE role = 'manager')::int AS managers,
                 COUNT(*) FILTER (WHERE role = 'admin')::int AS admins
          FROM users`)
      : Promise.resolve(empty),
    isAdmin
      ? pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'new')::int AS unread FROM contact_messages`)
      : Promise.resolve(empty),
    pool.query(`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
             COUNT(b.id)::int AS bookings,
             COALESCE(SUM(bi.spots), 0)::int AS spots
      FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') AS d(day)
      LEFT JOIN bookings b ON b.created_at >= d.day AND b.created_at < d.day + interval '1 day'
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      GROUP BY d.day
      ORDER BY d.day`),
    pool.query(`
      SELECT b.id, b.reference, b.name, b.email, b.created_at,
             COALESCE(SUM(bi.spots), 0)::int AS spots
      FROM bookings b
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT 5`),
    pool.query(`
      SELECT id, day, time, name, coach, capacity,
             GREATEST(capacity - spots, 0)::int AS booked,
             CASE WHEN capacity > 0
               THEN ROUND((GREATEST(capacity - spots, 0)::numeric / capacity) * 100)::int
               ELSE 0 END AS fill
      FROM classes
      ORDER BY fill DESC, booked DESC, time
      LIMIT 5`),
    pool.query(`
      SELECT id, time, name, coach, category, spots, capacity
      FROM classes
      WHERE day = to_char(current_date, 'Dy')
      ORDER BY time
      LIMIT 8`),
    pool.query(`
      SELECT COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_orders,
             COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
             COALESCE(SUM(amount_total) FILTER (WHERE status = 'paid'), 0)::int AS paid_amount
      FROM orders`),
  ])

  const classStats = classResult.rows[0]
  const bookingStats = bookingResult.rows[0]
  const trainerPlanStats = trainerPlanResult.rows[0]
  const userStats = userResult.rows[0] ?? {}
  const messageStats = messageResult.rows[0] ?? {}
  const capacity = Number(classStats.capacity) || 0
  const bookedSpots = Number(classStats.booked_spots) || 0

  res.json({
    scope: req.user.role,
    totals: {
      classes: classStats.classes,
      capacity,
      openSpots: classStats.open_spots,
      bookedSpots,
      occupancy: capacity > 0 ? Math.round((bookedSpots / capacity) * 100) : 0,
      bookings: bookingStats.bookings,
      bookingSpots: bookingStats.booking_spots,
      trainers: trainerPlanStats.trainers,
      plans: trainerPlanStats.plans,
      users: userStats.users ?? null,
      members: userStats.members ?? null,
      managers: userStats.managers ?? null,
      admins: userStats.admins ?? null,
      unreadMessages: messageStats.unread ?? null,
      paidOrders: orderResult.rows[0].paid_orders,
      pendingOrders: orderResult.rows[0].pending_orders,
      paidRevenue: orderResult.rows[0].paid_amount,
    },
    trend: trendResult.rows,
    recentBookings: recentResult.rows,
    topClasses: topClassResult.rows,
    todayClasses: todayResult.rows,
  })
})

// ---------- Classes (manager/admin) ----------

app.post('/api/classes', requireRole(...EDIT_ROLES), async (req, res) => {
  const parsed = parseClass(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const c = parsed.value
  const { rows: [row] } = await pool.query(
    `INSERT INTO classes (day, time, name, coach, category, spots, capacity)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [c.day, c.time, c.name, c.coach, c.category, c.spots, c.capacity])
  res.status(201).json(row)
})

app.put('/api/classes/:id', requireRole(...EDIT_ROLES), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid class id.' })

  const parsed = parseClass(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const { rows: [existing] } = await pool.query(
    'SELECT capacity, spots FROM classes WHERE id = $1', [id])
  if (!existing) return res.status(404).json({ error: 'Class not found.' })

  const booked = Math.max(0, existing.capacity - existing.spots)
  const c = parsed.value
  if (c.capacity < booked) {
    return res.status(409).json({
      error: `Capacity cannot be lower than ${booked} spots already booked.`,
    })
  }
  if (c.spots > c.capacity - booked) {
    return res.status(400).json({
      error: `Open spots must be ${c.capacity - booked} or fewer because ${booked} are already booked.`,
    })
  }

  const { rows: [row] } = await pool.query(
    `UPDATE classes
     SET day=$1, time=$2, name=$3, coach=$4, category=$5, spots=$6, capacity=$7
     WHERE id=$8 RETURNING *`,
    [c.day, c.time, c.name, c.coach, c.category, c.spots, c.capacity, id])
  res.json(row)
})

app.delete('/api/classes/:id', requireRole(...EDIT_ROLES), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid class id.' })

  try {
    const { rowCount } = await pool.query('DELETE FROM classes WHERE id = $1', [id])
    if (!rowCount) return res.status(404).json({ error: 'Class not found.' })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete a class that has bookings.' })
    }
    throw err
  }
})

// ---------- Trainers (admin) ----------

app.post('/api/trainers', requireRole('admin'), async (req, res) => {
  const parsed = parseTrainer(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const t = parsed.value
  const email = cleanString(req.body?.email).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const wantsAccount = Boolean(email || password)

  if (wantsAccount) {
    if (!emailPattern.test(email) || email.length > 320) {
      return res.status(400).json({ error: 'Enter a valid account email.' })
    }
    if (password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: 'Account password must be 8 to 200 characters.' })
    }
    const existing = await pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email])
    if (existing.rowCount) return res.status(409).json({ error: 'An account with that email already exists.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    let userId = null
    if (wantsAccount) {
      const passwordHash = await hashPassword(password)
      const { rows: [user] } = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1,$2,$3,'manager') RETURNING id`,
        [t.name, email, passwordHash])
      userId = user.id
    }

    const { rows: [trainer] } = await client.query(
      `INSERT INTO trainers (name, role, img, bio, user_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, name, role, img, bio, (user_id IS NOT NULL) AS has_account`,
      [t.name, t.role, t.img, t.bio, userId])

    await client.query('COMMIT')
    res.status(201).json(trainer)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

app.put('/api/trainers/:id', requireRole('admin'), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid trainer id.' })

  const parsed = parseTrainer(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const t = parsed.value
  const { rows: [row] } = await pool.query(
    `UPDATE trainers SET name=$1, role=$2, img=$3, bio=$4
     WHERE id=$5 RETURNING id, name, role, img, bio, (user_id IS NOT NULL) AS has_account`,
    [t.name, t.role, t.img, t.bio, id])
  if (!row) return res.status(404).json({ error: 'Trainer not found.' })
  res.json(row)
})

app.delete('/api/trainers/:id', requireRole('admin'), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid trainer id.' })

  const { rowCount } = await pool.query('DELETE FROM trainers WHERE id = $1', [id])
  if (!rowCount) return res.status(404).json({ error: 'Trainer not found.' })
  res.json({ ok: true })
})

// ---------- Plans (admin) ----------

app.post('/api/plans', requireRole('admin'), async (req, res) => {
  const parsed = parsePlan(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const p = parsed.value
  const { rows: [row] } = await pool.query(
    `INSERT INTO plans (name, price, note, featured, button, perks)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [p.name, p.price, p.note, p.featured, p.button, p.perks])
  res.status(201).json(row)
})

app.put('/api/plans/:id', requireRole('admin'), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid plan id.' })

  const parsed = parsePlan(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const p = parsed.value
  const { rows: [row] } = await pool.query(
    `UPDATE plans SET name=$1, price=$2, note=$3, featured=$4, button=$5, perks=$6
     WHERE id=$7 RETURNING *`,
    [p.name, p.price, p.note, p.featured, p.button, p.perks, id])
  if (!row) return res.status(404).json({ error: 'Plan not found.' })
  res.json(row)
})

app.delete('/api/plans/:id', requireRole('admin'), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid plan id.' })

  const { rowCount } = await pool.query('DELETE FROM plans WHERE id = $1', [id])
  if (!rowCount) return res.status(404).json({ error: 'Plan not found.' })
  res.json({ ok: true })
})

// ---------- Bookings ----------

// A member's own booking history, shown in the site header.
app.get('/api/bookings/mine', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT b.id, b.reference, b.created_at,
           COALESCE(SUM(ci.spots), 0)::int AS total_spots,
           json_agg(json_build_object(
             'classId', c.id, 'day', c.day, 'time', c.time, 'name', c.name, 'spots', ci.spots
           ) ORDER BY c.id) AS items
    FROM bookings b
    JOIN booking_items ci ON ci.booking_id = b.id
    JOIN classes c ON c.id = ci.class_id
    WHERE b.user_id = $1
    GROUP BY b.id
    ORDER BY b.created_at DESC, b.id DESC`, [req.user.id])

  res.json(rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    createdAt: row.created_at,
    totalSpots: row.total_spots,
    items: row.items,
  })))
})

app.get('/api/bookings', requireRole(...EDIT_ROLES), async (req, res) => {
  const { rows } = await pool.query(`
    SELECT b.id, b.reference, b.name, b.email, b.user_id, b.created_at,
           COALESCE(SUM(ci.spots), 0)::int AS total_spots,
           json_agg(json_build_object(
             'classId', c.id, 'day', c.day, 'time', c.time, 'name', c.name, 'spots', ci.spots
           ) ORDER BY ci.id) AS items
    FROM bookings b
    JOIN booking_items ci ON ci.booking_id = b.id
    JOIN classes c ON c.id = ci.class_id
    GROUP BY b.id
    ORDER BY b.created_at DESC, b.id DESC`)
  res.json(rows)
})

app.post('/api/bookings', async (req, res) => {
  const parsed = parseBooking({
    name: req.body?.name || req.user?.name,
    email: req.body?.email || req.user?.email,
    items: req.body?.items,
  })
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const { name, email, items } = parsed
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const ids = items.map((item) => item.classId)
    const { rows } = await client.query(
      'SELECT id, day, time, name, spots FROM classes WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
      [ids])

    if (rows.length !== ids.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'One of the selected classes no longer exists.' })
    }

    const classesById = new Map(rows.map((row) => [row.id, row]))

    // Locked rows make this check safe against two people booking the last spot.
    for (const item of items) {
      const cls = classesById.get(item.classId)
      if (item.spots > cls.spots) {
        await client.query('ROLLBACK')
        return res.status(409).json({
          error: `${cls.name} only has ${cls.spots} spot${cls.spots === 1 ? '' : 's'} left.`,
        })
      }
    }

    const reference = `FFL-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`
    const { rows: [booking] } = await client.query(
      `INSERT INTO bookings (reference, name, email, user_id)
       VALUES ($1,$2,$3,$4) RETURNING id, reference, name, email, created_at`,
      [reference, name, email, req.user?.id ?? null])

    for (const item of items) {
      await client.query(
        'INSERT INTO booking_items (booking_id, class_id, spots) VALUES ($1,$2,$3)',
        [booking.id, item.classId, item.spots])
      await client.query('UPDATE classes SET spots = spots - $1 WHERE id = $2', [item.spots, item.classId])
    }

    await client.query('COMMIT')

    res.status(201).json({
      reference: booking.reference,
      name: booking.name,
      email: booking.email,
      createdAt: booking.created_at,
      totalSpots: items.reduce((sum, item) => sum + item.spots, 0),
      items: items.map((item) => {
        const cls = classesById.get(item.classId)
        return { classId: cls.id, day: cls.day, time: cls.time, name: cls.name, spots: item.spots }
      }),
    })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

app.delete('/api/bookings/:id', requireRole(...EDIT_ROLES), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid booking id.' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [booking] } = await client.query(
      'SELECT id FROM bookings WHERE id = $1 FOR UPDATE', [id])
    if (!booking) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Booking not found.' })
    }

    const { rows: items } = await client.query(
      'SELECT class_id, spots FROM booking_items WHERE booking_id = $1', [id])

    for (const item of items) {
      await client.query(
        'UPDATE classes SET spots = LEAST(capacity, spots + $1) WHERE id = $2',
        [item.spots, item.class_id])
    }

    await client.query('DELETE FROM bookings WHERE id = $1', [id])
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

// ---------- Orders and Stripe (Test mode) ----------

// A member's own orders: powers the account page and the notifications
// dropdown. Newest first, each with its snapshotted line items.
app.get('/api/orders/mine', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT o.id, o.reference, o.status, o.amount_total, o.currency,
           o.created_at, o.paid_at,
           json_agg(json_build_object(
             'planId', i.plan_id, 'planName', i.plan_name,
             'quantity', i.quantity, 'unitAmount', i.unit_amount
           ) ORDER BY i.id) AS items
    FROM orders o
    JOIN order_items i ON i.order_id = o.id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC, o.id DESC`, [req.user.id])

  res.json(rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    amountTotal: row.amount_total,
    currency: row.currency,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    items: row.items,
  })))
})

// Creates a pending order from the database price and opens Stripe's hosted
// Checkout page. Signed in users only; the user id always comes from the
// session, and prices/totals always come from the plans table.
app.post('/api/orders/checkout', requireAuth, async (req, res) => {
  if (!getStripeClient()) {
    return res.status(503).json({ error: 'Online payments are not configured yet. Add STRIPE_SECRET_KEY to server/.env and restart.' })
  }

  const parsed = parseCheckoutInput(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })

  const { planId, quantity } = parsed.value
  const { rows: [plan] } = await pool.query(
    'SELECT id, name, price, note FROM plans WHERE id = $1', [planId])
  if (!plan) return res.status(404).json({ error: 'That plan is no longer available.' })

  const order = await createOrder({ userId: req.user.id, plan, quantity })

  try {
    const session = await createCheckoutSession({ order, item: order.items[0], origin: clientOrigin })
    await pool.query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [session.id, order.id])
    res.status(201).json({
      orderId: order.id,
      reference: order.reference,
      status: 'pending',
      amountTotal: order.amount_total,
      currency: order.currency,
      checkoutUrl: session.url,
    })
  } catch (err) {
    // No Checkout Session means no order: drop the pending row so a retry
    // starts clean and no ghost order lingers without a Stripe session.
    await pool.query('DELETE FROM orders WHERE id = $1 AND status = $2', [order.id, 'pending'])
    throw err
  }
})

// A member's own order status. Ownership is enforced in the query itself, so
// another user's order id behaves exactly like an unknown one.
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid order id.' })

  const order = await getOrderForUser(id, req.user.id)
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  res.json(order)
})

// "Return to payment page" for a still-pending order. Owner-scoped like the
// status route. If Stripe reports the payment settled (e.g. the webhook never
// arrived), it reconciles the order here — the exact transition the webhook
// would have performed. Open sessions get their hosted URL back; sessions
// already completed without payment, expired, or unknown read as 'expired'.
app.get('/api/orders/:id/checkout-url', requireAuth, async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid order id.' })

  const order = await getOrderForUser(id, req.user.id)
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.status === 'paid') return res.json({ status: 'paid' })
  if (order.status === 'canceled' || !order.stripeSessionId) {
    return res.json({ status: 'expired' })
  }

  try {
    const session = await retrieveCheckoutSession(order.stripeSessionId)
    const outcome = resolveResumeAction(session)
    if (outcome === 'paid') await markOrderPaid(order.stripeSessionId)
    if (outcome === 'open') {
      res.json({ status: 'open', checkoutUrl: session.url })
    } else {
      res.json({ status: outcome })
    }
  } catch (err) {
    // Unknown/old session id or Stripe misconfiguration: no page to return to.
    console.error('Could not resume checkout session:', err.message)
    res.json({ status: 'expired' })
  }
})

// Stripe webhook. Reads the raw request body and verifies the signature before
// touching anything. Orders become `paid` only from here — never because a
// browser was redirected to the success page. Duplicate deliveries are
// harmless: the transitions only apply to orders still `pending`.
app.post('/api/webhooks/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature']
  if (!signature) return res.status(400).json({ error: 'Missing Stripe signature.' })

  let event
  try {
    event = constructWebhookEvent(req.body, signature)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Invalid Stripe signature.' })
  }

  const { action, sessionId } = resolveCheckoutAction(event)

  if (action === 'paid' && sessionId) {
    const order = await markOrderPaid(sessionId)
    if (order) console.log(`Order ${order.id} marked paid (Stripe event ${event.id}).`)
    // A null here means the order was already paid or does not exist; either
    // way the event is acknowledged so Stripe will not keep retrying it.
  } else if (action === 'canceled' && sessionId) {
    await markOrderCanceled(sessionId)
  } else if (action === 'unpaid') {
    console.log(`Stripe event ${event.id} arrived without a settled payment; nothing was updated.`)
  }

  res.json({ received: true })
})

// ---------- Users (admin) ----------

app.get('/api/users', requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY id')
  res.json(rows.map(toUser))
})

app.patch('/api/users/:id', requireRole('admin'), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid user id.' })

  const role = cleanString(req.body?.role)
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Choose a valid role.' })
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot change your own role.' })

  const { rows: [row] } = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
    [role, id])
  if (!row) return res.status(404).json({ error: 'User not found.' })
  res.json(toUser(row))
})

app.delete('/api/users/:id', requireRole('admin'), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid user id.' })
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' })

  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id])
  if (!rowCount) return res.status(404).json({ error: 'User not found.' })
  res.json({ ok: true })
})

// ---------- Contact messages (admin) ----------

app.get('/api/contact', requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, phone, topic, message, status, created_at
     FROM contact_messages ORDER BY created_at DESC, id DESC`)
  res.json(rows)
})

app.patch('/api/contact/:id', requireRole('admin'), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid message id.' })

  const status = cleanString(req.body?.status)
  if (!CONTACT_STATUSES.includes(status)) return res.status(400).json({ error: 'Choose a valid status.' })

  const { rows: [row] } = await pool.query(
    `UPDATE contact_messages SET status = $1 WHERE id = $2
     RETURNING id, name, email, phone, topic, message, status, created_at`,
    [status, id])
  if (!row) return res.status(404).json({ error: 'Message not found.' })
  res.json(row)
})

app.delete('/api/contact/:id', requireRole('admin'), async (req, res) => {
  const id = positiveId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid message id.' })

  const { rowCount } = await pool.query('DELETE FROM contact_messages WHERE id = $1', [id])
  if (!rowCount) return res.status(404).json({ error: 'Message not found.' })
  res.json({ ok: true })
})

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

// Serve the built client when it exists, so a single process can host both.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(__dirname, '../client/dist')

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  if (res.headersSent) return next(err)
  if (err.code === '23505') return res.status(409).json({ error: 'That value is already in use.' })
  if (err.code === '23503') return res.status(409).json({ error: 'That record is in use and cannot be removed.' })
  const status = err.status || err.statusCode || 500
  res.status(status).json({ error: status === 500 ? 'Something went wrong' : err.message })
})

if (!env.VERCEL) {
  const server = app.listen(port, () => console.log(`API running on http://localhost:${port}`))

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the other server or set PORT to a different value.`)
      process.exit(1)
    }
    throw err
  })
}

export default app