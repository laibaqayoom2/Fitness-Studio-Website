// src/components/Footer.jsx
import { NAV, HOURS, SOCIAL } from '../data'

const title = 'mb-4 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-white'
const link = 'transition-colors hover:text-white'

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-line bg-ink px-pad pb-6 pt-16 text-[0.85rem] text-muted">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr] lg:gap-10">
        <div>
          <a href="#top"><img src="/images/logo.png" alt="FFL Studio" width="412" height="165" className="h-[2.8rem] w-auto" /></a>
          <p className="mb-5 mt-4 max-w-[28ch]">Fit For Life. Strong today. Stronger tomorrow.</p>
          <a href="#join" className="inline-block rounded-full border border-line bg-card px-4 py-2 text-white transition-colors hover:border-brand">Start your free trial</a>
        </div>
        <nav aria-label="Footer">
          <h2 className={title}>Explore</h2>
          <ul className="grid gap-2.5">{NAV.map((n) => <li key={n.href}><a className={link} href={n.href}>{n.label}</a></li>)}</ul>
        </nav>
        <div>
          <h2 className={title}>Opening hours</h2>
          <ul className="grid gap-2.5">{HOURS.map((h) => <li key={h}>{h}</li>)}</ul>
        </div>
        <div>
          <h2 className={title}>Contact</h2>
          <address className="not-italic">
            <ul className="grid gap-2.5 break-words">
              <li>12 Example Street, Your City</li>
              <li><a className={link} href="tel:+10000000000">+1 000 000 0000</a></li>
              <li><a className={link} href="mailto:hello@ffl.com">hello@ffl.com</a></li>
            </ul>
          </address>
          <ul aria-label="Social media" className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {SOCIAL.map((s) => <li key={s.label}><a className={link} href={s.href}>{s.label}</a></li>)}
          </ul>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap justify-between gap-x-8 gap-y-4 border-t border-line pt-6 text-[0.8rem]">
        <p>&copy; 2026 FFL Studio. All rights reserved.</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          <li><a className={link} href="#top">Privacy</a></li>
          <li><a className={link} href="#top">Terms</a></li>
          <li><a className={link} href="#top">Back to top &uarr;</a></li>
        </ul>
      </div>
    </footer>
  )
}