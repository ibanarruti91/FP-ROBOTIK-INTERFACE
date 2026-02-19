/**
 * Mini-Header de Telemetría
 * Two-zone header: left = status badges, right = program identification
 * Appears at the top of all telemetry tabs
 */

import { useState, useEffect, useRef } from 'react';
import './TelemetryMiniHeader.css';

export function TelemetryMiniHeader({ data }) {
  const [updatedFields, setUpdatedFields] = useState(new Set());
  const previousData = useRef({});

  // Track which fields have been updated for heartbeat effect
  useEffect(() => {
    if (!data) return;

    const currentData = {
      estadoRobot: data?.sistema?.estado_maquina,
      modo: data?.sistema?.modo_operacion,
      seguridad: data?.estado?.safety,
      programa: data?.programa?.nombre,
      numeroPrograma: data?.programa?.status_id,
    };

    const updated = new Set();
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
  const modo = data?.sistema?.modo_operacion || 'N/A';
  const seguridad = data?.estado?.safety || 'N/A';
  const programa = data?.programa?.nombre || 'N/A';
  const numeroProg = data?.programa?.status_id !== null && data?.programa?.status_id !== undefined
    ? data.programa.status_id
    : 'N/A';
  const getEstadoBadge = (estado) => {
    if (estado === 'POWER_ON') return 'ok';
    if (estado === 'POWER_OFF') return 'stop';
    if (estado === 'EMERGENCY_STOP') return 'error';
    return '';
  };

  const getModoBadge = (modOp) => {
    if (modOp === 'REMOTE' || modOp === 'AUTO') return 'ok';
    if (modOp === 'MANUAL') return 'stop';
    return '';
  };

  const getSeguridadBadge = (seg) => {
    if (seg === 'NORMAL') return 'ok';
    if (seg === 'REDUCED') return 'stop';
    if (seg === 'PROTECTIVE_STOP') return 'error';
    return '';
  };

  return (
    <div className="telemetry-mini-header">
      {/* Left: Status Badges */}
      <div className="header-badges">
        <div className={`status-badge badge-${getEstadoBadge(estadoRobot)} ${updatedFields.has('estadoRobot') ? 'heartbeat' : ''}`}>
          <span className="badge-label">Estado Robot</span>
          <span className="badge-value">{estadoRobot}</span>
        </div>

        <div className={`status-badge badge-${getModoBadge(modo)} ${updatedFields.has('modo') ? 'heartbeat' : ''}`}>
          <span className="badge-label">Modo Operación</span>
          <span className="badge-value">{modo}</span>
        </div>

        <div className={`status-badge badge-${getSeguridadBadge(seguridad)} ${updatedFields.has('seguridad') ? 'heartbeat' : ''}`}>
          <span className="badge-label">Seguridad</span>
          <span className="badge-value">{seguridad}</span>
        </div>
      </div>

      {/* Right: Program Identification */}
      <div className="header-identification">
        <div className={`header-id-item ${updatedFields.has('programa') ? 'heartbeat' : ''}`}>
          <span className="id-label">Nombre Programa</span>
          <span className="id-value">{programa}</span>
        </div>

        <div className={`header-id-item ${updatedFields.has('numeroPrograma') ? 'heartbeat' : ''}`}>
          <span className="id-label">N° Programa</span>
          <span className="id-value">{numeroProg}</span>
        </div>
      </div>
    </div>
  );
}
