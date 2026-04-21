/**
 * diagnosticBuffer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DERIVED DIAGNOSTIC BUFFER — frontend-side event inference engine.
 *
 * ⚠ NOTA IMPORTANTE: Este módulo NO accede al log de diagnósticos nativo del
 * controlador UR.  Los eventos aquí generados son DERIVADOS / INFERIDOS a
 * partir de transiciones de estado detectadas en los mensajes MQTT recibidos
 * de Node-RED.  Son útiles para operación y diagnóstico local, pero no deben
 * confundirse con el registro de errores o eventos internos del robot.
 *
 * ── Arquitectura ─────────────────────────────────────────────────────────────
 *   1. normalizeDiagnosticState(data, prevState) → DiagState
 *      Extrae los campos relevantes del payload MQTT y los mezcla con el
 *      último estado conocido para tolerar payloads parciales.
 *
 *   2. deriveDiagnosticEvents(prevState, currState) → DiagEvent[]
 *      Compara el estado anterior con el nuevo y genera los eventos que
 *      correspondan.  Solo genera eventos ante transiciones reales; si el
 *      estado no cambió no produce nada.
 *
 *   3. El caller (MqttStatusContext) inserta DiagEvent[] en el buffer limitado
 *      y lo expone al resto de la UI a través del contexto.
 *
 * ── API pública ───────────────────────────────────────────────────────────────
 *   MAX_DERIVED_DIAG_EVENTS         — capacidad máxima del buffer
 *   EMPTY_DIAG_STATE                — estado inicial / centinela
 *   normalizeDiagnosticState(data, prevState) → DiagState
 *   deriveDiagnosticEvents(prevState, currState) → DiagEvent[]
 */

// ── Buffer capacity ───────────────────────────────────────────────────────────

/** Número máximo de eventos que se conservan en el buffer derivado.  Ajustable. */
export const MAX_DERIVED_DIAG_EVENTS = 100;

// ── RTDE label maps ───────────────────────────────────────────────────────────
// Espejan los mapas de TelemetryMiniHeader para que este módulo sea autónomo
// y no tenga dependencias de UI.

const SAFETY_STATUS_LABELS = {
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
  3: 'PAUSANDO…',
  4: 'EN PAUSA',
  5: 'REANUDANDO…',
};

// ── Severity classification ───────────────────────────────────────────────────

/** safety_status ID → nivel de severidad */
const SAFETY_SEVERITY = {
  1:  'info',     // NORMAL
  2:  'warning',  // REDUCIDO
  3:  'error',    // PARADA PROTECTORA
  4:  'error',    // PARADA EMERGENCIA
  5:  'error',    // PARADA SALVAGUARDA
  6:  'error',    // EMERGENCIA SISTEMA EXTERNO
  7:  'error',    // EMERGENCIA ROBOT
  8:  'error',    // VIOLACIÓN DE LÍMITES
  9:  'error',    // FALLO DE HARDWARE
  11: 'warning',  // DETENIDO
};

/** safety_status level → buffer priority (higher = more urgent) */
const SAFETY_PRIORITY = { error: 10, warning: 5, info: 1 };

/**
 * Priority assigned to a transition INTO safety_status 7 (EMERGENCIA ROBOT).
 * Higher than the default error priority so this event always surfaces first
 * in the buffer when multiple events arrive in the same tick.
 */
const SAFETY_ROBOT_EMERGENCY_PRIORITY = 20;


const PROGRAM_STATE_SEVERITY = {
  0: 'info',     // NO INICIALIZADO
  1: 'warning',  // DETENIDO
  2: 'info',     // EN EJECUCIÓN
  3: 'warning',  // PAUSANDO…
  4: 'warning',  // EN PAUSA
  5: 'info',     // REANUDANDO…
};

/** robot_mode ID → nivel de severidad */
const ROBOT_MODE_SEVERITY = {
  0: 'warning',  // DESCONECTADO
  1: 'warning',  // CONFIRMAR SEGURIDAD
  2: 'info',     // INICIANDO SISTEMA
  3: 'warning',  // MOTORES APAGADOS
  4: 'info',     // MOTORES ENCENDIDOS
  5: 'info',     // ARRANCANDO
  6: 'info',     // LIBERACIÓN MANUAL (BACKDRIVE)
  7: 'info',     // OPERATIVO
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Devuelve "HH:MM:SS" a partir de un timestamp millisecond. */
function fmtTime(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

let _seq = 0;
/**
 * Genera un ID de evento único y legible.
 * Formato: "<CODE>_<ts>_<seq>" — determinista y depurable.
 */
function makeEventId(code, ts) {
  _seq = (_seq + 1) % 100_000;
  return `${code}_${ts}_${_seq}`;
}

// ── DiagState type ─────────────────────────────────────────────────────────────
/**
 * @typedef {Object} DiagState
 * @property {number|null}                  safetyStatus  — rtde.safety_status (ID numérico RTDE)
 * @property {number|null}                  robotMode     — rtde.robot_mode    (ID numérico RTDE)
 * @property {number|null}                  programState  — rtde.program_state (ID numérico RTDE)
 * @property {string|null}                  programName   — program_name
 * @property {number|null}                  programId     — program_id
 * @property {'RELEASED'|'ENGAGED'|null}    brakes        — derivado de robotMode === 7
 */

/**
 * Estado inicial / centinela.  Todos los campos null para que el primer
 * mensaje MQTT real genere los eventos de "carga inicial" correctos.
 */
export const EMPTY_DIAG_STATE = Object.freeze({
  safetyStatus: null,
  robotMode:    null,
  programState: null,
  programName:  null,
  programId:    null,
  brakes:       null,
});

// ── DiagEvent type ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} DiagEvent
 * @property {string}                       id        — ID único del evento
 * @property {number}                       ts        — Date.now() en el momento del evento
 * @property {string}                       time      — "HH:MM:SS" (hora local del cliente)
 * @property {'info'|'warning'|'error'}     level     — severidad
 * @property {string}                       code      — código legible por máquina (e.g. "PROGRAM_PAUSED")
 * @property {string}                       title     — etiqueta corta
 * @property {string}                       msg       — descripción completa
 * @property {'derived'}                    source    — siempre 'derived': no es un log nativo del robot
 * @property {DiagState}                    snapshot  — instantánea del estado en el momento del evento
 * @property {number}                       priority  — prioridad de visualización (mayor = más urgente); default 0
 * @property {boolean}                      visible   — si el evento debe mostrarse en el buffer; default true
 */

// ── Step 1 — Normalise incoming MQTT payload into DiagState ──────────────────

/**
 * normalizeDiagnosticState
 *
 * Mezcla el payload MQTT crudo con el último estado conocido para que los
 * payloads parciales (campos ausentes) no generen eventos falsos.  Solo
 * sobreescribe un campo cuando el payload entrante lo contiene explícitamente
 * (valor distinto de null/undefined); los campos ausentes mantienen el último
 * valor conocido.
 *
 * @param {Object}    data      — payload MQTT ya parseado (JSON)
 * @param {DiagState} prevState — último estado normalizado conocido
 * @returns {DiagState}
 */
export function normalizeDiagnosticState(data, prevState) {
  // Extraemos los valores entrantes; null/undefined = "ausente en este payload"
  const inSafety       = data?.rtde?.safety_status ?? null;
  const inRobotMode    = data?.rtde?.robot_mode    ?? null;
  const inProgramState = data?.rtde?.program_state ?? null;
  const inProgramName  = data?.program_name        ?? null;
  const inProgramId    = typeof data?.program_id === 'number' ? data.program_id : null;

  // Mezcla: solo actualizamos si el payload trae el campo
  const safetyStatus  = inSafety       !== null ? inSafety       : prevState.safetyStatus;
  const robotMode     = inRobotMode    !== null ? inRobotMode    : prevState.robotMode;
  const programState  = inProgramState !== null ? inProgramState : prevState.programState;
  const programName   = inProgramName  !== null ? inProgramName  : prevState.programName;
  const programId     = inProgramId    !== null ? inProgramId    : prevState.programId;

  // Frenos: derivados de robotMode (modo 7 = OPERATIVO = frenos liberados)
  const brakes = robotMode === null ? null : robotMode === 7 ? 'RELEASED' : 'ENGAGED';

  return { safetyStatus, robotMode, programState, programName, programId, brakes };
}

// ── Step 2 — Compare prev vs curr and derive events ──────────────────────────

/**
 * deriveDiagnosticEvents
 *
 * Compara dos snapshots DiagState y devuelve un array ordenado de DiagEvent
 * describiendo cada transición de estado real que ocurrió.
 *
 * Reglas:
 *  • Solo genera un evento cuando un campo realmente cambió de valor.
 *  • null → null (desconocido → desconocido) nunca genera evento.
 *  • Cuando varias transiciones ocurren en el mismo tick, se ordenan por
 *    severidad descendente (error > warning > info) para que lo crítico
 *    aparezca primero en el buffer.
 *  • El evento de frenos se suprime cuando ya se emitió un evento de robot_mode
 *    en el mismo tick (evita entradas dobles para la misma causa raíz).
 *
 * @param {DiagState} prev — estado anterior
 * @param {DiagState} curr — estado actual
 * @returns {DiagEvent[]}
 */
export function deriveDiagnosticEvents(prev, curr) {
  const ts       = Date.now();
  const time     = fmtTime(ts);
  const snapshot = { ...curr };
  const events   = [];

  /**
   * Factoría interna de eventos.
   * @param {string} code
   * @param {string} title
   * @param {string} msg
   * @param {'info'|'warning'|'error'} level
   * @param {number} [priority=0]  — mayor valor = mayor urgencia en el buffer
   * @param {boolean} [visible=true]
   */
  const make = (code, title, msg, level, priority = 0, visible = true) => ({
    id:       makeEventId(code, ts),
    ts,
    time,
    level,
    code,
    title,
    msg,
    source:   'derived',
    snapshot,
    priority,
    visible,
  });

  // ── SAFETY STATUS ──────────────────────────────────────────────────────────
  if (curr.safetyStatus !== prev.safetyStatus && curr.safetyStatus !== null) {
    const level    = SAFETY_SEVERITY[curr.safetyStatus] ?? 'warning';
    const priority = SAFETY_PRIORITY[level] ?? 1;

    let code, title, msg;

    if (curr.safetyStatus === 1) {
      // Robot returns to normal — always info regardless of what it was before
      code  = 'SAFETY_NORMAL';
      title = 'Seguridad normalizada';
      msg   = 'Estado de seguridad normalizado';
    } else {
      switch (curr.safetyStatus) {
        case 3:
          code  = 'SAFETY_PROTECTIVE_STOP';
          title = 'Protective stop activado';
          msg   = 'Parada de seguridad activada (Protective Stop)';
          break;
        case 4:
          code  = 'SAFETY_EMERGENCY_STOP';
          title = 'Parada de emergencia';
          msg   = 'Parada de emergencia activada';
          break;
        case 5:
          code  = 'SAFETY_SAFEGUARD_STOP';
          title = 'Parada de salvaguarda';
          msg   = 'Parada de salvaguarda activada (Safeguard Stop)';
          break;
        case 6:
          code  = 'SAFETY_SYSTEM_EMERGENCY_STOP';
          title = 'Emergencia sistema externo';
          msg   = 'Parada de emergencia por sistema externo';
          break;
        case 7:
          code  = 'SAFETY_ROBOT_EMERGENCY_STOP';
          title = 'Emergencia robot';
          msg   = 'Parada de emergencia del robot activada';
          break;
        case 8:
          code  = 'SAFETY_VIOLATION';
          title = 'Violación de límites';
          msg   = 'Violación de límites de seguridad detectada';
          break;
        case 9:
          code  = 'SAFETY_FAULT';
          title = 'Fallo de hardware';
          msg   = 'Fallo de hardware de seguridad detectado';
          break;
        case 2:
          code  = 'SAFETY_REDUCED';
          title = 'Velocidad reducida';
          msg   = 'Robot operando en modo de velocidad reducida';
          break;
        case 11:
          code  = 'SAFETY_STOPPED';
          title = 'Robot detenido (seguridad)';
          msg   = 'Robot detenido por condición de seguridad';
          break;
        default: {
          const label = SAFETY_STATUS_LABELS[curr.safetyStatus] ?? `ID ${curr.safetyStatus}`;
          code  = `SAFETY_STATUS_${curr.safetyStatus}`;
          title = `Seguridad: ${label}`;
          msg   = `Estado de seguridad cambiado a ${label}`;
        }
      }
    }

    events.push(make(code, title, msg, level, priority, true));
  }

  // ── ROBOT MODE ─────────────────────────────────────────────────────────────
  let robotModeEventEmitted = false;
  if (curr.robotMode !== prev.robotMode && curr.robotMode !== null) {
    const label = ROBOT_MODE_LABELS[curr.robotMode] ?? `Modo ${curr.robotMode}`;
    const level = ROBOT_MODE_SEVERITY[curr.robotMode] ?? 'info';

    let code;
    switch (curr.robotMode) {
      case 0: code = 'ROBOT_DISCONNECTED';   break;
      case 1: code = 'ROBOT_CONFIRM_SAFETY'; break;
      case 2: code = 'ROBOT_BOOTING';        break;
      case 3: code = 'ROBOT_POWER_OFF';      break;
      case 4: code = 'ROBOT_POWER_ON';       break;
      case 5: code = 'ROBOT_STARTING';       break;
      case 6: code = 'ROBOT_BACKDRIVE';      break;
      case 7: code = 'ROBOT_RUNNING';        break;
      default: code = `ROBOT_MODE_${curr.robotMode}`;
    }

    events.push(make(code, `Modo robot: ${label}`, `Modo robot cambiado a ${label}`, level));
    robotModeEventEmitted = true;
  }

  // ── BRAKES (derivados del robot_mode) ─────────────────────────────────────
  // Se suprime si ya se emitió un evento de modo robot en el mismo tick para
  // evitar duplicar la misma causa raíz con una entrada extra.
  if (curr.brakes !== prev.brakes && curr.brakes !== null && !robotModeEventEmitted) {
    if (curr.brakes === 'RELEASED') {
      events.push(make('BRAKES_RELEASED', 'Frenos liberados', 'Los frenos del robot han sido liberados', 'info'));
    } else {
      events.push(make('BRAKES_ENGAGED', 'Frenos activados', 'Los frenos del robot han sido activados', 'warning'));
    }
  }

  // ── PROGRAM STATE ──────────────────────────────────────────────────────────
  if (curr.programState !== prev.programState && curr.programState !== null) {
    const label = PROGRAM_STATE_LABELS[curr.programState] ?? `Estado ${curr.programState}`;
    const level = PROGRAM_STATE_SEVERITY[curr.programState] ?? 'info';

    let code, title, msg;
    switch (curr.programState) {
      case 2:
        code = 'PROGRAM_RUNNING';
        title = 'Programa iniciado';
        msg   = 'El programa ha comenzado la ejecución';
        break;
      case 3:
        code = 'PROGRAM_STOPPING';
        title = 'Programa deteniéndose';
        msg   = 'El programa está finalizando la ejecución';
        break;
      case 4:
        code = 'PROGRAM_PAUSED';
        title = 'Programa pausado';
        msg   = 'La ejecución del programa ha sido pausada';
        break;
      case 5:
        code = 'PROGRAM_RESUMING';
        title = 'Programa reanudándose';
        msg   = 'El programa está reanudando la ejecución';
        break;
      case 1:
        code = 'PROGRAM_STOPPED';
        title = 'Programa detenido';
        msg   = 'El programa ha sido detenido';
        break;
      case 0:
        code = 'PROGRAM_IDLE';
        title = 'Sin programa activo';
        msg   = `Estado: ${label}`;
        break;
      default:
        code  = `PROGRAM_STATE_${curr.programState}`;
        title = `Programa: ${label}`;
        msg   = `Estado de programa cambiado a ${label}`;
    }

    events.push(make(code, title, msg, level));
  }

  // ── PROGRAM NAME / ID ──────────────────────────────────────────────────────
  if (curr.programName !== prev.programName && curr.programName !== null) {
    if (prev.programName === null) {
      events.push(make(
        'PROGRAM_LOADED',
        'Programa cargado',
        `Programa cargado: ${curr.programName}`,
        'info',
      ));
    } else {
      events.push(make(
        'PROGRAM_CHANGED',
        'Programa cambiado',
        `Programa cambiado de "${prev.programName}" a "${curr.programName}"`,
        'info',
      ));
    }
  }

  // ── Ordenar por severidad (error → warning → info) ────────────────────────
  // Cuando varias transiciones ocurren en el mismo tick la más crítica queda
  // primera, lo que hace la lectura del buffer más intuitiva.
  const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };
  events.sort((a, b) => (SEVERITY_ORDER[a.level] ?? 2) - (SEVERITY_ORDER[b.level] ?? 2));

  return events;
}

// ── Step 3 — Re-classify Node-RED safety events ───────────────────────────────

/**
 * reclassifyNodeRedSafetyEvent
 *
 * Node-RED sometimes publishes `safety.changed` events with `level: 'info'`
 * because its internal severity map is empty or incomplete.  This function
 * corrects the classification on the frontend using the same SAFETY_SEVERITY
 * table used for derived events, ensuring emergencies are always surfaced at
 * the right severity level.
 *
 * Rules (driven by the SAFETY_SEVERITY table):
 *  • Transition INTO status 7 (EMERGENCIA ROBOT) → error, priority 20, visible
 *  • Transition INTO any other error-level status → error, priority 10, visible
 *  • Transition back to status 1 (NORMAL) → info (SAFETY_SEVERITY[1]), priority 1
 *  • All other safety transitions → use SAFETY_SEVERITY table
 *
 * The function is a pure transform: it returns a new object and never mutates
 * the input.  Non-safety events are returned unchanged.
 *
 * ⚠ Call this AFTER data has been parsed from JSON (i.e. after normalizeEvents).
 *
 * @param {Object} event — raw (but data-parsed) Node-RED event
 * @returns {Object} — event with corrected level / priority / visible
 */
export function reclassifyNodeRedSafetyEvent(event) {
  if (event?.type !== 'safety.changed') return event;

  const to = event?.data?.to;
  if (to == null) return event;

  // SAFETY_SEVERITY[1] = 'info' handles the "back to NORMAL" case.
  // SAFETY_SEVERITY[7] = 'error' handles the "EMERGENCIA ROBOT" case.
  // All other statuses are also mapped; unknown IDs fall back to 'warning'.
  const level    = SAFETY_SEVERITY[to] ?? 'warning';
  // Status 7 gets a priority above the standard error level so it always
  // surfaces first in the buffer when multiple events arrive simultaneously.
  const priority = to === 7
    ? SAFETY_ROBOT_EMERGENCY_PRIORITY
    : (SAFETY_PRIORITY[level] ?? 1);

  return { ...event, level, priority, visible: true };
}
