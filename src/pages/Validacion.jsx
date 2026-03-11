import { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import './Validacion.css';

const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_TOPIC = 'salesianos/robot/iban/step_capture';
const MAX_CAPTURES = 200;

let captureCounter = 0;

function Validacion() {
  const [captures, setCaptures] = useState([]);
  const [mqttConnected, setMqttConnected] = useState(false);

  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER);

    client.on('connect', () => {
      console.log('Conectado al broker MQTT (step_capture)');
      setMqttConnected(true);
      client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          console.error('Error al suscribirse al topic:', err);
        } else {
          console.log('Suscrito al topic:', MQTT_TOPIC);
        }
      });
    });

    client.on('disconnect', () => setMqttConnected(false));
    client.on('error', (err) => {
      console.error('MQTT error:', err);
      setMqttConnected(false);
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const capture = {
          _id: ++captureCounter,
          step_id: data.step_id,
          timestamp: data.timestamp,
          timestampFormatted: data.timestamp
            ? new Date(data.timestamp).toLocaleTimeString()
            : '—',
          x: data.tcp_position_mm?.x,
          y: data.tcp_position_mm?.y,
          z: data.tcp_position_mm?.z,
        };
        setCaptures((prev) => [capture, ...prev].slice(0, MAX_CAPTURES));
      } catch (err) {
        console.error('Error al parsear mensaje MQTT:', err);
      }
    });

    return () => {
      try {
        client.end();
      } catch (err) {
        console.error('Error al cerrar la conexión MQTT:', err);
      }
    };
  }, []);

  return (
    <div className="page-container">
      <div className="universal-header">
        <h1 className="universal-title">Registro de Step Points Reales</h1>
        <p className="universal-description">
          Visualización en tiempo real de los step points capturados por el robot.
          Topic MQTT: <code>{MQTT_TOPIC}</code>
        </p>
      </div>

      <div className="page-content">
        <div className="info-card">
          <div className="card-icon">📍</div>
          <h2>Historial de Capturas</h2>
          <p>
            {mqttConnected
              ? `Conectado · ${captures.length} captura${captures.length !== 1 ? 's' : ''} recibida${captures.length !== 1 ? 's' : ''}`
              : 'Conectando al broker MQTT…'}
          </p>
        </div>

        <div className="step-captures-panel">
          <div className="step-captures-header">
            <span className="step-col step-col-id">Step ID</span>
            <span className="step-col step-col-timestamp">Timestamp</span>
            <span className="step-col step-col-coord">X (mm)</span>
            <span className="step-col step-col-coord">Y (mm)</span>
            <span className="step-col step-col-coord">Z (mm)</span>
          </div>

          <div className="step-captures-list">
            {captures.length === 0 ? (
              <div className="step-captures-empty">
                <span>Esperando capturas de step points…</span>
              </div>
            ) : (
              captures.map((c) => (
                <div key={c._id} className="step-capture-row">
                  <span className="step-col step-col-id">{c.step_id ?? '—'}</span>
                  <span className="step-col step-col-timestamp">
                    {c.timestampFormatted}
                  </span>
                  <span className="step-col step-col-coord">
                    {c.x != null ? c.x.toFixed(3) : '—'}
                  </span>
                  <span className="step-col step-col-coord">
                    {c.y != null ? c.y.toFixed(3) : '—'}
                  </span>
                  <span className="step-col step-col-coord">
                    {c.z != null ? c.z.toFixed(3) : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Validacion;