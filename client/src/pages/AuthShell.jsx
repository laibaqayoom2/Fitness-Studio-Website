export default function AuthShell({ kicker, title, subtitle, children, footer }) {
  return (
    <section className="mx-auto w-full max-w-md px-pad pb-20 pt-32 sm:pt-36">
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-brand">{kicker}</p>
      <h1 className="mt-2 text-[clamp(1.8rem,7vw,2.4rem)] font-bold uppercase text-white light:text-gray-900">{title}</h1>
      {subtitle && <p className="mt-3 text-[0.9rem] text-muted">{subtitle}</p>}

      <div className="mt-7 rounded-3xl border border-line bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
        {children}
      </div>

      {footer && <div className="mt-5 text-center text-[0.85rem] text-muted">{footer}</div>}
    </section>
  )
}
