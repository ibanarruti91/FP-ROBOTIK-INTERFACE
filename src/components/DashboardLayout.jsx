import { NavLink, Outlet } from 'react-router-dom'

function DashboardLayout() {
  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="branding">
            <div className="logo-placeholder">FP</div>
            <div className="brand-text">FP Robotic Interface</div>
          </div>
        </div>
        <nav className="nav-menu">
          <NavLink to="/telemetria" className="nav-link">
            Telemetría
          </NavLink>
          <NavLink to="/conversor" className="nav-link">
            Conversor
          </NavLink>
          <NavLink to="/validacion" className="nav-link">
            Validación
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </>
  )
}

export default DashboardLayout
