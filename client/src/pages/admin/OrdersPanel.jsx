import { useState } from 'react'
import { apiPost } from '../../api'
import useFetch from '../../hooks/useFetch'
import { Empty, Notice, SectionHeader, Table, Td } from './ui'
import { cardClass, secondaryButton } from './styles'

// Order states the ledger can show (schema CHECK mirrors this).
const STATUS_BADGE = {
  pending: 'bg-brand/15 text-brand',
  paid: 'bg-green-500/15 text-green-300 light:text-green-700',
  canceled: 'bg-white/5 text-muted light:bg-black/5 light:text-gray-500',
  refunded: 'bg-red-500/10 text-red-300 light:text-red-700',
}

const money = (cents, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)

const fmtDate = (value) => new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export default function OrdersPanel() {
  const { data, loading, error, refetch } = useFetch('/api/orders/admin')
  const orders = data ?? []
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState(null) // { error?, success? }
  const [filter, setFilter] = useState('all')

  const actOn = async (order, action, confirmText) => {
    if (busyId) return
    if (typeof window !== 'undefined' && !window.confirm(confirmText)) return
    setBusyId(order.id)
    setNotice(null)
    try {
      const result = await apiPost(`/api/orders/${order.id}/${action}`)
      if (action === 'refund') {
        setNotice({ success: `Order ${order.reference} refunded through Stripe (status: ${result.refundStatus}). Membership revoked.` })
      } else {
        setNotice({ success: `Order ${order.reference} canceled. Its membership is no longer active.` })
      }
      await refetch()
    } catch (e) {
      setNotice({ error: e.message })
    } finally {
      setBusyId(null)
    }
  }

  const shown = filter === 'all' ? orders : orders.filter((order) => order.status === filter)

  return (
    <div>
      <SectionHeader
        title="Orders"
        description="The full payment ledger. Cancel stops a pending checkout or revokes a paid membership (no money moves); Refund returns the full amount through Stripe and marks the order refunded."
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {['all', 'paid', 'pending', 'canceled', 'refunded'].map((state) => (
          <button
            key={state}
            type="button"
            onClick={() => setFilter(state)}
            className={`rounded-full px-4 py-1.5 text-[0.8rem] capitalize transition ${
              filter === state ? 'bg-brand font-semibold text-ink' : 'border border-line text-soft hover:text-white light:hover:text-gray-900'
            }`}
          >
            {state === 'all' ? 'All orders' : state}
          </button>
        ))}
      </div>

      {notice && <Notice error={notice.error} success={notice.success} />}
      {error && <Notice error={`Could not load orders: ${error}`} />}

      <div className={cardClass}>
        {loading && !data && <p className="text-[0.85rem] text-muted">Loading orders…</p>}
        {shown.length === 0 && !loading && (
          <Empty>No orders{filter !== 'all' ? ` with status “${filter}”` : ''} yet.</Empty>
        )}
        {shown.length > 0 && (
          <Table columns={['Reference', 'Member', 'Items', 'Total', 'Status', 'Dates', 'Actions']}>
            {shown.map((order) => (
              <tr key={order.id}>
                <Td className="whitespace-nowrap font-mono font-semibold text-white light:text-gray-900">{order.reference}</Td>
                <Td>
                  <p className="font-semibold text-white light:text-gray-900">{order.userName}</p>
                  <p className="text-[0.72rem] text-muted">{order.userEmail}</p>
                </Td>
                <Td>
                  {order.items.map((item, index) => (
                    <p key={index} className="whitespace-nowrap">
                      {item.planName}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                    </p>
                  ))}
                </Td>
                <Td className="whitespace-nowrap font-semibold">{money(order.amountTotal, order.currency)}</Td>
                <Td>
                  <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-semibold capitalize ${STATUS_BADGE[order.status]}`}>
                    {order.status}
                  </span>
                </Td>
                <Td>
                  <p className="whitespace-nowrap">Created {fmtDate(order.createdAt)}</p>
                  {order.paidAt && <p className="whitespace-nowrap text-[0.72rem] text-muted">Paid {fmtDate(order.paidAt)}</p>}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    {(order.status === 'pending' || order.status === 'paid') && (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => actOn(order, 'cancel',
                          order.status === 'paid'
                            ? `Cancel the membership for order ${order.reference}? It will no longer count as active. (No money is returned.)`
                            : `Cancel pending checkout ${order.reference}? The Stripe page will stop working.`)}
                        className={secondaryButton}
                      >
                        {order.status === 'paid' ? 'Cancel membership' : 'Cancel checkout'}
                      </button>
                    )}
                    {order.status === 'paid' && (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => actOn(order, 'refund',
                          `Refund order ${order.reference} (${money(order.amountTotal, order.currency)}) through Stripe? The membership is revoked.`)}
                        className="rounded-full border border-red-400/40 px-4 py-2 text-[0.85rem] text-red-300 transition hover:border-red-300 light:text-red-700 disabled:opacity-50"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  )
}
