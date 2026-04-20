import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMqttStatus } from '../hooks/useMqttStatus';
import './Diagnostico.css';

// ── Level badge (for events_buffer / events_derived) ─────────────────────────
// Expects the info/warn/error vocabulary used by Node-RED RTDE events.

function LevelBadge({ level }) {
  const normalized = (level ?? '').toLowerCase();
  const cls =
    normalized === 'error'   ? 'diag-badge diag-badge--error' :
    normalized === 'warn' || normalized === 'warning' ? 'diag-badge diag-badge--warn' :
    'diag-badge diag-badge--info';
  const label =
    normalized === 'error' ? 'ERROR' :
    normalized === 'warn' || normalized === 'warning' ? 'WARN' :
    'INFO';
  return <span className={cls}>{label}</span>;
}

// ── Diagnostico message level tag ────────────────────────────────────────────
// principal.diagnostico.messages uses its own level vocabulary ("error",
// "evento", etc.) that is distinct from the info/warn/error semantics of
// events_buffer.  Rendered as a plain text label so no false severity mapping
// is implied.

function DiagMsgLevelTag({ level }) {
  if (!level) return null;
  const normalized = (level ?? '').toLowerCase();
  const cls =
    normalized === 'error' ? 'diag-msg-level diag-msg-level--error' :
    'diag-msg-level diag-msg-level--default';
  return <span className={cls}>{level.toUpperCase()}</span>;
}

// ── Collapsible data inspector ────────────────────────────────────────────────

function DataInspector({ data }) {
  const [open, setOpen] = useState(false);
  if (data == null) return null;
  const preview = typeof data === 'object' ? '{…}' : String(data).slice(0, 40);
  return (
    <div className="diag-data-inspector">
      <button
        className="diag-data-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="diag-data-arrow">{open ? '▼' : '▶'}</span>
        <span className="diag-data-preview">{preview}</span>
      </button>
      {open && (
        <pre className="diag-data-pre">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Timestamp formatter ───────────────────────────────────────────────────────

function formatTs(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

// ── Single event row ──────────────────────────────────────────────────────────

function EventRow({ event }) {
  return (
    <div className="diag-event-row">
      <div className="diag-event-header">
        <LevelBadge level={event.level} />
        {event.type && <span className="diag-event-type">{event.type}</span>}
        <span className="diag-event-ts">{formatTs(event.ts)}</span>
        {event.source && <span className="diag-event-source">{event.source}</span>}
      </div>
      <p className="diag-event-text">{event.text ?? '—'}</p>
      {event.data != null && <DataInspector data={event.data} />}
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

function Diagnostico() {
  const navigate = useNavigate();
  const {
    diagnosticoLastError,
    eventLog,
    nodeRedEventsBuffer,
    nodeRedEventsTotal,
    nodeRedEventsBufferLimit,
  } = useMqttStatus();

  // ── Debug: confirm context values on every render ─────────────────────────
  console.log('[Diagnostico] render — nodeRedEventsBuffer.length:', nodeRedEventsBuffer.length);
  console.log('[Diagnostico] render — nodeRedEventsTotal:', nodeRedEventsTotal);
  console.log('[Diagnostico] render — first event type:', nodeRedEventsBuffer[0]?.type ?? '(none)');

  // Diagnóstico messages from the principal topic
  const diagMessages = eventLog;

  // Events from Node-RED sorted newest first
  const sortedEvents = [...nodeRedEventsBuffer].reverse();

  // Level breakdown for the counter card — single pass
  const { errorCount, warnCount, infoCount } = nodeRedEventsBuffer.reduce(
    (acc, e) => {
      const lvl = (e.level ?? '').toLowerCase();
      if (lvl === 'error') acc.errorCount++;
      else if (lvl === 'warn' || lvl === 'warning') acc.warnCount++;
      else acc.infoCount++;
      return acc;
    },
    { errorCount: 0, warnCount: 0, infoCount: 0 },
  );

  // last_error comes directly from principal.diagnostico.last_error via context.
  // Never infer it from message text or events.
  const lastError = diagnosticoLastError;

  return (
    <div className="page-container diag-page">
      <button className="back-button" onClick={() => navigate('/')} aria-label="Volver al inicio">
        ← Volver
      </button>

      <div className="universal-header">
        <h1 className="universal-title">Diagnóstico del sistema</h1>
        <p className="universal-description">
          Eventos y diagnóstico publicados por Node-RED en tiempo real.
          La web solo consume y visualiza; no calcula ni deriva eventos en frontend.
        </p>
      </div>

      <div className="diag-grid">

        {/* ── 1. Último error ──────────────────────────────────────────── */}
        <div className="diag-card diag-card--last-error">
          <div className="diag-card-header">
            <span className="diag-card-icon">🔴</span>
            <h2 className="diag-card-title">Último error</h2>
          </div>
          <div className="diag-card-body">
            {lastError ? (
              <p className="diag-last-error-text">{lastError}</p>
            ) : (
              <p className="diag-empty">Ninguno</p>
            )}
          </div>
        </div>

        {/* ── 2. Diagnóstico / mensajes ────────────────────────────────── */}
        <div className="diag-card diag-card--messages">
          <div className="diag-card-header">
            <span className="diag-card-icon">📋</span>
            <h2 className="diag-card-title">Diagnóstico / mensajes</h2>
            <span className="diag-card-count">{diagMessages.length}</span>
          </div>
          <div className="diag-card-body diag-card-body--scroll">
            {diagMessages.length === 0 ? (
              <p className="diag-empty">Sin mensajes de diagnóstico</p>
            ) : (
              <ul className="diag-msg-list">
                {[...diagMessages].reverse().map((msg, i) => (
                  <li key={i} className="diag-msg-item">
                    {msg.level && <DiagMsgLevelTag level={msg.level} />}
                    {msg.time && <span className="diag-msg-time">{msg.time}</span>}
                    <span className="diag-msg-text">{msg.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── 3. Buffer de eventos ─────────────────────────────────────── */}
        <div className="diag-card diag-card--events diag-card--full-width">
          <div className="diag-card-header">
            <span className="diag-card-icon">📡</span>
            <h2 className="diag-card-title">Buffer de eventos del sistema / RTDE</h2>
            <span className="diag-card-count">{nodeRedEventsBuffer.length}</span>
            {nodeRedEventsBufferLimit != null && (
              <span className="diag-card-meta">límite: {nodeRedEventsBufferLimit}</span>
            )}
          </div>
          <div className="diag-card-body diag-card-body--scroll">
            {sortedEvents.length === 0 ? (
              <p className="diag-empty">Sin eventos en el buffer</p>
            ) : (
              <div className="diag-events-list">
                {sortedEvents.map((event, i) => (
                  <EventRow key={event.id ?? i} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 4. Contador de eventos ───────────────────────────────────── */}
        <div className="diag-card diag-card--counter">
          <div className="diag-card-header">
            <span className="diag-card-icon">📊</span>
            <h2 className="diag-card-title">Contador de eventos</h2>
          </div>
          <div className="diag-card-body diag-counter-body">
            <div className="diag-counter-row">
              <span className="diag-counter-label">Almacenados en buffer</span>
              <span className="diag-counter-value">{nodeRedEventsBuffer.length}</span>
            </div>
            {nodeRedEventsTotal > 0 && (
              <div className="diag-counter-row">
                <span className="diag-counter-label">Total acumulado (Node-RED)</span>
                <span className="diag-counter-value">{nodeRedEventsTotal}</span>
              </div>
            )}
            <div className="diag-counter-breakdown">
              <div className="diag-counter-chip diag-counter-chip--error">
                <LevelBadge level="error" />
                <span>{errorCount}</span>
              </div>
              <div className="diag-counter-chip diag-counter-chip--warn">
                <LevelBadge level="warn" />
                <span>{warnCount}</span>
              </div>
              <div className="diag-counter-chip diag-counter-chip--info">
                <LevelBadge level="info" />
                <span>{infoCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Diagnostico;
