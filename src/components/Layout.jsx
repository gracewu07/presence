import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

function Layout({ currentUser }) {
  return (
    <div className="app-shell">
      <Navbar currentUser={currentUser} />
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
