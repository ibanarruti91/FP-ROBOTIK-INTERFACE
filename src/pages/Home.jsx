import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const nodes = [
    {
      id: 1,
      title: 'Telemetría avanzadas centros',
      position: 'top-left',
      path: '/telemetria',
      color: '#00e5ff'
    },
    {
      id: 2,
      title: 'Interfaz conversor Blocky',
      position: 'top-right',
      path: 'https://yunamuno.github.io/FP_Robotik_Interface_v2/',
      color: '#a855f7',
      external: true
    },
    {
      id: 3,
      title: 'Control de validación código',
      position: 'bottom-center',
      path: '/validacion',
      color: '#ff33bb'
    }
  ];

  const handleNodeClick = (node) => {
    if (node.external) {
      window.open(node.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(node.path);
    }
  };

  return (
    <div className="home">
      <svg className="connection-lines" width="100%" height="100%">
        <defs>
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff33bb" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff33bb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Lines from planet to nodes */}
        <line className="connection-line" x1="50%" y1="50%" x2="30%" y2="30%" stroke="url(#lineGradient1)" strokeWidth="2" />
        <line className="connection-line" x1="50%" y1="50%" x2="70%" y2="30%" stroke="url(#lineGradient2)" strokeWidth="2" />
        <line className="connection-line" x1="50%" y1="50%" x2="50%" y2="75%" stroke="url(#lineGradient3)" strokeWidth="2" />
        
        {/* Lines between nodes */}
        <line className="connection-line" x1="30%" y1="30%" x2="70%" y2="30%" stroke="url(#lineGradient1)" strokeWidth="1.5" />
        <line className="connection-line" x1="70%" y1="30%" x2="50%" y2="75%" stroke="url(#lineGradient2)" strokeWidth="1.5" />
        <line className="connection-line" x1="50%" y1="75%" x2="30%" y2="30%" stroke="url(#lineGradient3)" strokeWidth="1.5" />
        
        {/* Binary text along lines */}
        <text className="binary-text" x="40%" y="40%" fill="#00e5ff" opacity="0.2" fontSize="10">101010</text>
        <text className="binary-text" x="60%" y="40%" fill="#a855f7" opacity="0.2" fontSize="10">110110</text>
        <text className="binary-text" x="50%" y="62%" fill="#ff33bb" opacity="0.2" fontSize="10">101101</text>
      </svg>

      <div className="planet-container">
        <div className="planet">
          <div className="planet-core"></div>
          <div className="planet-ring planet-ring-1"></div>
          <div className="planet-ring planet-ring-2"></div>
          <div className="planet-ring planet-ring-3"></div>
          <div className="planet-glow"></div>
        </div>
      </div>

      {nodes.map((node) => (
        <div
          key={node.id}
          className={`orbital-node ${node.position}`}
          onClick={() => handleNodeClick(node)}
          style={{ '--node-color': node.color }}
        >
          <div className="hexagon">
            <div className="hexagon-inner">
              <span className="node-title">{node.title}</span>
            </div>
          </div>
          <div className="node-glow" style={{ backgroundColor: node.color }}></div>
        </div>
      ))}
    </div>
  );
}

export default Home;
