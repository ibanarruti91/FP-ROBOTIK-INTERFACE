/**
 * CameraWidget - Componente de visualización de cámara
 * Monitor industrial limpio con estructura interna estandarizada
 */

import './CameraWidget.css';

export function CameraWidget({ streamUrl = '', className = '' }) {
  return (
    <div className={`camera-widget nexus-card ${className}`}>
      <div className="camera-inner camera-inner--ratio">
        {streamUrl ? (
          <iframe
            src={streamUrl}
            title="Camera Feed"
            allow="autoplay; camera; microphone; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
            loading="lazy"
          />
        ) : (
          <div className="no-signal">NO SIGNAL</div>
        )}
      </div>
    </div>
  );
}
