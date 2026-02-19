/**
 * Mini-Header de Telemetría
 * Small, elegant header showing 5 key telemetry metrics
 * Appears at the top of all telemetry tabs
 */

import { useState, useEffect, useRef } from 'react';
import './TelemetryMiniHeader.css';

export function TelemetryMiniHeader({ data }) {
  const [updatedFields, setUpdatedFields] = useState(new Set());
  const previousData = useRef({});

  // Track which fields have been updated
  useEffect(() => {
    if (!data) return;

    const updated = new Set();
    const currentData = {
      estadoRobot: data?.sistema?.estado_maquina,
      programa: data?.programa?.nombre,
      statusProg: data?.programa?.status_id,
      velocidad: data?.tcp?.speed,
      modo: data?.sistema?.modo_operacion
    };

    Object.keys(currentData).forEach(key => {
      if (previousData.current[key] !== currentData[key]) {
        updated.add(key);
      }
    });

    if (updated.size > 0) {
      setUpdatedFields(updated);
      const timer = setTimeout(() => setUpdatedFields(new Set()), 800);
      previousData.current = currentData;
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Extract values with fallbacks
  const estadoRobot = data?.sistema?.estado_maquina || 'N/A';
  const programa = data?.programa?.nombre || 'N/A';
  const statusProg = data?.programa?.status_id !== null && data?.programa?.status_id !== undefined 
    ? data.programa.status_id 
    : 'N/A';
  const velocidad = data?.tcp?.speed !== null && data?.tcp?.speed !== undefined 
    ? `${(data.tcp.speed * 100).toFixed(0)}%` 
    : 'N/A';
  const modo = data?.sistema?.modo_operacion || 'N/A';

  // Helper to determine status class for Estado Robot
  const getEstadoClass = (estado) => {
    if (estado === 'N/A') return '';
    if (estado === 'POWER_ON') return 'status-running';
    if (estado === 'POWER_OFF') return 'status-stopped';
    if (estado === 'EMERGENCY_STOP') return 'status-emergency';
    return '';
  };

  // Helper to determine status class for Status Prog
  const getStatusProgClass = (status) => {
    if (status === 'N/A') return '';
    // Assuming status_id: 1 = Running, 0 = Stopped, etc.
    if (status === 1 || status === '1') return 'status-running';
    if (status === 0 || status === '0') return 'status-stopped';
    return '';
  };

  return (
    <div className="telemetry-mini-header">
      <div className={`mini-metric ${updatedFields.has('estadoRobot') ? 'metric-flash' : ''}`}>
        <div className="mini-label">Estado Robot</div>
        <div className={`mini-value ${getEstadoClass(estadoRobot)}`}>
          {estadoRobot}
        </div>
        <div className="mini-progress-bar">
          <div className={`mini-progress-fill ${getEstadoClass(estadoRobot)}`} style={{ width: estadoRobot !== 'N/A' ? '100%' : '0%' }}></div>
        </div>
      </div>

      <div className={`mini-metric ${updatedFields.has('programa') ? 'metric-flash' : ''}`}>
        <div className="mini-label">Programa</div>
        <div className="mini-value">
          {programa}
        </div>
        <div className="mini-progress-bar">
          <div className="mini-progress-fill" style={{ width: programa !== 'N/A' ? '100%' : '0%' }}></div>
        </div>
      </div>

      <div className={`mini-metric ${updatedFields.has('statusProg') ? 'metric-flash' : ''}`}>
        <div className="mini-label">Status Prog</div>
        <div className={`mini-value ${getStatusProgClass(statusProg)}`}>
          {statusProg === 1 || statusProg === '1' ? 'Running' : statusProg === 0 || statusProg === '0' ? 'Stopped' : statusProg}
        </div>
        <div className="mini-progress-bar">
          <div className={`mini-progress-fill ${getStatusProgClass(statusProg)}`} style={{ width: statusProg !== 'N/A' ? '100%' : '0%' }}></div>
        </div>
      </div>

      <div className={`mini-metric ${updatedFields.has('velocidad') ? 'metric-flash' : ''}`}>
        <div className="mini-label">Velocidad</div>
        <div className="mini-value">
          {velocidad}
        </div>
        <div className="mini-progress-bar">
          <div className="mini-progress-fill" style={{ width: velocidad !== 'N/A' ? velocidad : '0%' }}></div>
        </div>
      </div>

      <div className={`mini-metric ${updatedFields.has('modo') ? 'metric-flash' : ''}`}>
        <div className="mini-label">Modo</div>
        <div className="mini-value">
          {modo}
        </div>
        <div className="mini-progress-bar">
          <div className="mini-progress-fill" style={{ width: modo !== 'N/A' ? '100%' : '0%' }}></div>
        </div>
      </div>
    </div>
  );
}
