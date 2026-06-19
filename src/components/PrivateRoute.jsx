import { Navigate, useLocation } from 'react-router-dom'
import { isMemberRole } from '../utils/permissions'

function PrivateRoute({ user, children }) {
  const location = useLocation()

  if (!isMemberRole(user)) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default PrivateRoute
