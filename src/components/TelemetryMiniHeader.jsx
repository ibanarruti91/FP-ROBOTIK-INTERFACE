/**
 * Mini-Header de Telemetría
 * Two-zone header: left = status badges, right = program identification
 * Appears at the top of all telemetry tabs
 *
 * Color mapping:
 *   Seguridad  – NORMAL→green, PROTECTIVE_STOP→amber-blink, EMERGENCY_STOP→red-pulse, RECOVERY→yellow
 *   Robot      – POWER_ON→cyan, POWER_OFF→gray, IDLE→blue, BOOTING→cyan-fade
 *   Ejecución  – PLAYING/RUNNING→green-cyan, PAUSED→amber, STOPPED→matte-red
 *   Modo       – REMOTE/AUTO→purple, LOCAL/TEACH→electric-blue
 */

import { useState, useEffect, useRef } from 'react';
import './TelemetryMiniHeader.css';

// ── Color-class resolvers ──────────────────────────────────────────────────

function getSeguridadClass(seg) {
  switch (seg) {
    case 'NORMAL':
    case 'OK':
      return 'badge-normal';
    case 'REDUCED':
      return 'badge-reduced';
    case 'PROTECTIVE_STOP':
      return 'badge-protective-stop';
    case 'RECOVERY':
      return 'badge-recovery';
    case 'EMERGENCY_STOP':
      return 'badge-emergency';
    case 'VIOLATION':
      return 'badge-violation';
    case 'FAULT':
      return 'badge-fault';
    case 'UNKNOWN':
      return 'badge-unknown';
    default:
      return '';
  }
}

function getEstadoRobotClass(estado) {
  switch (estado) {
    case 'POWER_ON':
      return 'badge-power-on';
    case 'POWER_OFF':
      return 'badge-power-off';
    case 'IDLE':
      return 'badge-idle';
    case 'BOOTING':
      return 'badge-booting';
    case 'RUNNING':
      return 'badge-running';
    case 'EMERGENCY_STOP':
      return 'badge-emergency';
    case 'UNKNOWN':
      return 'badge-unknown';
    default:
      return '';
  }
}

function getEjecucionClass(est) {
  switch (est) {
    case 'PLAYING':
    case 'RUNNING':
      return 'badge-running';
    case 'PAUSED':
      return 'badge-paused';
    case 'STOPPED':
      return 'badge-stopped';
    case 'UNKNOWN':
      return 'badge-unknown';
    default:
      return '';
  }
}

function getModoClass(modOp) {
  switch (modOp) {
    case 'REMOTE':
    case 'AUTO':
      return 'badge-remote';
    case 'LOCAL':
    case 'TEACH':
      return 'badge-local';
    case 'UNKNOWN':
      return 'badge-unknown';
    default:
      return '';
  }
}

// ── Component ──────────────────────────────────────────────────────────────

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
      ejecucion: data?.programa?.estado,
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
      previousData.current = currentData;
      let clearTimer = null;
      const flashTimer = setTimeout(() => {
        setUpdatedFields(updated);
        clearTimer = setTimeout(() => setUpdatedFields(new Set()), 200);
      }, 0);
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [data]);

  // Extract values with fallbacks
  const estadoRobot = data?.sistema?.estado_maquina || 'N/A';
  const modo = data?.sistema?.modo_operacion || 'N/A';
  const seguridad = data?.estado?.safety || 'N/A';
  const ejecucion = data?.programa?.estado || 'N/A';
  const programa = data?.programa?.nombre || 'N/A';
  const numeroProg = data?.programa?.status_id !== null && data?.programa?.status_id !== undefined
    ? data.programa.status_id
    : 'N/A';

  // Human-readable labels for execution state
  const ejecucionLabel = {
    PLAYING: 'EN EJECUCIÓN',
    RUNNING: 'EN EJECUCIÓN',
    PAUSED: 'PAUSADO',
    STOPPED: 'DETENIDO',
  }[ejecucion] || ejecucion;

  return (
    <div className="telemetry-mini-header">
      {/* Left: Status Badges */}
      <div className="header-badges">
        {/* SEGURIDAD – máxima prioridad visual */}
        <div className={`status-badge ${getSeguridadClass(seguridad)} ${updatedFields.has('seguridad') ? 'update-flash' : ''}`}>
          <span className="badge-label">Seguridad</span>
          <span className="badge-value">{seguridad}</span>
        </div>

        {/* ESTADO ROBOT */}
        <div className={`status-badge ${getEstadoRobotClass(estadoRobot)} ${updatedFields.has('estadoRobot') ? 'update-flash' : ''}`}>
          <span className="badge-label">Estado Robot</span>
          <span className="badge-value">{estadoRobot}</span>
        </div>

        {/* ESTADO EJECUCIÓN */}
        <div className={`status-badge ${getEjecucionClass(ejecucion)} ${updatedFields.has('ejecucion') ? 'update-flash' : ''}`}>
          <span className="badge-label">Ejecución</span>
          <span className="badge-value">{ejecucionLabel}</span>
        </div>

        {/* MODO OPERACIÓN */}
        <div className={`status-badge ${getModoClass(modo)} ${updatedFields.has('modo') ? 'update-flash' : ''}`}>
          <span className="badge-label">Modo Operación</span>
          <span className="badge-value">{modo}</span>
        </div>
      </div>

      {/* Right: Program Identification */}
      <div className="header-identification">
        <div className={`header-id-item ${updatedFields.has('programa') ? 'update-flash' : ''}`}>
          <span className="id-label">Nombre Programa</span>
          <span className="id-value id-program-name">{programa}</span>
        </div>

        <div className={`header-id-item header-id-num ${updatedFields.has('numeroPrograma') ? 'update-flash' : ''}`}>
          <span className="id-label">ID Estado</span>
          <span className="id-value">{numeroProg}</span>
        </div>
      </div>
    </div>
  );
}
