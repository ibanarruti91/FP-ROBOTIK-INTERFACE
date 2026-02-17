import { useState } from 'react';
import { CameraModal } from '../components/CameraModal';
import './SelectorCentros.css';

function SelectorCentros() {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);

  const centros = [
    {
      id: 'salesianos-urnieta',
      nombre: 'Salesianos Urnieta',
      estado: 'online',
      cameraLabel: 'CAM_01_SALESIANOS - LIVE FEED'
    },
    {
      id: 'cifp-repelega',
      nombre: 'CIFP Repélega',
      estado: 'offline'
    },
    {
      id: 'centro-3',
      nombre: 'Centro 3',
      estado: 'offline'
    },
    {
      id: 'centro-4',
      nombre: 'Centro 4',
      estado: 'offline'
    }
  ];

  const handleCentroClick = (centro) => {
    if (centro.estado === 'online') {
      setSelectedCamera(centro.cameraLabel);
      setIsCameraModalOpen(true);
    }
  };

  return (
    <div className="selector-centros-page">
      <div className="universal-header">
        <h1 className="universal-title">Cámara en Directo Multicentros</h1>
        <p className="universal-description">Selecciona un centro para visualizar su cámara en tiempo real</p>
      </div>

      <div className="centros-grid-selector">
        {centros.map((centro) => (
          <div
            key={centro.id}
            className={`centro-card-selector ${centro.estado === 'online' ? 'online' : 'offline'}`}
            onClick={() => handleCentroClick(centro)}
          >
            <div className="card-corner top-left"></div>
            <div className="card-corner top-right"></div>
            <div className="card-corner bottom-left"></div>
            <div className="card-corner bottom-right"></div>
            
            <div className="centro-status">
              <span className={`status-indicator ${centro.estado}`}></span>
              <span className="status-text">{centro.estado === 'online' ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            <div className="centro-icon-selector">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>

            <h2 className="centro-nombre">{centro.nombre}</h2>

            {centro.estado === 'online' && (
              <div className="access-indicator">
                <span>ACCESO DISPONIBLE</span>
                <div className="access-arrow">→</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <CameraModal 
        isOpen={isCameraModalOpen} 
        onClose={() => setIsCameraModalOpen(false)}
        cameraLabel={selectedCamera || 'CAM_01_SALESIANOS - LIVE FEED'}
      />
    </div>
  );
}

export default SelectorCentros;
