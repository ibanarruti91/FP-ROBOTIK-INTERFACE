import './Conversor.css';

function Conversor() {

  const handleOpenConverter = () => {
    window.open('https://yunamuno.github.io/FP_Robotik_Interface_v2/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Interfaz Conversor Blocky</h1>
        <div className="status-badge online">
          <span className="status-dot"></span>
          Sistema Online
        </div>
      </div>
      
      <div className="page-content">
        <div className="conversor-launcher">
          <div className="launcher-panel">
            <div className="launcher-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            
            <h2 className="launcher-title">Interfaz Conversor Blocky</h2>
            
            <p className="launcher-description">
              Herramienta de generación de código URScript y JSON para validación multi-centro.
            </p>
            
            <button className="launcher-button" onClick={handleOpenConverter}>
              <span className="button-text">Abrir Conversor</span>
              <span className="button-icon">→</span>
            </button>
            
            <p className="launcher-note">
              Se abrirá en una nueva pestaña.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Conversor;
