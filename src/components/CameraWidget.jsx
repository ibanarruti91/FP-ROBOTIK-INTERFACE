/**
 * CameraWidget - Componente de visualización de cámara
 * Monitor industrial limpio con estructura interna estandarizada
 */

import { useState } from 'react';
import './CameraWidget.css';

export function CameraWidget({ streamUrl = '', className = '' }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className={`camera-widget nexus-card ${className}`}>
      <div className="camera-inner camera-inner--ratio">
        <div className="camera-standby camera-placeholder">
          <span className="standby-main">📡 ESPERANDO SEÑAL DE VÍDEO...</span>
          <span className="standby-id">Sin conexión desde el centro.</span>
        </div>
        {streamUrl && (
          <iframe
            src={streamUrl}
            title="Camera Feed"
            allow="autoplay; camera; microphone; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.5s ease', background: 'transparent' }}
            loading="lazy"
            onLoad={() => setIframeLoaded(true)}
          />
        )}
      </div>
    </div>
  );
}
