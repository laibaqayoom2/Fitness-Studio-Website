import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthShell from './AuthShell'

const inputClass = 'w-full rounded-xl border border-line bg-ink/60 px-4 py-2.5 text-[0.9rem] text-white placeholder:text-muted focus:border-brand focus:outline-none light:bg-white light:text-gray-900'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await signup(form.name.trim(), form.email.trim(), form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      kicker="Join the studio"
      title="Sign up"
      subtitle="Create a free account to book classes. Studio roles are assigned by an admin."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-[0.8rem] font-semibold text-soft">
          Full name
          <input
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            placeholder="Your name"
          />
        </label>

        <label className="grid gap-1.5 text-[0.8rem] font-semibold text-soft">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className={inputClass}
            placeholder="you@example.com"
          />
        </label>

        <label className="grid gap-1.5 text-[0.8rem] font-semibold text-soft">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </label>

        <label className="grid gap-1.5 text-[0.8rem] font-semibold text-soft">
          Confirm password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
            className={inputClass}
            placeholder="Repeat your password"
          />
        </label>

        {error && <p role="alert" className="text-[0.85rem] text-red-300 light:text-red-700">{error}</p>}

        <button type="submit" disabled={submitting} className="btn mt-1 px-6 py-3 text-[0.9rem] disabled:opacity-50">
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
