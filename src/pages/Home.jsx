import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState, useMemo } from 'react';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const nodeRefs = useRef({});
  const [connections, setConnections] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);

  const nodes = useMemo(() => [
    {
      id: 'centros',
      label: 'Centros de Telemetría',
      path: '/centros',
      position: { left: '20%', top: '25%' },
      icon: 'nodo-centros.png',
      color: '#00f2ff'
    },
    {
      id: 'conversor',
      label: 'Interfaz Blockly',
      path: '/conversor',
      position: { right: '20%', top: '25%' },
      icon: 'nodo-blockly.png',
      color: '#00f2ff'
    },
    {
      id: 'validacion',
      label: 'Control Validación',
      path: '/validacion',
      position: { left: '20%', bottom: '25%' },
      icon: 'nodo-validacion.png',
      color: '#00f2ff'
    },
    {
      id: 'monitor',
      label: 'Sistema de Monitoreo',
      path: '/monitor',
      position: { right: '20%', bottom: '25%' },
      icon: 'nodo-monitor.png',
      color: '#00f2ff'
    }
  ], []);

  // Calculate connection lines from planet center to nodes
  useEffect(() => {
    const updateConnections = () => {
      if (!rootRef.current) return;

      const rootRect = rootRef.current.getBoundingClientRect();
      
      // Planet center is at 50%, 52% of the viewport (adjusted for mockup alignment)
      const planetCenterX = rootRect.width * 0.5;
      const planetCenterY = rootRect.height * 0.52;

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

      {/* SVG Nexus - Connection lines with animated data flow */}
      <svg className="svg-nexus" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
        <defs>
          {nodes.map((node) => (
            <linearGradient key={`gradient-${node.id}`} id={`gradient-${node.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={node.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={node.color} stopOpacity="0.2" />
            </linearGradient>
          ))}
        </defs>
        {connections.map((conn) => (
          <line
            key={conn.id}
            x1={conn.x1}
            y1={conn.y1}
            x2={conn.x2}
            y2={conn.y2}
            stroke={`url(#gradient-${conn.id})`}
            strokeWidth="2"
            strokeDasharray="8 4"
            className={`nexus-line ${hoveredNode === conn.id ? 'nexus-line-active' : ''}`}
          />
        ))}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          ref={(el) => (nodeRefs.current[node.id] = el)}
          className="space-node"
          onClick={() => navigate(node.path)}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ 
            ...node.position,
            '--node-color': node.color
          }}
        >
          <div className="node-circle">
            <img 
              src={`${import.meta.env.BASE_URL}assets/${node.icon}`} 
              alt={node.label} 
              className="node-icon" 
            />
          </div>
          <div className="node-label">
            <span className="node-text">{node.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Home;
