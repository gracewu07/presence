import { NavLink } from 'react-router-dom'

function Navbar({ currentUser }) {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <strong>Presence</strong>
        <span>UNC AKPsi</span>
      </div>

      <nav className="navbar__nav">
        <NavLink to="/" end className="navbar__link">
          Home
        </NavLink>
        <NavLink to="/check-in" className="navbar__link">
          Check-In
        </NavLink>
        <NavLink to="/calendar" className="navbar__link">
          Calendar
        </NavLink>
        <NavLink to="/leaderboard" className="navbar__link">
          Leaderboard
        </NavLink>
        <NavLink to="/profile" className="navbar__link">
          Profile
        </NavLink>
        <NavLink to="/excusals" className="navbar__link">
          Excusals
        </NavLink>
        {currentUser.role === 'admin' && (
          <>
            <NavLink to="/admin" className="navbar__link">
              Admin
            </NavLink>
            <NavLink to="/admin/create-event" className="navbar__link">
              Create Event
            </NavLink>
            <NavLink to="/admin/members" className="navbar__link">
              Members
            </NavLink>
            <NavLink to="/admin/analytics" className="navbar__link">
              Analytics
            </NavLink>
            <NavLink to="/admin/settings" className="navbar__link">
              Settings
            </NavLink>
          </>
        )}
      </nav>

      <div className="navbar__meta">
        <span>{currentUser.name}</span>
      </div>
    </header>
  )
}

export default Navbar
