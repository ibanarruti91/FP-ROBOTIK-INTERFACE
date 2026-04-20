/**
 * rtdeLabels.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Label maps and state-transition helper for RTDE events.
 *
 * getStateTransition(event) — reads event.type and event.data.from / event.data.to
 * and returns a structured transition object, or null if the event is not a
 * recognised state-change event.  It never inspects event.text.
 */

// ── Label maps ────────────────────────────────────────────────────────────────

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

export const SAFETY_STATUS_LABELS = {
  1:  'NORMAL',
  2:  'REDUCIDO',
  3:  'PARADA PROTECTORA',
  4:  'PARADA EMERGENCIA',
  5:  'PARADA SALVAGUARDA',
  6:  'EMERGENCIA SISTEMA EXTERNO',
  7:  'EMERGENCIA ROBOT',
  8:  'VIOLACIÓN DE LÍMITES',
  9:  'FALLO DE HARDWARE',
  11: 'DETENIDO',
};

// ── State-change event type → label map ───────────────────────────────────────

const STATE_CHANGE_DEFS = {
  'robot_mode.changed':    { name: 'robot_mode',    displayName: 'Modo robot',    labels: ROBOT_MODE_LABELS },
  'program_state.changed': { name: 'program_state', displayName: 'Estado prog.',  labels: PROGRAM_STATE_LABELS },
  'safety.changed':        { name: 'safety',        displayName: 'Seguridad',     labels: SAFETY_STATUS_LABELS },
};

// ── Public API ────────────────────────────────────────────────────────────────

/** Resolves a numeric/string value to a human label using the given map. */
function resolveLabel(map, value) {
  if (value == null) return '?';
  return map[value] ?? String(value);
}

/**
 * getStateTransition(event)
 *
 * Returns a structured description of a state-change event, or null when
 * the event is not a recognised transition.
 *
 * @param {Object} event  — raw event from the Node-RED events buffer
 * @returns {{ stateName: string, fromValue: number|string, toValue: number|string,
 *             fromLabel: string, toLabel: string } | null}
 */
export function getStateTransition(event) {
  if (!event?.type) return null;
  const def = STATE_CHANGE_DEFS[event.type];
  if (!def) return null;

  const from = event.data?.from;
  const to   = event.data?.to;
  if (from == null && to == null) return null;

  return {
    stateName:   def.name,
    displayName: def.displayName,
    fromValue:   from ?? '?',
    toValue:     to   ?? '?',
    fromLabel:   resolveLabel(def.labels, from),
    toLabel:     resolveLabel(def.labels, to),
  };
}
