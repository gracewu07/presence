import { Navigate, useLocation } from 'react-router-dom'

function PrivateRoute({ user, children }) {
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default PrivateRoute
