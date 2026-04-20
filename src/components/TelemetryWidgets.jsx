/**
 * Componentes reutilizables para widgets de telemetría
 */

import { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { Zap, Thermometer, Settings, Gauge, Activity, Cpu, RefreshCw, Clock } from 'lucide-react';
import ExcelJS from 'exceljs';
import { MqttStatusContext } from '../contexts/MqttStatusContext.js';
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
export function KpiCard({ label, value, unit, className = '', compact = false, format = '0', icon }) {
  const isValueAvailable = value !== null && value !== undefined && value !== '' && !(typeof value === 'number' && Number.isNaN(value));
  const numericValue = typeof value === 'number' && !Number.isNaN(value) ? value : null;
  const animatedValue = useCountingAnimation(numericValue || 0, 400);
  const [isUpdated, setIsUpdated] = useState(false);
  const previousValue = useRef(value);
  
  // Trigger update animation when value changes
  useEffect(() => {
    if (previousValue.current !== value && isValueAvailable) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsUpdated(true);
      previousValue.current = value;
      const timer = setTimeout(() => setIsUpdated(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value, isValueAvailable]);
  
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
  
  // Determine icon based on label if not provided
  const getIcon = () => {
    if (icon) return icon;
    const labelLower = label.toLowerCase();
    if (labelLower.includes('potencia') || labelLower.includes('power')) {
      return <Zap size={compact ? 14 : 16} />;
    }
    if (labelLower.includes('temp')) {
      return <Thermometer size={compact ? 14 : 16} />;
    }
    if (labelLower.includes('ciclo') || labelLower.includes('tiempo')) {
      return <Activity size={compact ? 14 : 16} />;
    }
    if (labelLower.includes('operación') || labelLower.includes('horas')) {
      return <Gauge size={compact ? 14 : 16} />;
    }
    return null;
  };
  
  const IconComponent = getIcon();
  
  // Calculate progress bar percentage (for numeric values)
  const progressPercentage = (isValueAvailable && numericValue !== null) ? 100 : 0;
  
  return (
    <CardGlass className={`kpi-card ${compact ? 'kpi-compact' : ''} ${className}`}>
      <div className="kpi-label">
        {IconComponent && <span className="widget-icon">{IconComponent}</span>}
        {label}
      </div>
      <div className="kpi-value-container">
        <span className={`kpi-value ${isNA ? 'value-na' : ''} ${isUpdated ? 'value-updated' : ''}`}>{displayValue}</span>
        {unit && !isNA && <span className="kpi-unit">{unit}</span>}
      </div>
      {/* Progress bar for visual feedback */}
      <div className="kpi-progress-bar">
        <div 
          className="kpi-progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
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
  const [isUpdated, setIsUpdated] = useState(false);
  const previousValue = useRef(value);
  
  // Trigger update animation when value changes
  useEffect(() => {
    if (previousValue.current !== value && isValueAvailable) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsUpdated(true);
      previousValue.current = value;
      const timer = setTimeout(() => setIsUpdated(false), 400);
      return () => clearTimeout(timer);
    }
  }, [value, isValueAvailable]);
  
  let statusClass = '';
  let shouldBlink = false;
  
  if (!isNA) {
    if (statusType === 'estado_maquina') {
      if (value === 'POWER_ON') {
        statusClass = 'status-power-on';
      } else if (value === 'POWER_OFF') {
        statusClass = 'status-power-off';
      } else if (value === 'BOOTING') {
        statusClass = 'status-booting';
      } else if (value === 'RUNNING') {
        statusClass = 'status-power-on';
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
      <div className={`status-value ${statusClass} ${shouldBlink ? 'blink' : ''} ${isNA ? 'value-na' : ''} ${isUpdated ? 'status-value-updated' : ''}`}>
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
  const [updatedIndices, setUpdatedIndices] = useState(new Set());
  const previousData = useRef(data);
  
  useEffect(() => {
    if (data && previousData.current) {
      const updated = new Set();
      data.forEach((val, idx) => {
        if (previousData.current[idx] !== val) {
          updated.add(idx);
        }
      });
      
      if (updated.size > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUpdatedIndices(updated);
        const timer = setTimeout(() => setUpdatedIndices(new Set()), 600);
        return () => clearTimeout(timer);
      }
    }
    previousData.current = data;
  }, [data]);
  
  if (!data || !Array.isArray(data)) {
    return (
      <CardGlass className="data-table">
        <div className="table-title">
          <Settings size={16} style={{ display: 'inline-flex', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          {label}
        </div>
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
      <div className="table-title">
        <Settings size={16} className="widget-icon" />
        {label}
      </div>
      <div className="table-grid">
        {data.map((value, index) => {
          const formattedValue = formatValue(value);
          const isNA = formattedValue === 'N/A';
          const isUpdated = updatedIndices.has(index);
          return (
            <div key={index} className="table-cell">
              <div className="cell-label">J{index + 1}</div>
              <div className={`cell-value ${isNA ? 'value-na' : ''} ${isUpdated ? 'value-updated' : ''}`}>
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
  // eventLog and clearEventLog come from MqttStatusContext so that:
  //  • clearing truly empties the in-memory buffer (not just the view), and
  //  • the cleared state survives tab switches / component remounts.
  const { eventLog, clearEventLog } = useContext(MqttStatusContext);

  const handleExportCsv = () => {
    const csvLines = ['Hora,Evento'];
    eventLog.forEach(({ time, text }) => {
      // Wrap fields in quotes and escape any internal quotes
      const safeTime = `"${String(time).replace(/"/g, '""')}"`;
      const safeText = `"${String(text).replace(/"/g, '""')}"`;
      csvLines.push(`${safeTime},${safeText}`);
    });
    const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'registro_eventos.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <CardGlass className={`log-panel ${compact ? 'log-compact' : ''} ${className}`}>
      <div className="log-header">
        <div className="log-title">Registro de Eventos</div>
        <div className="log-actions">
          <button
            className="log-btn log-btn--export"
            onClick={handleExportCsv}
            disabled={eventLog.length === 0}
            title="Exportar registro a CSV"
          >
            ⬇ Exportar a Excel
          </button>
          <button
            className="log-btn log-btn--clear"
            onClick={clearEventLog}
            disabled={eventLog.length === 0}
            title="Borrar el historial de eventos actual"
          >
            🗑 Borrar Registros
          </button>
        </div>
      </div>
      {eventLog.length === 0 ? (
        <div className="log-empty">No hay mensajes</div>
      ) : (
        <div className="log-messages">
          {eventLog.map((row, index) => (
            <div key={index} className="log-message">
              {row.time && <span className="log-time">{row.time}</span>}
              <span className="log-text">{row.text}</span>
            </div>
          ))}
        </div>
      )}
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
 * Digital IO - Matriz compacta 4×8 (DI / CI / DO / CO)
 * Inputs (DI/CI) → dark blue; Outputs (DO/CO) → magenta
 * Active cells emit a strong glow of their respective colour.
 */
export function DigitalIO({ data, className = '' }) {
  // Each row reads from its own 8-element array within digital_io
  const inputs              = data?.inputs               || Array(8).fill(null);
  const outputs             = data?.outputs              || Array(8).fill(null);
  const configurableInputs  = data?.configurable_inputs  || Array(8).fill(null);
  const configurableOutputs = data?.configurable_outputs || Array(8).fill(null);

  const rows = [
    { label: 'DI', values: inputs,              colorClass: 'led-input' },
    { label: 'CI', values: configurableInputs,  colorClass: 'led-input' },
    { label: 'DO', values: outputs,             colorClass: 'led-output' },
    { label: 'CO', values: configurableOutputs, colorClass: 'led-output' },
  ];

  return (
    <CardGlass className={`digital-io-compact ${className}`}>
      <div className="io-matrix">
        {/* Column header */}
        <div className="io-matrix-header">
          <div className="io-row-label-hdr" />
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="io-col-hdr">{i}</div>
          ))}
        </div>
        {/* Data rows */}
        {rows.map((row) => (
          <div key={row.label} className="io-matrix-row">
            <div className="io-row-label">{row.label}</div>
            {row.values.map((active, i) => (
              <div
                key={i}
                className={`io-cell ${row.colorClass} ${active === true ? 'io-active' : ''} ${active === null ? 'io-na' : ''}`}
                title={`${row.label}${i}: ${active === null ? 'N/A' : active ? '1' : '0'}`}
              >
                <span className="io-cell-name">{`${row.label}${i}`}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </CardGlass>
  );
}

/**
 * AnalogIO - Barras slim (6 px) para AI0/AI1/AO0/AO1
 * AI: cian #00f3ff  |  AO: magenta #ff00ff
 * Nombre a la izquierda, valor + "V" a la derecha – todo Monospace
 */
export function AnalogIO({ data, className = '' }) {
  const ai = data?.ai || [null, null];
  const ao = data?.ao || [null, null];

  const channels = [
    ...ai.map((v, i) => ({ label: `AI${i}`, value: v, colorVar: '#00f3ff', group: 'ai' })),
    ...ao.map((v, i) => ({ label: `AO${i}`, value: v, colorVar: '#ff00ff', group: 'ao' })),
  ];

  return (
    <CardGlass className={`analog-io ${className}`}>
      {channels.map(({ label, value, colorVar }) => {
        const isAvailable = value !== null && value !== undefined;
        // UR analog range 0–10 V
        const pct = isAvailable ? Math.min(100, Math.max(0, (value / 10) * 100)) : 0;
        return (
          <div key={label} className="analog-bar-row">
            <span className="analog-label">{label}</span>
            <div className="analog-bar-track">
              <div
                className="analog-bar-fill"
                style={{ width: `${pct}%`, background: colorVar, boxShadow: `0 0 5px ${colorVar}` }}
              />
            </div>
            <span className={`analog-value ${!isAvailable ? 'value-na' : ''}`} style={{ color: colorVar }}>
              {isAvailable ? `${value.toFixed(2)} V` : 'N/A'}
            </span>
          </div>
        );
      })}
    </CardGlass>
  );
}

/**
 * GestionPanel – Script Activo + Estado Programa (no header duplicates)
 */
export function GestionPanel({ data, className = '' }) {
  const nombre = data?.nombre;
  const estado = data?.estado;

  const estadoColor = {
    PLAYING: '#10b981', RUNNING: '#10b981',
    PAUSED:  '#ffbf00',
    STOPPED: '#ef4444',
  }[estado] || '#94a3b8';

  const isNombre = nombre !== null && nombre !== undefined;
  const isEstado = estado  !== null && estado  !== undefined;

  return (
    <CardGlass className={`gestion-panel ${className}`}>
      <div className="gestion-row">
        <span className="gestion-label">Script Activo</span>
        <span className={`gestion-value ${!isNombre ? 'value-na' : ''}`}>{isNombre ? nombre : 'N/A'}</span>
      </div>
      <div className="gestion-row">
        <span className="gestion-label">Estado Programa</span>
        <span
          className={`gestion-value gestion-estado ${!isEstado ? 'value-na' : ''}`}
          style={isEstado ? { color: estadoColor, textShadow: `0 0 8px ${estadoColor}80` } : {}}
        >
          {isEstado ? estado : 'N/A'}
        </span>
      </div>
    </CardGlass>
  );
}

/**
 * SecurityLedsPanel – LED indicators for emergency stop and protection
 * Green (OK) / Red blinking (Alarm)
 */
export function SecurityLedsPanel({ data, className = '' }) {
  const safety = data?.safety;
  // Derive from direct fields if present, otherwise fall back to safety string
  const emergencia = data?.emergencia_parada ?? (safety === 'EMERGENCY_STOP' ? true : safety === null ? null : false);
  const proteccion = data?.proteccion ?? (safety === 'PROTECTIVE_STOP' || safety === 'REDUCED' ? true : safety === null ? null : false);

  const ledState = (val) => {
    if (val === null) return 'led-na';
    return val ? 'led-alarm' : 'led-ok';
  };

  return (
    <CardGlass className={`security-leds-panel ${className}`}>
      <div className="security-led-row">
        <div className={`security-led-dot ${ledState(emergencia)}`} />
        <span className="security-led-label">PARADA EMERGENCIA</span>
        <span className={`security-led-status ${emergencia ? 'alarm-text' : emergencia === null ? '' : 'ok-text'}`}>
          {emergencia === null ? 'N/A' : emergencia ? 'ACTIVA' : 'OK'}
        </span>
      </div>
      <div className="security-led-row">
        <div className={`security-led-dot ${ledState(proteccion)}`} />
        <span className="security-led-label">PROTECCIÓN</span>
        <span className={`security-led-status ${proteccion ? 'alarm-text' : proteccion === null ? '' : 'ok-text'}`}>
          {proteccion === null ? 'N/A' : proteccion ? 'ACTIVA' : 'OK'}
        </span>
      </div>
    </CardGlass>
  );
}

/**
 * ToolPanel – Tensión (V), Corriente (mA) and computed Potencia (W)
 * Updates are smooth/static (no flash effect)
 */
export function ToolPanel({ data, className = '' }) {
  const tension   = data?.tension;
  const corriente = data?.corriente;
  const isT = tension   !== null && tension   !== undefined;
  const isC = corriente !== null && corriente !== undefined;
  // Use MQTT-provided potencia if available, otherwise compute from tension × corriente
  const potencia = data?.potencia ?? (isT && isC ? tension * corriente / 1000 : null);

  return (
    <CardGlass className={`tool-panel ${className}`}>
      <div className="tool-row">
        <span className="tool-label">Tensión</span>
        <span className={`tool-value ${!isT ? 'value-na' : ''}`}>
          {isT ? tension.toFixed(2) : 'N/A'}
        </span>
        {isT && <span className="tool-unit">V</span>}
      </div>
      <div className="tool-row">
        <span className="tool-label">Corriente</span>
        <span className={`tool-value ${!isC ? 'value-na' : ''}`}>
          {isC ? corriente.toFixed(1) : 'N/A'}
        </span>
        {isC && <span className="tool-unit">mA</span>}
      </div>
      <div className="tool-row tool-potencia">
        <span className="tool-label">Potencia</span>
        <span className={`tool-value ${potencia === null ? 'value-na' : ''}`}>
          {potencia !== null ? potencia.toFixed(2) : 'N/A'}
        </span>
        {potencia !== null && <span className="tool-unit">W</span>}
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
  
  // Pre-compute formatted values to avoid redundant calls
  const posX = formatValue(pos.x, 2);
  const posY = formatValue(pos.y, 2);
  const posZ = formatValue(pos.z, 2);
  const orientRx = formatValue(orient.rx, 3);
  const orientRy = formatValue(orient.ry, 3);
  const orientRz = formatValue(orient.rz, 3);
  
  return (
    <CardGlass className={`tcp-pose ${className}`}>
      <div className="tcp-pose-title">TCP Pose</div>
      <div className="tcp-pose-grid">
        <div className="tcp-pose-section">
          <div className="tcp-pose-section-label">POSICIÓN CARTESIANA [mm]</div>
          <div className="tcp-pose-values">
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">X</span>
              <span className={`tcp-pose-value ${posX === 'N/A' ? 'value-na' : ''}`}>{posX}</span>
              {posX !== 'N/A' && <span className="tcp-pose-unit">mm</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">Y</span>
              <span className={`tcp-pose-value ${posY === 'N/A' ? 'value-na' : ''}`}>{posY}</span>
              {posY !== 'N/A' && <span className="tcp-pose-unit">mm</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">Z</span>
              <span className={`tcp-pose-value ${posZ === 'N/A' ? 'value-na' : ''}`}>{posZ}</span>
              {posZ !== 'N/A' && <span className="tcp-pose-unit">mm</span>}
            </div>
          </div>
        </div>
        <div className="tcp-pose-section">
          <div className="tcp-pose-section-label">ORIENTACIÓN ANGULAR [°]</div>
          <div className="tcp-pose-values">
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RX</span>
              <span className={`tcp-pose-value ${orientRx === 'N/A' ? 'value-na' : ''}`}>{orientRx}</span>
              {orientRx !== 'N/A' && <span className="tcp-pose-unit">°</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RY</span>
              <span className={`tcp-pose-value ${orientRy === 'N/A' ? 'value-na' : ''}`}>{orientRy}</span>
              {orientRy !== 'N/A' && <span className="tcp-pose-unit">°</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RZ</span>
              <span className={`tcp-pose-value ${orientRz === 'N/A' ? 'value-na' : ''}`}>{orientRz}</span>
              {orientRz !== 'N/A' && <span className="tcp-pose-unit">°</span>}
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
  
  const [updatedPositions, setUpdatedPositions] = useState(new Set());
  const previousPositions = useRef(positions);
  
  useEffect(() => {
    const updated = new Set();
    positions.forEach((val, idx) => {
      if (previousPositions.current[idx] !== val) {
        updated.add(idx);
      }
    });
    
    if (updated.size > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUpdatedPositions(updated);
      const timer = setTimeout(() => setUpdatedPositions(new Set()), 600);
      return () => clearTimeout(timer);
    }
    previousPositions.current = positions;
  }, [positions]);
  
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
  
  const JOINT_NAMES = ['Base', 'Hombro', 'Codo', 'Muñeca 1', 'Muñeca 2', 'Muñeca 3'];

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
          const isPosUpdated = updatedPositions.has(index);
          
          return (
            <div key={index} className="joint-block">
              <div className="joint-header">
                <span className="joint-label">
                  <Settings size={18} className="widget-icon" />
                  {JOINT_NAMES[index] ?? `J${index + 1}`}
                </span>
              </div>
              <div className="joint-data">
                <div className="joint-metric">
                  <span className="joint-metric-label">Pos</span>
                  <span className={`joint-metric-value ${isPosNA ? 'value-na' : ''} ${isPosUpdated ? 'value-updated' : ''}`}>{posValue}</span>
                  {!isPosNA && <span className="joint-metric-unit">°</span>}
                </div>
                <div className="joint-metric">
                  <span className="joint-metric-label">Cur</span>
                  <span className={`joint-metric-value ${isCurrentNA ? 'value-na' : ''}`}>{currentValue}</span>
                  {!isCurrentNA && <span className="joint-metric-unit">A</span>}
                </div>
              </div>
              <div className="joint-temp-section">
                <div className={`joint-temp-label ${isTempNA ? 'value-na' : ''}`}>
                  <Thermometer size={12} className="widget-icon" />
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

/**
 * SystemMetricCard – Tarjeta compacta para métricas de sistema del Menú Principal.
 * Muestra label, valor con unidad y, opcionalmente, una mini barra de progreso (para CPU load).
 */
export function SystemMetricCard({ label, value, unit, showBar = false, icon = null }) {
  const isAvailable = value !== null && value !== undefined;
  // Only treat finite numbers as numericValue to prevent toFixed errors with Infinity/NaN
  const numericValue = (typeof value === 'number' && isFinite(value)) ? value : null;
  const barPercent = (showBar && numericValue !== null)
    ? Math.min(100, Math.max(0, numericValue))
    : 0;

  const getBarColor = (pct) => {
    if (pct >= 85) return '#ef4444';
    if (pct >= 60) return '#ffbf00';
    return '#00e5ff';
  };

  const getIcon = () => {
    if (icon === 'temp')    return <Thermometer size={16} />;
    if (icon === 'cpu')     return <Cpu size={16} />;
    if (icon === 'voltage') return <Zap size={16} />;
    if (icon === 'power')   return <Zap size={16} />;
    if (icon === 'speed')   return <Gauge size={16} />;
    if (icon === 'cycles')  return <RefreshCw size={16} />;
    if (icon === 'clock')   return <Clock size={16} />;
    return null;
  };

  const IconEl = getIcon();

  return (
    <CardGlass className="sys-metric-card">
      <div className="sys-metric-label">
        {IconEl && <span className="widget-icon">{IconEl}</span>}
        {label}
      </div>
      <div className="sys-metric-value-row">
        <span className={`sys-metric-value ${!isAvailable ? 'value-na' : ''}`}>
          {isAvailable
            ? (numericValue !== null ? numericValue.toFixed(numericValue % 1 === 0 ? 0 : 1) : value)
            : 'N/A'}
        </span>
        {isAvailable && unit && <span className="sys-metric-unit">{unit}</span>}
      </div>
      {showBar && (
        <div className="sys-metric-bar-track">
          <div
            className="sys-metric-bar-fill"
            style={{
              width: `${barPercent}%`,
              background: getBarColor(barPercent),
              boxShadow: `0 0 6px ${getBarColor(barPercent)}`,
            }}
          />
        </div>
      )}
    </CardGlass>
  );
}

/**
 * StepCaptureTable – Tabla en tiempo real para los registros del topic step_capture.
 * Muestra hasta los últimos 50 registros recibidos por MQTT, del más reciente al más antiguo.
 * El campo interno _receivedAt se excluye de la visualización.
 * Incluye controles para pausar/reanudar captura, borrar registros y exportar a CSV.
 */
export function StepCaptureTable({ records = [], className = '' }) {
  const { isPausedStepCapture, togglePauseStepCapture, clearStepCaptureRecords } = useContext(MqttStatusContext);
  const prevCountRef = useRef(records.length);
  const [newRowIndex, setNewRowIndex] = useState(null);

  useEffect(() => {
    if (records.length > prevCountRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewRowIndex(0); // La fila más reciente es siempre la primera (orden DESC)
      const timer = setTimeout(() => setNewRowIndex(null), 600);
      prevCountRef.current = records.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = records.length;
  }, [records.length]);

  const displayRecords = useMemo(() => [...records].reverse(), [records]); // Más reciente primero

  // Derive column names from the first record, memoized to avoid repeated computation
  const columns = useMemo(
    () => (displayRecords.length > 0 ? Object.keys(displayRecords[0]).filter((k) => k !== '_receivedAt') : []),
    [displayRecords]
  );

  const handleExport = () => {
    try {
      if (displayRecords.length === 0) return;
      const headers = ['#', 'recibido', ...columns];
      const rows = displayRecords.map((record, idx) => {
        const receivedTime = new Date(record._receivedAt).toLocaleTimeString('es-ES');
        return [
          displayRecords.length - idx,
          receivedTime,
          ...columns.map((col) => {
            const v = record[col];
            return v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
          }),
        ];
      });
      const csvContent = [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'capturas_step_points.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar a CSV:', err);
    }
  };

  return (
    <CardGlass className={`step-capture-table ${className}`}>
      <div className="sct-header">
        <Activity size={16} className="widget-icon" />
        {displayRecords.length === 0
          ? 'Registro de Step Point'
          : `Registro de Step Point — últimos ${displayRecords.length} registros`}
      </div>

      <div className="sct-controls">
        <button
          className={`ctrl-btn ${isPausedStepCapture ? 'ctrl-btn-start' : 'ctrl-btn-pause'}`}
          onClick={togglePauseStepCapture}
        >
          {isPausedStepCapture ? '▶ Reanudar captura' : '⏸ Detener captura'}
        </button>
        <button
          className="ctrl-btn ctrl-btn-clear"
          onClick={clearStepCaptureRecords}
          disabled={displayRecords.length === 0}
        >
          🗑 Borrar capturas
        </button>
        <button
          className="ctrl-btn ctrl-btn-export"
          onClick={handleExport}
          disabled={displayRecords.length === 0}
        >
          📥 Exportar CSV
        </button>
      </div>

      {displayRecords.length === 0 ? (
        <div className="sct-empty">Esperando datos del topic salesianos/robot/iban/step_capture…</div>
      ) : (
        <div className="sct-scroll">
          <table className="sct-tbl">
            <thead>
              <tr>
                <th className="sct-th sct-th-idx">#</th>
                <th className="sct-th">Recibido</th>
                {columns.map((col) => (
                  <th key={col} className="sct-th">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRecords.map((record, idx) => {
                const receivedTime = new Date(record._receivedAt).toLocaleTimeString('es-ES');
                const isNew = idx === newRowIndex;
                return (
                  <tr key={`${record._receivedAt ?? ''}-${idx}`} className={`sct-tr ${isNew ? 'sct-tr--new' : ''}`}>
                    <td className="sct-td sct-td-idx">{displayRecords.length - idx}</td>
                    <td className="sct-td sct-td-time">{receivedTime}</td>
                    {columns.map((col) => {
                      const cellVal = record[col];
                      const formatted = cellVal === null || cellVal === undefined
                        ? 'N/A'
                        : typeof cellVal === 'object'
                          ? JSON.stringify(cellVal)
                          : String(cellVal);
                      return (
                        <td key={col} className={`sct-td ${formatted === 'N/A' ? 'value-na' : ''}`}>
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardGlass>
  );
}

/**
 * Safely converts a value to a finite number, or returns null.
 * Handles strings, null, undefined, and NaN from MQTT payloads.
 */
function toSafeNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

/**
 * HardwareIOControlBox – E/S del Controlador (Control Box)
 * Shows the UR Control Box digital matrix (DI/DO/CI/CO × 8) and
 * analog channels (AI0/AI1/AO0/AO1) with dynamic V / mA units read from JSON.
 */
export function HardwareIOControlBox({ data, className = '' }) {
  const EMPTY8 = Array(8).fill(null);
  const di     = Array.isArray(data?.digital?.di)  ? data.digital.di  : EMPTY8;
  const doVals = Array.isArray(data?.digital?.do)  ? data.digital.do  : EMPTY8;
  const ci     = Array.isArray(data?.digital?.ci)  ? data.digital.ci  : EMPTY8;
  const co     = Array.isArray(data?.digital?.co)  ? data.digital.co  : EMPTY8;

  const digitalRows = [
    { label: 'DI', values: di,     colorClass: 'led-input'  },
    { label: 'CI', values: ci,     colorClass: 'led-input'  },
    { label: 'DO', values: doVals, colorClass: 'led-output' },
    { label: 'CO', values: co,     colorClass: 'led-output' },
  ];

  const analogChannels = [
    { label: 'AI0', ch: data?.analog?.ai0 },
    { label: 'AI1', ch: data?.analog?.ai1 },
    { label: 'AO0', ch: data?.analog?.ao0 },
    { label: 'AO1', ch: data?.analog?.ao1 },
  ];

  return (
    <CardGlass className={`hw-io-card ${className}`}>
      {/* ── Digital signals ── */}
      <div className="hw-io-section-label">DIGITALES</div>
      <div className="io-matrix">
        <div className="io-matrix-header">
          <div className="io-row-label-hdr" />
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="io-col-hdr">{i}</div>
          ))}
        </div>
        {digitalRows.map((row) => (
          <div key={row.label} className="io-matrix-row">
            <div className="io-row-label">{row.label}</div>
            {row.values.map((active, i) => (
              <div
                key={i}
                className={`io-cell ${row.colorClass}${active ? ' io-active' : ''}${active === null ? ' io-na' : ''}`}
                title={`${row.label}${i}: ${active === null ? 'N/A' : active ? '1' : '0'}`}
              >
                <span className="io-cell-name">{`${row.label}${i}`}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Analog signals ── */}
      <div className="hw-io-section-label hw-io-section-label--gap">ANALÓGICAS</div>
      <div className="hw-analog-channels">
        {analogChannels.map(({ label, ch }) => {
          const value = toSafeNum(ch?.value);
          const mode = ch?.mode ?? 'voltage';
          const isVoltage = mode === 'voltage';
          const unitLabel = isVoltage ? 'V' : 'mA';
          const unitColor = isVoltage ? '#00e5ff' : '#ff9500';
          // Voltage range 0–10 V; current range 0–20 mA
          const maxVal = isVoltage ? 10 : 20;
          const isAvailable = value !== null;
          const pct = isAvailable ? Math.min(100, Math.max(0, (value / maxVal) * 100)) : 0;

          return (
            <div key={label} className="hw-analog-bar-row">
              <span className="analog-label">{label}</span>
              <div className="analog-bar-track">
                <div
                  className="analog-bar-fill"
                  style={{ width: `${pct}%`, background: unitColor, boxShadow: `0 0 5px ${unitColor}` }}
                />
              </div>
              <div className="hw-analog-value-cell">
                <span className={`analog-value ${!isAvailable ? 'value-na' : ''}`} style={isAvailable ? { color: unitColor } : {}}>
                  {isAvailable ? value.toFixed(2) : 'N/A'}
                </span>
                {isAvailable && (
                  <span className="hw-analog-unit" style={{ color: unitColor }}>{unitLabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CardGlass>
  );
}

/**
 * HardwareIOTool – E/S de la Herramienta (Tool I/O)
 * Shows Tool digital signals (TDI/TDO × 2), analog inputs (AI2/AI3 fixed V),
 * and the tool power supply (voltage / current / wattage).
 *
 * Layout: two-column row — Digital (left) | Analog (right) — then Power below.
 * Digital cells use the same io-cell style as HardwareIOControlBox.
 */
export function HardwareIOTool({ data, className = '' }) {
  // If digital.available is explicitly false, show cells in OFF (false) state;
  // if data is simply missing, show N/A (null) state.
  const digitalAvailable = data?.digital?.available !== false;
  const EMPTY2     = Array(2).fill(null);
  const EMPTY2_OFF = Array(2).fill(false);
  const tdi = Array.isArray(data?.digital?.tdi) ? data.digital.tdi : (digitalAvailable ? EMPTY2 : EMPTY2_OFF);
  const tdo = Array.isArray(data?.digital?.tdo) ? data.digital.tdo : (digitalAvailable ? EMPTY2 : EMPTY2_OFF);

  const analogChannels = [
    { label: 'AI2', ch: data?.analog?.ai2 },
    { label: 'AI3', ch: data?.analog?.ai3 },
  ];

  const power = data?.power;
  const pvoltage = toSafeNum(power?.voltage);
  const pcurrent = toSafeNum(power?.current);
  const pwattage = toSafeNum(power?.wattage);

  const TOOL_ANALOG_COLOR = '#00e5ff';

  const renderAnalogBar = ({ label, ch }) => {
    const value = toSafeNum(ch?.value);
    const isAvailable = value !== null;
    const pct = isAvailable ? Math.min(100, Math.max(0, (value / 10) * 100)) : 0;
    return (
      <div className="hw-analog-bar-row">
        <span className="analog-label">{label}</span>
        <div className="analog-bar-track">
          <div
            className="analog-bar-fill"
            style={{ width: `${pct}%`, background: TOOL_ANALOG_COLOR, boxShadow: `0 0 5px ${TOOL_ANALOG_COLOR}` }}
          />
        </div>
        <div className="hw-analog-value-cell">
          <span className={`analog-value ${!isAvailable ? 'value-na' : ''}`} style={isAvailable ? { color: TOOL_ANALOG_COLOR } : {}}>
            {isAvailable ? value.toFixed(2) : '—'}
          </span>
          {isAvailable && (
            <span className="hw-analog-unit" style={{ color: TOOL_ANALOG_COLOR }}>V</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <CardGlass className={`hw-io-card hw-io-card--tool ${className}`}>
      {/* ── Section label header row ── */}
      <div className="tool-io-headers">
        <div className="hw-io-section-label">DIGITALES HERRAMIENTA (TOOL DIGITAL I/O)</div>
        <div className="hw-io-section-label">ANALÓGICAS HERRAMIENTA (TOOL ANALOG I/O)</div>
      </div>

      {/* ── Row-based synchronized grid: each row pairs Digital | Analog ── */}
      <div className="tool-io-main-grid">

        {/* ROW 1: Inputs (TDI) | AI2 */}
        <div className="tool-io-row-pair">
          <div className="tool-io-signal-group">
            <div className="tool-io-sublabel tool-io-sublabel--input">Inputs (TDI)</div>
            <div className="tool-io-row">
              {tdi.map((active, i) => (
                <div
                  key={`tdi-${i}`}
                  className={`io-cell led-input${active ? ' io-active' : ''}${active === null ? ' io-na' : ''}`}
                  title={`TDI${i}: ${active === null ? 'N/A' : active ? '1' : '0'}`}
                >
                  <span className="io-cell-name">TDI{i}</span>
                </div>
              ))}
            </div>
          </div>
          {renderAnalogBar(analogChannels[0])}
        </div>

        {/* ROW 2: Outputs (TDO) | AI3 */}
        <div className="tool-io-row-pair">
          <div className="tool-io-signal-group">
            <div className="tool-io-sublabel tool-io-sublabel--output">Outputs (TDO)</div>
            <div className="tool-io-row">
              {tdo.map((active, i) => (
                <div
                  key={`tdo-${i}`}
                  className={`io-cell led-output${active ? ' io-active' : ''}${active === null ? ' io-na' : ''}`}
                  title={`TDO${i}: ${active === null ? 'N/A' : active ? '1' : '0'}`}
                >
                  <span className="io-cell-name">TDO{i}</span>
                </div>
              ))}
            </div>
          </div>
          {renderAnalogBar(analogChannels[1])}
        </div>

      </div>

      {/* ── Power supply ── */}
      <div className="hw-io-section-label hw-io-section-label--gap">ALIMENTACIÓN</div>
      <div className="tool-power-grid">
        <div className="tool-power-item">
          <span className="tool-power-label">Tensión</span>
          <span className={`tool-power-value ${pvoltage === null ? 'value-na' : ''}`}>
            {pvoltage !== null ? pvoltage.toFixed(1) : 'N/A'}
          </span>
          {pvoltage !== null && <span className="tool-power-unit">V</span>}
        </div>
        <div className="tool-power-item">
          <span className="tool-power-label">Corriente</span>
          <span className={`tool-power-value ${pcurrent === null ? 'value-na' : ''}`}>
            {pcurrent !== null ? pcurrent.toFixed(1) : 'N/A'}
          </span>
          {pcurrent !== null && <span className="tool-power-unit">mA</span>}
        </div>
        <div className="tool-power-item tool-power-wattage">
          <span className="tool-power-label">Potencia</span>
          <span className={`tool-power-value ${pwattage === null ? 'value-na' : ''}`}>
            {pwattage !== null ? pwattage.toFixed(2) : 'N/A'}
          </span>
          {pwattage !== null && <span className="tool-power-unit">W</span>}
        </div>
      </div>
    </CardGlass>
  );
}

// ── Helpers shared by the Node-RED panels ────────────────────────────────────

/** Returns true if the diagnostic message text is considered noisy and should
 *  be hidden from the UI. Currently suppresses "URControl..." lines that
 *  contain no useful user-facing information. */
function isNoisyDiagMessage(msg) {
  // Check both the raw Node-RED field (msg.msg) and the normalized field (msg.text).
  const text = String(msg?.msg ?? msg?.text ?? '').trim();
  return /^URControl/i.test(text);
}

function formatEventTs(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

function EventLevelBadge({ level }) {
  const n = (level ?? '').toLowerCase();
  const cls =
    n === 'error'                        ? 'nr-badge nr-badge--error' :
    n === 'warn' || n === 'warning'      ? 'nr-badge nr-badge--warn'  :
                                           'nr-badge nr-badge--info';
  const label =
    n === 'error'                        ? 'ERROR' :
    n === 'warn' || n === 'warning'      ? 'WARN'  : 'INFO';
  return <span className={cls}>{label}</span>;
}

/**
 * NodeRedEventsPanel
 *
 * Muestra el buffer de eventos publicado por Node-RED en los topics
 * events_buffer y events_derived.  Lee directamente del contexto MQTT.
 */
export function NodeRedEventsPanel({ className = '' }) {
  const {
    nodeRedEventsBuffer,
    nodeRedEventsTotal,
    nodeRedEventsBufferLimit,
    publishCommand,
  } = useContext(MqttStatusContext);

  const sortedEvents = useMemo(
    () => [...nodeRedEventsBuffer].reverse(),
    [nodeRedEventsBuffer],
  );

  const { errorCount, warnCount, infoCount } = useMemo(
    () => nodeRedEventsBuffer.reduce(
      (acc, e) => {
        const lvl = (e.level ?? '').toLowerCase();
        if (lvl === 'error') acc.errorCount++;
        else if (lvl === 'warn' || lvl === 'warning') acc.warnCount++;
        else acc.infoCount++;
        return acc;
      },
      { errorCount: 0, warnCount: 0, infoCount: 0 },
    ),
    [nodeRedEventsBuffer],
  );

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FP-ROBOTIK-INTERFACE';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Buffer Eventos');
    sheet.columns = [
      { header: 'id',     key: 'id',     width: 36 },
      { header: 'ts',     key: 'ts',     width: 24 },
      { header: 'source', key: 'source', width: 20 },
      { header: 'level',  key: 'level',  width: 10 },
      { header: 'type',   key: 'type',   width: 20 },
      { header: 'text',   key: 'text',   width: 60 },
      { header: 'data',   key: 'data',   width: 40 },
    ];
    // Style header row
    sheet.getRow(1).font = { bold: true };
    nodeRedEventsBuffer.forEach(event => {
      let tsValue = '';
      if (event.ts != null) {
        try {
          const d = new Date(event.ts);
          tsValue = isNaN(d.getTime()) ? String(event.ts) : d.toISOString();
        } catch {
          tsValue = String(event.ts);
        }
      }
      sheet.addRow({
        id:     event.id     ?? '',
        ts:     tsValue,
        source: event.source ?? '',
        level:  event.level  ?? '',
        type:   event.type   ?? '',
        text:   event.text   ?? '',
        data:   event.data   != null ? JSON.stringify(event.data) : '',
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    const now = new Date();
    const dateTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    link.download = `buffer_eventos_${dateTag}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearBuffer = () => {
    publishCommand?.('salesianos/robot/iban/events_control', {
      command:   'clear_buffer',
      target:    'events_buffer',
      source:    'web',
      ts_client: Date.now(),
    });
  };

  return (
    <CardGlass className={`log-panel nr-events-panel ${className}`}>
      <div className="log-header">
        <div className="log-title">
          <span aria-hidden="true">📡</span> Buffer de eventos del sistema / RTDE
          {nodeRedEventsBuffer.length > 0 && (
            <span className="nr-count-badge">{nodeRedEventsBuffer.length}</span>
          )}
          {nodeRedEventsBufferLimit != null && (
            <span className="nr-meta">límite: {nodeRedEventsBufferLimit}</span>
          )}
        </div>
        <div className="log-actions">
          <button
            className="log-btn log-btn--export"
            onClick={handleExportExcel}
            disabled={nodeRedEventsBuffer.length === 0}
            aria-label={nodeRedEventsBuffer.length === 0 ? 'Exportar a Excel (buffer vacío)' : 'Exportar buffer de eventos a Excel'}
            title="Exportar buffer de eventos a Excel"
          >
            <span aria-hidden="true">⬇</span> Exportar a Excel
          </button>
          <button
            className="log-btn log-btn--clear"
            onClick={handleClearBuffer}
            aria-label="Enviar comando al backend para borrar el buffer de eventos"
            title="Enviar comando al backend para borrar el buffer de eventos"
          >
            <span aria-hidden="true">🗑</span> Borrar buffer
          </button>
        </div>
      </div>

      <div className="nr-counter-chips">
        <span className="nr-chip nr-chip--error">
          <span className="nr-badge nr-badge--error">ERROR</span>
          {errorCount}
        </span>
        <span className="nr-chip nr-chip--warn">
          <span className="nr-badge nr-badge--warn">WARN</span>
          {warnCount}
        </span>
        <span className="nr-chip nr-chip--info">
          <span className="nr-badge nr-badge--info">INFO</span>
          {infoCount}
        </span>
      </div>

      {nodeRedEventsTotal > 0 && (
        <div className="diag-buffer-count">
          Total acumulado (Node-RED): {nodeRedEventsTotal}
        </div>
      )}

      {sortedEvents.length === 0 ? (
        <div className="log-empty">Sin eventos en el buffer</div>
      ) : (
        <div className="log-messages nr-events-messages">
          {sortedEvents.map((event, i) => {
            const lvl = (event.level ?? 'info').toLowerCase();
            const rowMod = lvl === 'error' ? 'error' : lvl.startsWith('warn') ? 'warning' : 'info';
            return (
              <div
                key={event.id ?? i}
                className={`log-message diag-event-row diag-event-row--${rowMod}`}
              >
                <EventLevelBadge level={event.level} />
                {event.type && (
                  <span className="nr-event-type">{event.type}</span>
                )}
                <span className="log-time">{formatEventTs(event.ts)}</span>
                {event.source && (
                  <span className="nr-event-source">{event.source}</span>
                )}
                <span className="log-text diag-event-msg">{event.text ?? '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </CardGlass>
  );
}

/**
 * NodeRedDiagMessagesPanel
 *
 * Muestra los mensajes de principal.diagnostico.messages publicados por Node-RED,
 * filtrando las líneas ruidosas de URControl que no aportan información útil.
 */
export function NodeRedDiagMessagesPanel({ className = '' }) {
  const { diagnosticoMessages, diagnosticoLastError } = useContext(MqttStatusContext);

  const visibleMessages = useMemo(
    () => [...diagnosticoMessages].reverse().filter(msg => !isNoisyDiagMessage(msg)),
    [diagnosticoMessages],
  );

  return (
    <CardGlass className={`log-panel nr-messages-panel ${className}`}>
      <div className="log-header">
        <div className="log-title">
          📋 Diagnóstico / mensajes
          {visibleMessages.length > 0 && (
            <span className="nr-count-badge">{visibleMessages.length}</span>
          )}
        </div>
      </div>

      {diagnosticoLastError && (
        <div className="nr-last-error">
          <span className="nr-badge nr-badge--error">ÚLTIMO ERROR</span>
          <span className="nr-last-error-text">{diagnosticoLastError}</span>
        </div>
      )}

      {visibleMessages.length === 0 ? (
        <div className="log-empty">Sin mensajes de diagnóstico</div>
      ) : (
        <div className="log-messages nr-msg-messages">
          {visibleMessages.map((msg, i) => {
            const lvlMod = (msg.level ?? '').toLowerCase() === 'error' ? 'error' : 'default';
            return (
              <div key={i} className="log-message">
                {msg.level && (
                  <span className={`nr-msg-level nr-msg-level--${lvlMod}`}>
                    {String(msg.level).toUpperCase()}
                  </span>
                )}
                {msg.time && <span className="log-time">{msg.time}</span>}
                <span className="log-text">{msg.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </CardGlass>
  );
}

/**
 * DiagnosticBufferPanel
 *
 * ⚠ BUFFER DE DIAGNÓSTICO DERIVADO — no es el log nativo del robot UR.
 * Muestra el historial de eventos INFERIDOS en el frontend a partir de
 * transiciones de estado detectadas en los mensajes MQTT de Node-RED.
 *
 * Características:
 *  • Eventos ordenados de más reciente a más antiguo.
 *  • Icono y color diferenciados por nivel de severidad (info / warning / error).
 *  • Columna "code" para identificación rápida del tipo de evento.
 *  • Instantánea del estado (snapshot) expandible en tooltip del código.
 *  • Botones de exportar CSV y borrar buffer.
 */
export function DiagnosticBufferPanel({ className = '' }) {
  const { derivedDiagnosticBuffer, clearDerivedDiagnosticBuffer } = useContext(MqttStatusContext);

  const handleExportCsv = () => {
    const csvLines = ['Hora,Nivel,Código,Título,Mensaje'];
    derivedDiagnosticBuffer.forEach(({ time, level, code, title, msg }) => {
      const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      csvLines.push([esc(time), esc(level), esc(code), esc(title), esc(msg)].join(','));
    });
    const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'buffer_diagnostico_derivado.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const LEVEL_ICON  = { info: 'ℹ', warning: '⚠', error: '✖' };
  const LEVEL_LABEL = { info: 'INFO', warning: 'AVISO', error: 'ERROR' };

  return (
    <CardGlass className={`log-panel diag-buffer-panel ${className}`}>

      {/* ── Header ── */}
      <div className="log-header">
        <div className="log-title">
          Buffer de Diagnóstico Derivado
          <span className="diag-buffer-badge">INFERIDO · NO NATIVO</span>
        </div>
        <div className="log-actions">
          <button
            className="log-btn log-btn--export"
            onClick={handleExportCsv}
            disabled={derivedDiagnosticBuffer.length === 0}
            title="Exportar buffer de diagnóstico a CSV"
          >
            ⬇ Exportar CSV
          </button>
          <button
            className="log-btn log-btn--clear"
            onClick={clearDerivedDiagnosticBuffer}
            disabled={derivedDiagnosticBuffer.length === 0}
            title="Borrar el buffer de diagnóstico derivado"
          >
            🗑 Limpiar
          </button>
        </div>
      </div>

      {/* ── Event count ── */}
      {derivedDiagnosticBuffer.length > 0 && (
        <div className="diag-buffer-count">
          {(() => {
            const n = derivedDiagnosticBuffer.length;
            const s = n !== 1 ? 's' : '';
            return `${n} evento${s} derivado${s}`;
          })()}
        </div>
      )}

      {/* ── Events list (newest first) ── */}
      {derivedDiagnosticBuffer.length === 0 ? (
        <div className="log-empty">Sin eventos de diagnóstico derivado</div>
      ) : (
        <div className="log-messages diag-buffer-messages">
          {[...derivedDiagnosticBuffer].reverse().map(event => {
            const { snapshot } = event;
            const snapshotTip = [
              `Seguridad:  ${snapshot.safetyStatus  ?? '-'}`,
              `Modo robot: ${snapshot.robotMode     ?? '-'}`,
              `Prog. estado: ${snapshot.programState ?? '-'}`,
              `Prog. nombre: ${snapshot.programName ?? '-'}`,
              `Prog. ID: ${snapshot.programId       ?? '-'}`,
              `Frenos: ${snapshot.brakes             ?? '-'}`,
            ].join('\n');

            return (
              <div
                key={event.id}
                className={`log-message diag-event-row diag-event-row--${event.level}`}
              >
                {/* Severity icon */}
                <span
                  className={`diag-event-icon diag-event-icon--${event.level}`}
                  title={LEVEL_LABEL[event.level]}
                  aria-label={LEVEL_LABEL[event.level]}
                >
                  {LEVEL_ICON[event.level] ?? '•'}
                </span>

                {/* Timestamp */}
                <span className="log-time">{event.time}</span>

                {/* Code pill — hovering shows the state snapshot in readable format */}
                <span
                  className={`diag-event-code diag-event-code--${event.level}`}
                  title={`Estado en el momento del evento:\n${snapshotTip}`}
                >
                  {event.code}
                </span>

                {/* Message */}
                <span className="log-text diag-event-msg">{event.msg}</span>
              </div>
            );
          })}
        </div>
      )}

    </CardGlass>
  );
}
