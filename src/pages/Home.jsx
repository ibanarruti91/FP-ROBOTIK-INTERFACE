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

        // Calculate control points for curved path
        const dx = nodeCenterX - planetCenterX;
        const dy = nodeCenterY - planetCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Control point offset perpendicular to the line (creates curve)
        const curvature = dist * 0.15; // 15% of distance for subtle curve
        const perpX = -dy / dist * curvature;
        const perpY = dx / dist * curvature;
        
        const controlX = planetCenterX + dx / 2 + perpX;
        const controlY = planetCenterY + dy / 2 + perpY;

        return {
          id: node.id,
          x1: planetCenterX,
          y1: planetCenterY,
          x2: nodeCenterX,
          y2: nodeCenterY,
          controlX,
          controlY,
          color: node.color,
          pathLength: dist
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

      {/* SVG connection lines with particles and data stream */}
      <svg className="connection-lines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
        <defs>
          {/* Gradients for lines */}
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
          
          {/* Glow filters for enhanced effects */}
          <filter id="glow-1" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-3" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-4" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {connections.map((conn) => {
          const pathData = `M ${conn.x1} ${conn.y1} Q ${conn.controlX} ${conn.controlY} ${conn.x2} ${conn.y2}`;
          const pathId = `path-${conn.id}`;
          const particleDuration = 3 + conn.id * 0.5;
          const dataDuration = 4 + conn.id * 0.3;
          
          return (
            <g key={conn.id}>
              {/* Define the path for particles to follow */}
              <path
                id={pathId}
                d={pathData}
                fill="none"
                stroke="none"
              />
              
              {/* Main curved data line */}
              <path
                d={pathData}
                stroke={`url(#data-gradient-${conn.id})`}
                strokeWidth="2"
                fill="none"
                className={`data-link data-link-${conn.id}`}
                filter={`url(#glow-${conn.id})`}
              />
              
              {/* Animated particles traveling along the line */}
              <circle r="3" fill={conn.color} className={`particle-travel particle-travel-${conn.id}`}>
                <animateMotion
                  dur={`${particleDuration}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
              
              {/* Second particle with delay */}
              <circle r="2.5" fill={conn.color} opacity="0.7" className={`particle-travel particle-travel-${conn.id}`}>
                <animateMotion
                  dur={`${particleDuration}s`}
                  repeatCount="indefinite"
                  begin={`${particleDuration / 2}s`}
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
              
              {/* Data stream: "0" and "1" characters */}
              <text 
                fontSize="10" 
                fill={conn.color} 
                opacity="0.8"
                fontFamily="monospace"
                fontWeight="bold"
                className={`data-stream data-stream-${conn.id}`}
              >
                0
                <animateMotion
                  dur={`${dataDuration}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </text>
              
              <text 
                fontSize="10" 
                fill={conn.color} 
                opacity="0.8"
                fontFamily="monospace"
                fontWeight="bold"
                className={`data-stream data-stream-${conn.id}`}
              >
                1
                <animateMotion
                  dur={`${dataDuration}s`}
                  repeatCount="indefinite"
                  begin={`${dataDuration / 3}s`}
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </text>
              
              <text 
                fontSize="10" 
                fill={conn.color} 
                opacity="0.8"
                fontFamily="monospace"
                fontWeight="bold"
                className={`data-stream data-stream-${conn.id}`}
              >
                0
                <animateMotion
                  dur={`${dataDuration}s`}
                  repeatCount="indefinite"
                  begin={`${dataDuration * 2 / 3}s`}
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </text>
            </g>
          );
        })}
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
