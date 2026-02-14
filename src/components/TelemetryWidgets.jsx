/**
 * Componentes reutilizables para widgets de telemetría
 */

import './TelemetryWidgets.css';

/**
 * Contenedor con estilo glassmorphism
 */
export function CardGlass({ children, className = '' }) {
  return (
    <div className={`card-glass ${className}`}>
      {children}
    </div>
  );
}

/**
 * Tarjeta KPI - muestra label, valor grande y unidad
 */
export function KpiCard({ label, value, unit, className = '' }) {
  const displayValue = value ?? '--';
  
  return (
    <CardGlass className={`kpi-card ${className}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value-container">
        <span className="kpi-value">{displayValue}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
    </CardGlass>
  );
}

/**
 * Píldora de estado con colores según tipo
 */
export function StatusPill({ label, value, statusType, className = '' }) {
  const displayValue = value ?? '--';
  
  let statusClass = '';
  if (statusType === 'online') {
    statusClass = value ? 'status-online' : 'status-offline';
  } else if (statusType === 'mode') {
    statusClass = 'status-mode';
  } else if (statusType === 'safety') {
    statusClass = value === 'NORMAL' ? 'status-safe' : 'status-warning';
  }
  
  const displayText = statusType === 'online' 
    ? (value ? 'ONLINE' : 'OFFLINE')
    : displayValue;
  
  return (
    <CardGlass className={`status-pill ${className}`}>
      <div className="status-label">{label}</div>
      <div className={`status-value ${statusClass}`}>
        <span className="status-dot"></span>
        {displayText}
      </div>
    </CardGlass>
  );
}

/**
 * Tabla de datos para ejes (Joint 1..6)
 */
export function DataTable({ label, data, unit, format }) {
  if (!data || !Array.isArray(data)) {
    return (
      <CardGlass className="data-table">
        <div className="table-title">{label}</div>
        <div className="table-empty">No hay datos disponibles</div>
      </CardGlass>
    );
  }
  
  const formatValue = (val) => {
    if (val === null || val === undefined) return '--';
    const decimals = parseInt(format, 10);
    const validDecimals = isNaN(decimals) ? 2 : Math.max(0, decimals);
    return typeof val === 'number' ? val.toFixed(validDecimals) : val;
  };
  
  return (
    <CardGlass className="data-table">
      <div className="table-title">{label}</div>
      <div className="table-grid">
        {data.map((value, index) => (
          <div key={index} className="table-cell">
            <div className="cell-label">J{index + 1}</div>
            <div className="cell-value">
              {formatValue(value)} {unit}
            </div>
          </div>
        ))}
      </div>
    </CardGlass>
  );
}

/**
 * Panel de logs/mensajes
 */
export function LogPanel({ messages, className = '' }) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return (
      <CardGlass className={`log-panel ${className}`}>
        <div className="log-title">Registro de Eventos</div>
        <div className="log-empty">No hay mensajes</div>
      </CardGlass>
    );
  }
  
  return (
    <CardGlass className={`log-panel ${className}`}>
      <div className="log-title">Registro de Eventos</div>
      <div className="log-messages">
        {messages.map((msg, index) => (
          <div key={index} className="log-message">
            <span className="log-time">
              {msg.time ? new Date(msg.time).toLocaleTimeString('es-ES') : '--:--:--'}
            </span>
            <span className="log-text">{msg.txt || msg.message || '--'}</span>
          </div>
        ))}
      </div>
    </CardGlass>
  );
}
