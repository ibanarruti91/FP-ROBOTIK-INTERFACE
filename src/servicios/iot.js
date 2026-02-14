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
  return {
    timestamp: new Date().toISOString(),
    estado: {
      online: true,
      mode: "AUTO"
    },
    tcp: {
      position: {
        x: Math.random() * 500 - 250,
        y: Math.random() * 500 - 250,
        z: Math.random() * 500 - 250
      },
      velocity: {
        x: Math.random() * 10 - 5,
        y: Math.random() * 10 - 5,
        z: Math.random() * 10 - 5
      }
    },
    joints: {
      positions: [
        Math.random() * 360,
        Math.random() * 360,
        Math.random() * 360,
        Math.random() * 360,
        Math.random() * 360,
        Math.random() * 360
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
    }
  };
}
