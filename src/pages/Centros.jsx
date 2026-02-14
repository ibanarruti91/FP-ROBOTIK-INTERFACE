import { useNavigate } from 'react-router-dom';
import { CENTROS } from '../config/centros';
import './Centros.css';

function Centros() {
  const navigate = useNavigate();

  const handleCentroClick = (centroId, estado) => {
    if (estado === 'ONLINE') {
      navigate(`/telemetria/${centroId}`);
    }
  };

  return (
    <div className="page-container">
      <button className="back-button" onClick={() => navigate('/')} aria-label="Volver al inicio">
        ← Volver
      </button>
      
      <div className="page-header">
        <h1 className="page-title">Centros con telemetría avanzada</h1>
        <p className="page-description">
          Selecciona un centro para visualizar su telemetría en tiempo real
        </p>
      </div>
      
      <div className="centros-grid">
        {Object.entries(CENTROS).map(([id, centro]) => (
          <div
            key={id}
            className={`centro-card ${centro.estado === 'ONLINE' ? 'enabled' : 'disabled'}`}
            onClick={() => handleCentroClick(id, centro.estado)}
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
