import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [textPulseActive, setTextPulseActive] = useState(false);
  // Duration matches the textPulse animation in Home.css (0.6s = 600ms)
  const TEXT_PULSE_DURATION = 600;

  const handleTitleClick = () => {
    setTextPulseActive(true);
    setTimeout(() => setTextPulseActive(false), TEXT_PULSE_DURATION);
  };

  const nodes = [
    {
      id: 'centros',
      label: 'Centros de Telemetría',
      path: '/centros',
      position: { left: '15%', top: '25%' },
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
      position: { left: '16%', bottom: '0%' },
      icon: 'nodo-validacion.png'
    },
    {
      id: 'monitor',
      label: 'Sistema de Monitoreo',
      path: '/monitor',
      position: { right: '-3%', bottom: '6%' },
      icon: 'nodo-monitor.png'
    }
  ];

  return (
    <div 
      className="home-space"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}assets/mockups/home-reference1.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="home-header">
        <h1 className={`home-title ${textPulseActive ? 'text-pulse-animation' : ''}`} onClick={handleTitleClick}>
          FP ROBOTIK INTERFACE
        </h1>
        <p className="home-description">
          Plataforma de programación low-code y telemetría avanzada intercentros
        </p>
      </div>

      <div className="project-info-section">
        <div className="info-container">
          <h2 className="info-title">Acerca del Proyecto</h2>
          <p className="info-text">
            FP Robotik Interface es una plataforma integral diseñada para facilitar la programación 
            de robots mediante un entorno visual intuitivo y la gestión de telemetría en tiempo real.
          </p>
          <div className="info-features">
            <div className="feature-item">
              <span className="feature-highlight">Programación Visual:</span>
              <span> Interfaz Blockly para crear código sin necesidad de escribirlo manualmente</span>
            </div>
            <div className="feature-item">
              <span className="feature-highlight">Telemetría Avanzada:</span>
              <span> Monitorización en tiempo real de múltiples centros de operación</span>
            </div>
            <div className="feature-item">
              <span className="feature-highlight">Control de Validación:</span>
              <span> Sistema integrado para verificar y validar código generado</span>
            </div>
            <div className="feature-item">
              <span className="feature-highlight">Sistema de Monitoreo:</span>
              <span> Dashboard completo para supervisar el estado de los robots</span>
            </div>
          </div>
        </div>
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
