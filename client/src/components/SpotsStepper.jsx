// src/components/SpotsStepper.jsx
// Controlled: no state in here. `value` comes in, `onChange` reports what the user wants.
export default function SpotsStepper({ value, onChange, max, label, disabled = false }) {
  const btn = 'grid size-8 place-items-center rounded-full bg-cta font-bold text-white transition hover:bg-brand hover:text-ink disabled:opacity-30 disabled:hover:bg-cta disabled:hover:text-white light:bg-gray-200 light:text-gray-900 light:hover:bg-brand light:hover:text-ink'
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1.5">
      <button type="button" aria-label="Remove a spot" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className={btn}>&minus;</button>
      <output aria-live="polite" className="w-5 text-center font-bold">{value}</output>
      <button type="button" aria-label="Add a spot" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className={btn}>+</button>
    </div>
  )
}
