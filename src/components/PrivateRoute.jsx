import { Navigate, useLocation } from 'react-router-dom'

function PrivateRoute({ user, children }) {
  const location = useLocation()
  const canAccessMemberPages = user?.role === 'member' || user?.role === 'admin'

  if (!user || user.accessStatus !== 'approved' || !canAccessMemberPages) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default PrivateRoute
