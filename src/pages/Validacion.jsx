import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import './Validacion.css';

const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_TOPIC = 'salesianos/robot/iban/step_capture';
const MAX_CAPTURES = 200;

let captureCounter = 0;

function exportToCSV(captures) {
  const headers = ['step_id', 'timestamp', 'program_name', 'x', 'y', 'z'];
  const rows = captures.map((c) => [
    c.step_id ?? '',
    c.timestamp ?? '',
    c.program_name ?? '',
    c.x != null ? c.x : '',
    c.y != null ? c.y : '',
    c.z != null ? c.z : '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `step_points_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function Validacion() {
  const [captures, setCaptures] = useState([]);
  const [mqttConnected, setMqttConnected] = useState(false);
  // isPausedRef avoids stale-closure in the MQTT message handler;
  // isPaused state drives the UI button toggle.
  const [isPaused, setIsPaused] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const isPausedRef = useRef(false);

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
      if (isPausedRef.current) return;
      try {
        const data = JSON.parse(message.toString());
        const capture = {
          _id: ++captureCounter,
          step_id: data.step_id,
          timestamp: data.timestamp,
          program_name: data.program_name ?? null,
          timestampFormatted: data.timestamp
            ? new Date(data.timestamp).toLocaleTimeString()
            : '—',
          x: data.tcp_position_mm?.x,
          y: data.tcp_position_mm?.y,
          z: data.tcp_position_mm?.z,
        };
        if (data.program_name) {
          setCurrentProgram(data.program_name);
        }
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

  const handlePause = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const handleClear = () => {
    setCaptures([]);
  };

  const handleExport = () => {
    exportToCSV(captures);
  };

  return (
    <div className="page-container">
      <div className="universal-header">
        <h1 className="universal-title">Registro de Step Points</h1>
        <p className="universal-description">
          Aquí se muestran los step points reales capturados durante la ejecución del programa activo del robot.
        </p>
      </div>

      <div className="page-content">
        <div className="info-card">
          <div className="card-icon">📋</div>
          <h2>Historial de Capturas</h2>
          {currentProgram && (
            <p className="program-name-badge">
              Programa activo: <strong>{currentProgram}</strong>
            </p>
          )}
          <p>
            {mqttConnected
              ? `Conectado · ${captures.length} captura${captures.length !== 1 ? 's' : ''} recibida${captures.length !== 1 ? 's' : ''}`
              : 'Conectando al broker MQTT…'}
          </p>
        </div>

        <div className="capture-controls">
          {isPaused ? (
            <button className="ctrl-btn ctrl-btn-start" onClick={handleResume}>
              ▶ Iniciar captura
            </button>
          ) : (
            <button className="ctrl-btn ctrl-btn-pause" onClick={handlePause}>
              ⏸ Pausar captura
            </button>
          )}
          <button className="ctrl-btn ctrl-btn-clear" onClick={handleClear}>
            🗑 Limpiar historial
          </button>
          <button
            className="ctrl-btn ctrl-btn-export"
            onClick={handleExport}
            disabled={captures.length === 0}
          >
            📥 Exportar a Excel
          </button>
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