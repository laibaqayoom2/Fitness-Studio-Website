import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RequireRole({ roles = [], children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="pt-32 text-center text-muted">Loading...</p>
  }
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}
