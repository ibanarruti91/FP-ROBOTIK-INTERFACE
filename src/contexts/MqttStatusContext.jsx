import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import { MqttStatusContext } from './MqttStatusContext.js';

const MAX_STEP_CAPTURE_RECORDS = 50;

const ARROW_SEPARATOR = ' -> ';

/**
 * Normalises a raw messages value (string or array) into an array of
 * { time: string, text: string } objects so that the event log is always
 * stored in a uniform format regardless of what the robot sends.
 */
function parseMsgBatch(rawMessages) {
  if (Array.isArray(rawMessages)) {
    return rawMessages.map(msg => ({
      time: msg.hora ?? msg.time ?? '--:--:--',
      text: msg.msg ?? msg.mensaje ?? msg.txt ?? msg.message ?? '--',
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
          return { time: line.slice(0, arrowIdx).trim(), text: line.slice(arrowIdx + ARROW_SEPARATOR.length).trim() };
        }
        return { time: '', text: line };
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
  // On clearEventLog() only eventLog is reset; seenEventKeysRef is intentionally
  // kept intact so that:
  //  • events visible before the clear never reappear — their fingerprints are
  //    still in the Set, so subsequent MQTT messages that re-send the full
  //    cumulative history will have those events filtered out, and
  //  • genuinely new events (fingerprints not yet in the Set) are added
  //    immediately on the next MQTT message.
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
          return;
        }

        setLastMessageTime(now);
        setStatus('ONLINE');
        setTelemetryData(data);

        // Accumulate new events into eventLog using content-based deduplication.
        // Each event is fingerprinted as "time|text".  Only events whose
        // fingerprint is not already in seenEventKeysRef are appended, so the
        // approach is robust regardless of whether the robot sends the full
        // cumulative history or only incremental updates on each MQTT message.
        const rawMessages = data.diagnostico?.messages ?? data.messages ?? null;
        if (rawMessages !== null) {
          const parsed = parseMsgBatch(rawMessages);
          const newEvents = [];
          for (const e of parsed) {
            const key = `${e.time}|${e.text}`;
            if (!seenEventKeysRef.current.has(key)) {
              seenEventKeysRef.current.add(key);
              newEvents.push(e);
            }
          }
          if (newEvents.length > 0) {
            setEventLog(prev => [...prev, ...newEvents]);
          }
        }

        console.log('Mensaje MQTT recibido en watchdog:', data);
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

  // Clears the visible event log while keeping seenEventKeysRef intact.
  // Retaining the fingerprints prevents the robot's cumulative MQTT history
  // from re-populating the list after the user clears it.  Any event the
  // robot emits with a brand-new fingerprint will still appear immediately.
  const clearEventLog = useCallback(() => {
    setEventLog([]);
    // seenEventKeysRef is NOT cleared here intentionally — see comment above.
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
    clearEventLog
  };

  return (
    <MqttStatusContext.Provider value={value}>
      {children}
    </MqttStatusContext.Provider>
  );
};
