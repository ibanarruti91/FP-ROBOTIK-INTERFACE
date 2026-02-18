import { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { MqttStatusContext } from './MqttStatusContext.js';

export const MqttStatusProvider = ({ children }) => {
  const [status, setStatus] = useState('OFFLINE');
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);

  // MQTT Connection Effect
  useEffect(() => {
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

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
        const now = Date.now();
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
    });

    return () => {
      client.end();
      console.log('Desconectado del broker MQTT (watchdog)');
    };
  }, []);

  // Watchdog Effect - High-speed check for timeout every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastMessageTime) {
        const currentTime = Date.now();
        const timeSinceLastMessage = currentTime - lastMessageTime;
        
        // If more than 3 seconds (3000ms) have passed without a message
        if (timeSinceLastMessage > 3000 && status === 'ONLINE') {
          setStatus('OFFLINE');
          console.log('Watchdog: Sin mensajes durante 3 segundos - Estado: OFFLINE');
        }
      }
    }, 500); // Check every 500ms for high-speed monitoring

    return () => clearInterval(interval);
  }, [lastMessageTime, status]);

  const value = {
    status,
    isOnline: status === 'ONLINE',
    lastMessageTime,
    telemetryData
  };

  return (
    <MqttStatusContext.Provider value={value}>
      {children}
    </MqttStatusContext.Provider>
  );
};
