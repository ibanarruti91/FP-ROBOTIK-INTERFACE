/**
 * RobotDashboard - High-fidelity "ESTADO DE ROBOT / MAPEADO E/S" screen
 * 2-column layout (60/40) with camera, digital/analog IO mapping,
 * security panel, program management, analog instrumentation, and tool data.
 */

import { useState, useEffect, useRef } from 'react';
import './RobotDashboard.css';

// Program status labels
const PROGRAM_STATUS_LABELS = {
  0: 'ESPERA',
  1: 'EN EJECUCIÓN',
  2: 'DETENIDO',
  3: 'ERROR',
  4: 'PAUSA'
};

// Safety state configuration
const SAFETY_STATES = {
  'NORMAL':                  { label: 'NOMINAL',           color: '#10d98a', blink: false },
  'REDUCED':                 { label: 'REDUCIDO',          color: '#ffbf00', blink: false },
  'PROTECTIVE_STOP':         { label: 'STOP PROTECTIVO',   color: '#ef4444', blink: true  },
  'SYSTEM_EMERGENCY_STOP':   { label: 'EMERGENCIA',        color: '#ef4444', blink: true  },
  'ROBOT_EMERGENCY_STOP':    { label: 'EMERGENCIA',        color: '#ef4444', blink: true  },
  'VIOLATION':               { label: 'VIOLACIÓN',         color: '#ff33bb', blink: true  },
  'FAULT':                   { label: 'FALLO',             color: '#ff33bb', blink: true  }
};

/* ─── Camera Panel ──────────────────────────────────────────────────── */

function CameraPanel({ streamUrl }) {
  const [hasError, setHasError] = useState(false);
  const showFeed = streamUrl && !hasError;

  return (
    <div className="rd-camera-panel">
      <div className="rd-panel-header">
        <span className="rd-panel-title">CÁMARA EN VIVO</span>
        {showFeed && <span className="rd-live-badge">● LIVE</span>}
      </div>
      <div className="rd-camera-frame">
        {showFeed ? (
          <img
            src={streamUrl}
            alt="Camera Feed"
            className="rd-camera-img"
            onError={() => setHasError(true)}
            onLoad={() => setHasError(false)}
          />
        ) : (
          <div className="rd-no-signal">
            <div className="rd-no-signal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 7l-7 5 7 5V7z"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </div>
            <span className="rd-no-signal-text">SIN SEÑAL</span>
          </div>
        )}
        {/* Cyber-frame corner decorations */}
        <div className="rd-corner rd-corner-tl"></div>
        <div className="rd-corner rd-corner-tr"></div>
        <div className="rd-corner rd-corner-bl"></div>
        <div className="rd-corner rd-corner-br"></div>
      </div>
    </div>
  );
}

/* ─── LED Pin ───────────────────────────────────────────────────────── */

function LedPin({ number, active, isInput, naState }) {
  return (
    <div
      className={`rd-led-pin${active ? ' rd-led-active' : ''}${naState ? ' rd-led-na' : ''}${isInput ? ' rd-led-cyan' : ' rd-led-magenta'}`}
    >
      <span className="rd-led-number">{number}</span>
    </div>
  );
}

/* ─── IO Mapping Panel ──────────────────────────────────────────────── */

function IOMapping({ digitalInputs, digitalOutputs, analogInputs, analogOutputs }) {
  return (
    <div className="rd-io-panel">
      <div className="rd-panel-header">
        <span className="rd-panel-title">MAPEADO DIGITAL</span>
      </div>
      <div className="rd-io-grid">
        {/* DI - Digital Inputs */}
        <div className="rd-io-block">
          <div className="rd-io-block-title rd-cyan-text">
            DI <span className="rd-io-subtitle">Entradas Digitales</span>
          </div>
          <div className="rd-led-matrix">
            {digitalInputs.map((val, i) => (
              <LedPin
                key={`di-${i}`}
                number={i}
                active={val === 1 || val === true}
                isInput={true}
                naState={val === null}
              />
            ))}
          </div>
        </div>

        {/* CI - Analog Inputs */}
        <div className="rd-io-block">
          <div className="rd-io-block-title rd-cyan-text">
            CI <span className="rd-io-subtitle">Entradas Analógicas</span>
          </div>
          <div className="rd-led-matrix">
            {analogInputs.map((val, i) => (
              <LedPin
                key={`ci-${i}`}
                number={i}
                active={val !== null && val > 0}
                isInput={true}
                naState={val === null}
              />
            ))}
          </div>
        </div>

        {/* DO - Digital Outputs */}
        <div className="rd-io-block">
          <div className="rd-io-block-title rd-magenta-text">
            DO <span className="rd-io-subtitle">Salidas Digitales</span>
          </div>
          <div className="rd-led-matrix">
            {digitalOutputs.map((val, i) => (
              <LedPin
                key={`do-${i}`}
                number={i}
                active={val === 1 || val === true}
                isInput={false}
                naState={val === null}
              />
            ))}
          </div>
        </div>

        {/* CO - Analog Outputs */}
        <div className="rd-io-block">
          <div className="rd-io-block-title rd-magenta-text">
            CO <span className="rd-io-subtitle">Salidas Analógicas</span>
          </div>
          <div className="rd-led-matrix">
            {analogOutputs.map((val, i) => (
              <LedPin
                key={`co-${i}`}
                number={i}
                active={val !== null && val > 0}
                isInput={false}
                naState={val === null}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Security Block ────────────────────────────────────────────────── */

function SecurityBlock({ safety, heartbeat }) {
  const state = safety && SAFETY_STATES[safety]
    ? SAFETY_STATES[safety]
    : safety
      ? { label: safety, color: '#ffbf00', blink: false }
      : null;

  const isNominal  = safety === 'NORMAL';
  const isStop     = state?.blink ?? false;
  const isNA       = state === null;

  return (
    <div className="rd-block rd-security-block">
      <div className="rd-block-header">
        <span className="rd-block-title">🛡 SEGURIDAD</span>
        <span className="rd-critical-badge">CRÍTICO</span>
      </div>
      <div className="rd-security-badges">
        {isNA ? (
          <div className="rd-sec-badge rd-badge-na">N/A</div>
        ) : (
          <>
            <div className={`rd-sec-badge ${isNominal ? 'rd-badge-nominal' : 'rd-badge-dim'} ${heartbeat ? 'rd-heartbeat-flash' : ''}`}>
              <span className="rd-badge-dot"></span>
              NOMINAL
            </div>
            <div className={`rd-sec-badge ${isStop ? 'rd-badge-stop rd-badge-blink' : 'rd-badge-dim'}`}>
              <span className="rd-badge-dot"></span>
              STOP
            </div>
            {!isNominal && !isStop && state && (
              <div className="rd-sec-badge rd-badge-warning" style={{ '--badge-color': state.color }}>
                <span className="rd-badge-dot"></span>
                {state.label}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Program Management Block ──────────────────────────────────────── */

function ProgramBlock({ programa, sistema, heartbeat }) {
  const programName  = programa?.nombre;
  const statusId     = programa?.status_id;
  const statusLabel  = statusId !== null && statusId !== undefined
    ? (PROGRAM_STATUS_LABELS[statusId] ?? `STATUS ${statusId}`)
    : null;
  const modoOp    = sistema?.modo_operacion;
  const estadoMaq = sistema?.estado_maquina;

  const isCyanState = (val) => val === 'ESPERA' || val === 'DETENIDO' || val === 'PAUSA';

  return (
    <div className="rd-block rd-program-block">
      <div className="rd-block-header">
        <span className="rd-block-title">⚙ GESTIÓN DE PROGRAMA</span>
      </div>
      <table className="rd-program-table">
        <tbody>
          <tr className="rd-prog-row">
            <td className="rd-prog-label">Programa</td>
            <td className={`rd-prog-value ${!programName ? 'rd-na' : ''} ${heartbeat && programName ? 'rd-heartbeat-flash' : ''}`}>
              {programName ?? 'N/A'}
            </td>
          </tr>
          <tr className="rd-prog-row">
            <td className="rd-prog-label">Estado</td>
            <td className={`rd-prog-value ${statusLabel && isCyanState(statusLabel) ? 'rd-state-cyan' : ''} ${!statusLabel ? 'rd-na' : ''} ${heartbeat && statusLabel ? 'rd-heartbeat-flash' : ''}`}>
              {statusLabel ?? 'N/A'}
            </td>
          </tr>
          <tr className="rd-prog-row">
            <td className="rd-prog-label">Modo Op.</td>
            <td className={`rd-prog-value ${!modoOp ? 'rd-na' : ''} ${heartbeat && modoOp ? 'rd-heartbeat-flash' : ''}`}>
              {modoOp ?? 'N/A'}
            </td>
          </tr>
          <tr className="rd-prog-row">
            <td className="rd-prog-label">Estado Máq.</td>
            <td className={`rd-prog-value ${!estadoMaq ? 'rd-na' : ''} ${heartbeat && estadoMaq ? 'rd-heartbeat-flash' : ''}`}>
              {estadoMaq ?? 'N/A'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Analog Bar ────────────────────────────────────────────────────── */

function AnalogBar({ label, value, maxValue = 10, isInput, heartbeat }) {
  const isNA       = value === null || value === undefined;
  const percentage = isNA ? 0 : Math.min(100, Math.max(0, (value / maxValue) * 100));
  const gradient   = isInput
    ? 'linear-gradient(90deg, #00d1ff, #0057ff)'
    : 'linear-gradient(90deg, #ff33bb, #ff00ff)';

  return (
    <div className="rd-analog-row">
      <span className="rd-analog-label">{label}</span>
      <div className="rd-analog-bar-track">
        <div
          className="rd-analog-bar-fill"
          style={{ width: `${percentage}%`, background: isNA ? '#1e2940' : gradient }}
        ></div>
      </div>
      <span className={`rd-analog-val ${isNA ? 'rd-na' : ''} ${heartbeat && !isNA ? 'rd-heartbeat-flash' : ''}`}>
        {isNA ? 'N/A' : `${typeof value === 'number' ? value.toFixed(2) : value} V`}
      </span>
    </div>
  );
}

/* ─── Analog Instrumentation Block ─────────────────────────────────── */

function AnalogBlock({ analogInputs, analogOutputs, heartbeat }) {
  return (
    <div className="rd-block rd-analog-block">
      <div className="rd-block-header">
        <span className="rd-block-title">📊 INSTRUMENTACIÓN ANALÓGICA</span>
      </div>
      <div className="rd-analog-section">
        <div className="rd-analog-section-title rd-cyan-text">Entradas (CI)</div>
        {analogInputs.map((val, i) => (
          <AnalogBar key={`ci-bar-${i}`} label={`CI${i}`} value={val} isInput={true} heartbeat={heartbeat} />
        ))}
      </div>
      <div className="rd-analog-section">
        <div className="rd-analog-section-title rd-magenta-text">Salidas (CO)</div>
        {analogOutputs.map((val, i) => (
          <AnalogBar key={`co-bar-${i}`} label={`CO${i}`} value={val} isInput={false} heartbeat={heartbeat} />
        ))}
      </div>
    </div>
  );
}

/* ─── Tool Data Block ───────────────────────────────────────────────── */

function ToolBlock({ tool, heartbeat }) {
  const voltage  = tool?.voltage;
  const current  = tool?.current;
  const isVoltNA = voltage === null || voltage === undefined;
  const isCurrNA = current === null || current === undefined;

  return (
    <div className="rd-block rd-tool-block">
      <div className="rd-block-header">
        <span className="rd-block-title">🔧 TOOL DATA</span>
      </div>
      <div className="rd-tool-cards">
        <div className="rd-tool-card">
          <div className="rd-tool-label">TENSIÓN</div>
          <div className={`rd-tool-value ${isVoltNA ? 'rd-na' : ''} ${heartbeat && !isVoltNA ? 'rd-heartbeat-flash' : ''}`}>
            {isVoltNA ? 'N/A' : (typeof voltage === 'number' ? voltage.toFixed(1) : voltage)}
          </div>
          {!isVoltNA && <div className="rd-tool-unit">V</div>}
        </div>
        <div className="rd-tool-card">
          <div className="rd-tool-label">CORRIENTE</div>
          <div className={`rd-tool-value ${isCurrNA ? 'rd-na' : ''} ${heartbeat && !isCurrNA ? 'rd-heartbeat-flash' : ''}`}>
            {isCurrNA ? 'N/A' : (typeof current === 'number' ? current.toFixed(0) : current)}
          </div>
          {!isCurrNA && <div className="rd-tool-unit">mA</div>}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────────── */

export default function RobotDashboard({ data }) {
  const [heartbeat, setHeartbeat] = useState(false);
  const prevTimestamp = useRef(null);

  // Trigger heartbeat flash when MQTT timestamp changes
  useEffect(() => {
    if (data?.timestamp && data.timestamp !== prevTimestamp.current) {
      prevTimestamp.current = data.timestamp;
      const onTimer  = setTimeout(() => setHeartbeat(true), 0);
      const offTimer = setTimeout(() => setHeartbeat(false), 400);
      return () => { clearTimeout(onTimer); clearTimeout(offTimer); };
    }
  }, [data?.timestamp]);

  const digitalInputs  = data?.digital_io?.inputs  || Array(16).fill(null);
  const digitalOutputs = data?.digital_io?.outputs || Array(16).fill(null);
  const analogInputs   = data?.analog_io?.inputs   || Array(4).fill(null);
  const analogOutputs  = data?.analog_io?.outputs  || Array(4).fill(null);

  return (
    <div className="robot-dashboard">
      {/* ── Left Column (60%) ── */}
      <div className="rd-left-col">
        <CameraPanel streamUrl={data?.camera?.stream || data?.camera?.stream_url} />
        <IOMapping
          digitalInputs={digitalInputs}
          digitalOutputs={digitalOutputs}
          analogInputs={analogInputs}
          analogOutputs={analogOutputs}
        />
      </div>

      {/* ── Right Column (40%) ── */}
      <div className="rd-right-col">
        <SecurityBlock safety={data?.estado?.safety} heartbeat={heartbeat} />
        <ProgramBlock  programa={data?.programa} sistema={data?.sistema} heartbeat={heartbeat} />
        <AnalogBlock   analogInputs={analogInputs} analogOutputs={analogOutputs} heartbeat={heartbeat} />
        <ToolBlock     tool={data?.tool} heartbeat={heartbeat} />
      </div>
    </div>
  );
}
