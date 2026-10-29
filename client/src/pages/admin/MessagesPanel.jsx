import { useMemo, useState } from 'react'
import { apiDelete, apiPatch } from '../../api'
import useFetch from '../../hooks/useFetch'
import { CONTACT_TOPICS } from '../../data'
import { Empty, SectionHeader, Table, Td } from './ui'
import { dangerButton, inputClass, secondaryButton } from './styles'

const topicLabel = (value) => CONTACT_TOPICS.find((topic) => topic.value === value)?.label ?? value
const formatDate = (value) => new Date(value).toLocaleString()

export default function MessagesPanel() {
  const { data, loading, error, refetch } = useFetch('/api/contact')
  const messages = data ?? []
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [search, setSearch] = useState('')

  const newCount = messages.filter((message) => message.status === 'new').length
  const base = filter === 'all'
    ? messages
    : messages.filter((message) => message.status === filter)
  const shown = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return base
    return base.filter((m) =>
      [m.name, m.email, m.phone, m.message, topicLabel(m.topic)].some((v) => String(v || '').toLowerCase().includes(q))
    )
  }, [base, search])

  const toggleStatus = async (message) => {
    if (busyId) return
    setActionError(null)
    setBusyId(message.id)
    try {
      await apiPatch(`/api/contact/${message.id}`, {
        status: message.status === 'new' ? 'read' : 'new',
      })
      refetch()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (message) => {
    if (busyId) return
    if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return
    setActionError(null)
    setBusyId(message.id)
    try {
      await apiDelete(`/api/contact/${message.id}`)
      refetch()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const reply = (message) => {
    const url = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${topicLabel(message.topic)}`)}`
    window.open(url, '_self')
  }

  return (
    <div>
      <SectionHeader
        title="Contact messages"
        description="Enquiries submitted through the contact form. Mark messages as read once you have followed up."
        action={
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className={inputClass}
          />
        }
      />

      {newCount > 0 && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-[0.75rem] font-semibold text-brand">
          {newCount} unread
        </p>
      )}

      {messages.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: 'all', label: `All (${messages.length})` },
            { key: 'new', label: `Unread (${newCount})` },
            { key: 'read', label: `Read (${messages.length - newCount})` },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-4 py-2 text-[0.8rem] transition ${
                filter === item.key
                  ? 'bg-brand font-semibold text-ink'
                  : 'border border-line text-soft hover:text-white light:hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {actionError && (
        <p role="alert" className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-[0.85rem] text-red-200 light:text-red-700">
          {actionError}
        </p>
      )}

      {error && <p role="alert" className="mt-5 text-[0.85rem] text-red-300 light:text-red-700">Could not load messages: {error}</p>}
      {loading && !data && <p className="mt-5 text-[0.85rem] text-muted">Loading messages...</p>}
      {!loading && !error && messages.length === 0 && <Empty>No contact messages yet.</Empty>}
      {!loading && !error && messages.length > 0 && shown.length === 0 && (
        <Empty>No {filter === 'new' ? 'unread' : 'read'} messages.</Empty>
      )}

      {shown.length > 0 && (
        <Table columns={['From', 'Topic', 'Message', 'Received', 'Actions']} minWidth="56rem">
          {shown.map((message) => (
            <tr key={message.id}>
              <Td>
                <div className="flex items-start gap-2">
                  <span
                    aria-label={message.status === 'new' ? 'Unread' : 'Read'}
                    className={`mt-1.5 size-2 flex-none rounded-full ${message.status === 'new' ? 'bg-brand' : 'bg-white/25 light:bg-black/25'}`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white light:text-gray-900">{message.name}</p>
                    <a className="mt-0.5 block break-all text-[0.75rem] text-muted transition hover:text-white light:hover:text-gray-900" href={`mailto:${message.email}`}>
                      {message.email}
                    </a>
                    {message.phone && <p className="mt-0.5 text-[0.75rem] text-muted">{message.phone}</p>}
                  </div>
                </div>
              </Td>
              <Td className="whitespace-nowrap">{topicLabel(message.topic)}</Td>
              <Td>
                <p className="max-w-[42ch] whitespace-pre-line text-[0.8rem] leading-relaxed">{message.message}</p>
              </Td>
              <Td className="whitespace-nowrap text-[0.78rem]">{formatDate(message.created_at)}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => reply(message)} className={secondaryButton}>Reply</button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(message)}
                    disabled={busyId === message.id}
                    className={secondaryButton}
                  >
                    {message.status === 'new' ? 'Mark read' : 'Mark unread'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(message)}
                    disabled={busyId === message.id}
                    className={dangerButton}
                  >
                    Delete
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
