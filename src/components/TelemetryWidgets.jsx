/**
 * Componentes reutilizables para widgets de telemetría
 */

import { useState, useEffect, useRef } from 'react';
import { Zap, Thermometer, Settings, Gauge, Activity, Cpu, RefreshCw } from 'lucide-react';
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
  const isValueAvailable = value !== null && value !== undefined && value !== '';
  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountingAnimation(numericValue || 0, 400);
  const [isUpdated, setIsUpdated] = useState(false);
  const previousValue = useRef(value);
  
  // Trigger update animation when value changes
  useEffect(() => {
    if (previousValue.current !== value && isValueAvailable) {
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
          <div className="tcp-pose-section-label">Posición</div>
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
          <div className="tcp-pose-section-label">Orientación</div>
          <div className="tcp-pose-values">
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RX</span>
              <span className={`tcp-pose-value ${orientRx === 'N/A' ? 'value-na' : ''}`}>{orientRx}</span>
              {orientRx !== 'N/A' && <span className="tcp-pose-unit">rad</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RY</span>
              <span className={`tcp-pose-value ${orientRy === 'N/A' ? 'value-na' : ''}`}>{orientRy}</span>
              {orientRy !== 'N/A' && <span className="tcp-pose-unit">rad</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RZ</span>
              <span className={`tcp-pose-value ${orientRz === 'N/A' ? 'value-na' : ''}`}>{orientRz}</span>
              {orientRz !== 'N/A' && <span className="tcp-pose-unit">rad</span>}
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
                  J{index + 1}
                </span>
              </div>
              <div className="joint-data">
                <div className="joint-metric">
                  <span className="joint-metric-label">Pos</span>
                  <span className={`joint-metric-value ${isPosNA ? 'value-na' : ''} ${isPosUpdated ? 'value-updated' : ''}`}>{posValue}</span>
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
