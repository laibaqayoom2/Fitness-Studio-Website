import { useState } from 'react'
import { apiPost } from '../api'
import { useAuth } from '../auth/AuthContext'
import { CONTACT_TOPICS, HOURS, SOCIAL } from '../data'
import Panel from './Panel'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  topic: 'free-trial',
  message: '',
  consent: false,
  website: '',
}

const fieldClass = 'w-full rounded-xl border border-line bg-ink/60 px-4 py-2.5 text-[0.85rem] text-white placeholder:text-muted focus:border-brand focus:outline-none'
const labelClass = 'grid gap-1.5 text-[0.78rem] font-semibold text-soft'

export default function Contact() {
  const { user } = useAuth()
  // Re-mount the form when the signed-in user changes so name/email prefill,
  // without writing to state from an effect.
  return <ContactForm key={user?.id ?? 'guest'} user={user} />
}

function ContactForm({ user }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    name: user?.name ?? '',
    email: user?.email ?? '',
  }))
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (status === 'sending') return
    setError(null)
    setStatus('sending')

    try {
      const data = await apiPost('/api/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        topic: form.topic,
        message: form.message.trim(),
        consent: form.consent,
        website: form.website,
      })
      setResult(data)
      setStatus('sent')
      setForm({ ...emptyForm, name: user?.name ?? '', email: user?.email ?? '' })
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  return (
    <Panel id="contact" tone="bg-panel-alt" kicker="Contact us" title={<>Tell us about your <span className="text-brand">goals</span></>}>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="grid content-start gap-5">
          <p className="max-w-[48ch] text-[0.92rem] text-muted">
            Ask about a free trial, membership, personal training or anything else. A real person from the studio replies within one working day.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-card p-5">
              <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-brand">Visit</h3>
              <address className="mt-2 not-italic text-[0.85rem] leading-relaxed text-muted">
                12 Example Street<br />Your City
              </address>
            </div>
            <div className="rounded-3xl bg-card p-5">
              <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-brand">Talk to us</h3>
              <ul className="mt-2 grid gap-1 text-[0.85rem]">
                <li><a className="transition hover:text-white" href="tel:+10000000000">+1 000 000 0000</a></li>
                <li><a className="break-words transition hover:text-white" href="mailto:hello@ffl.com">hello@ffl.com</a></li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-5">
            <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-brand">Opening hours</h3>
            <ul className="mt-2 grid gap-1 text-[0.85rem] text-muted">
              {HOURS.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </div>

          <ul aria-label="Social media" className="flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem]">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a className="text-muted transition hover:text-white" href={s.href} target="_blank" rel="noreferrer noopener">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-line bg-card p-5 sm:p-7">
          {status === 'sent' ? (
            <div role="status" aria-live="polite" className="grid content-start gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 4.5 4.5L19 7" />
                </svg>
              </span>
              <div>
                <h3 className="text-[1.25rem] font-bold text-white">Message sent</h3>
                <p className="mt-1 text-[0.9rem] text-muted">
                  Thanks {result?.name?.split(' ')[0] || 'for reaching out'} &mdash; we&apos;ll be in touch within one working day.
                </p>
                {result?.reference && (
                  <p className="mt-3 text-[0.78rem] text-muted">
                    Your reference: <span className="font-mono font-semibold text-white">{result.reference}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setResult(null)
                  setStatus('idle')
                }}
                className="w-fit rounded-full border border-line px-4 py-2 text-[0.85rem] text-white transition hover:border-brand"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Name
                  <input type="text" required maxLength={120} autoComplete="name" value={form.name} onChange={update('name')} className={fieldClass} placeholder="Your name" />
                </label>
                <label className={labelClass}>
                  Email
                  <input type="email" required maxLength={320} autoComplete="email" value={form.email} onChange={update('email')} className={fieldClass} placeholder="you@example.com" />
                </label>
                <label className={labelClass}>
                  Phone <span className="font-normal text-muted">(optional)</span>
                  <input type="tel" maxLength={40} autoComplete="tel" value={form.phone} onChange={update('phone')} className={fieldClass} placeholder="+1 000 000 0000" />
                </label>
                <label className={labelClass}>
                  I&apos;m interested in
                  <select value={form.topic} onChange={update('topic')} className={fieldClass}>
                    {CONTACT_TOPICS.map((topic) => (
                      <option key={topic.value} value={topic.value}>{topic.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className={labelClass}>
                Message
                <textarea required minLength={10} maxLength={3000} rows="5" value={form.message} onChange={update('message')} className={fieldClass} placeholder="Tell us what you're looking for and when you'd like to start." />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-line bg-ink/30 p-4 text-[0.8rem] text-muted">
                <input type="checkbox" required checked={form.consent} onChange={update('consent')} className="mt-0.5 size-4 accent-brand" />
                <span>I&apos;m happy for FFL Studio to contact me about this enquiry.</span>
              </label>

              {/* Honeypot: hidden from people, tempting to bots. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label>
                  Website
                  <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
                </label>
              </div>

              <div aria-live="polite">
                {error && <p role="alert" className="mb-3 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-[0.85rem] text-red-200">{error}</p>}
                <button type="submit" disabled={status === 'sending'} className="btn px-6 py-3 text-[0.9rem] disabled:opacity-50">
                  {status === 'sending' ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Panel>
  )
}
