const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function apiUrl(path) {
  return `${API_BASE}${path}`
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(apiUrl(path), {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // A failed login should not clear a session that is already signed in.
    if (res.status === 401 && !path.startsWith('/api/auth/login') && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ffl:unauthorized'))
    }
    throw new ApiError(data?.error ?? `HTTP ${res.status}`, res.status)
  }
  return data
}

export const apiGet = (path, options) => apiRequest(path, options)
export const apiPost = (path, body, options) => apiRequest(path, { ...options, method: 'POST', body })
export const apiPut = (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body })
export const apiPatch = (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body })
export const apiDelete = (path, options) => apiRequest(path, { ...options, method: 'DELETE' })
