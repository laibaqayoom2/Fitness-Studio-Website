import { useState } from 'react'
import { NAV } from '../data'

export default function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="fixed left-1/2 top-3.5 z-20 flex w-[min(1180px,calc(100%-2rem))] -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-3xl border border-line bg-[rgb(32_26_24/0.85)] px-4 py-3 backdrop-blur-md md:rounded-full md:py-2.5 md:pl-6 md:pr-3">
      <a href="#top" onClick={close} className="flex flex-none items-center">
        <img src="/images/logo.png" alt="FFL Studio" width="412" height="165" className="h-[2.4rem] w-auto" />
      </a>

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
              <a href={item.href} onClick={close} className="block py-2 text-[#e8e8ea] transition-colors hover:text-brand md:py-0">
                {item.label}
              </a>
            </li>
          ))}
          <li className="mt-2 md:hidden">
            <a href="#join" onClick={close} className="btn block text-center">Free Trial</a>
          </li>
        </ul>
      </nav>

      <a href="#join" className="btn hidden px-5 py-2 text-[0.85rem] md:inline-block">Free Trial</a>
    </header>
  )
}