import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [glitchActive, setGlitchActive] = useState(false);
  // Duration matches the glitchFlash animation in Home.css (0.6s = 600ms)
  const GLITCH_DURATION = 600;

  const handleTitleClick = () => {
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), GLITCH_DURATION);
  };

  const nodes = [
    {
      id: 'centros',
      label: 'Centros de Telemetría',
      path: '/centros',
      position: { left: '25%', top: '25%' },
      icon: 'nodo-centros.png'
    },
    {
      id: 'conversor',
      label: 'Interfaz Blockly',
      path: '/conversor',
      position: { right: '-5%', top: '28%' },
      icon: 'nodo-blockly.png'
    },
    {
      id: 'validacion',
      label: 'Control Validación',
      path: '/validacion',
      position: { left: '16%', bottom: '-4%' },
      icon: 'nodo-validacion.png'
    },
    {
      id: 'monitor',
      label: 'Sistema de Monitoreo',
      path: '/monitor',
      position: { right: '-3%', bottom: '-3%' },
      icon: 'nodo-monitor.png'
    }
  ];

  return (
    <div 
      className={`home-space ${glitchActive ? 'glitch-effect' : ''}`}
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}assets/mockups/home-reference1.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="home-header">
        <h1 className="home-title" onClick={handleTitleClick}>
          FP ROBOTIK INTERFACE
        </h1>
        <p className="home-description">
          Plataforma de programación low-code y telemetría avanzada intercentros
        </p>
      </div>

      {nodes.map((node) => (
        <div
          key={node.id}
          className="space-node"
          onClick={() => navigate(node.path)}
          style={node.position}
        >
          <img 
            src={`${import.meta.env.BASE_URL}assets/${node.icon}`} 
            alt={node.label} 
            className="node-icon" 
          />
          <span className="node-label">{node.label}</span>
        </div>
      ))}
    </div>
  );
}

export default Home;
