/**
 * CameraWidget - Componente de visualización de cámara
 * Monitor industrial limpio con estructura interna estandarizada
 */

import { useState } from 'react';
import './CameraWidget.css';

export function CameraWidget({ streamUrl = '', className = '' }) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  const handleLoad = () => {
    setHasError(false);
  };

  return (
    <div className={`camera-widget nexus-card ${className}`}>
      <div className="camera-inner camera-inner--ratio">
        {streamUrl && !hasError ? (
          <img 
            src={streamUrl} 
            alt="Camera Feed" 
            onError={handleError}
            onLoad={handleLoad}
          />
        ) : (
          <div className="no-signal">NO SIGNAL</div>
        )}
      </div>
    </div>
  );
}
