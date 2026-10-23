import { useState } from 'react'
import { apiDelete, apiPost, apiPut } from '../../api'
import useFetch from '../../hooks/useFetch'
import { Empty, Field, Notice, SectionHeader, Table, Td } from './ui'
import { cardClass, dangerButton, inputClass, primaryButton, secondaryButton } from './styles'

const emptyForm = {
  name: '',
  price: 25,
  note: '',
  featured: false,
  button: 'dark',
  perks: '',
}

export default function PlansPanel() {
  const { data, loading, error, refetch } = useFetch('/api/plans')
  const plans = data ?? []
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(null)

  const update = (key) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [key]: key === 'price' ? (value === '' ? '' : Number(value)) : value }))
  }

  const reset = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const edit = (plan) => {
    setEditingId(plan.id)
    setForm({
      name: plan.name,
      price: plan.price,
      note: plan.note,
      featured: plan.featured,
      button: plan.button,
      perks: (plan.perks ?? []).join('\n'),
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
        name: form.name.trim(),
        price: Number(form.price),
        note: form.note.trim(),
        featured: form.featured,
        button: form.button,
        perks: form.perks.split('\n').map((perk) => perk.trim()).filter(Boolean),
      }
      if (editingId) await apiPut(`/api/plans/${editingId}`, payload)
      else await apiPost('/api/plans', payload)

      setSuccess(editingId ? 'Plan updated.' : 'Plan added.')
      setEditingId(null)
      setForm(emptyForm)
      refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (plan) => {
    if (!window.confirm(`Delete the ${plan.name} plan?`)) return
    setFormError(null)
    setSuccess(null)

    try {
      await apiDelete(`/api/plans/${plan.id}`)
      if (editingId === plan.id) reset()
      setSuccess('Plan deleted.')
      refetch()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div>
      <SectionHeader
        title="Membership plans"
        description="Manage the pricing cards shown on the public site. Put each perk on its own line."
      />

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">{editingId ? 'Edit plan' : 'Add a plan'}</h3>
          {editingId && (
            <button type="button" onClick={reset} className={secondaryButton}>Cancel edit</button>
          )}
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Plan name">
            <input type="text" required value={form.name} onChange={update('name')} className={inputClass} placeholder="Standard" />
          </Field>
          <Field label="Price">
            <input type="number" min="0" required value={form.price} onChange={update('price')} className={inputClass} />
          </Field>
          <Field label="Note">
            <input type="text" required value={form.note} onChange={update('note')} className={inputClass} placeholder="Extended package for comprehensive training." />
          </Field>
          <Field label="Button style">
            <select value={form.button} onChange={update('button')} className={inputClass}>
              <option value="dark">Dark</option>
              <option value="primary">Brand</option>
              <option value="light">Light</option>
            </select>
          </Field>
          <Field label="Perks" hint="One perk per line">
            <textarea required rows="4" value={form.perks} onChange={update('perks')} className={inputClass} placeholder={'Unlimited gym access\n3 group classes per month'} />
          </Field>
          <label className="flex items-start gap-3 rounded-2xl border border-line bg-ink/30 p-4 text-[0.85rem] sm:mt-6">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
              className="mt-0.5 size-4 accent-brand"
            />
            <span>
              <span className="font-semibold text-white">Highlight this plan</span>
              <span className="mt-0.5 block text-[0.75rem] text-muted">Featured plans get the emphasis styling on the landing page.</span>
            </span>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add plan'}
            </button>
          </div>
        </form>

        <Notice error={formError} success={success} />
      </div>

      {error && <p role="alert" className="mt-5 text-[0.85rem] text-red-300">Could not load plans: {error}</p>}
      {loading && !data && <p className="mt-5 text-[0.85rem] text-muted">Loading plans...</p>}
      {!loading && !error && plans.length === 0 && <Empty>No plans yet. Add the first one above.</Empty>}

      {plans.length > 0 && (
        <Table columns={['Plan', 'Price', 'Perks', 'Featured', 'Actions']}>
          {plans.map((plan) => (
            <tr key={plan.id}>
              <Td>
                <p className="font-semibold text-white">{plan.name}</p>
                <p className="mt-0.5 max-w-[32ch] text-[0.75rem] text-muted">{plan.note}</p>
              </Td>
              <Td className="font-semibold text-white">${plan.price}</Td>
              <Td>
                <ul className="grid gap-0.5 text-[0.75rem]">
                  {(plan.perks ?? []).map((perk) => <li key={perk}>{perk}</li>)}
                </ul>
              </Td>
              <Td>{plan.featured ? 'Yes' : 'No'}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => edit(plan)} className={secondaryButton}>Edit</button>
                  <button type="button" onClick={() => remove(plan)} className={dangerButton}>Delete</button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
