import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import logo from '/assets/logo.png';

function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 0,
      title: 'Inicio',
      path: '/',
      icon: '🏠'
    },
    {
      id: 1,
      title: 'Telemetría multicentros',
      path: '/centros',
      icon: '📊'
    },
    {
      id: 2,
      title: 'Interfaz conversor Blocky',
      path: 'https://yunamuno.github.io/FP_Robotik_Interface_v2/',
      icon: '🔷',
      external: true
    },
    {
      id: 3,
      title: 'Control de validación código',
      path: '/validacion',
      icon: '✓'
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img 
          src={logo} 
          alt="FP Robotic Interface Logo" 
          className="logo"
        />
        <h1 className="sidebar-title">FP Robotic Interface</h1>
        <p className="sidebar-subtitle">Colaboración Salesianos Urnieta × CIFP Repélega</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          if (item.external) {
            return (
              <a
                key={item.id}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-card"
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-title">{item.title}</span>
                <span className="external-indicator">↗</span>
              </a>
            );
          }
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => 
                `nav-card ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-title">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
