/**
 * rtdeLabels.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared RTDE numeric-ID → human-readable label maps, plus a helper that
 * extracts a state-transition description from a Node-RED event object.
 *
 * These maps mirror the ones in TelemetryMiniHeader.jsx and diagnosticBuffer.js.
 * They live here so that both the Diagnostico page and the TelemetryWidgets
 * component can share the same source of truth without UI dependencies.
 */

// ── RTDE ID → label maps ───────────────────────────────────────────────────

export const SAFETY_STATUS_LABELS = {
  1:  'NORMAL',
  2:  'REDUCIDO',
  3:  'PARADA PROTECTORA',
  4:  'PARADA EMERGENCIA',
  5:  'PARADA SALVAGUARDA',
  6:  'EM. SISTEMA EXTERNO',
  7:  'EM. ROBOT',
  8:  'VIOLACIÓN LÍMITES',
  9:  'FALLO DE HARDWARE',
  11: 'DETENIDO',
};

export const ROBOT_MODE_LABELS = {
  0: 'DESCONECTADO',
  1: 'CONFIRMAR SEGURIDAD',
  2: 'INICIANDO SISTEMA',
  3: 'MOTORES APAGADOS',
  4: 'MOTORES ENCENDIDOS',
  5: 'ARRANCANDO',
  6: 'LIBERACIÓN MANUAL',
  7: 'OPERATIVO',
};

export const PROGRAM_STATE_LABELS = {
  0: 'NO INICIALIZADO',
  1: 'DETENIDO',
  2: 'EN EJECUCIÓN',
  3: 'PAUSANDO…',
  4: 'EN PAUSA',
  5: 'REANUDANDO…',
};

// ── Transition helper ──────────────────────────────────────────────────────

/**
 * Resolves a numeric state ID to a human-readable label string.
 * If a labelMap is provided and contains the ID, returns "[id] LABEL".
 * Otherwise returns the raw string representation of the ID.
 *
 * @param {*}      id       — raw value from event.data.from / event.data.to
 * @param {Object} labelMap — optional ID→label map (e.g. ROBOT_MODE_LABELS)
 * @returns {string|null}
 */
function resolveStateLabel(id, labelMap) {
  if (id == null) return null;
  if (labelMap && labelMap[id] != null) return `[${id}] ${labelMap[id]}`;
  return String(id);
}

/**
 * getStateTransition
 *
 * Inspects a Node-RED event object and, if it represents a state-change event
 * that carries `data.to` (and optionally `data.from`), returns a plain object
 * describing the transition with human-readable labels.
 *
 * Supported event types (matched by substring):
 *   robot_mode.*   → ROBOT_MODE_LABELS
 *   program_state.*→ PROGRAM_STATE_LABELS
 *   safety.*       → SAFETY_STATUS_LABELS
 *   *.changed      → raw numeric/string values (no label map)
 *
 * @param {Object} event — a Node-RED event from nodeRedEventsBuffer
 * @returns {{ stateName: string, fromLabel: string|null, toLabel: string } | null}
 */
export function getStateTransition(event) {
  const type = event?.type ?? '';
  const data = event?.data;

  // Must have at least a destination state to be useful
  if (data?.to == null) return null;

  let labelMap = null;
  let stateName;

  if (type.includes('robot_mode')) {
    labelMap = ROBOT_MODE_LABELS;
    stateName = 'robot_mode';
  } else if (type.includes('program_state')) {
    labelMap = PROGRAM_STATE_LABELS;
    stateName = 'program_state';
  } else if (type.includes('safety')) {
    labelMap = SAFETY_STATUS_LABELS;
    stateName = 'safety_status';
  } else if (type.endsWith('.changed')) {
    // Generic *.changed event — use raw values, no label map
    stateName = type.replace(/\.changed$/, '');
  } else {
    return null;
  }

  const fromId = data.from;
  const toId   = data.to;

  return {
    stateName,
    fromLabel: resolveStateLabel(fromId, labelMap),
    toLabel:   resolveStateLabel(toId, labelMap),
  };
}
