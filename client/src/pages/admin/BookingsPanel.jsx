import { useMemo, useState } from 'react'
import { apiDelete, apiPost } from '../../api'
import useFetch from '../../hooks/useFetch'
import { Empty, Field, Notice, SectionHeader, Table, Td } from './ui'
import { cardClass, dangerButton, inputClass, primaryButton } from './styles'

const emptyForm = { name: '', email: '', classId: '', spots: 1 }

function downloadCSV(rows) {
  const header = 'Reference,Name,Email,Classes,Spots,Created\n'
  const body = rows.map((b) => {
    const classes = b.items.map((i) => `${i.day} ${i.time} ${i.name} x${i.spots}`).join(' | ')
    return `"${b.reference}","${b.name}","${b.email}","${classes.replace(/"/g, '""')}",${b.total_spots},"${new Date(b.created_at).toISOString()}"`
  }).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `bookings-${Date.now()}.csv`
  link.click()
}

export default function BookingsPanel() {
  const { data, loading, error, refetch } = useFetch('/api/bookings')
  const { data: classData, loading: classesLoading, refetch: refetchClasses } = useFetch('/api/classes')
  const bookings = useMemo(() => data ?? [], [data])
  const classes = classData ?? []

  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return bookings
    return bookings.filter((b) =>
      [b.reference, b.name, b.email, ...(b.items?.map((i) => i.name) ?? [])].some((v) => String(v).toLowerCase().includes(q))
    )
  }, [bookings, search])

  const update = (key) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [key]: key === 'spots' ? (value === '' ? '' : Number(value)) : value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    setFormError(null)
    setSuccess(null)

    if (!form.classId) {
      setFormError('Choose a class.')
      return
    }

    setSaving(true)
    try {
      const booking = await apiPost('/api/bookings', {
        name: form.name.trim(),
        email: form.email.trim(),
        items: [{ classId: Number(form.classId), spots: Number(form.spots) }],
      })
      setSuccess(`Booking ${booking.reference} added.`)
      setForm(emptyForm)
      refetch()
      refetchClasses()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (booking) => {
    if (!window.confirm(`Cancel booking ${booking.reference} for ${booking.name}? The spots will be returned to the classes. This action cannot be undone.`)) return
    setFormError(null)
    setSuccess(null)

    try {
      await apiDelete(`/api/bookings/${booking.id}`)
      setSuccess(`Booking ${booking.reference} cancelled.`)
      refetch()
      refetchClasses()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div>
      <SectionHeader
        title="Bookings"
        description="Create a booking on someone's behalf or cancel an existing one. Cancelling restores the reserved spots."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings..."
              className={inputClass}
            />
            {filtered.length > 0 && (
              <button type="button" onClick={() => downloadCSV(filtered)} className="rounded-full border border-line px-4 py-2 text-sm text-white">
                Export CSV
              </button>
            )}
          </div>
        }
      />

      <div className={cardClass}>
        <h3 className="font-bold">Add a booking</h3>
        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input type="text" required value={form.name} onChange={update('name')} className={inputClass} placeholder="Guest name" />
          </Field>
          <Field label="Email">
            <input type="email" required value={form.email} onChange={update('email')} className={inputClass} placeholder="guest@example.com" />
          </Field>
          <Field label="Class">
            <select required value={form.classId} onChange={update('classId')} className={inputClass} disabled={classesLoading && !classData}>
              <option value="">{classesLoading && !classData ? 'Loading classes...' : 'Choose a class'}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} disabled={c.spots === 0}>
                  {c.day} {c.time} · {c.name} ({c.spots} left)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Spots">
            <input type="number" min="1" required value={form.spots} onChange={update('spots')} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? 'Adding...' : 'Add booking'}
            </button>
          </div>
        </form>

        <Notice error={formError} success={success} />
      </div>

      {error && <p role="alert" className="mt-5 text-[0.85rem] text-red-300">Could not load bookings: {error}</p>}
      {loading && !data && <p className="mt-5 text-[0.85rem] text-muted">Loading bookings...</p>}
      {!loading && !error && bookings.length === 0 && <Empty>No bookings yet.</Empty>}
      {!loading && !error && bookings.length > 0 && filtered.length === 0 && <Empty>No bookings match your search.</Empty>}

      {filtered.length > 0 && (
        <Table columns={['Reference', 'Guest', 'Classes', 'Spots', 'Created', 'Actions']} minWidth="56rem">
          {filtered.map((booking) => (
            <tr key={booking.id}>
              <Td className="whitespace-nowrap font-mono font-semibold text-white">{booking.reference}</Td>
              <Td>
                <p className="font-semibold text-white">{booking.name}</p>
                <p className="mt-0.5 text-[0.75rem] text-muted">{booking.email}</p>
              </Td>
              <Td>
                <ul className="grid gap-1">
                  {booking.items.map((item) => (
                    <li key={item.classId} className="whitespace-nowrap">
                      {item.day} {item.time} · {item.name} <span className="text-white">× {item.spots}</span>
                    </li>
                  ))}
                </ul>
              </Td>
              <Td className="font-semibold text-white">{booking.total_spots}</Td>
              <Td className="whitespace-nowrap">{new Date(booking.created_at).toLocaleString()}</Td>
              <Td>
                <button type="button" onClick={() => remove(booking)} className={dangerButton}>Cancel</button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
