import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();

  // Botones que se quedan en la parte superior
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
      path: '/conversor',
      icon: '🔷'
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
      {/* HEADER: Logo y Títulos */}
      <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img 
          src={`${import.meta.env.BASE_URL}assets/logo.png`}
          alt="FP Robotic Interface Logo" 
          className="logo"
        />
        <h1 className="sidebar-title">FP Robotic Interface</h1>
        <p className="sidebar-subtitle">Colaboración Salesianos Urnieta × CIFP Repélega</p>
      </div>

      {/* NAVEGACIÓN PRINCIPAL */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
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
        ))}
      </nav>

      {/* FOOTER: Botón de Información (Separado abajo) */}
      <div className="sidebar-footer">
        <NavLink
          to="/informacion"
          className={({ isActive }) => 
            `nav-card ${isActive ? 'active' : ''}`
          }
        >
          <span className="nav-icon">ℹ️</span>
          <span className="nav-title">Sobre el proyecto</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
