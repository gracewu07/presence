import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const memberMoreLinks = [
  { to: '/progress', label: 'Requirements Progress', description: 'Track chapter, service, and professional development requirements.' },
  { to: '/leaderboard', label: 'Leaderboard', description: 'See your points and placement.' },
  { to: '/excusals', label: 'Excusals', description: 'Submit or review your excusal requests.' },
  { to: '/settings', label: 'Settings', description: 'Update app and profile preferences.' },
]

const adminMoreLinks = [
  { to: '/admin', label: 'Admin Dashboard', description: 'Chapter operations overview.' },
  { to: '/admin/standards', label: 'Standards Dashboard', description: 'Attendance risk and excusal review.' },
  { to: '/admin/create-event', label: 'Create Event', description: 'Add attendance events.' },
  { to: '/admin/members', label: 'Member Management', description: 'Manage approved members.' },
  { to: '/admin/analytics', label: 'Analytics', description: 'Review engagement trends.' },
  { to: '/admin/settings', label: 'Admin Settings', description: 'Configure chapter settings.' },
]

function More() {
  const { currentUser } = useAuth()
  const links = currentUser?.role === 'admin' ? [...memberMoreLinks, ...adminMoreLinks] : memberMoreLinks

  return (
    <section className="page more-page">
      <div className="page__header">
        <div>
          <p className="eyebrow">More</p>
          <h1>Everything else</h1>
          <p className="muted">Quick access to the rest of Presence.</p>
        </div>
      </div>

      <div className="more-grid">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="card more-link-card">
            <div>
              <h3>{link.label}</h3>
              <p className="muted">{link.description}</p>
            </div>
            <span aria-hidden="true">›</span>
          </NavLink>
        ))}
      </div>
    </section>
  )
}

export default More
