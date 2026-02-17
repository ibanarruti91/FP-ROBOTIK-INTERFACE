/**
 * CameraModal - Modal para visualizar el feed de la cámara
 */

import { CameraWidget } from './CameraWidget';
import './CameraModal.css';

export function CameraModal({ isOpen, onClose, cameraLabel = 'CAM_01_SALESIANOS - LIVE FEED', streamUrl = '' }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="camera-modal-backdrop" onClick={handleBackdropClick}>
      <div className="camera-modal-content">
        <button className="camera-modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <div className="camera-modal-header">
          <h2 className="camera-modal-title">Cámara en Directo Multicentros</h2>
          <p className="camera-modal-subtitle">Vigilancia en tiempo real</p>
        </div>
        <div className="camera-modal-body">
          <CameraWidget label={cameraLabel} streamUrl={streamUrl} />
        </div>
      </div>
    </div>
  );
}
