import './Monitor.css';

function Monitor() {
  return (
    <div className="monitor-page">
      <div className="universal-header">
        <h1 className="universal-title">Monitor del Sistema</h1>
        <p className="universal-description">Panel de monitorización en tiempo real de los sistemas robóticos</p>
      </div>
      
      <div className="monitor-content">
        <div className="monitor-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <h2>Monitor del Sistema</h2>
          <p>Este módulo está en desarrollo</p>
        </div>
      </div>
    </div>
  );
}

export default Monitor;
