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
      id: 'centros',
      label: 'Centros de Telemetría',
      path: '/centros',
      x: 22,
      y: 30,
      icon: 'nodo-centros.png',
      color: '#00e5ff'
    },
    {
      id: 'conversor',
      label: 'Interfaz Blockly',
      path: '/conversor',
      x: 78,
      y: 30,
      icon: 'nodo-blockly.png',
      color: '#a855f7'
    },
    {
      id: 'validacion',
      label: 'Control Validación',
      path: '/validacion',
      x: 22,
      y: 70,
      icon: 'nodo-validacion.png',
      color: '#ff33bb'
    },
    {
      id: 'monitor',
      label: 'Sistema de Monitoreo',
      path: '/monitor',
      x: 78,
      y: 70,
      icon: 'nodo-monitor.png',
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
    <div 
      className="home-space" 
      ref={rootRef}
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}assets/mockups/home-reference1.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <div className="home-header">
        <h1 className="home-title">FP ROBOTIC INTERFACE</h1>
        <p className="home-subtitle">Sistema de centralización de telemetría y programación low-code intercentros</p>
      </div>

      {/* Dynamic orbital overlay */}
      <div className="home-overlay">
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
            className="space-node"
            onClick={() => navigate(node.path)}
            style={{ 
              '--node-color': node.color,
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="node-halo"></div>
            <div className="node-image-wrapper">
              <img 
                src={`${import.meta.env.BASE_URL}assets/${node.icon}`} 
                alt={node.label} 
                className="node-image" 
              />
            </div>
            <div className="node-label">
              <span className="node-title">{node.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
