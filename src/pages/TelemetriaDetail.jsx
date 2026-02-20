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

        // Update telemetry state with incoming data
        setTelemetry((prevTelemetry) => {
          // Create a new telemetry object based on previous state or mock data
          const baseTelemetry = prevTelemetry || getMockTelemetryData(centro);
          
          // Map incoming MQTT data to telemetry structure
          return {
            ...baseTelemetry,
            timestamp: new Date().toISOString(),
            // Map programa data
            programa: {
              nombre: data.programa?.nombre ?? baseTelemetry.programa?.nombre ?? '',
              status_id: data.programa?.status_id ?? baseTelemetry.programa?.status_id ?? 0,
              estado: data.programa?.estado ?? baseTelemetry.programa?.estado ?? null
            },
            // Map sistema data (including new velocidad_tcp field)
            sistema: {
              modo_operacion: data.sistema?.modo_operacion ?? baseTelemetry.sistema?.modo_operacion ?? '',
              estado_maquina: data.sistema?.estado_maquina ?? baseTelemetry.sistema?.estado_maquina ?? '',
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
            // Map estado with safety/security fields
            estado: {
              ...baseTelemetry.estado,
              online: data.estado?.online ?? baseTelemetry.estado?.online,
              mode: data.estado?.mode ?? baseTelemetry.estado?.mode,
              safety: data.estado?.safety ?? baseTelemetry.estado?.safety,
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
            // Map digital I/O from MQTT data
            digital_io: data.digital_io ?? baseTelemetry.digital_io,
            // Map analog I/O from MQTT data
            analog_io: data.analog_io ?? baseTelemetry.analog_io,
            camera: {
              stream: data.camera?.stream ?? baseTelemetry.camera?.stream ?? ''
            },
            // Map herramienta data
            herramienta: {
              tension: data.herramienta?.tension ?? baseTelemetry.herramienta?.tension,
              corriente: data.herramienta?.corriente ?? baseTelemetry.herramienta?.corriente,
              potencia: data.herramienta?.potencia ?? baseTelemetry.herramienta?.potencia
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
      <TelemetryMiniHeader data={telemetry} />
      
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
