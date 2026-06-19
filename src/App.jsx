import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import MemberCheckIn from './pages/MemberCheckIn'
import EventCalendar from './pages/EventCalendar'
import Leaderboard from './pages/Leaderboard'
import MemberProfile from './pages/MemberProfile'
import ExcusalRequests from './pages/ExcusalRequests'
import AdminDashboard from './pages/AdminDashboard'
import StandardsDashboard from './pages/StandardsDashboard'
import EventCreation from './pages/EventCreation'
import MemberManagement from './pages/MemberManagement'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import Settings from './pages/Settings'
import More from './pages/More'

function App() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Loading authentication...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout currentUser={currentUser} />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route
            path="check-in"
            element={
              <PrivateRoute user={currentUser}>
                <MemberCheckIn />
              </PrivateRoute>
            }
          />
          <Route
            path="calendar"
            element={
              <PrivateRoute user={currentUser}>
                <EventCalendar />
              </PrivateRoute>
            }
          />
          <Route
            path="leaderboard"
            element={
              <PrivateRoute user={currentUser}>
                <Leaderboard />
              </PrivateRoute>
            }
          />
          <Route
            path="profile"
            element={
              <PrivateRoute user={currentUser}>
                <MemberProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="excusals"
            element={
              <PrivateRoute user={currentUser}>
                <ExcusalRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="more"
            element={
              <PrivateRoute user={currentUser}>
                <More />
              </PrivateRoute>
            }
          />
          <Route
            path="settings"
            element={
              <PrivateRoute user={currentUser}>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="admin"
            element={
              <AdminRoute user={currentUser}>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="admin/create-event"
            element={
              <AdminRoute user={currentUser}>
                <EventCreation />
              </AdminRoute>
            }
          />
          <Route
            path="admin/standards"
            element={
              <AdminRoute user={currentUser} requireStandards>
                <StandardsDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="admin/members"
            element={
              <AdminRoute user={currentUser}>
                <MemberManagement />
              </AdminRoute>
            }
          />
          <Route
            path="admin/analytics"
            element={
              <AdminRoute user={currentUser} requireAnalytics>
                <AnalyticsDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="admin/settings"
            element={
              <AdminRoute user={currentUser}>
                <Settings />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
