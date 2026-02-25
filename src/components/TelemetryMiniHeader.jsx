/**
 * Mini-Header de Telemetría – RTDE Universal Header
 * Five badges driven by raw MQTT payload from Node-RED:
 *   Número de Programa  – program_name + program_id
 *   Estado de Seguridad – rtde.safety_status
 *   Modo Robot          – rtde.robot_mode
 *   Estado de Programa  – rtde.program_state
 *   Frenos              – derived from rtde.robot_mode (7 = LIBERADOS, otherwise BLOQUEADOS)
 *
 * Color mapping (by numeric RTDE ID):
 *   Seguridad:  1,2 → green   3,5 → orange   4,8 → red-blink   6,7,9 → red-solid   11 → gray
 *   Modo Robot: 7   → green   5,6 → blue      4   → amber       1,2   → yellow      0,3 → gray
 *   Programa:   2   → green   3,4 → yellow    5   → blue        1     → red         0   → gray
 *   Frenos:     7   → green (LIBERADOS)        other → orange (BLOQUEADOS)
 */

import { useState, useEffect, useRef } from 'react';
import './TelemetryMiniHeader.css';

// ── RTDE ID → label maps ───────────────────────────────────────────────────

const SAFETY_STATUS_LABELS = {
  1: 'NORMAL',
  2: 'REDUCIDO',
  3: 'PARADA PROTECTORA',
  4: 'PARADA EMERGENCIA',
  5: 'PARADA SALVAGUARDA',
  6: 'EM. SISTEMA EXTERNO',
  7: 'EM. ROBOT',
  8: 'VIOLACIÓN LÍMITES',
  9: 'FALLO DE HARDWARE',
  11: 'DETENIDO',
};

const ROBOT_MODE_LABELS = {
  0: 'DESCONECTADO',
  1: 'CONFIRMAR SEGURIDAD',
  2: 'INICIANDO SISTEMA',
  3: 'MOTORES APAGADOS',
  4: 'MOTORES ENCENDIDOS',
  5: 'ARRANCANDO',
  6: 'LIBERACIÓN MANUAL',
  7: 'OPERATIVO',
};

const PROGRAM_STATE_LABELS = {
  0: 'NO INICIALIZADO',
  1: 'DETENIDO',
  2: 'EN EJECUCIÓN',
  3: 'PAUSANDO...',
  4: 'EN PAUSA',
  5: 'REANUDANDO...',
};

// ── Color-class resolvers ──────────────────────────────────────────────────

function getSafetyClass(id) {
  if (id === 1 || id === 2) return 'badge-normal';
  if (id === 3 || id === 5) return 'badge-orange';
  if (id === 4 || id === 8) return 'badge-emergency';
  if (id === 6 || id === 7 || id === 9) return 'badge-protective-stop';
  if (id === 11) return 'badge-stopped';
  return '';
}

function getRobotModeClass(id) {
  if (id === 7) return 'badge-running';
  if (id === 5 || id === 6) return 'badge-idle';
  if (id === 4) return 'badge-booting';
  if (id === 1 || id === 2) return 'badge-paused';
  if (id === 0 || id === 3) return 'badge-stopped';
  return '';
}

function getProgramStateClass(id) {
  if (id === 2) return 'badge-running';
  if (id === 3 || id === 4) return 'badge-paused';
  if (id === 5) return 'badge-idle';
  if (id === 1) return 'badge-protective-stop';
  if (id === 0) return 'badge-stopped';
  return '';
}

function getBrakesInfo(robotModeId) {
  if (robotModeId === 7) return { label: 'FRENOS LIBERADOS', cls: 'badge-running' };
  return { label: 'FRENOS BLOQUEADOS', cls: 'badge-orange' };
}

// ── Component ──────────────────────────────────────────────────────────────

export function TelemetryMiniHeader({ data }) {
  const [updatedFields, setUpdatedFields] = useState(new Set());
  const previousData = useRef({});

  // Read directly from the raw MQTT payload structure
  const safetyId       = data?.rtde?.safety_status ?? null;
  const robotModeId    = data?.rtde?.robot_mode    ?? null;
  const programStateId = data?.rtde?.program_state ?? null;
  const programId      = data?.program_id          ?? null;
  const programName    = data?.program_name        ?? null;

  useEffect(() => {
    const current = { safetyId, robotModeId, programStateId, programId, programName };
    const updated = new Set();
    Object.keys(current).forEach(key => {
      if (previousData.current[key] !== current[key]) updated.add(key);
    });
    if (updated.size > 0) {
      setUpdatedFields(updated);
      const timer = setTimeout(() => setUpdatedFields(new Set()), 200);
      previousData.current = current;
      return () => clearTimeout(timer);
    }
  }, [safetyId, robotModeId, programStateId, programId, programName]);

  const safetyLabel       = safetyId       !== null ? (SAFETY_STATUS_LABELS[safetyId]       ?? 'DESCONOCIDO') : '[-]';
  const robotModeLabel    = robotModeId    !== null ? (ROBOT_MODE_LABELS[robotModeId]        ?? 'DESCONOCIDO') : '[-]';
  const programStateLabel = programStateId !== null ? (PROGRAM_STATE_LABELS[programStateId]  ?? 'DESCONOCIDO') : '[-]';
  const brakes = getBrakesInfo(robotModeId);

  // Program badge: [105] PROCESO_SOLDADURA.URP
  const programIdDisplay   = programId   !== null ? `[${programId}]`              : '[-]';
  const programNameDisplay = programName !== null ? String(programName).toUpperCase() : '[-]';

  return (
    <div className="telemetry-mini-header">
      <div className="header-badges">

        {/* PROGRAMA */}
        <div id="header-program-name" className={`status-badge ${updatedFields.has('programName') || updatedFields.has('programId') ? 'update-flash' : ''}`}>
          <span className="badge-label">Número de Programa</span>
          <span className="badge-value id-value">
            <span className="badge-id">{programIdDisplay}</span> {programNameDisplay}
          </span>
        </div>

        {/* SEGURIDAD */}
        <div id="header-safety-status" className={`status-badge ${getSafetyClass(safetyId)} ${updatedFields.has('safetyId') ? 'update-flash' : ''}`}>
          <span className="badge-label">Estado de Seguridad</span>
          <span className="badge-value">
            <span className="badge-id">{safetyId !== null ? `[${safetyId}]` : '[-]'}</span> {safetyLabel}
          </span>
        </div>

        {/* MODO ROBOT */}
        <div id="header-robot-mode" className={`status-badge ${getRobotModeClass(robotModeId)} ${updatedFields.has('robotModeId') ? 'update-flash' : ''}`}>
          <span className="badge-label">Modo Robot</span>
          <span className="badge-value">
            <span className="badge-id">{robotModeId !== null ? `[${robotModeId}]` : '[-]'}</span> {robotModeLabel}
          </span>
        </div>

        {/* ESTADO DE PROGRAMA */}
        <div id="header-program-state" className={`status-badge ${getProgramStateClass(programStateId)} ${updatedFields.has('programStateId') ? 'update-flash' : ''}`}>
          <span className="badge-label">Estado de Programa</span>
          <span className="badge-value">
            <span className="badge-id">{programStateId !== null ? `[${programStateId}]` : '[-]'}</span> {programStateLabel}
          </span>
        </div>

        {/* FRENOS */}
        <div id="header-brakes" className={`status-badge ${brakes.cls} ${updatedFields.has('robotModeId') ? 'update-flash' : ''}`}>
          <span className="badge-label">Frenos</span>
          <span className="badge-value">{brakes.label}</span>
        </div>

      </div>
    </div>
  );
}
