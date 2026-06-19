import { Navigate, useLocation } from 'react-router-dom'
import { canAccessStandards, canViewAnalytics, isAdminRole } from '../utils/permissions'

function AdminRoute({ user, children, requireStandards = false, requireAnalytics = false }) {
  const location = useLocation()
  if (!user || user.accessStatus !== 'approved') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const hasAccess = requireStandards
    ? canAccessStandards(user)
    : requireAnalytics
      ? canViewAnalytics(user)
      : isAdminRole(user)

  if (!hasAccess) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default AdminRoute
