import { labelClass, tdClass, thClass } from './styles'

export function Field({ label, hint, children }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      {children}
      {hint && <span className="text-[0.7rem] font-normal text-muted">{hint}</span>}
    </label>
  )
}

export function Notice({ error, success }) {
  if (!error && !success) return null
  const isError = Boolean(error)
  return (
    <p
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`mt-4 rounded-xl border px-4 py-2.5 text-[0.85rem] ${
        isError
          ? 'border-red-400/40 bg-red-500/10 text-red-200'
          : 'border-green-400/30 bg-green-500/10 text-green-200'
      }`}
    >
      {error ?? success}
    </p>
  )
}

export function SectionHeader({ title, description }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[1.35rem] font-bold">{title}</h2>
        {description && <p className="mt-1 max-w-[70ch] text-[0.85rem] text-muted">{description}</p>}
      </div>
    </div>
  )
}

export function Empty({ children }) {
  return (
    <p className="mt-5 rounded-3xl border border-dashed border-line px-5 py-8 text-center text-[0.85rem] text-muted">
      {children}
    </p>
  )
}

export function Table({ columns, children, minWidth = '44rem' }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
      <table className="w-full text-left" style={{ minWidth }}>
        <thead className="bg-white/5">
          <tr>
            {columns.map((column) => <th key={column} className={thClass}>{column}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className = '' }) {
  return <td className={`${tdClass} ${className}`}>{children}</td>
}
