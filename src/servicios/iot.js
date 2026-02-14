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
 */
export function getMockTelemetryData() {
  const modes = ["AUTO", "MANUAL", "T1", "T2"];
  const safetyStates = ["NORMAL", "REDUCED", "PROTECTIVE_STOP"];
  const errors = ["", "E-STOP activado", "Límite articulación J3", "Temperatura alta J2", "Pérdida señal TCP"];
  
  return {
    timestamp: new Date().toISOString(),
    estado: {
      online: Math.random() > 0.1, // 90% online
      mode: modes[Math.floor(Math.random() * modes.length)],
      safety: safetyStates[Math.floor(Math.random() * safetyStates.length)]
    },
    robot_power: 1200 + Math.random() * 300, // W
    cycle_time: 45 + Math.random() * 15, // s
    uptime_hours: 1234.5 + Math.random() * 100, // h
    ctrl_temp: 35 + Math.random() * 10, // °C
    last_error: errors[Math.floor(Math.random() * errors.length)],
    tcp: {
      position: {
        x: Math.random() * 500 - 250,
        y: Math.random() * 500 - 250,
        z: Math.random() * 500 - 250
      },
      orientation: {
        rx: Math.random() * Math.PI - Math.PI / 2,
        ry: Math.random() * Math.PI - Math.PI / 2,
        rz: Math.random() * Math.PI - Math.PI / 2
      },
      speed: Math.random() * 2, // m/s
      velocity: {
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 - 5,
        z: Math.random() * 10 - 5
      }
    },
    joints: {
      positions: [
        Math.random() * 2 * Math.PI - Math.PI, // rad
        Math.random() * 2 * Math.PI - Math.PI,
        Math.random() * 2 * Math.PI - Math.PI,
        Math.random() * 2 * Math.PI - Math.PI,
        Math.random() * 2 * Math.PI - Math.PI,
        Math.random() * 2 * Math.PI - Math.PI
      ],
      temperatures: [
        25 + Math.random() * 10,
        25 + Math.random() * 10,
        25 + Math.random() * 10,
        25 + Math.random() * 10,
        25 + Math.random() * 10,
        25 + Math.random() * 10
      ],
      currents: [
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2
      ]
    },
    messages: [
      { time: new Date(Date.now() - 1000).toISOString(), txt: "Sistema iniciado correctamente" },
      { time: new Date(Date.now() - 5000).toISOString(), txt: "Calibración de ejes completada" },
      { time: new Date(Date.now() - 12000).toISOString(), txt: "Programa cargado: PICK_AND_PLACE_01" },
      { time: new Date(Date.now() - 25000).toISOString(), txt: "Conexión establecida con controlador" },
      { time: new Date(Date.now() - 45000).toISOString(), txt: "Modo AUTO activado" }
    ]
  };
}
