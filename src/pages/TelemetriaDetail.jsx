import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mqtt from 'mqtt';
import { CENTROS } from '../config/centros';
import { getMockTelemetryData } from '../servicios/iot';
import { SALESIANOS_LAYOUT } from '../ui/layouts/salesianos-urnieta.layout';
import WidgetRenderer from '../components/WidgetRenderer';
import { TelemetryMiniHeader } from '../components/TelemetryMiniHeader';
import { useMqttStatus } from '../hooks/useMqttStatus';
import './TelemetriaDetail.css';

// ── Numeric → String state maps (UR robot protocol) ──────────────────────────
const ROBOT_STATUS_MAP = {
  3: 'BOOTING',
  4: 'POWER_OFF',
  5: 'POWER_ON',
  7: 'RUNNING', // robot_status 7 (Running) and 8 (Pausing) both map to RUNNING
  8: 'RUNNING', // to keep a simple binary "machine is active" state in the UI
};
const ROBOT_MODE_MAP   = { 1: 'MANUAL', 2: 'AUTO', 3: 'REMOTE' };
const RUNTIME_STATE_MAP = { 1: 'STOPPED', 2: 'PLAYING', 3: 'PAUSED' };
const SAFETY_STATUS_MAP = { 1: 'NORMAL', 3: 'PROTECTIVE_STOP', 4: 'EMERGENCY_STOP' };

/**
 * Maps a numeric value using the provided lookup table.
 * String values are returned as-is; null/undefined are returned unchanged.
 */
function mapNumericState(map, value) {
  if (typeof value === 'number') return map[value] ?? String(value);
  return value;
}

function TelemetriaDetail() {
  const { centroId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('principal');
  const { status } = useMqttStatus();

  const centro = CENTROS[centroId];
  const layout = SALESIANOS_LAYOUT; // En el futuro, se podría cargar dinámicamente según el centro

  // Initialize telemetry with zero/null values
  const initialTelemetry = useMemo(() => 
    centro ? getMockTelemetryData(centro) : null, 
    [centro]
  );
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  // Raw MQTT payload – passed directly to TelemetryMiniHeader
  const [rawPayload, setRawPayload] = useState(null);

  // Calculate loading state based on centro and telemetry
  const loading = !centro || centro.estado === 'PROXIMAMENTE' ? false : !telemetry;

  useEffect(() => {
    if (!centro) {
      navigate('/centros');
      return;
    }
  }, [centroId, centro, navigate]);

  // MQTT Connection Effect
  useEffect(() => {
    if (!centro) {
      return;
    }

    // Connect to MQTT broker (as specified in requirements)
    // Note: broker URL and topic are configured per the project requirements
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

    client.on('connect', () => {
      console.log('Conectado al broker MQTT');
      // Subscribe to the topic (iban is the user identifier, not a bank account)
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
        // Parse the JSON message
        const data = JSON.parse(message.toString());
        console.log('Mensaje MQTT recibido:', data);

        // Store raw payload for TelemetryMiniHeader (reads new MQTT structure directly)
        setRawPayload(data);

        // Update telemetry state with incoming data
        setTelemetry((prevTelemetry) => {
          // Create a new telemetry object based on previous state or mock data
          const baseTelemetry = prevTelemetry || getMockTelemetryData(centro);

          // Resolve safety from new path (seguridad.safety) with fallback to estado.safety
          const rawSafety = data.seguridad?.safety ?? data.estado?.safety;
          const resolvedSafety = mapNumericState(SAFETY_STATUS_MAP, rawSafety) ?? baseTelemetry.seguridad?.safety ?? baseTelemetry.estado?.safety;

          // Capture raw RTDE numeric IDs before string mapping (used by the header badges)
          // Supports new MQTT format (rtde.robot_mode / rtde.safety_status / rtde.program_state)
          // and legacy formats with _id suffix or top-level keys
          const rawRobotMode    = data.rtde?.robot_mode       ?? data.rtde?.robot_mode_id    ?? data.robot_mode_id    ?? data.sistema?.estado_maquina;
          const rawProgramState = data.rtde?.program_state    ?? data.rtde?.program_state_id ?? data.program_state_id ?? data.programa?.estado;
          const rawSafetyId     = data.rtde?.safety_status    ?? data.rtde?.safety_status_id ?? data.safety_status_id ?? rawSafety;

          // Map incoming MQTT data to telemetry structure.
          // program_name / program_id are the new top-level fields from Node-RED.
          return {
            ...baseTelemetry,
            timestamp: new Date().toISOString(),
            // Map programa data.
            // `programa.id` is the new consolidated path; `programa.status_id` is the legacy path.
            // Both are kept for backward compatibility with existing widgets.
            programa: {
              nombre: data.program_name ?? data.programa?.nombre ?? baseTelemetry.programa?.nombre ?? '',
              // legacy field used by TelemetryMiniHeader; defaults to 0 (no program)
              status_id: data.program_id ?? data.programa?.status_id ?? data.programa?.id ?? baseTelemetry.programa?.status_id ?? 0,
              // new consolidated field; null means not provided
              id: data.program_id ?? data.programa?.id ?? data.programa?.status_id ?? baseTelemetry.programa?.id ?? null,
              ciclos: data.telemetry?.ciclos ?? data.programa?.ciclos ?? baseTelemetry.programa?.ciclos ?? null,
              estado: mapNumericState(RUNTIME_STATE_MAP, data.programa?.estado) ?? baseTelemetry.programa?.estado ?? null
            },
            // Map sistema data – apply numeric→string mappings
            sistema: {
              modo_operacion: mapNumericState(ROBOT_MODE_MAP, data.sistema?.modo_operacion) ?? baseTelemetry.sistema?.modo_operacion ?? '',
              estado_maquina: mapNumericState(ROBOT_STATUS_MAP, data.sistema?.estado_maquina) ?? baseTelemetry.sistema?.estado_maquina ?? '',
              potencia_total: data.sistema?.potencia_total ?? baseTelemetry.sistema?.potencia_total ?? 0,
              temperatura_control: data.sistema?.temperatura_control ?? baseTelemetry.sistema?.temperatura_control ?? 0,
              velocidad_tcp: data.sistema?.velocidad_tcp ?? baseTelemetry.sistema?.velocidad_tcp ?? null
            },
            // Map estadisticas data
            estadisticas: {
              tiempo_ciclo: data.estadisticas?.tiempo_ciclo ?? baseTelemetry.estadisticas?.tiempo_ciclo ?? 0,
              horas_operacion: data.estadisticas?.horas_operacion ?? baseTelemetry.estadisticas?.horas_operacion ?? 0
            },
            // Map eventos array
            eventos: data.eventos ?? baseTelemetry.eventos ?? [],
            // Map seguridad (new consolidated path: seguridad.safety)
            seguridad: {
              safety: resolvedSafety
            },
            // Map estado with safety/security fields (legacy + new path support)
            estado: {
              ...baseTelemetry.estado,
              online: data.estado?.online ?? baseTelemetry.estado?.online,
              mode: data.estado?.mode ?? baseTelemetry.estado?.mode,
              safety: resolvedSafety,
              emergencia_parada: data.estado?.emergencia_parada ?? baseTelemetry.estado?.emergencia_parada,
              proteccion: data.estado?.proteccion ?? baseTelemetry.estado?.proteccion,
              analogas: data.estado?.analogas ?? baseTelemetry.estado?.analogas
            },
            // Map tcp data
            tcp: {
              ...baseTelemetry.tcp,
              position: data.tcp?.position ?? baseTelemetry.tcp?.position,
              orientation: data.tcp?.orientation ?? baseTelemetry.tcp?.orientation,
              speed: data.tcp?.speed ?? baseTelemetry.tcp?.speed,
              velocity: data.tcp?.velocity ?? baseTelemetry.tcp?.velocity
            },
            joints: data.joints ?? baseTelemetry.joints,
            // Map digital I/O from MQTT data – four independent 8-element arrays
            digital_io: {
              inputs:               data.digital_io?.inputs               ?? baseTelemetry.digital_io?.inputs,
              outputs:              data.digital_io?.outputs              ?? baseTelemetry.digital_io?.outputs,
              configurable_inputs:  data.digital_io?.configurable_inputs  ?? baseTelemetry.digital_io?.configurable_inputs,
              configurable_outputs: data.digital_io?.configurable_outputs ?? baseTelemetry.digital_io?.configurable_outputs,
            },
            // Map analog I/O from MQTT data
            // Supports both analog_io.ai/ao and estado.analogas [AI0,AI1,AO0,AO1]
            analog_io: {
              ai: data.analog_io?.ai
                ?? (Array.isArray(data.estado?.analogas) ? data.estado.analogas.slice(0, 2) : undefined)
                ?? baseTelemetry.analog_io?.ai,
              ao: data.analog_io?.ao
                ?? (Array.isArray(data.estado?.analogas) ? data.estado.analogas.slice(2, 4) : undefined)
                ?? baseTelemetry.analog_io?.ao,
            },
            camera: {
              stream: data.camera?.stream ?? baseTelemetry.camera?.stream ?? ''
            },
            // Map herramienta data
            herramienta: {
              tension: data.herramienta?.tension ?? baseTelemetry.herramienta?.tension,
              corriente: data.herramienta?.corriente ?? baseTelemetry.herramienta?.corriente,
              potencia: data.herramienta?.potencia ?? baseTelemetry.herramienta?.potencia
            },
            // Map telemetry sub-object for the Menú Principal dashboard widgets.
            // Accepts the new Node-RED `payload.telemetry` format with fallback to
            // existing sistema/estadisticas fields for backward compatibility.
            // toNum() ensures all values are either a finite Number or null.
            telemetry: (() => {
              const toNum = (v) => {
                if (v === null || v === undefined) return null;
                const n = Number(v);
                return isFinite(n) ? n : null;
              };
              return {
                speed:           toNum(data.telemetry?.speed           ?? data.sistema?.velocidad_tcp),
                power:           toNum(data.telemetry?.power           ?? data.sistema?.potencia_total),
                controller_temp: toNum(data.telemetry?.controller_temp ?? data.sistema?.temperatura_control),
                main_voltage:    toNum(data.telemetry?.main_voltage),
                cpu_load:        toNum(data.telemetry?.cpu_load),
              };
            })(),
            // Raw RTDE protocol numeric IDs (before string mapping) – consumed by header badges
            rtde: {
              safety_status_id: typeof rawSafetyId === 'number' ? rawSafetyId : (baseTelemetry.rtde?.safety_status_id ?? null),
              robot_mode_id: typeof rawRobotMode === 'number' ? rawRobotMode : (baseTelemetry.rtde?.robot_mode_id ?? null),
              program_state_id: typeof rawProgramState === 'number' ? rawProgramState : (baseTelemetry.rtde?.program_state_id ?? null),
            }
          };
        });
      } catch (error) {
        console.error('Error al parsear mensaje MQTT:', error);
      }
    });

    client.on('error', (error) => {
      console.error('Error en conexión MQTT:', error);
    });

    // Cleanup on unmount
    return () => {
      client.end();
      console.log('Desconectado del broker MQTT');
    };
  }, [centro]);

  if (!centro) {
    return null;
  }

  if (centro.estado === 'PROXIMAMENTE') {
    return (
      <div className="page-container">   
        <div className="proximamente-container">
          <div className="proximamente-icon">🚧</div>
          <h1 className="proximamente-title">{centro.nombre}</h1>
          <p className="proximamente-text">
            La telemetría de este centro estará disponible próximamente
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Conectando con {centro.nombre}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="universal-header">
        <h1 className="universal-title">{centro.nombre}</h1>
        <p className="universal-description">Telemetría en tiempo real</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="tab-bar">
        {layout.tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            data-section={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mini Telemetry Header - Appears on all tabs */}
      <TelemetryMiniHeader data={rawPayload} />
      
      {/* Tab Content */}
      <div className={`tab-content ${status === 'OFFLINE' ? 'offline-mode' : ''}`} data-section={activeTab}>
        {layout.tabs
          .filter(tab => tab.id === activeTab)
          .map(tab => (
            <WidgetRenderer
              key={tab.id}
              groups={tab.groups}
              data={telemetry}
              sectionColor={tab.color}
              sectionId={tab.id}
            />
          ))
        }
      </div>

      {telemetry?.timestamp && (
        <div className="timestamp">
          Última actualización: {new Date(telemetry.timestamp).toLocaleString('es-ES')}
        </div>
      )}
    </div>
  );
}

export default TelemetriaDetail;
