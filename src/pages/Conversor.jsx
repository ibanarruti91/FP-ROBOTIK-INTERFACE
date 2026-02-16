import './Conversor.css';
import BinaryBackground from '../components/BinaryBackground';

function Conversor() {

  const handleOpenConverter = () => {
    window.open('https://yunamuno.github.io/FP_Robotik_Interface_v2/', '_blank', 'noopener,noreferrer');
  };

  return (
    /* Zoom intermedio y padding superior equilibrado */
    <div className="page-container" style={{ paddingTop: '1.2rem', zoom: '0.85' }}>
      
      <div className="universal-header">
        <h1 className="universal-title">Interfaz Conversor Blocky</h1>
        <p className="universal-description">Herramienta de generación de código URScript y JSON para validación multi-centro</p>
      </div>
      
      <div className="page-content" style={{ marginTop: '0' }}>
        <div className="conversor-launcher">
          {/* Panel con padding intermedio: ni muy apretado (0.8) ni muy ancho (1.5) */}
          <div className="launcher-panel" style={{ padding: '1.2rem', maxWidth: '550px' }}>
            <BinaryBackground />
            <div className="launcher-content">
              <div className="launcher-icon" style={{ marginBottom: '0.8rem' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '45px' }}>
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              
              <h2 className="launcher-title" style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>Interfaz Conversor Blocky</h2>
              
              <p className="launcher-description" style={{ margin: '0 0 1.2rem 0', fontSize: '1rem', lineHeight: '1.4' }}>
                Herramienta de generación de código URScript y JSON para validación multi-centro.
              </p>
              
              <button className="launcher-button" onClick={handleOpenConverter} style={{ padding: '0.75rem 1.2rem' }}>
                <span className="button-text">Abrir Conversor</span>
                <span className="button-icon">→</span>
              </button>
              
              <p className="launcher-note" style={{ marginTop: '0.8rem', fontSize: '0.8rem', opacity: 0.7 }}>
                Se abrirá en una nueva pestaña.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Conversor;