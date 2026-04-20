import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import { MqttStatusContext } from './MqttStatusContext.js';
import {
  MAX_DERIVED_DIAG_EVENTS,
  EMPTY_DIAG_STATE,
  normalizeDiagnosticState,
  deriveDiagnosticEvents,
} from '../servicios/diagnosticBuffer.js';

const MAX_STEP_CAPTURE_RECORDS = 50;

const ARROW_SEPARATOR = ' -> ';

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
  const [stepCaptureRecords, setStepCaptureRecords] = useState([]);
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

  // ── Diagnóstico (from principal.diagnostico.last_error) ──────────────────
  // Reflects Node-RED's own last_error field directly — no frontend inference.
  const [diagnosticoLastError, setDiagnosticoLastError] = useState(null);

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
      client.subscribe('salesianos/robot/iban/step_capture', (err) => {
        if (err) {
          console.error('Error al suscribirse al topic step_capture:', err);
        } else {
          console.log('Suscrito al topic: salesianos/robot/iban/step_capture');
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
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const now = Date.now();

        if (topic === 'salesianos/robot/iban/step_capture') {
          if (!isPausedStepCaptureRef.current) {
            const record = { ...data, _receivedAt: now };
            setStepCaptureRecords((prev) => {
              const updated = [...prev, record];
              return updated.length > MAX_STEP_CAPTURE_RECORDS
                ? updated.slice(updated.length - MAX_STEP_CAPTURE_RECORDS)
                : updated;
            });
          }
          if (data.program_name) {
            setCurrentProgram(data.program_name);
          }
          if (data.checksum != null) {
            setCurrentChecksum(data.checksum);
          }
        } else if (topic === 'salesianos/robot/iban/events_buffer') {
          // ── events_buffer: authoritative resync from Node-RED ───────────
          // Replace the buffer with the authoritative set from Node-RED.
          // Node-RED already limits the payload to buffer_limit items, so we
          // store the list as-is without further slicing.
          const events = Array.isArray(data.events) ? data.events : [];
          console.log('[MQTT] topic:', topic);
          console.log('[MQTT] events_buffer payload:', data);
          console.log('[MQTT] events_buffer events.length:', events.length);
          nodeRedEventIdsRef.current = new Set(events.map(e => e.id).filter(Boolean));
          setNodeRedEventsBuffer(events);
          console.log('[MQTT] nodeRedEventsBuffer state set to length:', events.length);
          if (typeof data.total === 'number') {
            setNodeRedEventsTotal(data.total);
            console.log('[MQTT] nodeRedEventsTotal set to:', data.total);
          }
          if (data.buffer_limit != null) {
            nodeRedEventsBufferLimitRef.current = data.buffer_limit;
            setNodeRedEventsBufferLimit(data.buffer_limit);
            console.log('[MQTT] nodeRedEventsBufferLimit set to:', data.buffer_limit);
          }
        } else if (topic === 'salesianos/robot/iban/events_derived') {
          // ── events_derived: incremental events from Node-RED ─────────────
          const incoming = Array.isArray(data.events) ? data.events : [];
          console.log('[MQTT] topic:', topic);
          console.log('[MQTT] events_derived payload:', data);
          console.log('[MQTT] events_derived incoming.length:', incoming.length);
          const newEvents = incoming.filter(e => e.id && !nodeRedEventIdsRef.current.has(e.id));
          console.log('[MQTT] events_derived newEvents (after dedup):', newEvents.length);
          if (newEvents.length > 0) {
            newEvents.forEach(e => nodeRedEventIdsRef.current.add(e.id));
            setNodeRedEventsBuffer(prev => {
              const merged = [...prev, ...newEvents];
              // Use the buffer_limit published by Node-RED via events_buffer.
              // nodeRedEventsBufferLimitRef is always current (updated in the
              // events_buffer handler before state setter to avoid stale closure).
              const limit = nodeRedEventsBufferLimitRef.current;
              const next = (limit != null && merged.length > limit)
                ? merged.slice(merged.length - limit)
                : merged;
              console.log('[MQTT] nodeRedEventsBuffer state after events_derived merge, length:', next.length);
              return next;
            });
            if (typeof data.count === 'number') setNodeRedEventsTotal(data.count);
          }
        } else {
          // ── principal topic ───────────────────────────────────────────────
          setLastMessageTime(now);
          setStatus('ONLINE');

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
          }

          // ── Diagnóstico last_error (direct from Node-RED payload) ─────────
          if (data.diagnostico?.last_error != null) {
            setDiagnosticoLastError(data.diagnostico.last_error);
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
  };

  return (
    <MqttStatusContext.Provider value={value}>
      {children}
    </MqttStatusContext.Provider>
  );
};
