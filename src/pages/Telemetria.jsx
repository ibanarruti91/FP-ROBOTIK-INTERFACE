import { useNavigate } from 'react-router-dom';
import './Telemetria.css';

function Telemetria() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Telemetría avanzada</h1>
        <div className="status-badge online">
          <span className="status-dot"></span>
          Sistema Online
        </div>
      </div>
      
      <div className="page-content">
        <div className="info-card">
          <div className="card-icon">📊</div>
          <h2>Sistema de Telemetría</h2>
          <p>
            Módulo de monitoreo en tiempo real para centros de control robótico.
            Sistema de métricas avanzadas y análisis de rendimiento.
          </p>
        </div>

        <div className="grid-layout">
          <div className="metric-card">
            <h3>CPU Usage</h3>
            <div className="metric-value">45%</div>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '45%', background: 'var(--accent-cyan)' }}></div>
            </div>
          </div>

          <div className="metric-card">
            <h3>Memory</h3>
            <div className="metric-value">2.4 GB</div>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '60%', background: 'var(--accent-purple)' }}></div>
            </div>
          </div>

          <div className="metric-card">
            <h3>Network</h3>
            <div className="metric-value">125 Mbps</div>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '80%', background: 'var(--accent-magenta)' }}></div>
            </div>
          </div>

          <div className="metric-card">
            <h3>Storage</h3>
            <div className="metric-value">67%</div>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '67%', background: 'var(--accent-online)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Telemetria;
