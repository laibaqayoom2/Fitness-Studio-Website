import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ClassesPanel from './admin/ClassesPanel'
import TrainersPanel from './admin/TrainersPanel'
import BookingsPanel from './admin/BookingsPanel'
import PlansPanel from './admin/PlansPanel'
import UsersPanel from './admin/UsersPanel'
import { cardClass } from './admin/styles'

const TABS = [
  { key: 'classes', label: 'Classes', roles: ['manager', 'admin'] },
  { key: 'bookings', label: 'Bookings', roles: ['manager', 'admin'] },
  { key: 'trainers', label: 'Trainers', roles: ['admin'] },
  { key: 'plans', label: 'Plans', roles: ['admin'] },
  { key: 'users', label: 'Users', roles: ['admin'] },
]

export default function Admin() {
  const { user, loading } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const allowedTabs = TABS.filter((tab) => tab.roles.includes(user?.role))
  const [selectedTab, setSelectedTab] = useState(allowedTabs[0]?.key ?? 'classes')
  const active = allowedTabs.some((tab) => tab.key === selectedTab)
    ? selectedTab
    : (allowedTabs[0]?.key ?? 'classes')

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-pad pb-20 pt-32 sm:pt-36">
        <p className="text-[0.9rem] text-muted">Loading your account...</p>
      </section>
    )
  }

  if (!user) {
    return <Navigate to="/login?redirect=/admin" replace />
  }

  if (!canManage) {
    return (
      <section className="mx-auto max-w-2xl px-pad pb-20 pt-32 sm:pt-36">
        <div className={cardClass}>
          <h1 className="text-[1.6rem] font-bold">Access denied</h1>
          <p className="mt-2 text-[0.9rem] text-muted">
            Your account ({user.email}) has the <strong className="text-white">{user.role}</strong> role.
            Only managers and admins can access this dashboard.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-full border border-line px-5 py-2 text-[0.85rem] text-white transition hover:border-brand">
            Back to home
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-pad pb-20 pt-32 sm:pt-36">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-brand">Studio management</p>
          <h1 className="mt-2 text-[clamp(1.8rem,7vw,2.8rem)] font-bold uppercase">Dashboard</h1>
          <p className="mt-2 text-[0.9rem] text-muted">
            Signed in as <span className="text-white">{user.name}</span> · {user.role}
          </p>
        </div>
        <Link to="/" className="rounded-full border border-line px-4 py-2 text-[0.85rem] text-white transition hover:border-brand">
          View public site
        </Link>
      </header>

      {allowedTabs.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {allowedTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedTab(tab.key)}
              className={`rounded-full px-4 py-2 text-[0.85rem] transition ${
                active === tab.key
                  ? 'bg-brand font-semibold text-ink'
                  : 'border border-line text-soft hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        {active === 'classes' && <ClassesPanel />}
        {active === 'bookings' && <BookingsPanel />}
        {active === 'trainers' && <TrainersPanel />}
        {active === 'plans' && <PlansPanel />}
        {active === 'users' && <UsersPanel />}
      </div>
    </section>
  )
}
