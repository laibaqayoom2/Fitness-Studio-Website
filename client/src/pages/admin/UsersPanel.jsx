import { useMemo, useState } from 'react'
import { apiDelete, apiPatch } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import useFetch from '../../hooks/useFetch'
import { Empty, Notice, SectionHeader, Table, Td } from './ui'
import { dangerButton, inputClass } from './styles'

const ROLES = ['member', 'manager', 'admin']

export default function UsersPanel() {
  const { user: me } = useAuth()
  const { data, loading, error, refetch } = useFetch('/api/users')
  const users = useMemo(() => data ?? [], [data])
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'All' && u.role !== roleFilter) return false
      if (!q) return true
      return [u.name, u.email, u.role].some((v) => String(v).toLowerCase().includes(q))
    })
  }, [users, search, roleFilter])

  const changeRole = async (user, role) => {
    setActionError(null)
    setSuccess(null)
    setBusyId(user.id)

    try {
      await apiPatch(`/api/users/${user.id}`, { role })
      setSuccess(`${user.name} is now ${role}.`)
      refetch()
    } catch (err) {
      setActionError(err.message)
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This also removes their sessions. This action cannot be undone.`)) return
    setActionError(null)
    setSuccess(null)
    setBusyId(user.id)

    try {
      await apiDelete(`/api/users/${user.id}`)
      setSuccess(`${user.name} was deleted.`)
      refetch()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <SectionHeader
        title="Users"
        description="Members can book classes. Managers (trainers) can manage classes and bookings. Admins can manage everything, including users and roles."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className={inputClass}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputClass}>
              <option value="All">All roles</option>
              {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        }
      />

      <Notice error={actionError} success={success} />

      {error && <p role="alert" className="mt-5 text-[0.85rem] text-red-300 light:text-red-700">Could not load users: {error}</p>}
      {loading && !data && <p className="mt-5 text-[0.85rem] text-muted">Loading users...</p>}
      {!loading && !error && users.length === 0 && <Empty>No users yet.</Empty>}
      {!loading && !error && users.length > 0 && filtered.length === 0 && <Empty>No users match your filters.</Empty>}

      {filtered.length > 0 && (
        <Table columns={['User', 'Email', 'Role', 'Joined', 'Actions']}>
          {filtered.map((user) => {
            const isMe = user.id === me?.id
            const busy = busyId === user.id

            return (
              <tr key={user.id}>
                <Td>
                  <p className="font-semibold text-white light:text-gray-900">
                    {user.name}
                    {isMe && <span className="ml-2 text-[0.7rem] font-semibold text-brand">(you)</span>}
                  </p>
                </Td>
                <Td className="break-all">{user.email}</Td>
                <Td>
                  <select
                    value={user.role}
                    disabled={isMe || busy}
                    onChange={(e) => changeRole(user, e.target.value)}
                    className={`${inputClass} min-w-32`}
                    aria-label={`Role for ${user.name}`}
                  >
                    {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </Td>
                <Td className="whitespace-nowrap">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</Td>
                <Td>
                  <button
                    type="button"
                    disabled={isMe || busy}
                    onClick={() => remove(user)}
                    className={dangerButton}
                  >
                    {busy ? 'Working...' : 'Delete'}
                  </button>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}
