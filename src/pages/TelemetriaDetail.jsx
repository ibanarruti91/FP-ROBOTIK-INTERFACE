import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CENTROS } from '../config/centros';
import { getTelemetryLatest, getMockTelemetryData } from '../servicios/iot';
import { SALESIANOS_LAYOUT } from '../ui/layouts/salesianos-urnieta.layout';
import WidgetRenderer from '../components/WidgetRenderer';
import './TelemetriaDetail.css';

function TelemetriaDetail() {
  const { centroId } = useParams();
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('principal');

  const centro = CENTROS[centroId];
  const layout = SALESIANOS_LAYOUT; // En el futuro, se podría cargar dinámicamente según el centro

  useEffect(() => {
    if (!centro) {
      navigate('/centros');
      return;
    }

    if (centro.estado === 'PROXIMAMENTE') {
      setLoading(false);
      return;
    }

    // Función para obtener datos
    const fetchData = async () => {
      try {
        let data;
        if (!centro.baseUrl || centro.baseUrl === "") {
          // Usar datos mock si no hay URL configurada
          data = getMockTelemetryData(centro);
        } else {
          // Intentar obtener datos reales
          data = await getTelemetryLatest(centro.baseUrl);
        }
        setTelemetry(data);
      } catch (err) {
        console.error('Error al obtener telemetría:', err);
        // Usar datos mock como fallback
        setTelemetry(getMockTelemetryData(centro));
      } finally {
        setLoading(false);
      }
    };

    // Fetch inicial
    fetchData();

    // Actualizar cada 1 segundo
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, [centroId, centro, navigate]);

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
