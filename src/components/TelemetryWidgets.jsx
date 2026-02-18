/**
 * Componentes reutilizables para widgets de telemetría
 */

import { useState, useEffect, useRef } from 'react';
import './TelemetryWidgets.css';

/**
 * Counting animation for numeric values
 */
function useCountingAnimation(targetValue, duration = 500) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const previousValueRef = useRef(targetValue);
  const isNonNumeric = typeof targetValue !== 'number' || isNaN(targetValue);
  
  useEffect(() => {
    // Handle non-numeric values
    if (isNonNumeric) {
      return;
    }
    
    const startValue = previousValueRef.current;
    const diff = targetValue - startValue;
    
    // Only animate if the change is significant
    if (Math.abs(diff) < 0.01) {
      previousValueRef.current = targetValue;
      return;
    }
    
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (diff * eased);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValueRef.current = targetValue;
      }
    };
    
    requestAnimationFrame(animate);
  }, [targetValue, duration, isNonNumeric]);
  
  // Return the actual target value for non-numeric values
  return isNonNumeric ? targetValue : displayValue;
}

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
export function KpiCard({ label, value, unit, className = '', compact = false, format = '0' }) {
  const isValueAvailable = value !== null && value !== undefined && value !== '';
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountingAnimation(numericValue || 0, 400);
  
  let displayValue;
  let isNA = false;
  
  if (!isValueAvailable) {
    displayValue = 'N/A';
    isNA = true;
  } else if (numericValue !== null) {
    // Format the animated value with the specified format
    const decimals = parseInt(format, 10);
    const validDecimals = isNaN(decimals) ? 0 : Math.max(0, decimals);
    displayValue = animatedValue.toFixed(validDecimals);
  } else {
    // For text values, display as-is
    displayValue = value;
  }
  
  return (
    <CardGlass className={`kpi-card ${compact ? 'kpi-compact' : ''} ${className}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value-container">
        <span className={`kpi-value ${isNA ? 'value-na' : ''}`}>{displayValue}</span>
        {unit && !isNA && <span className="kpi-unit">{unit}</span>}
      </div>
    </CardGlass>
  );
}

/**
 * Píldora de estado con colores según tipo
 */
export function StatusPill({ label, value, statusType, className = '' }) {
  const isValueAvailable = value !== null && value !== undefined && value !== '';
  const displayValue = isValueAvailable ? value : 'N/A';
  const isNA = !isValueAvailable;
  
  let statusClass = '';
  if (!isNA) {
    if (statusType === 'online') {
      statusClass = value ? 'status-online' : 'status-offline';
    } else if (statusType === 'mode') {
      statusClass = 'status-mode';
    } else if (statusType === 'safety') {
      statusClass = value === 'NORMAL' ? 'status-safe' : 'status-warning';
    }
  }
  
  const displayText = statusType === 'online' && !isNA
    ? (value ? 'ONLINE' : 'OFFLINE')
    : displayValue;
  
  return (
    <CardGlass className={`status-pill ${className}`}>
      <div className="status-label">{label}</div>
      <div className={`status-value ${statusClass} ${isNA ? 'value-na' : ''}`}>
        {!isNA && <span className="status-dot"></span>}
        {displayText}
      </div>
    </CardGlass>
  );
}

/**
 * Dynamic Status Widget with custom colors for estado_maquina and modo_operacion
 */
export function StatusDynamic({ label, value, statusType, className = '', compact = false }) {
  const isValueAvailable = value !== null && value !== undefined && value !== '';
  const displayValue = isValueAvailable ? value : 'N/A';
  const isNA = !isValueAvailable;
  
  let statusClass = '';
  let shouldBlink = false;
  
  if (!isNA) {
    if (statusType === 'estado_maquina') {
      if (value === 'POWER_ON') {
        statusClass = 'status-power-on';
      } else if (value === 'POWER_OFF') {
        statusClass = 'status-power-off';
      } else if (value === 'EMERGENCY_STOP') {
        statusClass = 'status-emergency';
        shouldBlink = true;
      }
    } else if (statusType === 'modo_operacion') {
      if (value === 'REMOTE' || value === 'AUTO') {
        statusClass = 'status-remote-auto';
      } else if (value === 'MANUAL') {
        statusClass = 'status-manual';
      }
    }
  }
  
  return (
    <CardGlass className={`status-dynamic ${compact ? 'status-compact' : ''} ${className}`}>
      <div className="status-label">{label}</div>
      <div className={`status-value ${statusClass} ${shouldBlink ? 'blink' : ''} ${isNA ? 'value-na' : ''}`}>
        {!isNA && <span className="status-dot"></span>}
        {displayValue}
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
    if (val === null || val === undefined) return 'N/A';
    const decimals = parseInt(format, 10);
    const validDecimals = isNaN(decimals) ? 2 : Math.max(0, decimals);
    return typeof val === 'number' ? val.toFixed(validDecimals) : val;
  };
  
  return (
    <CardGlass className="data-table">
      <div className="table-title">{label}</div>
      <div className="table-grid">
        {data.map((value, index) => {
          const formattedValue = formatValue(value);
          const isNA = formattedValue === 'N/A';
          return (
            <div key={index} className="table-cell">
              <div className="cell-label">J{index + 1}</div>
              <div className={`cell-value ${isNA ? 'value-na' : ''}`}>
                {formattedValue} {!isNA && unit}
              </div>
            </div>
          );
        })}
      </div>
    </CardGlass>
  );
}

/**
 * Panel de logs/mensajes
 */
export function LogPanel({ messages, className = '', compact = false }) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return (
      <CardGlass className={`log-panel ${compact ? 'log-compact' : ''} ${className}`}>
        <div className="log-title">Registro de Eventos</div>
        <div className="log-empty">No hay mensajes</div>
      </CardGlass>
    );
  }
  
  return (
    <CardGlass className={`log-panel ${compact ? 'log-compact' : ''} ${className}`}>
      <div className="log-title">Registro de Eventos</div>
      <div className="log-messages">
        {messages.map((msg, index) => {
          // Handle different time formats from MQTT
          let timeDisplay = '--:--:--';
          if (msg.hora) {
            timeDisplay = msg.hora;
          } else if (msg.time) {
            timeDisplay = msg.time;
          }
          
          // Handle different message field names
          const messageText = msg.msg || msg.mensaje || msg.txt || msg.message || '--';
          
          return (
            <div key={index} className="log-message">
              <span className="log-time">{timeDisplay}</span>
              <span className="log-text">{messageText}</span>
            </div>
          );
        })}
      </div>
    </CardGlass>
  );
}

/**
 * Safety Panel - Panel de seguridad con máxima prioridad visual
 */
export function SafetyPanel({ value, className = '' }) {
  const safetyStates = {
    'NORMAL': { label: 'NORMAL', color: '#10b981', icon: '✓' },
    'REDUCED': { label: 'REDUCIDO', color: '#ffbf00', icon: '⚠' },
    'PROTECTIVE_STOP': { label: 'PARADA PROTECTIVA', color: '#ff33bb', icon: '⛔' }
  };
  
  const isValueAvailable = value !== null && value !== undefined && value !== '';
  const state = isValueAvailable && safetyStates[value] 
    ? safetyStates[value] 
    : { label: 'N/A', color: '#6b7280', icon: '?' };
  const isNA = !isValueAvailable;
  
  return (
    <CardGlass className={`safety-panel ${className}`}>
      <div className="safety-header">
        <div className="safety-icon" style={{ color: state.color }}>
          {state.icon}
        </div>
        <div className="safety-content">
          <div className="safety-label">ESTADO DE SEGURIDAD</div>
          <div className={`safety-value ${isNA ? 'value-na' : ''}`} style={{ color: state.color }}>
            {state.label}
          </div>
        </div>
      </div>
      <div className="safety-indicator" style={{ backgroundColor: state.color }}></div>
    </CardGlass>
  );
}

/**
 * Digital IO - Matriz de 32 LEDs para entradas/salidas digitales
 */
export function DigitalIO({ data, className = '' }) {
  const inputs = data?.inputs || Array(16).fill(null);
  const outputs = data?.outputs || Array(16).fill(null);
  
  return (
    <CardGlass className={`digital-io ${className}`}>
      <div className="io-section">
        <div className="io-section-title">Entradas Digitales (DI)</div>
        <div className="io-grid">
          {inputs.map((active, index) => (
            <div key={`in-${index}`} className="io-led">
              <div className="io-led-label">DI{index}</div>
              <div className={`io-led-indicator ${active === true ? 'active' : ''} ${active === null ? 'value-na' : ''}`}></div>
            </div>
          ))}
        </div>
      </div>
      <div className="io-section">
        <div className="io-section-title">Salidas Digitales (DO)</div>
        <div className="io-grid">
          {outputs.map((active, index) => (
            <div key={`out-${index}`} className="io-led">
              <div className="io-led-label">DO{index}</div>
              <div className={`io-led-indicator ${active === true ? 'active' : ''} ${active === null ? 'value-na' : ''}`}></div>
            </div>
          ))}
        </div>
      </div>
    </CardGlass>
  );
}

/**
 * TCP Pose - Tarjeta específica para mostrar posición y orientación TCP
 */
export function TcpPose({ data, className = '' }) {
  const pos = data?.position || {};
  const orient = data?.orientation || {};
  
  const formatValue = (val, decimals = 2) => {
    if (val === null || val === undefined) return 'N/A';
    return typeof val === 'number' ? val.toFixed(decimals) : val;
  };
  
  return (
    <CardGlass className={`tcp-pose ${className}`}>
      <div className="tcp-pose-title">TCP Pose</div>
      <div className="tcp-pose-grid">
        <div className="tcp-pose-section">
          <div className="tcp-pose-section-label">Posición</div>
          <div className="tcp-pose-values">
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">X</span>
              <span className={`tcp-pose-value ${formatValue(pos.x, 2) === 'N/A' ? 'value-na' : ''}`}>{formatValue(pos.x, 2)}</span>
              {formatValue(pos.x, 2) !== 'N/A' && <span className="tcp-pose-unit">mm</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">Y</span>
              <span className={`tcp-pose-value ${formatValue(pos.y, 2) === 'N/A' ? 'value-na' : ''}`}>{formatValue(pos.y, 2)}</span>
              {formatValue(pos.y, 2) !== 'N/A' && <span className="tcp-pose-unit">mm</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">Z</span>
              <span className={`tcp-pose-value ${formatValue(pos.z, 2) === 'N/A' ? 'value-na' : ''}`}>{formatValue(pos.z, 2)}</span>
              {formatValue(pos.z, 2) !== 'N/A' && <span className="tcp-pose-unit">mm</span>}
            </div>
          </div>
        </div>
        <div className="tcp-pose-section">
          <div className="tcp-pose-section-label">Orientación</div>
          <div className="tcp-pose-values">
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RX</span>
              <span className={`tcp-pose-value ${formatValue(orient.rx, 3) === 'N/A' ? 'value-na' : ''}`}>{formatValue(orient.rx, 3)}</span>
              {formatValue(orient.rx, 3) !== 'N/A' && <span className="tcp-pose-unit">rad</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RY</span>
              <span className={`tcp-pose-value ${formatValue(orient.ry, 3) === 'N/A' ? 'value-na' : ''}`}>{formatValue(orient.ry, 3)}</span>
              {formatValue(orient.ry, 3) !== 'N/A' && <span className="tcp-pose-unit">rad</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RZ</span>
              <span className={`tcp-pose-value ${formatValue(orient.rz, 3) === 'N/A' ? 'value-na' : ''}`}>{formatValue(orient.rz, 3)}</span>
              {formatValue(orient.rz, 3) !== 'N/A' && <span className="tcp-pose-unit">rad</span>}
            </div>
          </div>
        </div>
      </div>
    </CardGlass>
  );
}

/**
 * Joints Grid - Rejilla de 6 bloques para articulaciones con barras de temperatura
 */
export function JointsGrid({ data, className = '' }) {
  const positions = data?.positions || Array(6).fill(null);
  const temperatures = data?.temperatures || Array(6).fill(null);
  const currents = data?.currents || Array(6).fill(null);
  
  const formatValue = (val, decimals = 2) => {
    if (val === null || val === undefined) return 'N/A';
    return typeof val === 'number' ? val.toFixed(decimals) : val;
  };
  
  // Normalizar temperatura para la barra (0-100%)
  const getTempPercentage = (temp) => {
    if (temp === null || temp === undefined || typeof temp !== 'number') return 0;
    const min = 20;
    const max = 50;
    const normalized = ((temp - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, normalized));
  };
  
  // Color de la barra según temperatura
  const getTempColor = (temp) => {
    if (temp === null || temp === undefined || typeof temp !== 'number') return '#6b7280'; // Gray for N/A
    if (temp < 30) return '#10b981'; // Verde
    if (temp < 40) return '#ffbf00'; // Ámbar
    return '#ff33bb'; // Rojo
  };
  
  return (
    <CardGlass className={`joints-grid ${className}`}>
      <div className="joints-grid-container">
        {positions.map((pos, index) => {
          const posValue = formatValue(pos, 3);
          const currentValue = formatValue(currents[index], 2);
          const tempValue = formatValue(temperatures[index], 1);
          const isPosNA = posValue === 'N/A';
          const isCurrentNA = currentValue === 'N/A';
          const isTempNA = tempValue === 'N/A';
          
          return (
            <div key={index} className="joint-block">
              <div className="joint-header">
                <span className="joint-label">J{index + 1}</span>
              </div>
              <div className="joint-data">
                <div className="joint-metric">
                  <span className="joint-metric-label">Pos</span>
                  <span className={`joint-metric-value ${isPosNA ? 'value-na' : ''}`}>{posValue}</span>
                  {!isPosNA && <span className="joint-metric-unit">rad</span>}
                </div>
                <div className="joint-metric">
                  <span className="joint-metric-label">Cur</span>
                  <span className={`joint-metric-value ${isCurrentNA ? 'value-na' : ''}`}>{currentValue}</span>
                  {!isCurrentNA && <span className="joint-metric-unit">A</span>}
                </div>
              </div>
              <div className="joint-temp-section">
                <div className={`joint-temp-label ${isTempNA ? 'value-na' : ''}`}>
                  Temperatura: {tempValue}{!isTempNA && '°C'}
                </div>
                <div className="joint-temp-bar-container">
                  <div 
                    className="joint-temp-bar"
                    style={{
                      width: `${getTempPercentage(temperatures[index])}%`,
                      backgroundColor: getTempColor(temperatures[index])
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CardGlass>
  );
}
