// Timeout para las peticiones (en milisegundos)
const REQUEST_TIMEOUT = 5000;

/**
 * Realiza una petición fetch con timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Obtiene los datos de telemetría más recientes de un centro
 * @param {string} baseUrl - URL base del IoT del centro
 * @returns {Promise<Object>} Datos de telemetría
 */
export async function getTelemetryLatest(baseUrl) {
  if (!baseUrl || baseUrl === "") {
    throw new Error("URL no configurada");
  }

  try {
    const url = `${baseUrl}/api/v1/telemetria/latest`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout al conectar con el IoT');
    }
    throw error;
  }
}

/**
 * Genera datos mock para telemetría cuando no hay conexión real
 * @param {Object} centroConfig - Configuración del centro (opcional)
 */
export function getMockTelemetryData(centroConfig = null) {
  return {
    timestamp: null,
    // Program Data
    programa: {
      nombre: null,
      status_id: null,
      id: null,
      ciclos: null,
      estado: null    // PLAYING | RUNNING | PAUSED | STOPPED
    },
    // System Status
    sistema: {
      modo_operacion: null,
      estado_maquina: null,
      potencia_total: null,
      temperatura_control: null,
      velocidad_tcp: null
    },
    // Performance and Statistics
    estadisticas: {
      tiempo_ciclo: null,
      horas_operacion: null
    },
    // Event Log
    eventos: [],
    // Security status (new consolidated path)
    seguridad: {
      safety: null   // NORMAL | PROTECTIVE_STOP | EMERGENCY_STOP
    },
    // Legacy fields for other tabs
    estado: {
      online: null,
      mode: null,
      safety: null,
      emergencia_parada: null,   // boolean: true = emergency active
      proteccion: null           // boolean: true = protection active
    },
    robot_power: null, // W
    cycle_time: null, // s
    uptime_hours: null, // h
    ctrl_temp: null, // °C
    last_error: null,
    tcp: {
      position: {
        x: null,
        y: null,
        z: null
      },
      orientation: {
        rx: null,
        ry: null,
        rz: null
      },
      speed: null, // m/s
      velocity: {
        x: null,
        y: null,
        z: null
      }
    },
    joints: {
      positions: [null, null, null, null, null, null],
      temperatures: [null, null, null, null, null, null],
      currents: [null, null, null, null, null, null]
    },
    messages: [],
    digital_io: {
      inputs:               Array.from({ length: 8 }, () => null),
      outputs:              Array.from({ length: 8 }, () => null),
      configurable_inputs:  Array.from({ length: 8 }, () => null),
      configurable_outputs: Array.from({ length: 8 }, () => null)
    },
    analog_io: {
      ai: [null, null],   // Analog Inputs  AI0, AI1  (0–10 V)
      ao: [null, null]    // Analog Outputs AO0, AO1  (0–10 V)
    },
    camera: {
      stream: centroConfig?.cameraStreamUrl || ''
    },
    herramienta: {
      tension: null,   // V
      corriente: null, // mA
      potencia: null   // W
    },
    // Telemetry sub-object for the Menú Principal dashboard (Node-RED payload.telemetry)
    telemetry: {
      speed:           null,   // mm/s
      power:           null,   // W
      controller_temp: null,   // °C
      main_voltage:    null,   // V
      cpu_load:        null,   // %
    },
    // Raw RTDE protocol numeric IDs (before string mapping)
    rtde: {
      safety_status_id: null,
      robot_mode_id: null,
      program_state_id: null,
    }
  };
}
