import { useState } from 'react'
import { apiDelete, apiPost, apiPut } from '../../api'
import useFetch from '../../hooks/useFetch'
import { imageFileToDataUrl, trainerImageSrc } from '../../utils/image'
import { Empty, Field, Notice, SectionHeader, Table, Td } from './ui'
import { cardClass, dangerButton, inputClass, primaryButton, secondaryButton } from './styles'

const emptyForm = {
  name: '',
  role: '',
  img: '',
  bio: '',
  email: '',
  password: '',
}

export default function TrainersPanel() {
  const { data, loading, error, refetch } = useFetch('/api/trainers')
  const trainers = data ?? []
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const reset = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setPhotoError(null)
  }

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setPhotoError(null)
    setFormError(null)
    setSuccess(null)
    setProcessingPhoto(true)
    try {
      const dataUrl = await imageFileToDataUrl(file)
      setForm((prev) => ({ ...prev, img: dataUrl }))
    } catch (err) {
      setPhotoError(err.message)
    } finally {
      setProcessingPhoto(false)
    }
  }

  const edit = (trainer) => {
    setEditingId(trainer.id)
    setForm({
      name: trainer.name,
      role: trainer.role,
      img: trainer.img,
      bio: trainer.bio,
      email: '',
      password: '',
    })
    setFormError(null)
    setPhotoError(null)
    setSuccess(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving || processingPhoto) return
    setFormError(null)
    setSuccess(null)

    if (!form.img.trim()) {
      setFormError('Upload a trainer photo before saving.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        img: form.img.trim(),
        bio: form.bio.trim(),
      }

      if (!editingId && (form.email.trim() || form.password)) {
        payload.email = form.email.trim()
        payload.password = form.password
      }

      if (editingId) await apiPut(`/api/trainers/${editingId}`, payload)
      else await apiPost('/api/trainers', payload)

      setSuccess(editingId ? 'Trainer updated.' : credentialsMessage(form))
      setEditingId(null)
      setForm(emptyForm)
      refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Clicking "Delete" in the table only sets state, so it paints immediately.
  const requestRemove = (trainer) => {
    setFormError(null)
    setSuccess(null)
    setPendingDelete(trainer)
  }

  const cancelRemove = () => {
    if (deleting) return
    setPendingDelete(null)
  }

  const confirmRemove = async () => {
    if (!pendingDelete || deleting) return
    setDeleting(true)

    try {
      await apiDelete(`/api/trainers/${pendingDelete.id}`)
      if (editingId === pendingDelete.id) reset()
      setSuccess('Trainer deleted.')
      refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <SectionHeader
        title="Trainers"
        description="Add coaches to the public team section. Creating a trainer with an email and password also makes them a manager who can sign in and manage classes and bookings."
      />

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">{editingId ? 'Edit trainer' : 'Add a trainer'}</h3>
          {editingId && (
            <button type="button" onClick={reset} className={secondaryButton}>Cancel edit</button>
          )}
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input type="text" required value={form.name} onChange={update('name')} className={inputClass} placeholder="Amara Okoye" />
          </Field>
          <Field label="Specialty / role">
            <input type="text" required value={form.role} onChange={update('role')} className={inputClass} placeholder="Strength & Conditioning" />
          </Field>
          <Field label="Photo" hint="PNG, JPG or WebP up to 8 MB. We resize it automatically for the web.">
            <div className="flex flex-wrap items-center gap-3">
              {form.img ? (
                <img src={trainerImageSrc(form.img)} alt="Trainer photo preview" className="size-16 flex-none rounded-xl border border-line object-cover" />
              ) : (
                <span className="grid size-16 flex-none place-items-center rounded-xl border border-dashed border-line text-center text-[0.6rem] leading-tight text-muted">
                  No photo
                </span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={uploadPhoto}
                disabled={processingPhoto}
                className="block w-full max-w-64 text-[0.75rem] text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-[0.75rem] file:font-semibold file:text-ink hover:file:opacity-90 disabled:opacity-50"
              />
            </div>
            {processingPhoto && <span className="text-[0.72rem] font-normal text-muted">Processing photo...</span>}
            {photoError && <span role="alert" className="text-[0.72rem] font-normal text-red-300 light:text-red-700">{photoError}</span>}
          </Field>
          <Field label="Bio">
            <textarea required rows="3" value={form.bio} onChange={update('bio')} className={inputClass} placeholder="A short introduction for the team section." />
          </Field>

          {!editingId && (
            <div className="sm:col-span-2 rounded-2xl border border-line bg-ink/30 p-4">
              <p className="text-[0.8rem] font-semibold text-white light:text-gray-900">Manager login (optional)</p>
              <p className="mt-1 text-[0.75rem] text-muted">
                Leave both fields blank for a profile-only trainer. If you add login details, the account gets the manager role.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Account email">
                  <input type="email" autoComplete="off" value={form.email} onChange={update('email')} className={inputClass} placeholder="trainer@ffl.com" />
                </Field>
                <Field label="Account password" hint="At least 8 characters">
                  <input type="password" autoComplete="new-password" value={form.password} onChange={update('password')} className={inputClass} placeholder="Set a password" />
                </Field>
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <button type="submit" disabled={saving || processingPhoto} className={primaryButton}>
              {processingPhoto ? 'Processing photo...' : saving ? 'Saving...' : editingId ? 'Save changes' : 'Add trainer'}
            </button>
          </div>
        </form>

        <Notice error={formError} success={success} />
      </div>

      {error && <p role="alert" className="mt-5 text-[0.85rem] text-red-300 light:text-red-700">Could not load trainers: {error}</p>}
      {loading && !data && <p className="mt-5 text-[0.85rem] text-muted">Loading trainers...</p>}
      {!loading && !error && trainers.length === 0 && <Empty>No trainers yet. Add the first one above.</Empty>}

      {trainers.length > 0 && (
        <Table columns={['Trainer', 'Specialty', 'Manager login', 'Actions']}>
          {trainers.map((trainer) => (
            <tr key={trainer.id}>
              <Td>
                <div className="flex items-start gap-3">
                  <img
                    src={trainerImageSrc(trainer.img)}
                    alt=""
                    className="size-10 flex-none rounded-full border border-line object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white light:text-gray-900">{trainer.name}</p>
                    <p className="mt-0.5 max-w-[38ch] text-[0.75rem] text-muted">{trainer.bio}</p>
                  </div>
                </div>
              </Td>
              <Td>{trainer.role}</Td>
              <Td>
                {trainer.has_account
                  ? <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-[0.7rem] font-semibold text-green-300 light:text-green-700">Linked</span>
                  : <span className="text-[0.75rem] text-muted">None</span>}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => edit(trainer)} className={secondaryButton}>Edit</button>
                  <button type="button" onClick={() => requestRemove(trainer)} className={dangerButton}>Delete</button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {pendingDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-trainer-title"
          aria-describedby="delete-trainer-desc"
          onKeyDown={(e) => e.key === 'Escape' && cancelRemove()}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
        >
          <div className={`${cardClass} w-full max-w-md`}>
            <h3 id="delete-trainer-title" className="font-bold">Delete {pendingDelete.name}?</h3>
            <p id="delete-trainer-desc" className="mt-2 text-[0.85rem] text-muted">
              Their login, if any, is kept in Users.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={confirmRemove}
                disabled={deleting}
                autoFocus
                className={dangerButton}
              >
                {deleting ? 'Deleting...' : 'Delete trainer'}
              </button>
              <button type="button" onClick={cancelRemove} disabled={deleting} className={secondaryButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function credentialsMessage(form) {
  return form.email.trim()
    ? `Trainer added and manager login created for ${form.email.trim()}.`
    : 'Trainer added.'
}