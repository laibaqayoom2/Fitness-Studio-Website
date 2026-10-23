import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../api'

// GET helper with loading/error state and refetch. A `null` path disables the
// request (used for member-only data before sign-in). State is tagged with the
// request key so switching paths never shows another request's data while the
// new request is in flight. `identity` (for example a user id) scopes the cache.
export default function useFetch(path, identity) {
  const baseKey = path ? `${path}|${identity ?? ''}` : null
  const [state, setState] = useState({ baseKey: null, key: null, data: null, loading: false, error: null })
  const [reloadKey, setReloadKey] = useState(0)
  const key = baseKey ? `${baseKey}|${reloadKey}` : null

  const refetch = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    if (!path || !key) return

    const ctrl = new AbortController()

    apiGet(path, { signal: ctrl.signal })
      .then((data) => setState({ baseKey, key, data, loading: false, error: null }))
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setState({ baseKey, key, data: null, loading: false, error: e.message })
        }
      })

    return () => ctrl.abort()
  }, [path, key, baseKey])

  const samePath = state.baseKey === baseKey
  const fresh = samePath && state.key === key

  return {
    data: samePath ? state.data : null,
    loading: path ? (fresh ? state.loading : true) : false,
    error: fresh ? state.error : null,
    refetch,
  }
}
