/**
 * Layout declarativo para Salesianos Urnieta (SMS)
 * Define la estructura de tabs, grupos y widgets para la telemetría del robot UR3e
 */

export const SALESIANOS_LAYOUT = {
  tabs: [
    {
      id: "principal",
      label: "Principal",
      color: "#00e5ff", // Cyan
      groups: [
        {
          title: "CÁMARA EN VIVO",
          className: "principal-camera",
          compact: true,
          widgets: [
            { type: "camera", label: "Cámara", path: "camera.stream", compact: true, columns: 2 }
          ]
        },
        {
          title: "Telemetría",
          className: "principal-metrics",
          compact: true,
          widgets: [
            { type: "kpi", label: "Potencia", path: "sistema.potencia_total", unit: "W", format: "0", columns: 1, compact: true },
            { type: "kpi", label: "Temp. Control", path: "sistema.temperatura_control", unit: "°C", format: "1", columns: 1, compact: true },
            { type: "kpi", label: "Velocidad TCP", path: "sistema.velocidad_tcp", unit: "mm/s", format: "1", columns: 1, compact: true },
            { type: "kpi", label: "Tiempo Ciclo", path: "estadisticas.tiempo_ciclo", unit: "s", format: "2", columns: 1, compact: true },
            { type: "kpi", label: "Horas Operación", path: "estadisticas.horas_operacion", unit: "h", format: "1", columns: 1, compact: true }
          ]
        },
        {
          title: "Eventos",
          className: "principal-events",
          compact: true,
          widgets: [
            { type: "log", label: "Mensajes del Sistema", path: "eventos", compact: true, columns: 2 }
          ]
        }
      ]
    },
    {
      id: "estado-robot",
      label: "ESTADO HARDWARE E/S",
      color: "#ffbf00", // Amber
      groups: [
        // ── LEFT COLUMN (55 %) ──────────────────────────────────────────
        {
          title: "CÁMARA EN VIVO",
          className: "er-camera",
          widgets: [
            { type: "camera", path: "camera.stream", dismissible: true, borderColor: "#ffbf00" }
          ]
        },
        {
          title: "MAPEADO E/S DIGITAL",
          className: "er-digital-io",
          widgets: [
            { type: "digital-io", path: "digital_io" }
          ]
        },
        // ── RIGHT COLUMN (45 %) ─────────────────────────────────────────
        {
          title: "SEGURIDAD",
          className: "er-seguridad-leds",
          widgets: [
            { type: "security-leds", path: "estado" }
          ]
        },
        {
          title: "ANALÓGICA",
          className: "er-analog",
          widgets: [
            { type: "analog-io", path: "analog_io" }
          ]
        },
        {
          title: "HERRAMIENTA",
          className: "er-herramienta",
          widgets: [
            { type: "tool-panel", path: "herramienta" }
          ]
        }
      ]
    },
    {
      id: "cinematica",
      label: "Cinemática",
      color: "#007bff", // Electric Blue
      groups: [
        // ── LEFT COLUMN ──────────────────────────────────────────────────
        {
          title: "CÁMARA EN VIVO",
          className: "cin-camera",
          widgets: [
            { type: "camera", path: "camera.stream", dismissible: true, borderColor: "#007bff" }
          ]
        },
        {
          title: "DIAGNÓSTICO DE POTENCIA",
          className: "cin-potencia",
          compact: true,
          widgets: [
            { type: "kpi", label: "Potencia Total", path: "sistema.potencia_total", unit: "W", format: "0", columns: 1, compact: true },
            { type: "kpi", label: "Velocidad TCP", path: "sistema.velocidad_tcp", unit: "m/s", format: "3", columns: 1, compact: true }
          ]
        },
        // ── RIGHT COLUMN ─────────────────────────────────────────────────
        {
          title: "ESTADO CARTESIANO DEL TCP",
          className: "cin-tcp",
          widgets: [
            { type: "tcp-pose", label: "TCP Pose", path: "tcp" }
          ]
        },
        {
          title: "ESTADO DE SERVOMOTORES (J1-J6)",
          className: "cin-joints",
          widgets: [
            { type: "joints-grid", label: "Articulaciones", path: "joints" }
          ]
        }
      ]
    },
    {
      id: "diagnostico",
      label: "Diagnóstico",
      color: "#8a2be2", // Violet
      groups: [
        {
          title: "Parámetros de Control",
          widgets: [
            { type: "kpi", label: "Temp. Controlador", path: "ctrl_temp", unit: "°C", format: "1", columns: 2 },
            { type: "kpi", label: "Potencia Robot", path: "robot_power", unit: "W", format: "0", columns: 2 }
          ]
        },
        {
          title: "Diagnóstico de Errores",
          widgets: [
            { type: "kpi", label: "Último Error", path: "last_error", unit: "", format: "text" }
          ]
        },
        {
          title: "Historial de Eventos",
          widgets: [
            { type: "log", label: "Log del Sistema", path: "messages" }
          ]
        },
        {
          title: "Información del Sistema",
          widgets: [
            { type: "kpi", label: "Tiempo Operación", path: "uptime_hours", unit: "h", format: "1", columns: 2 },
            { type: "kpi", label: "Tiempo Ciclo Promedio", path: "cycle_time", unit: "s", format: "1", columns: 2 }
          ]
        }
      ]
    }
  ]
};
