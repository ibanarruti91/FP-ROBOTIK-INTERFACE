import { createContext } from 'react';

export const MqttStatusContext = createContext({
  status: 'OFFLINE',
  lastMessageTime: null,
  telemetryData: null,
  stepCaptureRecords: [],
  currentProgram: null,
  currentChecksum: null,
  isPausedStepCapture: false,
  togglePauseStepCapture: () => {},
  clearStepCaptureRecords: () => {},
  publishCommand: () => {},
  eventLog: [],
  clearEventLog: () => {},
  lastError: null,
  // ── Derived Diagnostic Buffer ─────────────────────────────────────────────
  // Buffer de eventos DERIVADOS / INFERIDOS en frontend a partir de transiciones
  // de estado MQTT.  No es el log nativo del controlador UR.
  derivedDiagnosticBuffer: [],
  clearDerivedDiagnosticBuffer: () => {},
  // ── Node-RED Events (from events_derived + events_buffer topics) ──────────
  // Eventos publicados por Node-RED.  La web solo los consume y visualiza;
  // no los calcula ni deriva en frontend.
  nodeRedEventsBuffer: [],
  nodeRedEventsTotal: 0,
  nodeRedEventsBufferLimit: null,
  // ── Diagnóstico (from principal.diagnostico) ──────────────────────────────
  diagnosticoLastError: null,
  // ── Status topic payload ──────────────────────────────────────────────────
  // Full payload from salesianos/robot/iban/status (center_id, center_name,
  // iot_online, modo_origen, data_status, …).  null until first message.
  statusData: null,
});
