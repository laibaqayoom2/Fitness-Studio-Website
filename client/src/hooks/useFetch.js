import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../api'

export default function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()

    apiGet(path, { signal: ctrl.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setState((prev) => ({ ...prev, loading: false, error: e.message }))
        }
      })

    return () => ctrl.abort()
  }, [path, reloadKey])

  return { ...state, refetch }
}
