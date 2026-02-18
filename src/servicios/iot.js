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
    timestamp: new Date().toISOString(),
    // Program Data
    programa: {
      nombre: "Programa Demo",
      status_id: 0
    },
    // System Status
    sistema: {
      modo_operacion: "MANUAL",
      estado_maquina: "DETENIDO",
      potencia_total: 0,
      temperatura_control: 0
    },
    // Performance and Statistics
    estadisticas: {
      tiempo_ciclo: 0,
      horas_operacion: 0
    },
    // Event Log
    eventos: [],
    // Legacy fields for other tabs
    estado: {
      online: false,
      mode: "MANUAL",
      safety: "NORMAL"
    },
    robot_power: 0, // W
    cycle_time: 0, // s
    uptime_hours: 0, // h
    ctrl_temp: 0, // °C
    last_error: "",
    tcp: {
      position: {
        x: 0,
        y: 0,
        z: 0
      },
      orientation: {
        rx: 0,
        ry: 0,
        rz: 0
      },
      speed: 0, // m/s
      velocity: {
        x: 0,
        y: 0,
        z: 0
      }
    },
    joints: {
      positions: [0, 0, 0, 0, 0, 0],
      temperatures: [0, 0, 0, 0, 0, 0],
      currents: [0, 0, 0, 0, 0, 0]
    },
    messages: [],
    digital_io: {
      inputs: Array.from({ length: 16 }, () => false),
      outputs: Array.from({ length: 16 }, () => false)
    },
    camera: {
      stream: centroConfig?.cameraStreamUrl || ''
    }
  };
}
