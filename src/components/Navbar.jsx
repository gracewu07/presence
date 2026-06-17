import { NavLink } from 'react-router-dom'
import akpsiLogo from '../assets/akpsi-logo.jpg'

const memberLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/check-in', label: 'Check-In' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/progress', label: 'Progress' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/profile', label: 'Profile' },
  { to: '/excusals', label: 'Excusals' },
]

const adminLinks = [
  { to: '/admin', label: 'Admin' },
  { to: '/admin/standards', label: 'Standards' },
  { to: '/admin/create-event', label: 'Create Event' },
  { to: '/admin/members', label: 'Members' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/settings', label: 'Settings' },
]

const mobileIconPaths = {
  Home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  'Check-In': (
    <>
      <path d="M9 11.5 11.2 14 16 8.5" />
      <path d="M12 22s7-4.6 7-11.1A7 7 0 0 0 5 10.9C5 17.4 12 22 12 22Z" />
    </>
  ),
  Calendar: (
    <>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4.5 8h15" />
      <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z" />
    </>
  ),
  Profile: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  More: (
    <>
      <path d="M5 12h.01" />
      <path d="M12 12h.01" />
      <path d="M19 12h.01" />
      <path d="M4 6h16" />
      <path d="M4 18h16" />
    </>
  ),
  Admin: (
    <>
      <path d="M12 3 19 6v5.5c0 4.1-2.8 7.8-7 9.5-4.2-1.7-7-5.4-7-9.5V6l7-3Z" />
      <path d="M9.5 12.2 11.3 14l3.4-4" />
    </>
  ),
  'Sign In': (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M3 12h11" />
      <path d="m10 8 4 4-4 4" />
    </>
  ),
}

function MobileNavIcon({ label }) {
  return (
    <svg className="mobile-nav__icon" viewBox="0 0 24 24" aria-hidden="true">
      {mobileIconPaths[label] || mobileIconPaths.Home}
    </svg>
  )
}

function Navbar({ currentUser }) {
  const links = currentUser
    ? [...memberLinks, ...(currentUser.role === 'admin' ? adminLinks : [])]
    : [{ to: '/', label: 'Home', end: true }]

  const mobileLinks = currentUser
    ? [
        { to: '/', label: 'Home', end: true },
        { to: '/check-in', label: 'Check-In' },
        { to: '/calendar', label: 'Calendar' },
        { to: '/profile', label: 'Profile' },
        { to: currentUser.role === 'admin' ? '/admin' : '/more', label: currentUser.role === 'admin' ? 'Admin' : 'More' },
      ]
    : [{ to: '/login', label: 'Sign In' }]

  return (
    <>
      <header className="navbar">
        <div className="navbar__brand">
          <img src={akpsiLogo} alt="AKPsi UNC" className="navbar__logo" />
        </div>

        <nav className="navbar__nav" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="navbar__link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__meta">
          {currentUser ? (
            <span>{currentUser.name}</span>
          ) : (
            <NavLink to="/login" className="button button--primary navbar__action">
              Sign In
            </NavLink>
          )}
        </div>
      </header>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileLinks.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className="mobile-nav__link" aria-label={link.label} title={link.label}>
            <MobileNavIcon label={link.label} />
            <span className="sr-only">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default Navbar
