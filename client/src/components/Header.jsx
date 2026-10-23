import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NAV } from '../data'
import { useAuth } from '../auth/AuthContext'

const navLink = 'block py-2 text-[#e8e8ea] transition-colors hover:text-brand md:py-0'

export default function Header() {
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, loading, logout } = useAuth()
  const close = () => setOpen(false)

  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const sectionTo = (href) => (pathname === '/' ? href : `/${href}`)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false) }
    const onPointerDown = (e) => {
      if (!headerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  const handleLogout = async () => {
    close()
    await logout()
    navigate('/')
  }

  return (
    <header ref={headerRef} className="fixed left-1/2 top-3.5 z-20 flex w-[min(1180px,calc(100%-2rem))] -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-3xl border border-line bg-[rgb(32_26_24/0.85)] px-4 py-3 backdrop-blur-md md:rounded-full md:py-2.5 md:pl-6 md:pr-3">
      <Link to="/#top" onClick={close} className="flex flex-none items-center">
        <img src="/images/logo.png" alt="FFL Studio" width="412" height="165" className="h-[2.4rem] w-auto" />
      </Link>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="primary-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
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
        <ul className="flex flex-col py-2 text-[0.95rem] md:flex-row md:gap-x-6 md:py-0 md:text-[0.85rem]">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link to={sectionTo(item.href)} onClick={close} className={navLink}>
                {item.label}
              </Link>
            </li>
          ))}

          <li className="mt-3 border-t border-line pt-3 md:hidden">
            {loading ? (
              <p className="py-2 text-[0.85rem] text-muted">Checking your session...</p>
            ) : user ? (
              <div className="grid gap-2">
                <p className="text-[0.8rem] text-muted">
                  Signed in as <span className="text-white">{user.name}</span>
                  {canManage && <span className="ml-1 text-brand">({user.role})</span>}
                </p>
                {canManage && (
                  <Link to="/admin" onClick={close} className="rounded-full border border-line px-4 py-2 text-center text-white transition hover:border-brand">
                    Dashboard
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="rounded-full border border-line px-4 py-2 text-center text-white transition hover:border-brand">
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                <Link to="/login" onClick={close} className="rounded-full border border-line px-4 py-2 text-center text-white transition hover:border-brand">
                  Log in
                </Link>
                <Link to="/signup" onClick={close} className="btn block text-center">Sign up</Link>
              </div>
            )}
          </li>
        </ul>
      </nav>

      <div className="hidden items-center gap-4 md:flex">
        {loading ? (
          <span className="text-[0.8rem] text-muted">...</span>
        ) : user ? (
          <>
            <span className="max-w-44 truncate text-[0.8rem] text-muted">
              {user.name}
              {canManage && <span className="ml-1 text-brand">({user.role})</span>}
            </span>
            {canManage && (
              <Link to="/admin" className="rounded-full border border-line px-4 py-2 text-[0.8rem] text-white transition hover:border-brand">
                Dashboard
              </Link>
            )}
            <button type="button" onClick={handleLogout} className="rounded-full border border-line px-4 py-2 text-[0.8rem] text-white transition hover:border-brand">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-[0.85rem] text-soft transition-colors hover:text-white">
              Log in
            </Link>
            <Link to="/signup" className="btn px-5 py-2 text-[0.85rem]">Sign up</Link>
          </>
        )}
      </div>
    </header>
  )
}
