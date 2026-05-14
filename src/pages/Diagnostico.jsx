import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMqttStatus } from '../hooks/useMqttStatus';
import { getStateTransition, normalizeEventData } from '../servicios/rtdeLabels.js';
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

// ── Transition label formatter ────────────────────────────────────────────────

/**
 * Renders the primary transition line as structured JSX so each part can be
 * styled independently.
 * e.g. "Modo robot: [3] MOTORES APAGADOS → [5] ARRANCANDO"
 */
function TransitionMain({ t }) {
  return (
    <p className="diag-event-text diag-transition-main">
      <span className="diag-tr-name">{t.displayName}: </span>
      <span className="diag-tr-val">[{t.fromValue}]</span>
      {' '}
      <span className="diag-tr-label">{t.fromLabel}</span>
      {' '}
      <span className="diag-tr-arrow">→</span>
      {' '}
      <span className="diag-tr-val">[{t.toValue}]</span>
      {' '}
      <span className="diag-tr-label">{t.toLabel}</span>
    </p>
  );
}

// ── Transition event type definitions ─────────────────────────────────────────

const TRANSITION_TYPE_LABELS = {
  'robot_mode.changed':    'Modo robot',
  'program_state.changed': 'Estado programa',
  'safety.changed':        'Safety',
};

// ── Single event row ──────────────────────────────────────────────────────────

function EventRow({ event }) {
  const normalizedData  = normalizeEventData(event.data);
  // Pass a normalised copy so getStateTransition can always read .from / .to
  const normalizedEvent = normalizedData !== event.data
    ? { ...event, data: normalizedData }
    : event;
  const transition = getStateTransition(normalizedEvent);

  const isTransitionType = Object.prototype.hasOwnProperty.call(TRANSITION_TYPE_LABELS, event.type ?? '');
  const hasFromTo        = normalizedData?.from != null && normalizedData?.to != null;

  // Decide primary content:
  //   1. Preferred path: transition resolved AND from/to present → TransitionMain
  //   2. Defensive path: recognised *.changed type with from/to but helper returned
  //      null (e.g. unmapped label) → build minimal inline transition from raw values
  //   3. Fallback: render event.text as before
  let mainContent;
  if (transition && hasFromTo) {
    mainContent = <TransitionMain t={transition} />;
  } else if (isTransitionType && hasFromTo) {
    // Defensive fallback: never show generic text for a real state-change event
    const minimalTransition = {
      displayName: TRANSITION_TYPE_LABELS[event.type],
      fromValue:   normalizedData.from,
      toValue:     normalizedData.to,
      fromLabel:   String(normalizedData.from),
      toLabel:     String(normalizedData.to),
    };
    mainContent = <TransitionMain t={minimalTransition} />;
  } else {
    mainContent = <p className="diag-event-text">{event.text ?? '—'}</p>;
  }

  return (
    <div className="diag-event-row">
      <div className="diag-event-header">
        <LevelBadge level={event.level} />
        {event.type && <span className="diag-event-type">{event.type}</span>}
        <span className="diag-event-ts">{formatTs(event.ts)}</span>
        {event.source && <span className="diag-event-source">{event.source}</span>}
      </div>
      {mainContent}
      {event.data != null && <DataInspector data={event.data} />}
    </div>
  );
}

// ── Last state summary item ───────────────────────────────────────────────────

function LastStateItem({ label, event, isError }) {
  if (!event) {
    return (
      <div className="diag-last-state-item">
        <span className="diag-last-state-label">{label}</span>
        <span className="diag-last-state-value diag-last-state-value--empty">Ninguno</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="diag-last-state-item">
        <span className="diag-last-state-label">{label}</span>
        <span className="diag-last-state-value diag-last-state-value--error">
          {event.text ?? '—'}
          <span className="diag-last-state-ts"> {formatTs(event.ts)}</span>
        </span>
      </div>
    );
  }
  const transition = getStateTransition(event);
  return (
    <div className="diag-last-state-item">
      <span className="diag-last-state-label">{label}</span>
      <span className="diag-last-state-value">
        {transition
          ? `[${transition.toValue}] ${transition.toLabel}`
          : (event.text ?? '—')}
        <span className="diag-last-state-ts"> {formatTs(event.ts)}</span>
      </span>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

function Diagnostico() {
  const navigate = useNavigate();
  const {
    diagnosticoLastError,
    nodeRedEventsBuffer,
    nodeRedEventsTotal,
    nodeRedEventsBufferLimit,
    nodeRedTechnicalEventsBuffer,
  } = useMqttStatus();

  const [showTechnicalEvents, setShowTechnicalEvents] = useState(false);

  // Build the list of events to display.
  //   - Never show events explicitly marked visible === false.
  //   - When toggle is off: only main buffer (technical events are already in
  //     their own separate buffer and do NOT appear here at all).
  //   - When toggle is on: merge technical events and re-sort newest-first.
  // The main buffer is already sorted newest-first by MqttStatusContext.
  const visibleEvents = useMemo(() => {
    const base = nodeRedEventsBuffer.filter(e => e.visible !== false);
    if (!showTechnicalEvents) return base;
    const merged = [...base, ...nodeRedTechnicalEventsBuffer];
    merged.sort((a, b) => {
      const tsDiff = (b.ts ?? 0) - (a.ts ?? 0);
      if (tsDiff !== 0) return tsDiff;
      return (b.priority ?? 0) - (a.priority ?? 0);
    });
    return merged;
  }, [nodeRedEventsBuffer, nodeRedTechnicalEventsBuffer, showTechnicalEvents]);

  // Upper panel: only error-level events, newest first, max 3.
  // Source is nodeRedEventsBuffer (same as the lower buffer) so errors always
  // appear in both panels simultaneously.
  const diagnosticErrorEvents = visibleEvents
    .filter(e => (e.level ?? '').toLowerCase() === 'error')
    .slice(0, 3);

  // Level breakdown — computed on visible events only (technical events never
  // count unless the toggle is on and they're merged into visibleEvents).
  const { errorCount, warnCount, infoCount } = visibleEvents.reduce(
    (acc, e) => {
      const lvl = (e.level ?? '').toLowerCase();
      if (lvl === 'error') acc.errorCount++;
      else if (lvl === 'warn' || lvl === 'warning') acc.warnCount++;
      else acc.infoCount++;
      return acc;
    },
    { errorCount: 0, warnCount: 0, infoCount: 0 },
  );

  // Derive "last state" summaries from visible events (buffer is newest-first).
  const lastRobotModeEvent    = visibleEvents.find(e => e.type === 'robot_mode.changed');
  const lastProgramStateEvent = visibleEvents.find(e => e.type === 'program_state.changed');
  const lastSafetyEvent       = visibleEvents.find(e => e.type === 'safety.changed');
  const lastErrorEvent        = visibleEvents.find(e => (e.level ?? '').toLowerCase() === 'error');

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
            <span className="diag-card-count">{diagnosticErrorEvents.length}</span>
          </div>
          <div className="diag-card-body diag-card-body--scroll">
            {diagnosticErrorEvents.length === 0 ? (
              <p className="diag-empty">Sin mensajes de diagnóstico</p>
            ) : (
              <div className="diag-events-list">
                {diagnosticErrorEvents.map((event, i) => (
                  <EventRow key={event.id ?? i} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Últimos cambios relevantes ────────────────────────── */}
        <div className="diag-card diag-card--last-states diag-card--full-width">
          <div className="diag-card-header">
            <span className="diag-card-icon">🔍</span>
            <h2 className="diag-card-title">Últimos cambios relevantes</h2>
          </div>
          <div className="diag-last-states">
            <div className="diag-last-states-grid">
              <LastStateItem label="Modo robot"      event={lastRobotModeEvent} />
              <LastStateItem label="Estado programa" event={lastProgramStateEvent} />
              <LastStateItem label="Safety"          event={lastSafetyEvent} />
              <LastStateItem label="Último error"    event={lastErrorEvent} isError />
            </div>
          </div>
        </div>

        {/* ── 4. Buffer de eventos ─────────────────────────────────────── */}
        <div className="diag-card diag-card--events diag-card--full-width">
          <div className="diag-card-header">
            <span className="diag-card-icon">📡</span>
            <h2 className="diag-card-title">Buffer de eventos del sistema / RTDE</h2>
            <span className="diag-card-count">{visibleEvents.length}</span>
            {nodeRedEventsBufferLimit != null && (
              <span className="diag-card-meta">límite: {nodeRedEventsBufferLimit}</span>
            )}
            <button
              className={`diag-toggle-technical${showTechnicalEvents ? ' diag-toggle-technical--active' : ''}`}
              onClick={() => setShowTechnicalEvents(v => !v)}
              title="Mostrar/ocultar eventos técnicos (p.ej. tool.voltage.changed)"
              aria-pressed={showTechnicalEvents}
            >
              {showTechnicalEvents ? '🔧 Ocultar técnicos' : '🔧 Mostrar técnicos'}
            </button>
          </div>
          <div className="diag-card-body diag-card-body--scroll">
            {visibleEvents.length === 0 ? (
              <p className="diag-empty">Sin eventos en el buffer</p>
            ) : (
              <div className="diag-events-list">
                {visibleEvents.map((event, i) => (
                  <EventRow key={event.id ?? i} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 5. Contador de eventos ───────────────────────────────────── */}
        <div className="diag-card diag-card--counter">
          <div className="diag-card-header">
            <span className="diag-card-icon">📊</span>
            <h2 className="diag-card-title">Contador de eventos</h2>
          </div>
          <div className="diag-card-body diag-counter-body">
            <div className="diag-counter-row">
              <span className="diag-counter-label">Visibles en buffer</span>
              <span className="diag-counter-value">{visibleEvents.length}</span>
            </div>
            {nodeRedEventsTotal > 0 && (
              <div className="diag-counter-row">
                <span className="diag-counter-label">Total acumulado (Node-RED)</span>
                <span className="diag-counter-value">{nodeRedEventsTotal}</span>
              </div>
            )}
            {!showTechnicalEvents && nodeRedTechnicalEventsBuffer.length > 0 && (
              <div className="diag-counter-row diag-counter-row--technical">
                <span className="diag-counter-label">Eventos técnicos ocultos</span>
                <span className="diag-counter-value diag-counter-value--muted">{nodeRedTechnicalEventsBuffer.length}</span>
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
