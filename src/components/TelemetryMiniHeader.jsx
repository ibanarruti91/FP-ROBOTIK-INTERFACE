/**
 * Mini-Header de Telemetría - Compact header for robot telemetry
 * Displays safety status, program info, robot info, and diagnostics
 */

import { useState, useEffect } from 'react';
import { useMqttStatus } from '../hooks/useMqttStatus';
import './TelemetryMiniHeader.css';

function TelemetryMiniHeader({ telemetry }) {
  const { status: connectionStatus, lastMessageTime } = useMqttStatus();
  const [latency, setLatency] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for the clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate latency when last message time changes
  useEffect(() => {
    if (lastMessageTime) {
      const timeSinceLastMessage = Date.now() - lastMessageTime;
      setLatency(timeSinceLastMessage);
    }
  }, [lastMessageTime, currentTime]);

  const isOnline = connectionStatus === 'ONLINE';

  // Extract safety status from telemetry
  const getSafetyStatus = () => {
    if (!isOnline || !telemetry) return 'OFFLINE';
    
    const estadoMaquina = telemetry?.sistema?.estado_maquina;
    
    if (estadoMaquina === 'EMERGENCY_STOP') {
      return 'EMERGENCY_STOP';
    } else if (estadoMaquina === 'PROTECTIVE_STOP') {
      return 'PROTECTIVE_STOP';
    } else if (estadoMaquina === 'POWER_ON') {
      return 'OK';
    }
    
    return 'OK'; // Default to OK if no specific status
  };

  const safetyStatus = getSafetyStatus();

  // Extract program info
  const programName = isOnline && telemetry?.programa?.nombre 
    ? telemetry.programa.nombre 
    : 'N/A';
  
  const programStatusId = telemetry?.programa?.status_id;
  let programStatus = 'N/A';
  if (isOnline && programStatusId !== null && programStatusId !== undefined) {
    // Check if it's a simple status (0, 1, 2) or a complex status code
    if (programStatusId === 1) {
      programStatus = 'Running';
    } else if (programStatusId === 2) {
      programStatus = 'Paused';
    } else if (programStatusId === 0) {
      programStatus = 'Stopped';
    } else if (programStatusId > 100) {
      // Complex status code - interpret as running if it's a large positive number
      programStatus = 'Running';
    } else {
      programStatus = `Status ${programStatusId}`;
    }
  }

  // Extract robot info
  const speedPercentage = isOnline && telemetry?.sistema?.velocidad_general !== undefined
    ? telemetry.sistema.velocidad_general
    : null;
  
  const controlMode = isOnline && telemetry?.sistema?.modo_operacion
    ? telemetry.sistema.modo_operacion
    : 'N/A';

  // Format latency for display
  const formatLatency = () => {
    if (!isOnline || latency === null) return 'N/A';
    
    if (latency < 1000) {
      return `${latency}ms`;
    } else {
      return `Hace ${(latency / 1000).toFixed(1)}s`;
    }
  };

  // Format last message time
  const formatLastMessageTime = () => {
    if (!isOnline || !lastMessageTime) return '--:--:--';
    
    const date = new Date(lastMessageTime);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className={`telemetry-mini-header ${!isOnline ? 'offline' : ''}`}>
      {/* Safety Badges Section */}
      <div className="mini-header-section safety-section">
        <div className={`safety-badge ${safetyStatus.toLowerCase().replace('_', '-')}`}>
          <span className="safety-badge-label">SEGURIDAD:</span>
          <span className="safety-badge-value">
            {safetyStatus === 'OK' && 'OK'}
            {safetyStatus === 'PROTECTIVE_STOP' && 'PROTECTIVE STOP'}
            {safetyStatus === 'EMERGENCY_STOP' && 'EMERGENCY STOP'}
            {safetyStatus === 'OFFLINE' && 'SIN CONEXIÓN'}
          </span>
        </div>
      </div>

      {/* Process Info Section */}
      <div className="mini-header-section process-section">
        <div className="info-item">
          <span className="info-label">Programa:</span>
          <span className="info-value">{programName}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Estado:</span>
          <span className={`info-value status-${programStatus.toLowerCase()}`}>
            {programStatus}
          </span>
        </div>
      </div>

      {/* Robot Info Section */}
      <div className="mini-header-section robot-section">
        <div className="info-item">
          <span className="info-label">Velocidad:</span>
          <span className="info-value">
            {speedPercentage !== null ? `${speedPercentage}%` : 'N/A'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Modo:</span>
          <span className="info-value">{controlMode}</span>
        </div>
      </div>

      {/* Diagnostics Section */}
      <div className="mini-header-section diagnostics-section">
        <div className="info-item">
          <span className="info-label">LINK:</span>
          <span className={`info-value link-status ${isOnline ? 'online' : 'offline'}`}>
            <span className="status-circle"></span>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">LATENCIA:</span>
          <span className="info-value">{formatLatency()}</span>
        </div>
        <div className="info-item">
          <span className="info-label">HORA:</span>
          <span className="info-value">{formatLastMessageTime()}</span>
        </div>
      </div>
    </div>
  );
}

export default TelemetryMiniHeader;
