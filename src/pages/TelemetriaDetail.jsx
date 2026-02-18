import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mqtt from 'mqtt';
import { CENTROS } from '../config/centros';
import { getMockTelemetryData } from '../servicios/iot';
import { SALESIANOS_LAYOUT } from '../ui/layouts/salesianos-urnieta.layout';
import WidgetRenderer from '../components/WidgetRenderer';
import './TelemetriaDetail.css';

function TelemetriaDetail() {
  const { centroId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('principal');

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
      client.subscribe('salesianos/robot/iban', (err) => {
        if (err) {
          console.error('Error al suscribirse al topic:', err);
        } else {
          console.log('Suscrito al topic: salesianos/robot/iban');
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
          
          // Extract j1_temp with fallback to 'temperatura' field
          const j1Temp = data.j1_temp !== undefined ? data.j1_temp : 
                        (data.temperatura !== undefined ? data.temperatura : baseTelemetry.joints.temperatures[0]);
          
          // Extract j1_ang with fallback
          const j1Ang = data.j1_ang !== undefined ? data.j1_ang : baseTelemetry.joints.positions[0];
          
          // Update the data structure to match the expected format
          return {
            ...baseTelemetry,
            timestamp: new Date().toISOString(),
            // Update j1_temp in joints.temperatures[0]
            joints: {
              ...baseTelemetry.joints,
              temperatures: [
                j1Temp,
                ...baseTelemetry.joints.temperatures.slice(1)
              ],
              positions: [
                j1Ang,
                ...baseTelemetry.joints.positions.slice(1)
              ]
            },
            // Update estado if provided
            estado: {
              ...baseTelemetry.estado,
              ...(data.estado !== undefined && { mode: data.estado })
            },
            // Add test_id to the data structure
            test_id: data.test_id !== undefined ? data.test_id : baseTelemetry.test_id
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
      
      {/* Tab Content */}
      <div className="tab-content" data-section={activeTab}>
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
