/**
 * CameraWidget - Componente de visualización de cámara con efecto de escaneo
 */

import './CameraWidget.css';

export function CameraWidget({ label = 'CAM_01_SALESIANOS - LIVE FEED', streamUrl = '', className = '' }) {
  // URL de stream MJPEG genérica como placeholder
  const defaultStreamUrl = 'https://via.placeholder.com/640x480/0c121e/00e5ff?text=CAMERA+STREAM';
  const actualStreamUrl = streamUrl || defaultStreamUrl;

  return (
    <div className={`camera-widget nexus-card ${className}`}>
      <div className="camera-container">
        <img 
          src={actualStreamUrl} 
          alt="Camera Feed" 
          className="camera-feed"
        />
        <div className="camera-overlay">
          <div className="overlay-text">{label}</div>
        </div>
        <div className="glow-line"></div>
      </div>
    </div>
  );
}
