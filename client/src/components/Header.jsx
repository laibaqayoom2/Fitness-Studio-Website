import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NAV } from '../data'
import { useAuth } from '../auth/AuthContext'
import useFetch from '../hooks/useFetch'
import { MemberBookingsInline, MemberBookingsMenu } from './MemberBookings'
import { useTheme } from '../theme/useTheme'

const navLink = 'block py-2 text-[#e8e8ea] transition-colors hover:text-brand md:py-0 light:text-gray-900 light:hover:text-brand'
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (min-width: 768px)').matches

export default function Header() {
  const [open, setOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const headerRef = useRef(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, loading, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { data: bookings, loading: bookingsLoading, error: bookingsError, refetch: refetchBookings } =
    useFetch(user ? '/api/bookings/mine' : null, user?.id)
  const close = () => {
    setOpen(false)
    setOpenMenu(null)
  }

  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const sectionTo = (href) => (pathname === '/' ? href : `/${href}`)
  const toggleMenu = (label) => setOpenMenu((current) => (current === label ? null : label))

  // A booking made on the schedule should show up in the nav straight away.
  useEffect(() => {
    const onBookingCreated = () => refetchBookings()
    window.addEventListener('ffl:booking-created', onBookingCreated)
    return () => window.removeEventListener('ffl:booking-created', onBookingCreated)
  }, [refetchBookings])

  useEffect(() => {
    if (!open && !openMenu) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }
    const onPointerDown = (e) => {
      if (!headerRef.current?.contains(e.target)) close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, openMenu])

  const handleLogout = async () => {
    close()
    await logout()
    navigate('/')
  }

  return (
    <header ref={headerRef} className="fixed left-1/2 top-3.5 z-20 flex w-[min(1180px,calc(100%-2rem))] -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-3xl border border-line bg-[rgb(32_26_24/0.85)] px-4 py-3 backdrop-blur-md transition-colors md:rounded-full md:py-2.5 md:pl-6 md:pr-3 light:bg-white/90 light:text-gray-900">
      <Link to="/#top" onClick={close} className="flex flex-none items-center">
        <img src="/images/logo.png" alt="FFL Studio" width="412" height="165" className="h-[2.4rem] w-auto" />
      </Link>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="primary-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => {
          setOpen((o) => !o)
          setOpenMenu(null)
        }}
        className="grid size-10 place-items-center rounded-full border border-line md:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      <nav
        id="primary-nav"
        aria-label="Primary"
        className={`${open ? 'block' : 'hidden'} order-3 w-full md:order-none md:mr-auto md:block md:w-auto`}
      >
        <ul className="flex flex-col py-2 text-[0.95rem] md:flex-row md:items-center md:gap-x-5 md:py-0 md:text-[0.85rem]">
          {NAV.map((item) => {
            const menuId = `nav-menu-${slug(item.label)}`
            const isOpen = openMenu === item.label
            return (
              <li
                key={item.label}
                className={`relative ${item.children ? "md:before:absolute md:before:inset-x-0 md:before:top-full md:before:h-3 md:before:content-['']" : ''}`}
                onMouseEnter={() => item.children && canHover() && setOpenMenu(item.label)}
                onMouseLeave={() => canHover() && setOpenMenu((current) => (current === item.label ? null : current))}
              >
                <div className="flex items-center justify-between gap-1">
                  <Link to={sectionTo(item.href)} onClick={close} className={navLink}>
                    {item.label}
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.label)}
                      aria-expanded={isOpen}
                      aria-controls={menuId}
                      aria-label={`${isOpen ? 'Hide' : 'Show'} ${item.label} links`}
                      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-white/10 hover:text-white md:size-6"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className={`size-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </div>

                {item.children && (
                  <ul
                    id={menuId}
                    className={`${isOpen ? 'grid' : 'hidden'} mt-1 gap-1 rounded-2xl border border-line bg-panel p-2 md:absolute md:left-0 md:top-full md:z-30 md:mt-3 md:w-72 md:shadow-2xl md:shadow-black/50`}
                  >
                    {item.children.map((child) => (
                      <li key={`${item.label}-${child.href}`}>
                        <Link
                          to={sectionTo(child.href)}
                          onClick={close}
                          className="block rounded-xl px-3 py-2.5 transition hover:bg-white/5 light:hover:bg-black/5"
                        >
                          <span className="block text-[0.85rem] font-semibold text-white light:text-gray-900">{child.label}</span>
                          {child.description && (
                            <span className="mt-0.5 block text-[0.72rem] leading-snug text-muted">{child.description}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}

          <li className="mt-3 border-t border-line pt-3 md:hidden">
            {loading ? (
              <p className="py-2 text-[0.85rem] text-muted">Checking your session...</p>
            ) : user ? (
              <div className="grid gap-2">
                <p className="text-[0.8rem] text-muted">
                  Signed in as <span className="text-white">{user.name}</span>
                  {canManage && <span className="ml-1 text-brand">({user.role})</span>}
                </p>
                <MemberBookingsInline bookings={bookings} loading={bookingsLoading} error={bookingsError} onNavigate={close} />
                {canManage && (
                  <Link to="/admin" onClick={close} className="rounded-full border border-line px-4 py-2 text-center text-white transition hover:border-brand light:text-gray-900">
                    Dashboard
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="rounded-full border border-line px-4 py-2 text-center text-white transition hover:border-brand light:text-gray-900">
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                <Link to="/login" onClick={close} className="rounded-full border border-line px-4 py-2 text-center text-white transition hover:border-brand light:text-gray-900">
                  Log in
                </Link>
                <Link to="/signup" onClick={close} className="btn block text-center">Sign up</Link>
              </div>
            )}
          </li>
        </ul>
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="grid size-9 place-items-center rounded-full border border-line text-soft transition hover:text-white light:text-gray-700 light:hover:text-gray-900"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {loading ? (
          <span className="text-[0.8rem] text-muted">...</span>
        ) : user ? (
          <>
            <span className="max-w-36 truncate text-[0.8rem] text-muted light:text-gray-600">
              {user.name}
              {canManage && <span className="ml-1 text-brand">({user.role})</span>}
            </span>
            <MemberBookingsMenu bookings={bookings} loading={bookingsLoading} error={bookingsError} />
            {canManage && (
              <Link to="/admin" className="rounded-full border border-line px-4 py-2 text-[0.8rem] text-white transition hover:border-brand light:text-gray-900 light:hover:text-brand">
                Dashboard
              </Link>
            )}
            <button type="button" onClick={handleLogout} className="rounded-full border border-line px-4 py-2 text-[0.8rem] text-white transition hover:border-brand light:text-gray-900 light:hover:text-brand">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-[0.85rem] text-soft transition-colors hover:text-white light:text-gray-700 light:hover:text-gray-900">
              Log in
            </Link>
            <Link to="/signup" className="btn px-5 py-2 text-[0.85rem]">Sign up</Link>
          </>
        )}
      </div>
    </header>
  )
}
