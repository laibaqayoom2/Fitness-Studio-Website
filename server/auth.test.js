import { describe, expect, it, vi } from 'vitest'
import { requireAuth } from './auth.js'

function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
  }
  return res
}

describe('requireAuth middleware', () => {
  it('rejects requests without a signed-in session with 401', () => {
    const res = makeRes()
    const next = vi.fn()

    requireAuth({}, res, next)

    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes the request through when a session user exists', () => {
    const next = vi.fn()
    const user = { id: 7, role: 'member' }

    requireAuth({ user }, makeRes(), next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
