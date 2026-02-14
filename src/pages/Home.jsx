import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const nodes = [
    {
      id: 1,
      title: 'Telemetría avanzadas centros',
      position: 'node-1',
      path: '/telemetria',
      color: '#00e5ff',
      icon: 'chart'
    },
    {
      id: 2,
      title: 'Interfaz Conversor Blocky',
      position: 'node-2',
      path: 'https://yunamuno.github.io/FP_Robotik_Interface_v2/',
      color: '#a855f7',
      external: true,
      icon: 'blocks'
    },
    {
      id: 3,
      title: 'Control de validación código',
      position: 'node-3',
      path: '/validacion',
      color: '#ff33bb',
      icon: 'check'
    }
  ];

  const handleNodeClick = (node) => {
    if (node.external) {
      window.open(node.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(node.path);
    }
  };

  const renderIcon = (iconType, color) => {
    switch(iconType) {
      case 'chart':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M3 3v18h18M7 16V8m4 8V5m4 11v-4m4 4v-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'blocks':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'check':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="home">
      <svg className="connection-lines" width="100%" height="100%">
        <defs>
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff33bb" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff33bb" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        
        {/* Lines from planet to nodes - adjusted for new positions */}
        <line className="connection-line" x1="50%" y1="50%" x2="25%" y2="35%" stroke="url(#lineGradient1)" strokeWidth="2" />
        <line className="connection-line" x1="50%" y1="50%" x2="75%" y2="25%" stroke="url(#lineGradient2)" strokeWidth="2" />
        <line className="connection-line" x1="50%" y1="50%" x2="55%" y2="78%" stroke="url(#lineGradient3)" strokeWidth="2" />
        
        {/* Binary text along lines with low opacity */}
        <text className="binary-text" x="35%" y="42%" fill="#00e5ff" opacity="0.15" fontSize="11">101010</text>
        <text className="binary-text" x="62%" y="37%" fill="#a855f7" opacity="0.15" fontSize="11">110110</text>
        <text className="binary-text" x="52%" y="64%" fill="#ff33bb" opacity="0.15" fontSize="11">101101</text>
        <text className="binary-text" x="38%" y="50%" fill="#00e5ff" opacity="0.12" fontSize="9">11001</text>
        <text className="binary-text" x="65%" y="45%" fill="#a855f7" opacity="0.12" fontSize="9">01010</text>
      </svg>

      <div className="planet-container">
        <div className="planet">
          {/* Circuit pattern background */}
          <svg className="circuit-pattern" viewBox="0 0 100 100">
            <defs>
              <pattern id="circuit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M0 10h5M15 10h5M10 0v5M10 15v5" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3"/>
                <circle cx="10" cy="10" r="1" fill="#00e5ff" opacity="0.4"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#circuit)"/>
          </svg>
          
          {/* Server rack icon in center */}
          <svg className="server-icon" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5">
            <rect x="2" y="2" width="20" height="6" rx="2" opacity="0.6"/>
            <rect x="2" y="10" width="20" height="6" rx="2" opacity="0.5"/>
            <rect x="2" y="18" width="20" height="4" rx="2" opacity="0.4"/>
            <circle cx="6" cy="5" r="0.5" fill="#00e5ff"/>
            <circle cx="6" cy="13" r="0.5" fill="#00e5ff"/>
            <circle cx="6" cy="20" r="0.5" fill="#00e5ff"/>
          </svg>
          
          <div className="planet-core"></div>
          <div className="planet-ring planet-ring-1"></div>
          <div className="planet-ring planet-ring-2"></div>
          <div className="planet-ring planet-ring-3"></div>
          <div className="planet-glow"></div>
          <div className="planet-halo"></div>
        </div>
      </div>

      {nodes.map((node) => (
        <div
          key={node.id}
          className={`orbital-node ${node.position}`}
          onClick={() => handleNodeClick(node)}
          style={{ '--node-color': node.color }}
        >
          <div className="node-card">
            <div className="node-icon">
              {renderIcon(node.icon, node.color)}
            </div>
            <span className="node-title">{node.title}</span>
            {node.external && <span className="external-badge">↗</span>}
          </div>
          <div className="node-glow" style={{ backgroundColor: node.color }}></div>
        </div>
      ))}
    </div>
  );
}

export default Home;
