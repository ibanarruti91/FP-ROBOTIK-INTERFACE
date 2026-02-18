import { useNavigate } from 'react-router-dom';
import { CENTROS } from '../config/centros';
import './Centros.css';

function Centros() {
  const navigate = useNavigate();

  const handleCentroClick = (centroId, estado, robots) => {
    if (estado === 'ONLINE') {
      // If center has robots defined, navigate to first robot
      if (robots && robots.length > 0) {
        navigate(`/telemetria/${centroId}/${robots[0].id}`);
      } else {
        // Fallback to old behavior for backward compatibility
        navigate(`/telemetria/${centroId}`);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="universal-header">
        <h1 className="universal-title">Centros con telemetría avanzada</h1>
        <p className="universal-description">Selecciona un centro para visualizar su telemetría en tiempo real</p>
      </div>
      
      <div className="centros-grid">
        {Object.entries(CENTROS).map(([id, centro]) => (
          <div
            key={id}
            className={`centro-card ${centro.estado === 'ONLINE' ? 'enabled' : 'disabled'}`}
            onClick={() => handleCentroClick(id, centro.estado, centro.robots)}
          >
            <div className="centro-header">
              <h2>{centro.nombre}</h2>
              {centro.estado === 'PROXIMAMENTE' && (
                <span className="badge-proximamente">Próximamente</span>
              )}
              {centro.estado === 'ONLINE' && (
                <span className="badge-online">
                  <span className="status-dot"></span>
                  Online
                </span>
              )}
            </div>
            
            <div className="centro-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2" y="14" width="20" height="8" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="6" r="1" fill="currentColor"/>
                <circle cx="6" cy="18" r="1" fill="currentColor"/>
                <line x1="10" y1="6" x2="18" y2="6" strokeLinecap="round"/>
                <line x1="10" y1="18" x2="18" y2="18" strokeLinecap="round"/>
              </svg>
            </div>
            
            <p className="centro-description">
              {centro.estado === 'ONLINE' 
                ? 'Haz clic para acceder a los datos de telemetría en tiempo real'
                : 'Este centro estará disponible próximamente'}
            </p>
            
            {centro.estado === 'ONLINE' && centro.robots && centro.robots.length > 0 && (
              <div className="centro-robots">
                <p className="robots-label">Robots disponibles:</p>
                {centro.robots.map((robot) => (
                  <span key={robot.id} className="robot-badge">
                    {robot.nombre} ({robot.modelo})
                  </span>
                ))}
              </div>
            )}
            
            {centro.estado === 'ONLINE' && (
              <div className="centro-arrow">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Centros;
