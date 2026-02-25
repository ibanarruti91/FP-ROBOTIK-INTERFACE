/**
 * Mini-Header de Telemetría – RTDE Universal Header
 * Five badges driven by raw RTDE protocol numeric IDs:
 *   Programa     – .urp filename (programa.nombre)
 *   Seguridad    – safety_status_id  (rtde.safety_status_id)
 *   Modo Robot   – robot_mode_id     (rtde.robot_mode_id)
 *   Ejecución    – program_state_id  (rtde.program_state_id)
 *   Frenos       – derived from robot_mode (7 = RELEASED, otherwise LOCKED)
 *
 * Color mapping (by numeric RTDE ID):
 *   Seguridad:  1,2 → green   3,5,22 → orange   6,7,20 → red-solid   8,9 → red-blink
 *   Modo Robot: 7   → green   5,6    → blue      2,4    → amber
 *   Ejecución:  2   → green   3,4    → yellow    0,1    → red
 *   Frenos:     7   → green (RELEASED)            other  → orange (LOCKED)
 */

import { useState, useEffect, useRef } from 'react';
import './TelemetryMiniHeader.css';

// ── RTDE ID → label maps ───────────────────────────────────────────────────

const SAFETY_STATUS_LABELS = {
  1: 'NORMAL', 2: 'REDUCED',
  3: 'PROTECTIVE STOP', 5: 'SAFEGUARD STOP', 22: 'SAFEGUARD STOP',
  6: 'EMERGENCY STOP', 7: 'EMERGENCY STOP', 20: 'EMERGENCY STOP',
  8: 'FAULT', 9: 'FAULT',
};

const ROBOT_MODE_LABELS = {
  2: 'BOOTING', 4: 'BOOTING',
  5: 'IDLE', 6: 'BACKDRIVE',
  7: 'RUNNING',
};

const PROGRAM_STATE_LABELS = {
  0: 'STOPPED', 1: 'STOPPED',
  2: 'PLAYING',
  3: 'PAUSED', 4: 'PAUSED',
};

// ── Color-class resolvers ──────────────────────────────────────────────────

function getSafetyClass(id) {
  if (id === 1 || id === 2) return 'badge-normal';
  if (id === 3 || id === 5 || id === 22) return 'badge-orange';
  if (id === 6 || id === 7 || id === 20) return 'badge-protective-stop';
  if (id === 8 || id === 9) return 'badge-emergency';
  return '';
}

function getRobotModeClass(id) {
  if (id === 7) return 'badge-running';
  if (id === 5 || id === 6) return 'badge-idle';
  if (id === 2 || id === 4) return 'badge-booting';
  return '';
}

function getProgramStateClass(id) {
  if (id === 2) return 'badge-running';
  if (id === 3 || id === 4) return 'badge-paused';
  if (id === 0 || id === 1) return 'badge-protective-stop';
  return '';
}

function getBrakesInfo(robotModeId) {
  if (robotModeId === 7) return { label: 'BRAKES RELEASED', cls: 'badge-running' };
  return { label: 'LOCKED', cls: 'badge-orange' };
}

// ── Component ──────────────────────────────────────────────────────────────

export function TelemetryMiniHeader({ data }) {
  const [updatedFields, setUpdatedFields] = useState(new Set());
  const previousData = useRef({});

  const safetyId       = data?.rtde?.safety_status_id ?? null;
  const robotModeId    = data?.rtde?.robot_mode_id    ?? null;
  const programStateId = data?.rtde?.program_state_id ?? null;
  const programName   = data?.programa?.nombre    || 'N/A';

  useEffect(() => {
    const current = { safetyId, robotModeId, programStateId, programName };
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
  }, [safetyId, robotModeId, programStateId, programName]);

  const safetyLabel       = safetyId       !== null ? (SAFETY_STATUS_LABELS[safetyId]       ?? String(safetyId))       : 'N/A';
  const robotModeLabel    = robotModeId    !== null ? (ROBOT_MODE_LABELS[robotModeId]        ?? String(robotModeId))    : 'N/A';
  const programStateLabel = programStateId !== null ? (PROGRAM_STATE_LABELS[programStateId]  ?? String(programStateId)) : 'N/A';
  const brakes = getBrakesInfo(robotModeId);

  return (
    <div className="telemetry-mini-header">
      <div className="header-badges">

        {/* PROGRAMA */}
        <div id="header-program-name" className={`status-badge ${updatedFields.has('programName') ? 'update-flash' : ''}`}>
          <span className="badge-label">Programa</span>
          <span className="badge-value id-value">{programName}</span>
        </div>

        {/* SEGURIDAD */}
        <div id="header-safety-status" className={`status-badge ${getSafetyClass(safetyId)} ${updatedFields.has('safetyId') ? 'update-flash' : ''}`}>
          <span className="badge-label">Seguridad</span>
          <span className="badge-value">
            {safetyId !== null && <span className="badge-id">[{safetyId}]</span>} {safetyLabel}
          </span>
        </div>

        {/* MODO ROBOT */}
        <div id="header-robot-mode" className={`status-badge ${getRobotModeClass(robotModeId)} ${updatedFields.has('robotModeId') ? 'update-flash' : ''}`}>
          <span className="badge-label">Modo Robot</span>
          <span className="badge-value">
            {robotModeId !== null && <span className="badge-id">[{robotModeId}]</span>} {robotModeLabel}
          </span>
        </div>

        {/* EJECUCIÓN */}
        <div id="header-program-state" className={`status-badge ${getProgramStateClass(programStateId)} ${updatedFields.has('programStateId') ? 'update-flash' : ''}`}>
          <span className="badge-label">Ejecución</span>
          <span className="badge-value">
            {programStateId !== null && <span className="badge-id">[{programStateId}]</span>} {programStateLabel}
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
