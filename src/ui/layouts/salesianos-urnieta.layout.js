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
          title: "RENDIMIENTO DINÁMICO",
          className: "principal-chart",
          widgets: [
            { type: "performance-chart", path: "telemetry" }
          ]
        },
        {
          className: "principal-sys-cards",
          widgets: [
            { type: "sys-metric", label: "Temperatura Sistema", path: "telemetry.controller_temp", unit: "ºC",   icon: "temp" },
            { type: "sys-metric", label: "Tensión Principal",   path: "telemetry.main_voltage",    unit: "V",    icon: "voltage" },
            { type: "sys-metric", label: "Carga CPU",           path: "telemetry.cpu_load",        unit: "%",    icon: "cpu",    showBar: true },
            { type: "sys-metric", label: "Consumo Actual",      path: "telemetry.power",           unit: "W",    icon: "power" },
            { type: "sys-metric", label: "Velocidad TCP",       path: "telemetry.speed",           unit: "mm/s", icon: "speed" },
            { type: "sys-metric", label: "Tiempo de Robot Encendido", path: "telemetry.tiempo_funcionamiento", unit: "",  icon: "clock"  }
          ]
        }
      ]
    },
    {
      id: "estado-robot",
      label: "ESTADO HARDWARE E/S",
      color: "#ffbf00", // Amber
      groups: [
        // ── LEFT COLUMN (50 %) — Camera stretches to match right column ──
        {
          title: "CÁMARA EN VIVO",
          className: "er-camera",
          widgets: [
            { type: "camera", path: "camera.stream", dismissible: true, borderColor: "#ffbf00" }
          ]
        },
        // ── RIGHT COLUMN (50 %) — Control Box card + Tool I/O card ─────
        {
          title: "E/S DEL CONTROLADOR (Control Box)",
          className: "er-control-box",
          compact: true,
          widgets: [
            { type: "hardware-io-control-box", path: "hardware_io.control_box" }
          ]
        },
        {
          title: "E/S DE LA HERRAMIENTA (Tool I/O)",
          className: "er-tool-io",
          compact: true,
          widgets: [
            { type: "hardware-io-tool", path: "hardware_io.tool" }
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
            { type: "kpi", label: "Consumo total de articulaciones", paths: ["joints.power", "joints.potencia_total", "joints.consumo_movimiento"], unit: "W", format: "0", columns: 1, compact: true },
            { type: "kpi", label: "Velocidad TCP", path: "sistema.velocidad_tcp", unit: "mm/s", format: "3", columns: 1, compact: true }
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
          title: "CÁMARA EN VIVO",
          className: "diag-camera",
          compact: true,
          widgets: [
            { type: "camera", path: "camera.stream", dismissible: true, borderColor: "#8a2be2" }
          ]
        },
        {
          title: "Parámetros de Control",
          className: "diag-data",
          compact: true,
          widgets: [
            { type: "kpi", label: "Temp. Controlador", path: "ctrl_temp", unit: "°C", format: "1", columns: 1, compact: true },
            { type: "kpi", label: "Potencia Robot", path: "robot_power", unit: "W", format: "0", columns: 1, compact: true }
          ]
        },
        {
          title: "Diagnóstico de Errores",
          className: "diag-data",
          compact: true,
          widgets: [
            { type: "kpi", label: "Último Error", path: "last_error", unit: "", format: "text", columns: 2, compact: true }
          ]
        },
        {
          title: "Información del Sistema",
          className: "diag-data",
          compact: true,
          widgets: [
            { type: "kpi", label: "Tiempo Operación", path: "uptime_hours", unit: "h", format: "1", columns: 1, compact: true },
            { type: "kpi", label: "Estado Broker", path: "mqtt_online_status", unit: "", format: "text", columns: 1, compact: true }
          ]
        },
        {
          title: "Historial de Eventos",
          className: "diag-log",
          compact: true,
          widgets: [
            { type: "log", label: "Log del Sistema", path: "messages", compact: true, columns: 2 }
          ]
        },
        {
          title: "Buffer de Diagnóstico Derivado",
          className: "diag-derived-buffer",
          widgets: [
            // ⚠ Eventos INFERIDOS en frontend a partir de transiciones de estado MQTT.
            // No son el log nativo del controlador UR.
            { type: "diag-buffer", columns: 2 }
          ]
        }
      ]
    },
    {
      id: "capturas",
      label: "Registro de Step Point",
      color: "#10b981", // Emerald green
      groups: [
        {
          title: "TABLA DE CAPTURAS DE PASO EN TIEMPO REAL",
          className: "cap-table",
          widgets: [
            { type: "step-capture-table", path: "step_capture", columns: 2 }
          ]
        }
      ]
    }
  ]
};
