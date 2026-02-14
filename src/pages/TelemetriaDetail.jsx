import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CENTROS } from '../config/centros';
import { getTelemetryLatest, getMockTelemetryData } from '../servicios/iot';
import './TelemetriaDetail.css';

function TelemetriaDetail() {
  const { centroId } = useParams();
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const centro = CENTROS[centroId];

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
          data = getMockTelemetryData();
        } else {
          // Intentar obtener datos reales
          data = await getTelemetryLatest(centro.baseUrl);
        }
        setTelemetry(data);
        setError(null);
      } catch (err) {
        console.error('Error al obtener telemetría:', err);
        setError('Sin conexión con IoT');
        // Usar datos mock como fallback
        setTelemetry(getMockTelemetryData());
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
        <button className="back-button" onClick={() => navigate('/centros')} aria-label="Volver a centros">
          ← Volver
        </button>
        
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
        <button className="back-button" onClick={() => navigate('/centros')} aria-label="Volver a centros">
          ← Volver
        </button>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Conectando con {centro.nombre}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="back-button" onClick={() => navigate('/centros')} aria-label="Volver a centros">
        ← Volver
      </button>
      
      <div className="page-header">
        <div>
          <h1 className="page-title">{centro.nombre}</h1>
          <p className="page-subtitle">Telemetría en tiempo real</p>
        </div>
        <div className="status-badges">
          {error ? (
            <div className="status-badge error">
              <span className="status-dot"></span>
              {error}
            </div>
          ) : (
            <div className="status-badge online">
              <span className="status-dot"></span>
              Conectado
            </div>
          )}
        </div>
      </div>
      
      <div className="telemetry-grid">
        {/* Estado del sistema */}
        {telemetry?.estado && (
          <div className="telemetry-card estado-card">
            <h3 className="card-title">Estado del Sistema</h3>
            <div className="card-content">
              <div className="metric-row">
                <span className="metric-label">Estado:</span>
                <span className={`metric-value ${telemetry.estado.online ? 'online' : 'offline'}`}>
                  {telemetry.estado.online ? 'Online' : 'Offline'}
                </span>
              </div>
              {telemetry.estado.mode && (
                <div className="metric-row">
                  <span className="metric-label">Modo:</span>
                  <span className="metric-value">{telemetry.estado.mode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TCP (Tool Center Point) */}
        {telemetry?.tcp && (
          <>
            <div className="telemetry-card tcp-card">
              <h3 className="card-title">TCP - Posición</h3>
              <div className="card-content">
                <div className="metric-row">
                  <span className="metric-label">X:</span>
                  <span className="metric-value">
                    {telemetry.tcp.position?.x?.toFixed(2) ?? '--'} mm
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Y:</span>
                  <span className="metric-value">
                    {telemetry.tcp.position?.y?.toFixed(2) ?? '--'} mm
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Z:</span>
                  <span className="metric-value">
                    {telemetry.tcp.position?.z?.toFixed(2) ?? '--'} mm
                  </span>
                </div>
              </div>
            </div>

            <div className="telemetry-card tcp-card">
              <h3 className="card-title">TCP - Velocidad</h3>
              <div className="card-content">
                <div className="metric-row">
                  <span className="metric-label">X:</span>
                  <span className="metric-value">
                    {telemetry.tcp.velocity?.x?.toFixed(2) ?? '--'} mm/s
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Y:</span>
                  <span className="metric-value">
                    {telemetry.tcp.velocity?.y?.toFixed(2) ?? '--'} mm/s
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Z:</span>
                  <span className="metric-value">
                    {telemetry.tcp.velocity?.z?.toFixed(2) ?? '--'} mm/s
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Joints */}
        {telemetry?.joints && (
          <>
            {telemetry.joints.positions && (
              <div className="telemetry-card joints-card">
                <h3 className="card-title">Joints - Posiciones</h3>
                <div className="card-content">
                  {telemetry.joints.positions.map((pos, index) => (
                    <div key={index} className="metric-row">
                      <span className="metric-label">J{index + 1}:</span>
                      <span className="metric-value">
                        {pos?.toFixed(2) ?? '--'}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {telemetry.joints.temperatures && (
              <div className="telemetry-card joints-card">
                <h3 className="card-title">Joints - Temperaturas</h3>
                <div className="card-content">
                  {telemetry.joints.temperatures.map((temp, index) => (
                    <div key={index} className="metric-row">
                      <span className="metric-label">J{index + 1}:</span>
                      <span className="metric-value">
                        {temp?.toFixed(1) ?? '--'}°C
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {telemetry.joints.currents && (
              <div className="telemetry-card joints-card">
                <h3 className="card-title">Joints - Corrientes</h3>
                <div className="card-content">
                  {telemetry.joints.currents.map((current, index) => (
                    <div key={index} className="metric-row">
                      <span className="metric-label">J{index + 1}:</span>
                      <span className="metric-value">
                        {current?.toFixed(3) ?? '--'} A
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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
