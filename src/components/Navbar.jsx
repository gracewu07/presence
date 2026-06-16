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
      </nav>

      <div className="navbar__meta">
        <span>{currentUser.name}</span>
        <NavLink to="/profile" className="navbar__profile-link">
          Profile
        </NavLink>
      </div>
    </header>
  )
}

export default Navbar
