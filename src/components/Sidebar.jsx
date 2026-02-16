import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

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
      path: '/centros', // Unificado con el panel principal
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
      {/* HEADER: Ajustado para que no tenga huecos entre elementos */}
      <div 
        className="sidebar-header" 
        onClick={() => navigate('/')} 
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '0px' // Elimina el espacio automático de flex
        }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}assets/logo.png`}
          alt="FP Robotic Interface Logo" 
          className="logo"
          style={{ 
            height: '240px',      // Logo mucho más grande
            width: 'auto', 
            marginBottom: '-25px', // "Succiona" el texto hacia arriba
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.4))'
          }}
        />
        <h1 
          className="sidebar-title" 
          style={{ 
            marginTop: '0px', 
            paddingTop: '0px', 
            lineHeight: '1',      // Quita el espacio extra del texto
            zIndex: '2' 
          }}
        >
          FP Robotic Interface
        </h1>
        <p 
          className="sidebar-subtitle" 
          style={{ 
            marginTop: '5px', 
            opacity: '0.7', 
            fontSize: '0.7rem' 
          }}
        >
          Colaboración Salesianos Urnieta × CIFP Repélega
        </p>
      </div>

      {/* NAVEGACIÓN: Se mantiene funcional */}
      <nav className="sidebar-nav" style={{ marginTop: '10px' }}>
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
