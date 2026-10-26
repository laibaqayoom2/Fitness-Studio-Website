import { useMemo, useState } from 'react'
import { apiDelete, apiPost, apiPut } from '../../api'
import { DAYS } from '../../data'
import useFetch from '../../hooks/useFetch'
import { Empty, Field, Notice, SectionHeader, Table, Td } from './ui'
import { cardClass, dangerButton, inputClass, primaryButton, secondaryButton } from './styles'

const CATEGORIES = ['Strength', 'Cardio', 'Swim', 'Mobility', 'Other']

const emptyForm = {
  day: 'Mon',
  time: '06:30',
  name: '',
  coach: '',
  category: 'Strength',
  spots: 12,
  capacity: 12,
}

export default function ClassesPanel() {
  const { data, loading, error, refetch } = useFetch('/api/classes')
  const { data: trainerData, loading: trainersLoading } = useFetch('/api/trainers')
  const classes = useMemo(() => data ?? [], [data])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [filterDay, setFilterDay] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')

  const coachNames = Array.from(new Set([...(trainerData ?? []).map((t) => t.name), 'All coaches']))
  const currentCoach = form.coach && !coachNames.includes(form.coach) ? form.coach : null

  const categories = ['All', ...Array.from(new Set(classes.map((c) => c.category).filter(Boolean))).sort()]
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return classes.filter((c) => {
      if (filterDay !== 'All' && c.day !== filterDay) return false
      if (filterCategory !== 'All' && c.category !== filterCategory) return false
      if (!q) return true
      return [c.name, c.coach, c.category, c.day, c.time].some((v) => String(v).toLowerCase().includes(q))
    })
  }, [classes, search, filterDay, filterCategory])

  const update = (key) => (e) => {
    const value = e.target.value
    setForm((prev) => ({
      ...prev,
      [key]: key === 'spots' || key === 'capacity' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  const reset = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const edit = (c) => {
    setEditingId(c.id)
    setForm({
      day: c.day,
      time: c.time,
      name: c.name,
      coach: c.coach,
      category: c.category,
      spots: c.spots,
      capacity: c.capacity,
    })
    setFormError(null)
    setSuccess(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    setFormError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const payload = {
        ...form,
        spots: Number(form.spots),
        capacity: Number(form.capacity),
      }
      if (editingId) await apiPut(`/api/classes/${editingId}`, payload)
      else await apiPost('/api/classes', payload)

      setSuccess(editingId ? 'Class updated.' : 'Class added.')
      setEditingId(null)
      setForm(emptyForm)
      refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name} on ${c.day} at ${c.time}? This action cannot be undone.`)) return
    setFormError(null)
    setSuccess(null)

    try {
      await apiDelete(`/api/classes/${c.id}`)
      if (editingId === c.id) reset()
      setSuccess('Class deleted.')
      refetch()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div>
      <SectionHeader
        title="Classes"
        description="Add sessions, update times and availability, or remove a class. Managers and admins can edit the schedule."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classes..."
              className={inputClass}
            />
            <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className={inputClass}>
              <option value="All">All days</option>
              {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={inputClass}>
              {categories.map((cat) => <option key={cat} value={cat}>{cat === 'All' ? 'All categories' : cat}</option>)}
            </select>
          </div>
        }
      />

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">{editingId ? 'Edit class' : 'Add a class'}</h3>
          {editingId && (
            <button type="button" onClick={reset} className={secondaryButton}>Cancel edit</button>
          )}
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Day">
            <select value={form.day} onChange={update('day')} className={inputClass}>
              {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
          </Field>
          <Field label="Time">
            <input type="time" required value={form.time} onChange={update('time')} className={inputClass} />
          </Field>
          <Field label="Class name">
            <input type="text" required value={form.name} onChange={update('name')} className={inputClass} placeholder="Strength Circuit" />
          </Field>
          <Field label="Coach">
            <select
              required
              value={form.coach}
              onChange={update('coach')}
              className={inputClass}
              disabled={trainersLoading && !trainerData}
            >
              <option value="">
                {trainersLoading && !trainerData ? 'Loading coaches...' : 'Choose a coach'}
              </option>
              {currentCoach && <option value={currentCoach}>{currentCoach} (not in trainer list)</option>}
              {coachNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={update('category')} className={inputClass}>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Open spots">
              <input type="number" min="0" required value={form.spots} onChange={update('spots')} className={inputClass} />
            </Field>
            <Field label="Capacity">
              <input type="number" min="1" required value={form.capacity} onChange={update('capacity')} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add class'}
            </button>
          </div>
        </form>

        <Notice error={formError} success={success} />
      </div>

      {error && <p role="alert" className="mt-5 text-[0.85rem] text-red-300">Could not load classes: {error}</p>}
      {loading && !data && <p className="mt-5 text-[0.85rem] text-muted">Loading classes...</p>}
      {!loading && !error && classes.length === 0 && <Empty>No classes yet. Add the first one above.</Empty>}
      {!loading && !error && classes.length > 0 && filtered.length === 0 && <Empty>No classes match your filters.</Empty>}

      {filtered.length > 0 && (
        <Table columns={['When', 'Class', 'Coach', 'Category', 'Spots', 'Actions']}>
          {filtered.map((c) => (
            <tr key={c.id}>
              <Td className="whitespace-nowrap font-semibold text-white">{c.day} {c.time}</Td>
              <Td className="font-semibold text-white">{c.name}</Td>
              <Td>{c.coach}</Td>
              <Td>{c.category}</Td>
              <Td>{c.spots} / {c.capacity}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => edit(c)} className={secondaryButton}>Edit</button>
                  <button type="button" onClick={() => remove(c)} className={dangerButton}>Delete</button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
