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
});
