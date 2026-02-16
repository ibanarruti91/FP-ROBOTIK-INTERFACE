import { useNavigate } from 'react-router-dom';
import './Conversor.css';

function Conversor() {
  const navigate = useNavigate();

  const handleOpenConverter = () => {
    window.open('https://yunamuno.github.io/FP_Robotik_Interface_v2/', '_blank', 'noopener,noreferrer');
  };

  return (
    /* Reducimos el padding superior del contenedor principal */
    <div className="page-container" style={{ paddingTop: '1rem', zoom: '0.9' }}>
      
      {/* Alineamos título y badge en la misma línea con márgenes mínimos */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Interfaz Conversor Blocky</h1>
        <div className="status-badge online" style={{ margin: 0 }}>
          <span className="status-dot"></span>
          Sistema Online
        </div>
      </div>
      
      <div className="page-content" style={{ marginTop: '0' }}>
        <div className="conversor-launcher">
          {/* Ajustamos el panel para que sea menos alto (márgenes internos más estrechos) */}
          <div className="launcher-panel" style={{ padding: '1.5rem' }}>
            <div className="launcher-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            
            <h2 className="launcher-title">Interfaz Conversor Blocky</h2>
            
            <p className="launcher-description" style={{ margin: '0.5rem 0' }}>
              Herramienta de generación de código URScript y JSON para validación multi-centro.
            </p>
            
            <button className="launcher-button" onClick={handleOpenConverter}>
              <span className="button-text">Abrir Conversor</span>
              <span className="button-icon">→</span>
            </button>
            
            <p className="launcher-note" style={{ marginTop: '0.5rem' }}>
              Se abrirá en una nueva pestaña.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Conversor;

export default Conversor;
