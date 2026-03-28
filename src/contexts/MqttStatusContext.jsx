import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import { MqttStatusContext } from './MqttStatusContext.js';

export const MqttStatusProvider = ({ children }) => {
  const [status, setStatus] = useState('OFFLINE');
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const clientRef = useRef(null);

  // MQTT Connection Effect
  useEffect(() => {
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');
    clientRef.current = client;

    client.on('connect', () => {
      console.log('Conectado al broker MQTT para watchdog');
      client.subscribe('salesianos/robot/iban/principal', (err) => {
        if (err) {
          console.error('Error al suscribirse al topic:', err);
        } else {
          console.log('Suscrito al topic: salesianos/robot/iban/principal');
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        // Only messages with bit_vida: true count for the Online/Offline watchdog
        if (data.bit_vida === true) {
          const now = Date.now();
          setLastMessageTime(now);
          setStatus('ONLINE');
          console.log('Mensaje MQTT recibido en watchdog (bit_vida: true):', data);
        }
        setTelemetryData(data);
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
        
        // If more than 5 seconds (5000ms) have passed without a bit_vida: true message
        if (timeSinceLastMessage > 5000 && status === 'ONLINE') {
          setStatus('OFFLINE');
          setTelemetryData(null);
          console.log('Watchdog: Sin mensajes bit_vida durante 5 segundos - Estado: OFFLINE');
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [lastMessageTime, status]);

  const value = {
    status,
    lastMessageTime,
    telemetryData,
    publishCommand
  };

  return (
    <MqttStatusContext.Provider value={value}>
      {children}
    </MqttStatusContext.Provider>
  );
};
