/**
 * Configuración de centros educativos
 * 
 * IMPORTANTE - Configuración de URLs de cámara:
 * - NO usar localhost/127.0.0.1 en producción (solo funciona si el Web Server corre en el mismo PC)
 * - Usar la IP o hostname del servidor que ejecuta el stream MJPEG
 * - Las URLs se configuran mediante variables de entorno (ver .env.example)
 * 
 * Configuración mediante variables de entorno:
 *   VITE_CAMERA_SALESIANOS_URNIETA - URL del stream de Salesianos Urnieta
 *   VITE_CAMERA_REPELEGA - URL del stream de CIFP Repélega
 *   VITE_IOT_SALESIANOS_URNIETA - URL del servidor IoT de Salesianos Urnieta
 *   VITE_IOT_REPELEGA - URL del servidor IoT de CIFP Repélega
 * 
 * Ejemplo de valores:
 *   - Desarrollo local: "http://localhost:8081/video.mjpg"
 *   - Red local: "http://192.168.1.100:8081/video.mjpg"
 *   - Remoto: "http://miservidor.com:8081/video.mjpg"
 */
export const CENTROS = {
  "salesianos-urnieta": {
    nombre: "Salesianos Urnieta",
    baseUrl: import.meta.env.VITE_IOT_SALESIANOS_URNIETA || "",
    cameraStreamUrl: import.meta.env.VITE_CAMERA_SALESIANOS_URNIETA || "https://vdo.ninja/?view=Salesianos_Iban&autoplay=1&muted=1&style=1&base&cleanviewer=1",
    estado: "ONLINE"
  },
  "repelega": {
    nombre: "CIFP Repélega",
    baseUrl: import.meta.env.VITE_IOT_REPELEGA || "",
    cameraStreamUrl: import.meta.env.VITE_CAMERA_REPELEGA || "",
    estado: "PROXIMAMENTE"
  }
};
