import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const nodes = [
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
  ];

  return (
    <div className="home-space">
      {/* Particles background */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i % 3}`}></div>
        ))}
      </div>

      {/* Orbital rings */}
      <svg className="orbital-rings" viewBox="0 0 100 100">
        <circle className="orbit orbit-1" cx="50" cy="50" r="30" />
        <circle className="orbit orbit-2" cx="50" cy="50" r="38" />
        <circle className="orbit orbit-3" cx="50" cy="50" r="45" />
      </svg>

      {/* Central planet */}
      <div className="planet-wrapper">
        <div className="planet-glow"></div>
        <img
          src={`${import.meta.env.BASE_URL}assets/planeta-central.png`}
          alt="Planeta Central"
          className="planet-central"
        />
      </div>

      {/* Orbiting nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
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
