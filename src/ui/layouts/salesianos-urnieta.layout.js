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
          title: "Vista en Vivo",
          className: "principal-camera",
          compact: true,
          widgets: [
            { type: "camera", label: "Cámara", path: "camera.stream_url", compact: true, columns: 2 }
          ]
        },
        {
          title: "Telemetría",
          className: "principal-metrics",
          compact: true,
          widgets: [
            { type: "kpi", label: "Potencia", path: "sistema.potencia_total", unit: "W", format: "0", columns: 1, compact: true },
            { type: "kpi", label: "Temp. Control", path: "sistema.temperatura_control", unit: "°C", format: "1", columns: 1, compact: true },
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
      id: "estado-io",
      label: "Estado+IO",
      color: "#ffbf00", // Amber
      groups: [
        {
          title: "Entradas/Salidas Digitales",
          widgets: [
            { type: "digital-io", label: "Matriz IO Digital", path: "digital_io", ioCount: 32 }
          ]
        },
        {
          title: "Estado General",
          widgets: [
            { type: "status", label: "Conexión", path: "estado.online", statusType: "online" },
            { type: "kpi", label: "Último Error", path: "last_error", unit: "", format: "text" }
          ]
        },
        {
          title: "TCP - Posición Cartesiana",
          widgets: [
            { type: "kpi", label: "X", path: "tcp.position.x", unit: "mm", format: "2", columns: 3 },
            { type: "kpi", label: "Y", path: "tcp.position.y", unit: "mm", format: "2", columns: 3 },
            { type: "kpi", label: "Z", path: "tcp.position.z", unit: "mm", format: "2", columns: 3 }
          ]
        },
        {
          title: "TCP - Orientación",
          widgets: [
            { type: "kpi", label: "RX", path: "tcp.orientation.rx", unit: "rad", format: "3", columns: 3 },
            { type: "kpi", label: "RY", path: "tcp.orientation.ry", unit: "rad", format: "3", columns: 3 },
            { type: "kpi", label: "RZ", path: "tcp.orientation.rz", unit: "rad", format: "3", columns: 3 }
          ]
        },
        {
          title: "TCP - Velocidad",
          widgets: [
            { type: "kpi", label: "Velocidad TCP", path: "tcp.speed", unit: "mm/s", format: "3" }
          ]
        }
      ]
    },
    {
      id: "cinematica",
      label: "Cinemática",
      color: "#007bff", // Electric Blue
      groups: [
        {
          title: "TCP Pose - Posición y Orientación",
          widgets: [
            { type: "tcp-pose", label: "TCP Pose", path: "tcp" }
          ]
        },
        {
          title: "Ejes del Robot (J1-J6)",
          widgets: [
            { type: "joints-grid", label: "Articulaciones", path: "joints" }
          ]
        },
        {
          title: "Posiciones de Ejes (rad)",
          widgets: [
            { type: "table", label: "Posiciones", path: "joints.positions", unit: "rad", format: "4" }
          ]
        },
        {
          title: "Temperaturas de Ejes (°C)",
          widgets: [
            { type: "table", label: "Temperaturas", path: "joints.temperatures", unit: "°C", format: "1" }
          ]
        },
        {
          title: "Corrientes de Ejes (A)",
          widgets: [
            { type: "table", label: "Corrientes", path: "joints.currents", unit: "A", format: "3" }
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
