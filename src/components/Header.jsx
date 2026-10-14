// src/components/Header.jsx
import { NAV } from '../data'

export default function Header() {
  return (
    <header className="fixed left-1/2 top-3.5 z-20 flex w-[min(1180px,calc(100%-2rem))] -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-3xl border border-line bg-[rgb(32_26_24/0.85)] px-4 py-3 backdrop-blur-md md:rounded-full md:py-2.5 md:pl-6 md:pr-3">
      <a href="#top" className="flex flex-none items-center">
        <img src="/images/logo.png" alt="FFL Studio" width="412" height="165" className="h-[2.4rem] w-auto" />
      </a>
      <nav aria-label="Primary" className="order-3 w-full md:order-none md:mr-auto md:w-auto">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.85rem] md:gap-x-6">
          {NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="text-[#e8e8ea] transition-colors hover:text-brand">{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <a href="#join" className="btn px-5 py-2 text-[0.85rem]">Free Trial</a>
    </header>
  )
}