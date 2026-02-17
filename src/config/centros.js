/**
 * Configuración de centros educativos
 * 
 * IMPORTANTE - Configuración de URLs de cámara:
 * - NO usar localhost/127.0.0.1 en producción (solo funciona si el Web Server corre en el mismo PC)
 * - Usar la IP o hostname del servidor que ejecuta el stream MJPEG
 * 
 * Ejemplo:
 *   - Desarrollo local: "http://localhost:8081/video.mjpg"
 *   - Red local: "http://192.168.1.100:8081/video.mjpg"
 *   - Remoto: "http://miservidor.com:8081/video.mjpg"
 */
export const CENTROS = {
  "salesianos-urnieta": {
    nombre: "Salesianos Urnieta",
    baseUrl: "", // URL del servidor IoT (ej: http://192.168.1.100:3000)
    cameraStreamUrl: "", // URL del stream MJPEG (ej: http://192.168.1.100:8081/video.mjpg)
    estado: "ONLINE"
  },
  "repelega": {
    nombre: "CIFP Repélega",
    baseUrl: "", // URL del servidor IoT (ej: http://192.168.1.200:3000)
    cameraStreamUrl: "", // URL del stream MJPEG (ej: http://192.168.1.200:8081/video.mjpg)
    estado: "PROXIMAMENTE"
  }
};
