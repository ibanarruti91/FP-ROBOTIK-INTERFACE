import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState, useMemo } from 'react';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const planetRef = useRef(null);
  const nodeRefs = useRef({});
  const [connections, setConnections] = useState([]);

  const nodes = useMemo(() => [
    {
      id: 1,
      title: 'Centros de Telemetría',
      image: `${import.meta.env.BASE_URL}assets/nodo-centros.png`,
      position: 'node-1',
      path: '/centros',
      color: '#00e5ff'
    },
    {
      id: 2,
      title: 'Conversor Blockly',
      image: `${import.meta.env.BASE_URL}assets/nodo-blockly.png`,
      position: 'node-2',
      path: '/conversor',
      color: '#a855f7'
    },
    {
      id: 3,
      title: 'Validación de Código',
      image: `${import.meta.env.BASE_URL}assets/nodo-validacion.png`,
      position: 'node-3',
      path: '/validacion',
      color: '#ff33bb'
    },
    {
      id: 4,
      title: 'Monitor del Sistema',
      image: `${import.meta.env.BASE_URL}assets/nodo-monitor.png`,
      position: 'node-4',
      path: '/monitor',
      color: '#10b981'
    }
  ], []);

  // Calculate connection lines between planet and nodes
  useEffect(() => {
    const updateConnections = () => {
      if (!planetRef.current || !rootRef.current) return;

      const planetRect = planetRef.current.getBoundingClientRect();
      const rootRect = rootRef.current.getBoundingClientRect();

      const planetCenterX = planetRect.left + planetRect.width / 2 - rootRect.left;
      const planetCenterY = planetRect.top + planetRect.height / 2 - rootRect.top;

      const newConnections = nodes.map((node) => {
        const nodeEl = nodeRefs.current[node.id];
        if (!nodeEl) return null;

        const nodeRect = nodeEl.getBoundingClientRect();
        const nodeCenterX = nodeRect.left + nodeRect.width / 2 - rootRect.left;
        const nodeCenterY = nodeRect.top + nodeRect.height / 2 - rootRect.top;

        return {
          id: node.id,
          x1: planetCenterX,
          y1: planetCenterY,
          x2: nodeCenterX,
          y2: nodeCenterY,
          color: node.color
        };
      }).filter(Boolean);

      setConnections(newConnections);
    };

    updateConnections();
    window.addEventListener('resize', updateConnections);
    return () => window.removeEventListener('resize', updateConnections);
  }, [nodes]);

  return (
    <div className="home-space" ref={rootRef}>
      {/* Header */}
      <div className="home-header">
        <h1 className="home-title">FP ROBOTIC INTERFACE</h1>
        <p className="home-subtitle">Sistema de centralización de telemetría y programación low-code intercentros</p>
      </div>

      {/* Particles background */}
      <div className="particles">
        {[...Array(30)].map((_, i) => (
          <div key={i} className={`particle particle-${i % 3}`}></div>
        ))}
      </div>

      {/* Traveling particles on orbits */}
      <div className="orbit-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`orbit-particle orbit-particle-${i % 3}`}></div>
        ))}
      </div>

      {/* Orbital rings */}
      <svg className="orbital-rings" viewBox="0 0 100 100">
        <circle className="orbit orbit-1" cx="50" cy="50" r="30" />
        <circle className="orbit orbit-2" cx="50" cy="50" r="38" />
        <circle className="orbit orbit-3" cx="50" cy="50" r="45" />
      </svg>

      {/* Central planet */}
      <div className="planet-wrapper" ref={planetRef}>
        <div className="planet-glow"></div>
        <img
          src={`${import.meta.env.BASE_URL}assets/planeta-central.png`}
          alt="Planeta Central"
          className="planet-central"
        />
      </div>

      {/* SVG connection lines */}
      <svg className="connection-lines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
        <defs>
          <linearGradient id="data-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 229, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(0, 229, 255, 0.2)" />
          </linearGradient>
          <linearGradient id="data-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(168, 85, 247, 0.6)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.2)" />
          </linearGradient>
          <linearGradient id="data-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 51, 187, 0.6)" />
            <stop offset="100%" stopColor="rgba(255, 51, 187, 0.2)" />
          </linearGradient>
          <linearGradient id="data-gradient-4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.2)" />
          </linearGradient>
        </defs>
        {connections.map((conn) => (
          <g key={conn.id}>
            <line
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke={`url(#data-gradient-${conn.id})`}
              strokeWidth="2"
              strokeDasharray="8 4"
              className={`data-link data-link-${conn.id}`}
              style={{ opacity: 0.7 }}
            />
          </g>
        ))}
      </svg>

      {/* Orbiting nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          ref={(el) => (nodeRefs.current[node.id] = el)}
          className={`space-node ${node.position}`}
          onClick={() => navigate(node.path)}
          style={{ '--node-color': node.color }}
        >
          <div className="node-halo"></div>
          <div className="node-image-wrapper">
            <img src={node.image} alt={node.title} className="node-image" />
          </div>
          <div className="node-label">
            <span className="node-title">{node.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Home;
