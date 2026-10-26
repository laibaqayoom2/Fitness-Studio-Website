import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ClassesPanel from './admin/ClassesPanel'
import TrainersPanel from './admin/TrainersPanel'
import BookingsPanel from './admin/BookingsPanel'
import MessagesPanel from './admin/MessagesPanel'
import PlansPanel from './admin/PlansPanel'
import UsersPanel from './admin/UsersPanel'
import OverviewPanel from './admin/OverviewPanel'
import { cardClass } from './admin/styles'

const TABS = [
  { key: 'overview', label: 'Overview', roles: ['manager', 'admin'] },
  { key: 'classes', label: 'Classes', roles: ['manager', 'admin'] },
  { key: 'bookings', label: 'Bookings', roles: ['manager', 'admin'] },
  { key: 'messages', label: 'Messages', roles: ['admin'] },
  { key: 'trainers', label: 'Trainers', roles: ['admin'] },
  { key: 'plans', label: 'Plans', roles: ['admin'] },
  { key: 'users', label: 'Users', roles: ['admin'] },
]

export default function Admin() {
  const { user, loading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const allowedTabs = TABS.filter((tab) => tab.roles.includes(user?.role))
  const paramTab = searchParams.get('tab')
  const initialTab = allowedTabs.some((tab) => tab.key === paramTab) ? paramTab : allowedTabs[0]?.key ?? 'overview'
  const [selectedTab, setSelectedTab] = useState(initialTab)
  const active = allowedTabs.some((tab) => tab.key === selectedTab)
    ? selectedTab
    : (allowedTabs[0]?.key ?? 'overview')

  const changeTab = (tab) => {
    setSelectedTab(tab)
    setSearchParams(tab === (allowedTabs[0]?.key ?? 'overview') ? {} : { tab })
  }

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
    <section className="min-h-screen bg-ink px-pad pb-20 pt-28">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-brand">Studio management</p>
            <h1 className="mt-2 text-[clamp(1.8rem,6vw,2.8rem)] font-bold uppercase">Dashboard</h1>
            <p className="mt-2 text-[0.9rem] text-muted">
              Signed in as <span className="text-white light:text-gray-900">{user.name}</span> · {user.role}
            </p>
          </div>
          <Link to="/" className="rounded-full border border-line px-4 py-2 text-[0.85rem] text-white transition hover:border-brand light:text-gray-900 light:hover:text-brand">
            View public site
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px,1fr] xl:grid-cols-[280px,1fr]">
          <aside className="sticky top-24 h-fit rounded-2xl border border-line bg-panel p-3 shadow-lg shadow-black/5">
            <div className="mb-3 px-2 py-2">
              <p className="text-sm font-semibold text-white light:text-gray-900">Admin Menu</p>
              <p className="text-xs text-muted">Studio Management</p>
            </div>
            <nav className="flex flex-col gap-1">
              {allowedTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => changeTab(tab.key)}
                  className={`rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active === tab.key
                      ? 'bg-brand font-semibold text-ink'
                      : 'text-soft hover:bg-white/5 hover:text-white light:text-gray-700 light:hover:bg-black/5 light:hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 overflow-x-auto">
            {active === 'overview' && <OverviewPanel onNavigate={changeTab} />}
            {active === 'classes' && <ClassesPanel />}
            {active === 'bookings' && <BookingsPanel />}
            {active === 'messages' && <MessagesPanel />}
            {active === 'trainers' && <TrainersPanel />}
            {active === 'plans' && <PlansPanel />}
            {active === 'users' && <UsersPanel />}
          </main>
        </div>
      </div>
    </section>
  )
}
