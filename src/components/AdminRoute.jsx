import { Navigate, useLocation } from 'react-router-dom'

function AdminRoute({ user, children }) {
  const location = useLocation()
  if (!user || user.accessStatus !== 'approved') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default AdminRoute
