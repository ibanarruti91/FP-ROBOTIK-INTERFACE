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
              status_id: data.programa?.status_id ?? baseTelemetry.programa?.status_id ?? 0
            },
            // Map sistema data
            sistema: {
              modo_operacion: data.sistema?.modo_operacion ?? baseTelemetry.sistema?.modo_operacion ?? '',
              estado_maquina: data.sistema?.estado_maquina ?? baseTelemetry.sistema?.estado_maquina ?? '',
              potencia_total: data.sistema?.potencia_total ?? baseTelemetry.sistema?.potencia_total ?? 0,
              temperatura_control: data.sistema?.temperatura_control ?? baseTelemetry.sistema?.temperatura_control ?? 0
            },
            // Map estadisticas data
            estadisticas: {
              tiempo_ciclo: data.estadisticas?.tiempo_ciclo ?? baseTelemetry.estadisticas?.tiempo_ciclo ?? 0,
              horas_operacion: data.estadisticas?.horas_operacion ?? baseTelemetry.estadisticas?.horas_operacion ?? 0
            },
            // Map eventos array
            eventos: data.eventos ?? baseTelemetry.eventos ?? [],
            // Keep existing data for other tabs
            estado: baseTelemetry.estado,
            tcp: baseTelemetry.tcp,
            joints: baseTelemetry.joints,
            digital_io: baseTelemetry.digital_io,
            // Map analog IO data
            analog_io: {
              inputs: data.analog_io?.inputs ?? baseTelemetry.analog_io?.inputs ?? Array(4).fill(null),
              outputs: data.analog_io?.outputs ?? baseTelemetry.analog_io?.outputs ?? Array(4).fill(null)
            },
            // Map tool data
            tool: {
              voltage: data.tool?.voltage ?? baseTelemetry.tool?.voltage ?? null,
              current: data.tool?.current ?? baseTelemetry.tool?.current ?? null
            },
            camera: baseTelemetry.camera
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
    <div className="page-container td-has-bottom-nav">
      <div className="universal-header">
        <h1 className="universal-title">{centro.nombre}</h1>
        <p className="universal-description">Telemetría en tiempo real</p>
      </div>
      
      {/* Tab Navigation (top - hidden when bottom nav is present) */}
      <div className="tab-bar tab-bar-top">
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

      {/* Fixed Bottom Navigation - Neon round buttons */}
      <nav className="bottom-nav">
        {layout.tabs.map(tab => (
          <button
            key={tab.id}
            className={`bottom-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--tab-color': tab.color }}
            aria-label={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default TelemetriaDetail;
