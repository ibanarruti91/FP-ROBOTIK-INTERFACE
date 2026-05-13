import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import { MqttStatusContext } from './MqttStatusContext.js';
import {
  MAX_DERIVED_DIAG_EVENTS,
  EMPTY_DIAG_STATE,
  normalizeDiagnosticState,
  deriveDiagnosticEvents,
  reclassifyNodeRedSafetyEvent,
} from '../servicios/diagnosticBuffer.js';

const MAX_STEP_CAPTURE_RECORDS = 200;
const STEP_CAPTURE_TOPIC = 'salesianos/robot/iban/step_capture';
const STEP_CAPTURE_STORAGE_KEY = 'fp-step-capture-records-v2';

const ARROW_SEPARATOR = ' -> ';

function isStepCaptureTopic(topic) {
  return /^salesianos\/robot\/[^/]+\/step_capture$/.test(topic);
}

function inferCenterIdFromTopic(topic) {
  return typeof topic === 'string' ? topic.split('/')[2] ?? null : null;
}

function getStepCaptureSortValue(record) {
  const timestampValue = Date.parse(record?.timestamp ?? '');
  if (!Number.isNaN(timestampValue)) return timestampValue;
  return Number(record?._receivedAt) || 0;
}

function sortAndTrimStepCaptureRecords(records) {
  return [...records]
    .filter(Boolean)
    .sort((a, b) => {
      const tsDiff = getStepCaptureSortValue(b) - getStepCaptureSortValue(a);
      if (tsDiff !== 0) return tsDiff;
      return (Number(b?._receivedAt) || 0) - (Number(a?._receivedAt) || 0);
    })
    .slice(0, MAX_STEP_CAPTURE_RECORDS);
}

function getCaptureOrientation(payload) {
  return (
    payload?.orientation ??
    payload?.orientacion ??
    payload?.tcp_orientation ??
    payload?.tcp_orientacion ??
    payload?.tcp?.orientation ??
    payload?.tcp?.orientacion ??
    null
  );
}

function isStepCapturePayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  return (
    payload.message_type === 'step_capture'
    || (typeof payload.schema_version === 'string' && payload.schema_version.startsWith('step_capture_socket_clean_'))
  );
}

function normalizeStepCaptureRecord(payload, topic, receivedAt) {
  if (!isStepCapturePayload(payload)) return null;

  const position = payload.tcp_position_mm ?? null;
  const orientation = getCaptureOrientation(payload);
  const timestamp = payload.timestamp ?? new Date(receivedAt).toISOString();
  const uniqueSuffix = [
    payload.snapshot_short ?? 'na',
    payload.event_counter ?? 'na',
    payload.cycle_number ?? 'na',
    payload.step_id ?? 'na',
    timestamp,
    receivedAt,
  ].join('_');

  return {
    _id: `${topic}_${uniqueSuffix}`,
    _receivedAt: receivedAt,
    _topic: topic,
    timestamp,
    schema_version: payload.schema_version ?? null,
    center_id: payload.center_id ?? inferCenterIdFromTopic(topic),
    program_name: payload.program_name ?? payload.program_identity?.program_name ?? null,
    snapshot_short: payload.snapshot_short ?? payload.program_identity?.snapshot_short ?? null,
    cycle_number: payload.cycle_number ?? null,
    cycle_label: payload.cycle_label ?? null,
    cycle_assigned: payload.cycle_assigned ?? null,
    cycle_source: payload.cycle_source ?? null,
    event_type: payload.event_type ?? null,
    marker_type: payload.marker_type ?? null,
    step_role: payload.step_role ?? null,
    step_role_label: payload.step_role_label ?? null,
    step_type: payload.step_type ?? null,
    step_id: payload.step_id ?? null,
    event_counter: payload.event_counter ?? null,
    x_real_capturada_mm: position?.x ?? null,
    y_real_capturada_mm: position?.y ?? null,
    z_real_capturada_mm: position?.z ?? null,
    rx: orientation?.rx ?? null,
    ry: orientation?.ry ?? null,
    rz: orientation?.rz ?? null,
  };
}

function loadStepCaptureRecords() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STEP_CAPTURE_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return sortAndTrimStepCaptureRecords(
      parsed
        .filter(record => record && typeof record === 'object')
        .map((record, index) => ({
          ...record,
          _id: record._id ?? `stored-${index}-${Date.now()}`,
          _receivedAt:
            Number(record._receivedAt) ||
            Date.parse(record.timestamp ?? '') ||
            Date.now(),
        })),
    );
  } catch (error) {
    console.error('Error al cargar step_capture desde localStorage:', error);
    return [];
  }
}

/**
 * Normalises the `data` field of a single event.
 * Node-RED sometimes publishes event.data as a JSON string instead of an
 * already-parsed object.  Parsing it here — at the point events enter state —
 * ensures every consumer always sees a plain object (or the original value
 * when it is not a JSON string).
 */
function normalizeEventData(rawData) {
  if (rawData == null || typeof rawData !== 'string') return rawData;
  try { return JSON.parse(rawData); } catch { return rawData; }
}

/** Applies normalizeEventData to an array of events (returns a new array). */
function normalizeEvents(events) {
  return events.map(e =>
    e.data != null && typeof e.data === 'string'
      ? { ...e, data: normalizeEventData(e.data) }
      : e,
  );
}

/**
 * Normalises a raw messages value (string or array) into an array of
 * { time, text, level } objects so that the event log is always stored in a
 * uniform format regardless of what the robot sends.
 *
 * Note: principal.diagnostico.messages uses its own level vocabulary
 * ("error", "evento", etc.) which is different from the info/warn/error
 * semantics used by events_buffer / events_derived.  The level field is
 * passed through as-is so the UI can render it with an appropriate label.
 */
function parseMsgBatch(rawMessages) {
  if (Array.isArray(rawMessages)) {
    return rawMessages.map(msg => ({
      time:  msg.hora    ?? msg.time    ?? '--:--:--',
      text:  msg.msg     ?? msg.mensaje ?? msg.txt ?? msg.message ?? '--',
      level: msg.level   ?? msg.nivel   ?? null,
    }));
  }
  if (typeof rawMessages === 'string' && rawMessages) {
    return rawMessages
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const arrowIdx = line.indexOf(ARROW_SEPARATOR);
        if (arrowIdx !== -1) {
          return { time: line.slice(0, arrowIdx).trim(), text: line.slice(arrowIdx + ARROW_SEPARATOR.length).trim(), level: null };
        }
        return { time: '', text: line, level: null };
      });
  }
  return [];
}

export const MqttStatusProvider = ({ children }) => {
  const [status, setStatus] = useState('OFFLINE');
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [stepCaptureRecords, setStepCaptureRecords] = useState(loadStepCaptureRecords);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [currentChecksum, setCurrentChecksum] = useState(null);
  const [isPausedStepCapture, setIsPausedStepCapture] = useState(false);
  const isPausedStepCaptureRef = useRef(false);
  const clientRef = useRef(null);

  // ── Derived Diagnostic Buffer ─────────────────────────────────────────────
  // Buffer de eventos DERIVADOS generados en frontend a partir de transiciones
  // de estado MQTT.  NO es el log de diagnósticos nativo del controlador UR.
  const [derivedDiagnosticBuffer, setDerivedDiagnosticBuffer] = useState([]);
  const prevDiagStateRef = useRef(EMPTY_DIAG_STATE);

  // ── Last error ───────────────────────────────────────────────────────────────
  // lastError holds the text of the most recent event whose text contains
  // "ERROR".  It is reset to null by clearEventLog() so that "Último Error"
  // shows "Ninguno" immediately after the log is cleared and only updates again
  // when a genuinely new ERROR event arrives.
  const [lastError, setLastError] = useState(null);

  // ── Status topic payload ──────────────────────────────────────────────────
  // Stores the last payload received on salesianos/robot/iban/status.
  // Fields: center_id, center_name, iot_online, modo_origen, data_status, …
  // data_status: 'active' → telemetry running; 'idle' → center reachable but
  // telemetry paused.  Both mean the center is ONLINE.
  const [statusData, setStatusData] = useState(null);

  // ── Diagnóstico (from principal.diagnostico.last_error) ──────────────────
  // Reflects Node-RED's own last_error field directly — no frontend inference.
  const [diagnosticoLastError, setDiagnosticoLastError] = useState(null);

  // ── Diagnóstico messages (from principal.diagnostico.messages) ───────────
  // Stores the latest normalized batch from Node-RED.  Node-RED publishes the
  // full cumulative history on every message, so we replace on each update.
  // Never inferred or derived in the frontend — only what Node-RED sends.
  const [diagnosticoMessages, setDiagnosticoMessages] = useState([]);

  // ── Node-RED Events ───────────────────────────────────────────────────────
  // Populated from events_derived (incremental) and events_buffer (authoritative).
  // The web never calculates these; it only consumes what Node-RED publishes.
  const [nodeRedEventsBuffer, setNodeRedEventsBuffer] = useState([]);
  const [nodeRedEventsTotal, setNodeRedEventsTotal] = useState(0);
  const [nodeRedEventsBufferLimit, setNodeRedEventsBufferLimit] = useState(null);
  // Tracks event IDs already in the buffer to prevent duplicates from events_derived.
  const nodeRedEventIdsRef = useRef(new Set());
  // Mirrors nodeRedEventsBufferLimit in a ref so it is always current inside
  // MQTT message callbacks (avoids stale-closure reads of the state value).
  const nodeRedEventsBufferLimitRef = useRef(null);

  // ── Event log ────────────────────────────────────────────────────────────────
  // eventLog accumulates incoming events in {time, text} format.
  // It lives in the context (not in LogPanel) so that:
  //  • clearing truly empties the buffer, not just the view, and
  //  • the cleared state survives tab switches (component unmounts).
  //
  // seenEventKeysRef is a Set of "time|text" fingerprints for every event
  // that has already been added to eventLog.  This content-based approach
  // is more reliable than length comparison because it works correctly even
  // when the robot re-sends a batch of the same size or resends the full
  // history with new events appended anywhere in the array.
  //
  // On clearEventLog() only eventLog is reset; seenEventKeysRef is deliberately
  // kept intact.  This prevents old events from reappearing when the robot
  // re-sends the full history on the next MQTT message (old fingerprints are
  // still in the Set so they are skipped), while genuinely new events (new
  // fingerprints not yet in the Set) are still displayed immediately.
  const [eventLog, setEventLog] = useState([]);
  const seenEventKeysRef = useRef(new Set());

  // MQTT Connection Effect
  useEffect(() => {
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');
    clientRef.current = client;

    client.on('connect', () => {
      console.log('Conectado al broker MQTT para watchdog');
      client.subscribe('salesianos/robot/iban/principal', (err) => {
        if (err) {
          console.error('Error al suscribirse al topic principal:', err);
        } else {
          console.log('Suscrito al topic: salesianos/robot/iban/principal');
        }
      });
      client.subscribe(STEP_CAPTURE_TOPIC, (err) => {
        if (err) {
          console.error('Error al suscribirse al topic step_capture:', err);
        } else {
          console.log(`Suscrito al topic: ${STEP_CAPTURE_TOPIC}`);
        }
      });
      client.subscribe('salesianos/robot/iban/events_derived', (err) => {
        if (err) {
          console.error('Error al suscribirse al topic events_derived:', err);
        } else {
          console.log('Suscrito al topic: salesianos/robot/iban/events_derived');
        }
      });
      client.subscribe('salesianos/robot/iban/events_buffer', (err) => {
        if (err) {
          console.error('Error al suscribirse al topic events_buffer:', err);
        } else {
          console.log('Suscrito al topic: salesianos/robot/iban/events_buffer');
        }
      });
      // ── status topic: single source of truth for ONLINE/OFFLINE ────────────
      // Node-RED publishes a heartbeat here regardless of whether telemetry is
      // active.  The watchdog uses this topic — NOT principal — to decide if
      // the IoT centre is reachable.
      client.subscribe('salesianos/robot/iban/status', (err) => {
        if (err) {
          console.error('Error al suscribirse al topic status:', err);
        } else {
          console.log('Suscrito al topic: salesianos/robot/iban/status');
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const now = Date.now();
        console.log('[MQTT]', topic, data);

        if (isStepCaptureTopic(topic)) {
          console.log('[STEP_CAPTURE MQTT]', topic, data);
          if (!isPausedStepCaptureRef.current) {
            const normalizedRecord = normalizeStepCaptureRecord(data, topic, now);
            if (normalizedRecord) {
              setStepCaptureRecords(prev =>
                sortAndTrimStepCaptureRecords([normalizedRecord, ...prev]),
              );
              if (normalizedRecord.program_name) {
                setCurrentProgram(normalizedRecord.program_name);
              }
              if (data.checksum != null) {
                setCurrentChecksum(data.checksum);
              }
            }
          }
        } else if (topic === 'salesianos/robot/iban/events_buffer') {
          // ── events_buffer: authoritative resync from Node-RED ───────────
          // Node-RED sends the full snapshot; use it as the source of truth.
          const events = Array.isArray(data.events) ? data.events : [];

          if (data.action === 'cleared') {
            // Backend cleared the buffer — empty everything.
            nodeRedEventIdsRef.current = new Set();
            setNodeRedEventsBuffer([]);
            setNodeRedEventsTotal(0);
          } else {
            // Normalize data fields (JSON strings → objects) then re-classify
            // safety events so Node-RED level fallbacks ('info') are corrected.
            // Sort newest first; break ts ties by priority (higher = more
            // important).  The backend usually sends it already sorted, but
            // re-sorting here guarantees the tiebreaker rule is always applied.
            const sorted = [...normalizeEvents(events)]
              .map(reclassifyNodeRedSafetyEvent)
              .sort((a, b) => {
                const tsDiff = (b.ts ?? 0) - (a.ts ?? 0);
                if (tsDiff !== 0) return tsDiff;
                return (b.priority ?? 0) - (a.priority ?? 0);
              });
            nodeRedEventIdsRef.current = new Set(sorted.map(e => e.id).filter(Boolean));
            setNodeRedEventsBuffer(sorted);
            if (typeof data.total === 'number') {
              setNodeRedEventsTotal(data.total);
            }
          }

          if (data.buffer_limit != null) {
            nodeRedEventsBufferLimitRef.current = data.buffer_limit;
            setNodeRedEventsBufferLimit(data.buffer_limit);
          }
        } else if (topic === 'salesianos/robot/iban/events_derived') {
          // ── events_derived: incremental events from Node-RED ─────────────
          // Normalize data fields then re-classify safety events so Node-RED
          // level fallbacks ('info') are corrected before adding to the buffer.
          const incoming = normalizeEvents(Array.isArray(data.events) ? data.events : [])
            .map(reclassifyNodeRedSafetyEvent);
          const newEvents = incoming.filter(e => e.id && !nodeRedEventIdsRef.current.has(e.id));
          if (newEvents.length > 0) {
            newEvents.forEach(e => nodeRedEventIdsRef.current.add(e.id));
            setNodeRedEventsBuffer(prev => {
              // Prepend new events, then re-sort to maintain newest-first order
              // with priority as the tiebreaker for identical timestamps.
              const merged = [...newEvents, ...prev];
              merged.sort((a, b) => {
                const tsDiff = (b.ts ?? 0) - (a.ts ?? 0);
                if (tsDiff !== 0) return tsDiff;
                return (b.priority ?? 0) - (a.priority ?? 0);
              });
              // Use the buffer_limit published by Node-RED via events_buffer.
              const limit = nodeRedEventsBufferLimitRef.current;
              return (limit != null && merged.length > limit)
                ? merged.slice(0, limit)
                : merged;
            });
            if (typeof data.count === 'number') setNodeRedEventsTotal(data.count);
          }
        } else if (topic === 'salesianos/robot/iban/status') {
          // ── status topic: drives ONLINE/OFFLINE and lastMessageTime ──────────
          // This is the ONLY place that updates lastMessageTime and sets ONLINE.
          // The watchdog (below) will set OFFLINE if this heartbeat stops arriving.
          // data_status: 'active' → telemetry running; 'idle' → center reachable
          // but telemetry paused.  Both values keep the badge ONLINE.
          setLastMessageTime(now);
          setStatus('ONLINE');
          setStatusData(data);
          console.log('Estado del centro recibido (status topic):', data);
        } else {
          // ── principal topic ───────────────────────────────────────────────
          // Updates telemetryData and all diagnostic/event state.
          // Does NOT set status or lastMessageTime — that is driven solely by
          // the status topic above.

          // ── Derived Diagnostic Buffer ─────────────────────────────────────
          // Compara el estado MQTT anterior con el nuevo y genera los eventos que
          // correspondan.  La lógica de normalización y derivación está en
          // src/servicios/diagnosticBuffer.js para mantener este archivo limpio.
          const currDiagState = normalizeDiagnosticState(data, prevDiagStateRef.current);
          const newDiagEvents = deriveDiagnosticEvents(prevDiagStateRef.current, currDiagState);
          prevDiagStateRef.current = currDiagState;
          if (newDiagEvents.length > 0) {
            setDerivedDiagnosticBuffer(prev => {
              const updated = [...prev, ...newDiagEvents];
              return updated.length > MAX_DERIVED_DIAG_EVENTS
                ? updated.slice(updated.length - MAX_DERIVED_DIAG_EVENTS)
                : updated;
            });

            // Surface safety error events immediately in the last-error cache
            // so the UI (Diagnóstico page) can show them without waiting for
            // Node-RED to publish a diagnostico.last_error value.
            const safetyError = newDiagEvents.findLast(
              e => e.level === 'error' && e.code.startsWith('SAFETY_'),
            );
            if (safetyError) {
              setDiagnosticoLastError(safetyError.msg);
            }
          }

          // ── Diagnóstico last_error (direct from Node-RED payload) ─────────
          if (data.diagnostico?.last_error != null) {
            setDiagnosticoLastError(data.diagnostico.last_error);
          }

          // ── Diagnóstico messages (direct from Node-RED payload) ───────────
          // Replace with the latest full batch.  Node-RED sends cumulative
          // history on every message so there is no need to accumulate here.
          const rawDiagMessages = data.diagnostico?.messages ?? data.messages ?? null;
          if (rawDiagMessages !== null) {
            setDiagnosticoMessages(parseMsgBatch(rawDiagMessages));
          }

          setTelemetryData(data);

          // Accumulate new events into eventLog using content-based deduplication.
          // Each event is fingerprinted as "time|text".  Only events whose
          // fingerprint is not already in seenEventKeysRef are appended, so the
          // approach is robust regardless of whether the robot sends the full
          // cumulative history or only incremental updates on each MQTT message.
          const rawMessages = data.diagnostico?.messages ?? data.messages ?? null;
          if (rawMessages !== null) {
            const parsed = parseMsgBatch(rawMessages);
            const newMsgEvents = [];
            for (const e of parsed) {
              const key = `${e.time}|${e.text}`;
              if (!seenEventKeysRef.current.has(key)) {
                seenEventKeysRef.current.add(key);
                newMsgEvents.push(e);
              }
            }
            if (newMsgEvents.length > 0) {
              setEventLog(prev => [...prev, ...newMsgEvents]);
              // Update lastError with the most recent ERROR entry among new events.
              const latestError = newMsgEvents.findLast(e =>
                e.text.toUpperCase().includes('ERROR')
              );
              if (latestError) {
                setLastError(latestError.text);
              }
            }
          }

          console.log('Mensaje MQTT recibido en watchdog:', data);
        }
      } catch (error) {
        console.error('Error al parsear mensaje MQTT:', error);
      }
    });

    client.on('error', (error) => {
      console.error('Error en conexión MQTT:', error);
      setStatus('OFFLINE');
      setTelemetryData(null);
    });

    return () => {
      client.end();
      clientRef.current = null;
      console.log('Desconectado del broker MQTT (watchdog)');
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        STEP_CAPTURE_STORAGE_KEY,
        JSON.stringify(sortAndTrimStepCaptureRecords(stepCaptureRecords)),
      );
    } catch (error) {
      console.error('Error al guardar step_capture en localStorage:', error);
    }
  }, [stepCaptureRecords]);

  const publishCommand = useCallback((topic, payload) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topic, JSON.stringify(payload));
      console.log(`Comando publicado en ${topic}:`, payload);
    } else {
      console.warn('No se puede publicar: cliente MQTT no conectado');
    }
  }, []);

  const togglePauseStepCapture = useCallback(() => {
    setIsPausedStepCapture((prev) => {
      const next = !prev;
      isPausedStepCaptureRef.current = next;
      return next;
    });
  }, []);

  const clearStepCaptureRecords = useCallback(() => {
    setStepCaptureRecords([]);
  }, []);

  // Clears the accumulated event log.
  // Intentionally does NOT clear seenEventKeysRef so that old fingerprints
  // are retained.  The robot typically re-sends its full cumulative history
  // on every MQTT message; if the Set were emptied here, all those old events
  // would pass the !has(key) check on the very next message and immediately
  // refill the log — making the clear appear to have no effect.
  // By keeping the Set intact, old events stay filtered out forever, while
  // genuinely new events (new fingerprints) are still displayed as soon as
  // they arrive.
  const clearEventLog = useCallback(() => {
    setEventLog([]);
  }, []);

  const clearDerivedDiagnosticBuffer = useCallback(() => {
    setDerivedDiagnosticBuffer([]);
  }, []);

  // Watchdog Effect - Check for timeout every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastMessageTime) {
        const currentTime = Date.now();
        const timeSinceLastMessage = currentTime - lastMessageTime;
        
        // If more than 6 seconds (6000ms) have passed without a message
        if (timeSinceLastMessage > 6000 && status === 'ONLINE') {
          setStatus('OFFLINE');
          setTelemetryData(null);
          console.log('Watchdog: Sin mensajes durante 6 segundos - Estado: OFFLINE');
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [lastMessageTime, status]);

  const value = {
    status,
    lastMessageTime,
    telemetryData,
    stepCaptureRecords,
    currentProgram,
    currentChecksum,
    isPausedStepCapture,
    togglePauseStepCapture,
    clearStepCaptureRecords,
    publishCommand,
    eventLog,
    clearEventLog,
    lastError,
    // ── Derived Diagnostic Buffer ─────────────────────────────────────────
    derivedDiagnosticBuffer,
    clearDerivedDiagnosticBuffer,
    // ── Node-RED Events ───────────────────────────────────────────────────
    nodeRedEventsBuffer,
    nodeRedEventsTotal,
    nodeRedEventsBufferLimit,
    // ── Diagnóstico ───────────────────────────────────────────────────────
    diagnosticoLastError,
    diagnosticoMessages,
    statusData,
  };

  return (
    <MqttStatusContext.Provider value={value}>
      {children}
    </MqttStatusContext.Provider>
  );
};
