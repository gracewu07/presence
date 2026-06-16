import { Navigate, useLocation } from 'react-router-dom'

function AdminRoute({ user, children }) {
  const location = useLocation()
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default AdminRoute
