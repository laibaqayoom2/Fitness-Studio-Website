import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthShell from './AuthShell'

const inputClass = 'w-full rounded-xl border border-line bg-ink/60 px-4 py-2.5 text-[0.9rem] text-white placeholder:text-muted focus:border-brand focus:outline-none light:bg-white light:text-gray-900'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      const user = await login(form.email.trim(), form.password)
      const requested = new URLSearchParams(location.search).get('redirect')
      const redirect = requested && requested.startsWith('/') && !requested.startsWith('//')
        ? requested
        : (user.role === 'admin' || user.role === 'manager' ? '/admin' : '/')
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      kicker="Welcome back"
      title="Log in"
      subtitle="Access your account to book classes and manage the studio."
      footer={<>New to FFL? <Link to="/signup" className="font-semibold text-brand hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="grid gap-4">
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
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className={inputClass}
            placeholder="Your password"
          />
        </label>

        {error && <p role="alert" className="text-[0.85rem] text-red-300">{error}</p>}

        <button type="submit" disabled={submitting} className="btn mt-1 px-6 py-3 text-[0.9rem] disabled:opacity-50">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-5 border-t border-line pt-4 text-[0.75rem] leading-relaxed text-muted">
          <p className="font-semibold text-soft">Demo accounts</p>
          <p>Admin: admin@ffl.com / Admin123!</p>
          <p>Trainer manager: amara@ffl.com / Trainer123!</p>
          <p>Member: member@ffl.com / Member123!</p>
        </div>
      )}
    </AuthShell>
  )
}
