import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const MemberCheckIn = lazy(() => import('./pages/MemberCheckIn'))
const EventCalendar = lazy(() => import('./pages/EventCalendar'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const MemberProfile = lazy(() => import('./pages/MemberProfile'))
const ExcusalRequests = lazy(() => import('./pages/ExcusalRequests'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const StandardsDashboard = lazy(() => import('./pages/StandardsDashboard'))
const EventCreation = lazy(() => import('./pages/EventCreation'))
const MemberManagement = lazy(() => import('./pages/MemberManagement'))
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const More = lazy(() => import('./pages/More'))

function AppLoadingFallback({ message }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-card">
        <span className="loading-dot" aria-hidden="true"></span>
        <p>{message}</p>
      </div>
    </div>
  )
}

function App() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <AppLoadingFallback message="Loading authentication..." />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<AppLoadingFallback message="Loading page..." />}>
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
              path="admin/events/:eventId/edit"
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
      </Suspense>
    </BrowserRouter>
  )
}

export default App
