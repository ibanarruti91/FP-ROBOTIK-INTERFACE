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
            allowFullScreen
          />
        ) : (
          <div className="no-signal">NO SIGNAL</div>
        )}
      </div>
    </div>
  );
}
