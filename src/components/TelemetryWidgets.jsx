/**
 * Componentes reutilizables para widgets de telemetría
 */

import { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { Zap, Thermometer, Settings, Gauge, Activity, Cpu, RefreshCw, Clock } from 'lucide-react';
import ExcelJS from 'exceljs';
import { MqttStatusContext } from '../contexts/MqttStatusContext.js';
import { getStateTransition, normalizeEventData } from '../servicios/rtdeLabels.js';
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
export function LogPanel({ className = '', compact = false }) {
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
 * Returns the PolyScope display rotation vector for a live TCP pose.
 * The alternate form r_display = r * (1 - 2π/θ) is applied ONLY when the
 * first significant component of the raw vector is negative, matching the
 * convention PolyScope uses to pick between the two equivalent representations.
 *
 * Decision rule (first non-near-zero component wins):
 *   1. |rx| > EPS  →  apply transform iff rx < 0
 *   2. |ry| > EPS  →  apply transform iff ry < 0
 *   3. otherwise   →  apply transform iff rz < 0
 *
 * This must ONLY be used for the live TCP pose, never for TCP configuration.
 * @param {number} rx
 * @param {number} ry
 * @param {number} rz
 * @returns {[number, number, number]} display [rx, ry, rz]
 */
function polyscopeDisplayRotvec(rx, ry, rz) {
  const EPS = 1e-9;
  const theta = Math.sqrt(rx * rx + ry * ry + rz * rz);
  if (theta < EPS) return [rx, ry, rz];

  const useAlt =
    (Math.abs(rx) > EPS && rx < 0) ||
    (Math.abs(rx) <= EPS && Math.abs(ry) > EPS && ry < 0) ||
    (Math.abs(rx) <= EPS && Math.abs(ry) <= EPS && rz < 0);

  if (!useAlt) return [rx, ry, rz];

  const scale = 1 - (2 * Math.PI / theta);
  return [rx * scale, ry * scale, rz * scale];
}

/**
 * TCP Pose - Tarjeta específica para mostrar posición y orientación TCP
 */
export function TcpPose({ data, className = '' }) {
  const pos = data?.position || {};
  // Raw RTDE orientation (radians) — kept unmodified as source of truth.
  const rawOrient = data?.orientation || {};
  const [angleUnit, setAngleUnit] = useState('rad'); // 'rad' | 'deg'

  const formatValue = (val, decimals = 2) => {
    if (val === null || val === undefined) return 'N/A';
    return typeof val === 'number' ? val.toFixed(decimals) : val;
  };

  // Select display rotation vector: apply PolyScope conditional transform only when the
  // first significant component of the raw vector is negative (see polyscopeDisplayRotvec).
  // DEG mode is derived from these display RAD values (NOT from the raw *_deg MQTT fields).
  const rawRx = typeof rawOrient.rx === 'number' ? rawOrient.rx : null;
  const rawRy = typeof rawOrient.ry === 'number' ? rawOrient.ry : null;
  const rawRz = typeof rawOrient.rz === 'number' ? rawOrient.rz : null;

  let dispRx = rawRx, dispRy = rawRy, dispRz = rawRz;
  if (rawRx !== null && rawRy !== null && rawRz !== null) {
    [dispRx, dispRy, dispRz] = polyscopeDisplayRotvec(rawRx, rawRy, rawRz);
  }

  // Format orientation angle from the PolyScope-transformed display value.
  // In RAD mode: show the transformed value. In DEG mode: convert the transformed RAD to degrees.
  const formatAngle = (dispVal) => {
    if (dispVal === null || dispVal === undefined) return 'N/A';
    if (angleUnit === 'deg') return (dispVal * (180 / Math.PI)).toFixed(3);
    return dispVal.toFixed(4);
  };

  // Pre-compute formatted values to avoid redundant calls
  const posX = formatValue(pos.x, 2);
  const posY = formatValue(pos.y, 2);
  const posZ = formatValue(pos.z, 2);
  const orientRx = formatAngle(dispRx);
  const orientRy = formatAngle(dispRy);
  const orientRz = formatAngle(dispRz);

  const angleUnitLabel = angleUnit === 'deg' ? '°' : 'rad';

  // TCP source badge derived from source_status propagated by the MQTT normaliser.
  const sourceStatus = data?.source_status ?? null;
  const sourceKey = sourceStatus?.applied ?? null;
  const sourceBadge = (() => {
    if (!sourceKey) return null;
    const k = String(sourceKey).toLowerCase();
    if (k === 'modbus') {
      const age = sourceStatus?.modbus_age_ms != null
        ? ` · ${sourceStatus.modbus_age_ms} ms`
        : '';
      return { label: `TCP: Modbus${age}`, colorClass: 'tcp-source-modbus' };
    }
    if (k === 'rtde_fallback') {
      return { label: 'TCP: RTDE fallback', colorClass: 'tcp-source-fallback' };
    }
    // 'rtde' or any unrecognised value → blue RTDE badge
    return { label: 'TCP: RTDE', colorClass: 'tcp-source-rtde' };
  })();

  return (
    <CardGlass className={`tcp-pose ${className}`}>
      <div className="tcp-pose-header">
        <div className="tcp-pose-title-block">
          <div className="tcp-pose-title">TCP Pose</div>
          <div className="tcp-pose-ref-badge">
            <span className="tcp-pose-ref-icon">⊙</span>
            REFERENCIA ACTIVA: BASE
          </div>
          {sourceBadge && (
            <div className={`tcp-source-badge ${sourceBadge.colorClass}`}>
              {sourceBadge.label}
            </div>
          )}
          <div className="tcp-pose-ref-note">Todos los valores TCP se expresan respecto al sistema Base del robot</div>
        </div>
        <div className="tcp-pose-unit-segmented">
          <button
            className={`tcp-pose-seg-btn ${angleUnit === 'deg' ? 'active' : ''}`}
            onClick={() => setAngleUnit('deg')}
            title="Mostrar orientación en grados"
          >DEG</button>
          <button
            className={`tcp-pose-seg-btn ${angleUnit === 'rad' ? 'active' : ''}`}
            onClick={() => setAngleUnit('rad')}
            title="Mostrar orientación en radianes"
          >RAD</button>
        </div>
      </div>
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
          <div className="tcp-pose-section-label">ORIENTACIÓN ANGULAR [{angleUnitLabel}]</div>
          <div className="tcp-pose-values">
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RX</span>
              <span className={`tcp-pose-value ${orientRx === 'N/A' ? 'value-na' : ''}`}>{orientRx}</span>
              {orientRx !== 'N/A' && <span className="tcp-pose-unit">{angleUnitLabel}</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RY</span>
              <span className={`tcp-pose-value ${orientRy === 'N/A' ? 'value-na' : ''}`}>{orientRy}</span>
              {orientRy !== 'N/A' && <span className="tcp-pose-unit">{angleUnitLabel}</span>}
            </div>
            <div className="tcp-pose-item">
              <span className="tcp-pose-axis">RZ</span>
              <span className={`tcp-pose-value ${orientRz === 'N/A' ? 'value-na' : ''}`}>{orientRz}</span>
              {orientRz !== 'N/A' && <span className="tcp-pose-unit">{angleUnitLabel}</span>}
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

  // Display-only normalization for Wrist 3 (index 5).
  // Wraps any angle to the [0, 360) range to match Polyscope's convention.
  // The raw joint value is never modified.
  const wrapTo360 = (deg) => {
    let v = deg % 360;
    if (v < 0) v += 360;
    return v;
  };

  return (
    <CardGlass className={`joints-grid ${className}`}>
      <div className="joints-grid-container">
        {positions.map((pos, index) => {
          const displayPos = (index === 5 && typeof pos === 'number') ? wrapTo360(pos) : pos;
          const posValue = formatValue(displayPos, 3);
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

function formatStepValidationTime(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? String(timestamp)
    : date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
}

function formatStepValidationNumber(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(digits);
}

function getStepValidationStatusClass(status) {
  switch (String(status ?? 'UNKNOWN').toUpperCase()) {
    case 'OK':
      return 'svt-status--ok';
    case 'WARNING':
      return 'svt-status--warning';
    case 'ERROR':
      return 'svt-status--error';
    case 'SNAPSHOT_MISMATCH':
      return 'svt-status--snapshot-mismatch';
    case 'UNKNOWN_STEP':
      return 'svt-status--unknown-step';
    case 'FINISHED':
      return 'svt-status--finished';
    case 'PENDING_WEB_VALIDATION':
      return 'svt-status--pending';
    default:
      return 'svt-status--unknown';
  }
}

export function StepValidationTable({ records = [], className = '' }) {
  const { clearStepValidationRecords } = useContext(MqttStatusContext);

  const displayRecords = useMemo(() => (
    Array.isArray(records) ? records : []
  ), [records]);

  const handleExport = () => {
    try {
      if (displayRecords.length === 0) return;
      const headers = [
        'hora',
        'centro',
        'center_id',
        'snapshot_short',
        'step_id',
        'event_counter',
        'step_label',
        'estado',
        'texto_validacion',
        'error_total_mm',
        'dx_mm',
        'dy_mm',
        'dz_mm',
        'planned_x_mm',
        'planned_y_mm',
        'planned_z_mm',
        'captured_x_mm',
        'captured_y_mm',
        'captured_z_mm',
        'snapshot_match',
        'program_name',
        'topic',
      ];
      const rows = displayRecords.map((record) => [
        record.timestamp ?? '',
        record.center_name ?? record.center_id ?? '',
        record.center_id ?? '',
        record.snapshot_short ?? '',
        record.step_id ?? '',
        record.event_counter ?? '',
        record.step_label ?? '',
        record.validation_status ?? '',
        record.validation_text ?? '',
        record.total_error_mm ?? '',
        record.dx_mm ?? '',
        record.dy_mm ?? '',
        record.dz_mm ?? '',
        record.planned_x_mm ?? '',
        record.planned_y_mm ?? '',
        record.planned_z_mm ?? '',
        record.captured_x_mm ?? '',
        record.captured_y_mm ?? '',
        record.captured_z_mm ?? '',
        record.snapshot_match ?? '',
        record.program_name ?? '',
        record._topic ?? '',
      ]);
      const csvContent = [headers, ...rows]
        .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
      link.href = url;
      link.download = `step_validation_${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar resultados de validación:', error);
    }
  };

  return (
    <CardGlass className={`step-validation-table ${className}`}>
      <div className="svt-header">
        <Activity size={16} className="widget-icon" />
        {displayRecords.length === 0
          ? 'Validador de pasos'
          : `Validador de pasos — ${displayRecords.length} resultado${displayRecords.length !== 1 ? 's' : ''}`}
      </div>

      <div className="svt-subtitle">
        Escuchando <code>salesianos/robot/+/step_validation</code> y mostrando solo resultados ya validados.
      </div>

      <div className="sct-controls">
        <button
          className="ctrl-btn ctrl-btn-clear"
          onClick={clearStepValidationRecords}
          disabled={displayRecords.length === 0}
        >
          🗑 Limpiar resultados
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
        <div className="sct-empty">Esperando datos del topic salesianos/robot/+/step_validation…</div>
      ) : (
        <div className="svt-scroll">
          <table className="svt-tbl">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Centro</th>
                <th>Snapshot</th>
                <th>Step</th>
                <th>Event</th>
                <th>Etiqueta</th>
                <th>Estado</th>
                <th>Validación</th>
                <th>Error total (mm)</th>
                <th>ΔX</th>
                <th>ΔY</th>
                <th>ΔZ</th>
                <th>Planned X</th>
                <th>Planned Y</th>
                <th>Planned Z</th>
                <th>Captured X</th>
                <th>Captured Y</th>
                <th>Captured Z</th>
                <th>Snapshot match</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.map((record) => (
                <tr key={record._id ?? `${record.timestamp ?? ''}-${record.step_id ?? ''}-${record.event_counter ?? ''}`}>
                  <td className="svt-td-time">{formatStepValidationTime(record.timestamp)}</td>
                  <td>{record.center_name ?? record.center_id ?? '—'}</td>
                  <td>{record.snapshot_short ?? '—'}</td>
                  <td>{record.step_id ?? '—'}</td>
                  <td>{record.event_counter ?? '—'}</td>
                  <td>{record.step_label ?? '—'}</td>
                  <td>
                    <span className={`svt-status ${getStepValidationStatusClass(record.validation_status)}`}>
                      {record.validation_status ?? 'UNKNOWN'}
                    </span>
                  </td>
                  <td>{record.validation_text ?? '—'}</td>
                  <td>{formatStepValidationNumber(record.total_error_mm)}</td>
                  <td>{formatStepValidationNumber(record.dx_mm)}</td>
                  <td>{formatStepValidationNumber(record.dy_mm)}</td>
                  <td>{formatStepValidationNumber(record.dz_mm)}</td>
                  <td>{formatStepValidationNumber(record.planned_x_mm)}</td>
                  <td>{formatStepValidationNumber(record.planned_y_mm)}</td>
                  <td>{formatStepValidationNumber(record.planned_z_mm)}</td>
                  <td>{formatStepValidationNumber(record.captured_x_mm)}</td>
                  <td>{formatStepValidationNumber(record.captured_y_mm)}</td>
                  <td>{formatStepValidationNumber(record.captured_z_mm)}</td>
                  <td>
                    {typeof record.snapshot_match === 'boolean' ? (
                      <span className={`svt-match ${record.snapshot_match ? 'svt-match--yes' : 'svt-match--no'}`}>
                        {record.snapshot_match ? 'true' : 'false'}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
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
// ── Transition type definitions (mirrors Diagnostico.jsx) ────────────────────
const NR_TRANSITION_TYPE_LABELS = {
  'robot_mode.changed':    'Modo robot',
  'program_state.changed': 'Estado programa',
  'safety.changed':        'Safety',
};

export function NodeRedEventsPanel({ className = '' }) {
  const {
    nodeRedEventsBuffer,
    nodeRedEventsTotal,
    nodeRedEventsBufferLimit,
    publishCommand,
  } = useContext(MqttStatusContext);

  // ── Single source of truth: filter hidden events, keep newest-first order ──
  // nodeRedEventsBuffer is already sorted newest-first by MqttStatusContext.
  // We only filter out visible===false; no .reverse() is applied here.
  const renderedBufferEvents = useMemo(
    () => nodeRedEventsBuffer.filter(e => e.visible !== false),
    [nodeRedEventsBuffer],
  );

  // Counters derived from the same filtered source.
  const { errorCount, warnCount, infoCount } = useMemo(
    () => renderedBufferEvents.reduce(
      (acc, e) => {
        const lvl = (e.level ?? '').toLowerCase();
        if (lvl === 'error') acc.errorCount++;
        else if (lvl === 'warn' || lvl === 'warning') acc.warnCount++;
        else acc.infoCount++;
        return acc;
      },
      { errorCount: 0, warnCount: 0, infoCount: 0 },
    ),
    [renderedBufferEvents],
  );

  // ── Excel export: same source and same order as the visible list ─────────
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FP-ROBOTIK-INTERFACE';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Buffer Eventos');
    sheet.columns = [
      { header: 'id',          key: 'id',          width: 36 },
      { header: 'ts',          key: 'ts',          width: 24 },
      { header: 'source',      key: 'source',      width: 20 },
      { header: 'level',       key: 'level',       width: 10 },
      { header: 'type',        key: 'type',        width: 20 },
      { header: 'text',        key: 'text',        width: 60 },
      { header: 'transition',  key: 'transition',  width: 60 },
      { header: 'data',        key: 'data',        width: 40 },
    ];
    sheet.getRow(1).font = { bold: true };
    // Iterate renderedBufferEvents so the Excel row order matches the UI order.
    renderedBufferEvents.forEach(event => {
      let tsValue = '';
      if (event.ts != null) {
        try {
          const d = new Date(event.ts);
          tsValue = isNaN(d.getTime()) ? String(event.ts) : d.toISOString();
        } catch {
          tsValue = String(event.ts);
        }
      }
      const tr = getStateTransition(event);
      const transitionText = tr
        ? `${tr.displayName}: [${tr.fromValue}] ${tr.fromLabel} → [${tr.toValue}] ${tr.toLabel}`
        : '';
      sheet.addRow({
        id:         event.id     ?? '',
        ts:         tsValue,
        source:     event.source ?? '',
        level:      event.level  ?? '',
        type:       event.type   ?? '',
        text:       event.text   ?? '',
        transition: transitionText,
        data:       event.data   != null ? JSON.stringify(event.data) : '',
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

  const CLEAR_BUFFER_BACKEND_READY = true;

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
          {renderedBufferEvents.length > 0 && (
            <span className="nr-count-badge">{renderedBufferEvents.length}</span>
          )}
          {nodeRedEventsBufferLimit != null && (
            <span className="nr-meta">límite: {nodeRedEventsBufferLimit}</span>
          )}
        </div>
        <div className="log-actions">
          <button
            className="log-btn log-btn--export"
            onClick={handleExportExcel}
            disabled={renderedBufferEvents.length === 0}
            aria-label={renderedBufferEvents.length === 0 ? 'Exportar a Excel (buffer vacío)' : 'Exportar buffer de eventos a Excel'}
            title="Exportar buffer de eventos a Excel"
          >
            <span aria-hidden="true">⬇</span> Exportar a Excel
          </button>
          <button
            className="log-btn log-btn--clear"
            onClick={handleClearBuffer}
            disabled={!CLEAR_BUFFER_BACKEND_READY}
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

      {renderedBufferEvents.length === 0 ? (
        <div className="log-empty">Sin eventos en el buffer</div>
      ) : (
        <div className="log-messages nr-events-messages">
          {renderedBufferEvents.map((event, i) => {
            const lvl = (event.level ?? 'info').toLowerCase();
            const rowMod = lvl === 'error' ? 'error' : lvl.startsWith('warn') ? 'warning' : 'info';
            const normalizedData = normalizeEventData(event.data);
            const normalizedEvent = normalizedData !== event.data
              ? { ...event, data: normalizedData }
              : event;
            const transition = getStateTransition(normalizedEvent);
            const isTransitionType = Object.prototype.hasOwnProperty.call(
              NR_TRANSITION_TYPE_LABELS, event.type ?? '',
            );
            const hasFromTo = normalizedData?.from != null && normalizedData?.to != null;

            // Build primary line: transition if available, else event.text
            let mainText;
            if (transition && hasFromTo) {
              mainText = `${transition.displayName}: [${transition.fromValue}] ${transition.fromLabel} → [${transition.toValue}] ${transition.toLabel}`;
            } else if (isTransitionType && hasFromTo) {
              // Defensive fallback: never show generic text for a real state-change event
              const name = NR_TRANSITION_TYPE_LABELS[event.type];
              mainText = `${name}: [${normalizedData.from}] ${normalizedData.from} → [${normalizedData.to}] ${normalizedData.to}`;
            } else {
              mainText = event.text ?? '—';
            }

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
                <span className="log-text diag-event-msg">{mainText}</span>
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
 * Muestra los eventos de nivel ERROR del buffer de eventos de Node-RED
 * (misma fuente que NodeRedEventsPanel, el buffer inferior).
 * Así el cuadro superior y el buffer inferior siempre son coherentes.
 */
export function NodeRedDiagMessagesPanel({ className = '' }) {
  const { nodeRedEventsBuffer } = useContext(MqttStatusContext);

  // Same filtering as NodeRedEventsPanel — hidden events never shown.
  const visibleEvents = useMemo(
    () => nodeRedEventsBuffer.filter(e => e.visible !== false),
    [nodeRedEventsBuffer],
  );

  // Only the 3 most recent error-level events (newest first, same buffer order).
  const diagnosticErrorEvents = useMemo(
    () => visibleEvents.filter(e => (e.level ?? '').toLowerCase() === 'error').slice(0, 3),
    [visibleEvents],
  );

  const lastErrorEvent = diagnosticErrorEvents[0] ?? null;

  return (
    <CardGlass className={`log-panel nr-messages-panel ${className}`}>
      <div className="log-header">
        <div className="log-title">
          📋 Diagnóstico / mensajes
          {diagnosticErrorEvents.length > 0 && (
            <span className="nr-count-badge">{diagnosticErrorEvents.length}</span>
          )}
        </div>
      </div>

      {lastErrorEvent && (
        <div className="nr-last-error">
          <span className="nr-badge nr-badge--error">ÚLTIMO ERROR</span>
          <span className="nr-last-error-text">{lastErrorEvent.text ?? '—'}</span>
        </div>
      )}

      {diagnosticErrorEvents.length === 0 ? (
        <div className="log-empty">Sin mensajes de diagnóstico</div>
      ) : (
        <div className="log-messages nr-msg-messages">
          {diagnosticErrorEvents.map((event, i) => (
            <div key={event.id ?? i} className="log-message diag-event-row diag-event-row--error">
              <EventLevelBadge level={event.level} />
              {event.type && (
                <span className="nr-event-type">{event.type}</span>
              )}
              <span className="log-time">{formatEventTs(event.ts)}</span>
              <span className="log-text">{event.text ?? '—'}</span>
            </div>
          ))}
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

/**
 * TcpConfigPanel – Displays tool configuration data from config_herramienta MQTT block.
 * Shows TCP name, position (X/Y/Z), orientation (RX/RY/RZ), load (kg) and center of gravity (CX/CY/CZ).
 * Legacy full-panel kept for backward compatibility.
 */
export function TcpConfigPanel({ data, className = '' }) {
  const tcp = data?.punto_central_herramienta ?? {};
  const load = data?.carga_y_centro_de_gravedad ?? {};
  const pos = tcp.posicion ?? {};
  const ori = tcp.orientacion ?? {};
  const cog = load.centro_de_gravedad ?? {};
  const oriUnits = ori.unidades ?? 'rad';

  const tcpNombre = tcp.tcp_nombre;
  const displayName =
    !tcpNombre || tcpNombre === 'no_disponible_por_rtde'
      ? 'TCP activo'
      : tcpNombre;

  const fmtNum = (v) => {
    if (v === null || v === undefined) return '—';
    const n = Number(v);
    return isFinite(n) ? n.toFixed(4) : String(v);
  };

  return (
    <div className={`tcp-cfg-panel ${className}`}>
      {/* TCP Name Banner */}
      <div className="tcp-cfg-name-badge">
        <span className="tcp-cfg-name-icon" aria-hidden="true">⚙</span>
        <span className="tcp-cfg-name-label">{displayName}</span>
      </div>

      {/* Section 1: Punto central de la herramienta */}
      <CardGlass className="tcp-cfg-section">
        <div className="tcp-cfg-section-header">
          <span className="tcp-cfg-section-icon" aria-hidden="true">📍</span>
          <span className="tcp-cfg-section-title">PUNTO CENTRAL DE LA HERRAMIENTA</span>
        </div>
        <div className="tcp-cfg-data-grid">
          <div className="tcp-cfg-group">
            <div className="tcp-cfg-group-label">POSICIÓN</div>
            {[
              { axis: 'X', value: pos.X_mm, unit: 'mm' },
              { axis: 'Y', value: pos.Y_mm, unit: 'mm' },
              { axis: 'Z', value: pos.Z_mm, unit: 'mm' },
            ].map(({ axis, value, unit }) => (
              <div key={axis} className="tcp-cfg-row">
                <span className="tcp-cfg-axis">{axis}</span>
                <span className={`tcp-cfg-value ${value == null ? 'value-na' : ''}`}>{fmtNum(value)}</span>
                <span className="tcp-cfg-unit">{unit}</span>
              </div>
            ))}
          </div>
          <div className="tcp-cfg-group">
            <div className="tcp-cfg-group-label">ORIENTACIÓN</div>
            {[
              { axis: 'RX', value: ori.RX },
              { axis: 'RY', value: ori.RY },
              { axis: 'RZ', value: ori.RZ },
            ].map(({ axis, value }) => (
              <div key={axis} className="tcp-cfg-row">
                <span className="tcp-cfg-axis">{axis}</span>
                <span className={`tcp-cfg-value ${value == null ? 'value-na' : ''}`}>{fmtNum(value)}</span>
                <span className="tcp-cfg-unit">{oriUnits}</span>
              </div>
            ))}
          </div>
        </div>
      </CardGlass>

      {/* Section 2: Carga y centro de gravedad */}
      <CardGlass className="tcp-cfg-section">
        <div className="tcp-cfg-section-header">
          <span className="tcp-cfg-section-icon" aria-hidden="true">⚖</span>
          <span className="tcp-cfg-section-title">CARGA Y CENTRO DE GRAVEDAD</span>
        </div>
        <div className="tcp-cfg-data-grid">
          <div className="tcp-cfg-group">
            <div className="tcp-cfg-group-label">CARGA</div>
            <div className="tcp-cfg-row tcp-cfg-row--single">
              <span className="tcp-cfg-axis tcp-cfg-axis--label">Carga</span>
              <span className={`tcp-cfg-value ${load.carga_kg == null ? 'value-na' : ''}`}>{fmtNum(load.carga_kg)}</span>
              <span className="tcp-cfg-unit">kg</span>
            </div>
          </div>
          <div className="tcp-cfg-group">
            <div className="tcp-cfg-group-label">CENTRO DE GRAVEDAD</div>
            {[
              { axis: 'CX', value: cog.CX_mm },
              { axis: 'CY', value: cog.CY_mm },
              { axis: 'CZ', value: cog.CZ_mm },
            ].map(({ axis, value }) => (
              <div key={axis} className="tcp-cfg-row">
                <span className="tcp-cfg-axis">{axis}</span>
                <span className={`tcp-cfg-value ${value == null ? 'value-na' : ''}`}>{fmtNum(value)}</span>
                <span className="tcp-cfg-unit">mm</span>
              </div>
            ))}
          </div>
        </div>
      </CardGlass>
    </div>
  );
}

/**
 * TcpConfigMain – Position + orientation block for the CONFIGURACIÓN TCP tab (top-right cell).
 * Uses the same typographic scale as TcpPose for visual consistency.
 * Includes a RAD/DEG toggle for orientation display (display-only, source data unchanged).
 */
export function TcpConfigMain({ data, className = '' }) {
  const tcp = data?.punto_central_herramienta ?? {};
  const pos = tcp.posicion ?? {};
  const ori = tcp.orientacion ?? {};

  const [angleUnit, setAngleUnit] = useState('rad'); // 'rad' | 'deg'

  const tcpNombre = tcp.tcp_nombre;
  const displayName =
    !tcpNombre || tcpNombre === 'no_disponible_por_rtde'
      ? 'TCP Activo'
      : tcpNombre;

  const fmtNum = (v) => {
    if (v === null || v === undefined) return '—';
    const n = Number(v);
    return isFinite(n) ? n.toFixed(4) : String(v);
  };

  // Orientation display: raw MQTT values in RAD mode, simple rad→deg in DEG mode.
  // NO PolyScope-equivalent transform — this is the static tool offset, not the live pose.
  const fmtAngle = (v) => {
    if (v === null || v === undefined) return '—';
    const n = Number(v);
    if (!isFinite(n)) return String(v);
    if (angleUnit === 'deg') return (n * (180 / Math.PI)).toFixed(3);
    return n.toFixed(4);
  };

  console.log('[TCP CONFIGURATION] raw config RX/RY/RZ:', ori.RX, ori.RY, ori.RZ);
  console.log('[TCP CONFIGURATION] displayed RX/RY/RZ:', fmtAngle(ori.RX), fmtAngle(ori.RY), fmtAngle(ori.RZ));

  const angleUnitLabel = angleUnit === 'deg' ? '°' : 'rad';

  // If no config data at all, show a clean fallback
  if (!data) {
    return (
      <CardGlass className={`tcp-cfgm-card ${className}`}>
        <div className="tcp-cfgm-fallback">Sin datos de configuración TCP</div>
      </CardGlass>
    );
  }

  return (
    <CardGlass className={`tcp-cfgm-card ${className}`}>
      {/* Header: name badge + toggle */}
      <div className="tcp-cfgm-header">
        <div className="tcp-cfgm-title-block">
          <div className="tcp-cfgm-title">HERRAMIENTA ACTIVA</div>
          <div className="tcp-cfgm-name-badge">
            <span className="tcp-cfgm-name-icon" aria-hidden="true">⚙</span>
            <span className="tcp-cfgm-name-label">{displayName}</span>
          </div>
        </div>
        <div className="tcp-cfgm-header-right">
          <div className="tcp-cfgm-ref-badge">
            <span>⊙</span>
            <span>REF: BRIDA</span>
          </div>
          <div className="tcp-cfgm-unit-segmented" role="group" aria-label="Unidad angular">
            <button
              className={`tcp-cfgm-seg-btn ${angleUnit === 'deg' ? 'active' : ''}`}
              onClick={() => setAngleUnit('deg')}
              title="Mostrar orientación en grados"
            >DEG</button>
            <button
              className={`tcp-cfgm-seg-btn ${angleUnit === 'rad' ? 'active' : ''}`}
              onClick={() => setAngleUnit('rad')}
              title="Mostrar orientación en radianes"
            >RAD</button>
          </div>
        </div>
      </div>

      {/* Data grid */}
      <div className="tcp-cfgm-grid">
        {/* Position column */}
        <div className="tcp-cfgm-section">
          <div className="tcp-cfgm-section-label">POSICIÓN [mm]</div>
          <div className="tcp-cfgm-values">
            {[
              { axis: 'X', value: pos.X_mm, unit: 'mm' },
              { axis: 'Y', value: pos.Y_mm, unit: 'mm' },
              { axis: 'Z', value: pos.Z_mm, unit: 'mm' },
            ].map(({ axis, value, unit }) => (
              <div key={axis} className="tcp-cfgm-item">
                <span className="tcp-cfgm-axis">{axis}</span>
                <span className={`tcp-cfgm-value ${value === null || value === undefined ? 'value-na' : ''}`}>{fmtNum(value)}</span>
                <span className="tcp-cfgm-unit">{unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orientation column */}
        <div className="tcp-cfgm-section">
          <div className="tcp-cfgm-section-label">ORIENTACIÓN [{angleUnitLabel}]</div>
          <div className="tcp-cfgm-values">
            {[
              { axis: 'RX', value: ori.RX },
              { axis: 'RY', value: ori.RY },
              { axis: 'RZ', value: ori.RZ },
            ].map(({ axis, value }) => (
              <div key={axis} className="tcp-cfgm-item">
                <span className="tcp-cfgm-axis">{axis}</span>
                <span className={`tcp-cfgm-value ${value === null || value === undefined ? 'value-na' : ''}`}>{fmtAngle(value)}</span>
                <span className="tcp-cfgm-unit">{angleUnitLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardGlass>
  );
}

/**
 * TcpPayloadPanel – Payload mass and centre-of-gravity block for the CONFIGURACIÓN TCP tab (bottom-left cell).
 */
export function TcpPayloadPanel({ data, className = '' }) {
  const load = data?.carga_y_centro_de_gravedad ?? {};
  const cog  = load.centro_de_gravedad ?? {};

  const fmtNum = (v) => {
    if (v === null || v === undefined) return '—';
    const n = Number(v);
    return isFinite(n) ? n.toFixed(4) : String(v);
  };

  if (!data) {
    return (
      <CardGlass className={`tcp-payload-card ${className}`}>
        <div className="tcp-cfgm-fallback">Sin datos de carga / CoG</div>
      </CardGlass>
    );
  }

  return (
    <CardGlass className={`tcp-payload-card ${className}`}>
      <div className="tcp-payload-header">
        <span className="tcp-payload-icon" aria-hidden="true">⚖</span>
        <span className="tcp-payload-title">CARGA Y CENTRO DE GRAVEDAD</span>
      </div>

      <div className="tcp-payload-grid">
        {/* Load */}
        <div className="tcp-payload-section">
          <div className="tcp-payload-section-label">MASA [kg]</div>
          <div className="tcp-payload-big-value">
            <span className={`tcp-payload-value-num ${load.carga_kg === null || load.carga_kg === undefined ? 'value-na' : ''}`}>
              {fmtNum(load.carga_kg)}
            </span>
            <span className="tcp-payload-value-unit">kg</span>
          </div>
        </div>

        {/* CoG */}
        <div className="tcp-payload-section">
          <div className="tcp-payload-section-label">CENTRO DE GRAVEDAD [mm]</div>
          <div className="tcp-payload-cog-values">
            {[
              { axis: 'CX', value: cog.CX_mm },
              { axis: 'CY', value: cog.CY_mm },
              { axis: 'CZ', value: cog.CZ_mm },
            ].map(({ axis, value }) => (
              <div key={axis} className="tcp-cfgm-item">
                <span className="tcp-cfgm-axis">{axis}</span>
                <span className={`tcp-cfgm-value ${value === null || value === undefined ? 'value-na' : ''}`}>{fmtNum(value)}</span>
                <span className="tcp-cfgm-unit">mm</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardGlass>
  );
}

/**
 * TcpFlangeSchematic – SVG technical diagram of the tool flange reference frame.
 * Shows front view (flange face with bolt pattern) and side view (arm end with X/Y/Z axes).
 * Polyscope-inspired flat technical drawing style.
 */
export function TcpFlangeSchematic({ data, className = '' }) {
  const tcp  = data?.punto_central_herramienta ?? {};
  const pos  = tcp.posicion ?? {};
  const load = data?.carga_y_centro_de_gravedad ?? {};

  const xVal = pos.X_mm != null ? Number(pos.X_mm).toFixed(2) : '—';
  const yVal = pos.Y_mm != null ? Number(pos.Y_mm).toFixed(2) : '—';
  const zVal = pos.Z_mm != null ? Number(pos.Z_mm).toFixed(2) : '—';
  const massVal = load.carga_kg != null ? `${Number(load.carga_kg).toFixed(3)} kg` : '—';

  return (
    <CardGlass className={`tcp-schematic-card ${className}`}>
      <div className="tcp-schematic-header">
        <span className="tcp-schematic-title">MARCO DE REFERENCIA — BRIDA / HERRAMIENTA</span>
        <span className="tcp-schematic-subtitle">Sistema de coordenadas relativo a la brida del robot</span>
      </div>

      <div className="tcp-schematic-body">
        {/* ── FRONT VIEW: Flange face ── */}
        <div className="tcp-schematic-view">
          <div className="tcp-schematic-view-label">VISTA FRONTAL — BRIDA</div>
          <svg viewBox="0 0 200 200" className="tcp-schematic-svg" aria-label="Vista frontal de la brida">
            {/* Outer flange ring */}
            <circle cx="100" cy="100" r="76" fill="none" stroke="#6b7280" strokeWidth="2"/>
            {/* Inner bore */}
            <circle cx="100" cy="100" r="20" fill="none" stroke="#6b7280" strokeWidth="1.5"/>
            {/* PCD circle (dashed) */}
            <circle cx="100" cy="100" r="55" fill="none" stroke="#4b5563" strokeWidth="1" strokeDasharray="4 3"/>
            {/* 6 bolt holes */}
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const r = (deg * Math.PI) / 180;
              return (
                <circle key={deg}
                  cx={100 + 55 * Math.cos(r)} cy={100 + 55 * Math.sin(r)}
                  r="6" fill="#1e293b" stroke="#6b7280" strokeWidth="1.5"/>
              );
            })}
            {/* Alignment notch on outer ring */}
            <line x1="100" y1="24" x2="100" y2="15" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            {/* Origin crosshair */}
            <line x1="88" y1="100" x2="112" y2="100" stroke="#9ca3af" strokeWidth="0.75" strokeDasharray="2 2"/>
            <line x1="100" y1="88" x2="100" y2="112" stroke="#9ca3af" strokeWidth="0.75" strokeDasharray="2 2"/>
            {/* Origin — blue dot (Z comes out of the plane) */}
            <circle cx="100" cy="100" r="3.5" fill="#3b82f6"/>
            {/* X axis — red, pointing right */}
            <line x1="100" y1="100" x2="148" y2="100" stroke="#ef4444" strokeWidth="2.5"/>
            <polygon points="148,95.5 156,100 148,104.5" fill="#ef4444"/>
            <text x="159" y="104" fill="#ef4444" fontSize="12" fontFamily="var(--font-display,'Orbitron',sans-serif)" fontWeight="700">X</text>
            {/* Y axis — green, pointing up */}
            <line x1="100" y1="100" x2="100" y2="52" stroke="#22c55e" strokeWidth="2.5"/>
            <polygon points="95.5,52 100,44 104.5,52" fill="#22c55e"/>
            <text x="104" y="42" fill="#22c55e" fontSize="12" fontFamily="var(--font-display,'Orbitron',sans-serif)" fontWeight="700">Y</text>
            {/* Z label (out of plane) */}
            <circle cx="100" cy="100" r="8" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2"/>
            <text x="110" y="90" fill="#3b82f6" fontSize="10" fontFamily="var(--font-display,'Orbitron',sans-serif)" fontWeight="700">Z</text>
          </svg>
        </div>

        {/* ── SIDE VIEW: Tool arm / offset ── */}
        <div className="tcp-schematic-view">
          <div className="tcp-schematic-view-label">VISTA LATERAL — OFFSET TCP</div>
          <svg viewBox="0 0 200 200" className="tcp-schematic-svg" aria-label="Vista lateral del offset TCP">
            {/* Wrist arm body */}
            <rect x="20" y="82" width="88" height="36" rx="4"
              fill="none" stroke="#6b7280" strokeWidth="1.75"/>
            {/* Flange face (vertical plate) */}
            <rect x="108" y="82" width="14" height="36" rx="2"
              fill="#1e293b" stroke="#9ca3af" strokeWidth="1.75"/>
            {/* Tool body (dashed outline) */}
            <rect x="122" y="86" width="26" height="28" rx="3"
              fill="none" stroke="#9ca3af" strokeWidth="1.25" strokeDasharray="4 2.5"/>
            {/* Flange origin */}
            <circle cx="115" cy="100" r="3" fill="#6b7280"/>
            {/* TCP origin — blue */}
            <circle cx="148" cy="100" r="3.5" fill="#3b82f6"/>
            {/* Offset dashed line */}
            <line x1="118" y1="100" x2="144.5" y2="100"
              stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 2"/>
            {/* Y axis — green, pointing UP */}
            <line x1="148" y1="100" x2="148" y2="54" stroke="#22c55e" strokeWidth="2.5"/>
            <polygon points="143.5,54 148,46 152.5,54" fill="#22c55e"/>
            <text x="152" y="44" fill="#22c55e" fontSize="10" fontFamily="var(--font-display,'Orbitron',sans-serif)" fontWeight="700">Y</text>
            {/* Z axis — blue, pointing LEFT */}
            <line x1="148" y1="100" x2="108" y2="100" stroke="#3b82f6" strokeWidth="2.5"/>
            <polygon points="108,95.5 100,100 108,104.5" fill="#3b82f6"/>
            <text x="88" y="95" fill="#3b82f6" fontSize="10" fontFamily="var(--font-display,'Orbitron',sans-serif)" fontWeight="700">Z</text>
            {/* X axis — red, into/out of plane marker */}
            <circle cx="148" cy="100" r="7" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2"/>
            <line x1="143" y1="95" x2="153" y2="105" stroke="#ef4444" strokeWidth="1.25"/>
            <line x1="153" y1="95" x2="143" y2="105" stroke="#ef4444" strokeWidth="1.25"/>
            <text x="158" y="120" fill="#ef4444" fontSize="9" fontFamily="var(--font-display,'Orbitron',sans-serif)" fontWeight="700">X</text>
            {/* Labels */}
            <text x="20" y="148" fill="#6b7280" fontSize="8" fontFamily="var(--font-display,'Orbitron',sans-serif)">BRIDA</text>
            <text x="126" y="155" fill="#9ca3af" fontSize="8" fontFamily="var(--font-display,'Orbitron',sans-serif)" fontWeight="700">TCP</text>
          </svg>
        </div>
      </div>

      {/* Configured offset summary — values come exclusively from config_herramienta, NOT live pose */}
      <div className="tcp-schematic-summary-block">
        <div className="tcp-schematic-summary-header">OFFSET CONFIGURADO (BRIDA → TCP)</div>
        <div className="tcp-schematic-summary">
          <div className="tcp-schematic-summary-item">
            <span className="tcp-schematic-summary-axis" style={{ color: '#ef4444' }}>ΔX</span>
            <span className="tcp-schematic-summary-val">{xVal}</span>
            <span className="tcp-schematic-summary-unit">mm</span>
          </div>
          <div className="tcp-schematic-summary-item">
            <span className="tcp-schematic-summary-axis" style={{ color: '#22c55e' }}>ΔY</span>
            <span className="tcp-schematic-summary-val">{yVal}</span>
            <span className="tcp-schematic-summary-unit">mm</span>
          </div>
          <div className="tcp-schematic-summary-item">
            <span className="tcp-schematic-summary-axis" style={{ color: '#3b82f6' }}>ΔZ</span>
            <span className="tcp-schematic-summary-val">{zVal}</span>
            <span className="tcp-schematic-summary-unit">mm</span>
          </div>
          <div className="tcp-schematic-summary-item tcp-schematic-summary-item--mass">
            <span className="tcp-schematic-summary-axis" style={{ color: '#ff7c00' }}>M</span>
            <span className="tcp-schematic-summary-val">{massVal}</span>
          </div>
        </div>
      </div>
    </CardGlass>
  );
}
