import crypto from 'node:crypto'
import pool from './db.js'

export const SESSION_COOKIE = 'ffl_session'
const configuredTtlDays = Number(process.env.SESSION_TTL_DAYS)
const SESSION_TTL_DAYS = Number.isFinite(configuredTtlDays) && configuredTtlDays > 0 ? configuredTtlDays : 7
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
const configuredSameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase()
const sameSite = ['lax', 'strict', 'none'].includes(configuredSameSite) ? configuredSameSite : 'lax'
const secure = sameSite === 'none' || process.env.NODE_ENV === 'production'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

const cookieOptions = { httpOnly: true, sameSite, secure, path: '/', maxAge: SESSION_TTL_MS }

export async function createSession(res, userId) {
  await pool.query('DELETE FROM sessions WHERE expires_at <= now()')

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,$3)',
    [hashToken(token), userId, expiresAt])

  res.cookie(SESSION_COOKIE, token, cookieOptions)
}

export async function destroySession(req, res) {
  const token = req.cookies?.[SESSION_COOKIE]
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)])
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite, secure, path: '/' })
}

export async function attachUser(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE]
    if (!token) return next()

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)])

    if (rows[0]) req.user = rows[0]
    next()
  } catch (err) {
    next(err)
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in.' })
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Please log in.' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that.' })
    }
    next()
  }
}
