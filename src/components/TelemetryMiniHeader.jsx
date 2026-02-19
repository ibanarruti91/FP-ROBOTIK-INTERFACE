/**
 * Mini-Header de Telemetría
 * Two-zone header: left = status badges, right = program identification
 * Appears at the top of all telemetry tabs
 */

import { useState, useEffect, useRef } from 'react';
import './TelemetryMiniHeader.css';

/** Highlight the .urp (or any) file extension inside a program name */
function ProgramName({ name }) {
  if (!name || name === 'N/A') return <span>{name || 'N/A'}</span>;
  const dotIdx = name.lastIndexOf('.');
  if (dotIdx < 0) return <span>{name}</span>;
  return (
    <>
      <span>{name.slice(0, dotIdx)}</span>
      <span className="urp-highlight">{name.slice(dotIdx)}</span>
    </>
  );
}

export function TelemetryMiniHeader({ data }) {
  const [heartbeat, setHeartbeat] = useState(false);
  const previousData = useRef({});

  // Global heartbeat: any field change → all badges flash simultaneously
  useEffect(() => {
    if (!data) return;

    const snapshot = {
      estadoRobot: data?.sistema?.estado_maquina,
      modo: data?.sistema?.modo_operacion,
      seguridad: data?.estado?.safety,
      programa: data?.programa?.nombre,
      programaEstado: data?.programa?.estado,
      numeroPrograma: data?.programa?.status_id,
    };

    const hasChanged = Object.keys(snapshot).some(
      (k) => previousData.current[k] !== snapshot[k]
    );

    if (hasChanged) {
      previousData.current = snapshot;
      setHeartbeat(true);
      const timer = setTimeout(() => setHeartbeat(false), 800);
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Extract values with fallbacks
  const estadoRobot = data?.sistema?.estado_maquina || 'N/A';
  const modo = data?.sistema?.modo_operacion || 'N/A';
  const seguridad = data?.estado?.safety || 'N/A';
  const programa = data?.programa?.nombre || 'N/A';
  const numeroProg =
    data?.programa?.status_id !== null && data?.programa?.status_id !== undefined
      ? data.programa.status_id
      : 'N/A';
  const programaEstado = data?.programa?.estado || null;

  // ── Badge colour helpers ──────────────────────────────────────────────────

  const getEstadoBadge = (estado) => {
    if (estado === 'POWER_ON') return 'estado-on';
    if (estado === 'POWER_OFF') return 'stop';
    if (estado === 'EMERGENCY_STOP') return 'error';
    return '';
  };

  // All mode values share the same dark-blue "modo" capsule
  const getModoBadge = () => 'modo';

  const getSeguridadBadge = (seg) => {
    if (seg === 'NOMINAL' || seg === 'NORMAL') return 'safety-ok';
    if (seg === 'REDUCED') return 'stop';
    if (seg === 'PROTECTIVE_STOP' || seg === 'EMERGENCY_STOP') return 'error';
    return '';
  };

  // ── Program execution status helpers (single source of truth) ───────────

  const PROGRAM_STATUS_MAP = {
    PLAYING:  { badge: 'running', label: 'EN EJECUCIÓN' },
    RUNNING:  { badge: 'running', label: 'EN EJECUCIÓN' },
    STOPPED:  { badge: 'stopped', label: 'DETENIDO' },
    PAUSED:   { badge: 'stopped', label: 'EN PAUSA' },
  };

  const getProgramBadge = (estado) => {
    if (!estado) return '';
    return PROGRAM_STATUS_MAP[estado.toUpperCase()]?.badge ?? '';
  };

  const getProgramStatusLabel = (estado) => {
    if (!estado) return 'N/A';
    return PROGRAM_STATUS_MAP[estado.toUpperCase()]?.label ?? estado;
  };

  const hb = heartbeat ? 'heartbeat' : '';

  return (
    <div className="telemetry-mini-header">
      {/* Left: Status Badges */}
      <div className="header-badges">
        <div className={`status-badge badge-${getEstadoBadge(estadoRobot)} ${hb}`}>
          <span className="badge-label">Estado Robot</span>
          <span className="badge-value">{estadoRobot}</span>
        </div>

        <div className={`status-badge badge-${getModoBadge()} ${hb}`}>
          <span className="badge-label">Modo Operación</span>
          <span className="badge-value">{modo}</span>
        </div>

        <div className={`status-badge badge-${getSeguridadBadge(seguridad)} ${hb}`}>
          <span className="badge-label">Seguridad</span>
          <span className="badge-value">{seguridad}</span>
        </div>

        {/* Program execution status badge */}
        <div className={`status-badge badge-${getProgramBadge(programaEstado)} ${hb}`}>
          <span className="badge-label">Estado Ejecución</span>
          <span className="badge-value">{getProgramStatusLabel(programaEstado)}</span>
        </div>
      </div>

      {/* Right: Program Identification */}
      <div className="header-identification">
        {/* Wider badge: program file name with extension highlighted */}
        <div className={`header-id-item badge-programa ${hb}`}>
          <span className="id-label">Nombre Programa</span>
          <span className="id-value">
            <ProgramName name={programa} />
          </span>
        </div>

        {/* Small badge: numeric status ID */}
        <div className={`header-id-item badge-id-small ${hb}`}>
          <span className="id-label">ID Status</span>
          <span className="id-value">{numeroProg}</span>
        </div>
      </div>
    </div>
  );
}
