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
      status_id: null
    },
    // System Status
    sistema: {
      modo_operacion: null,
      estado_maquina: null,
      potencia_total: null,
      temperatura_control: null
    },
    // Performance and Statistics
    estadisticas: {
      tiempo_ciclo: null,
      horas_operacion: null
    },
    // Event Log
    eventos: [],
    // Legacy fields for other tabs
    estado: {
      online: null,
      mode: null,
      safety: null
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
      inputs: Array.from({ length: 16 }, () => null),
      outputs: Array.from({ length: 16 }, () => null)
    },
    camera: {
      stream: centroConfig?.cameraStreamUrl || ''
    }
  };
}
