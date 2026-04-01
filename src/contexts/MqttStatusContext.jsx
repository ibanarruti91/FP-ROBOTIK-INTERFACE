import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import { MqttStatusContext } from './MqttStatusContext.js';

const MAX_STEP_CAPTURE_RECORDS = 50;

export const MqttStatusProvider = ({ children }) => {
  const [status, setStatus] = useState('OFFLINE');
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [stepCaptureRecords, setStepCaptureRecords] = useState([]);
  const clientRef = useRef(null);

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
          const record = { ...data, _receivedAt: now };
          setStepCaptureRecords((prev) => {
            const updated = [...prev, record];
            return updated.length > MAX_STEP_CAPTURE_RECORDS
              ? updated.slice(updated.length - MAX_STEP_CAPTURE_RECORDS)
              : updated;
          });
          return;
        }

        setLastMessageTime(now);
        setStatus('ONLINE');
        setTelemetryData(data);
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
    publishCommand
  };

  return (
    <MqttStatusContext.Provider value={value}>
      {children}
    </MqttStatusContext.Provider>
  );
};
