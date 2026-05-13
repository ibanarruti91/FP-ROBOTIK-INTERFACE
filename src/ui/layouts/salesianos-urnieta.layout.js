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
      id: "config-tcp",
      label: "Configuración TCP",
      color: "#ff7c00", // Orange
      groups: [
        {
          title: "CÁMARA EN VIVO",
          className: "ctcp-camera",
          widgets: [
            { type: "camera", path: "camera.stream", dismissible: true, borderColor: "#ff7c00" }
          ]
        },
        {
          title: "PUNTO CENTRAL DE LA HERRAMIENTA",
          className: "ctcp-main",
          widgets: [
            { type: "tcp-config-main", path: "config_herramienta" }
          ]
        },
        {
          title: "CARGA Y CENTRO DE GRAVEDAD",
          className: "ctcp-payload",
          widgets: [
            { type: "tcp-payload", path: "config_herramienta" }
          ]
        },
        {
          title: "DIAGRAMA DE REFERENCIA — BRIDA / HERRAMIENTA",
          className: "ctcp-schematic",
          widgets: [
            { type: "tcp-schematic", path: "config_herramienta" }
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
      id: "estado-robot",
      label: "Estado Hardware E/S",
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
          title: "Información del Sistema",
          className: "diag-data",
          compact: true,
          widgets: [
            { type: "kpi", label: "Tiempo de Robot Encendido", path: "telemetry.tiempo_funcionamiento", unit: "", format: "text", columns: 1, compact: true },
            { type: "kpi", label: "Estado Broker", path: "mqtt_online_status", unit: "", format: "text", columns: 1, compact: true }
          ]
        },
        {
          title: "Diagnóstico / Mensajes Node-RED",
          className: "diag-nr-messages",
          widgets: [
            { type: "nodered-messages", columns: 2 }
          ]
        },
        {
          title: "Buffer de Eventos del Sistema / RTDE",
          className: "diag-nr-events",
          widgets: [
            { type: "nodered-events", columns: 2 }
          ]
        }
      ]
    },
    {
      id: "validacion-pasos",
      label: "Registro de puntos",
      color: "#10b981", // Emerald green
      groups: [
        {
          title: "Registro de ciclos y puntos de paso",
          className: "cap-table",
          widgets: [
            { type: "step-registry-table", path: "step_capture", columns: 2 }
          ]
        }
      ]
    },
  ]
};
