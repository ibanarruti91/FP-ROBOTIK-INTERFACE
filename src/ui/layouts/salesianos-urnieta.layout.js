/**
 * Layout declarativo para Salesianos Urnieta
 * Define la estructura de tabs, grupos y widgets para la telemetría
 */

export const SALESIANOS_LAYOUT = {
  tabs: [
    {
      id: "menu-principal",
      label: "MENU PRINCIPAL",
      groups: [
        {
          title: "Estado del Sistema",
          widgets: [
            { type: "status", label: "Estado", path: "estado.online", statusType: "online" },
            { type: "status", label: "Modo", path: "estado.mode", statusType: "mode" },
            { type: "status", label: "Seguridad", path: "estado.safety", statusType: "safety" }
          ]
        },
        {
          title: "Indicadores Principales",
          widgets: [
            { type: "kpi", label: "Potencia", path: "robot_power", unit: "W", format: "0", columns: 3 },
            { type: "kpi", label: "Tiempo Ciclo", path: "cycle_time", unit: "s", format: "1", columns: 3 },
            { type: "kpi", label: "Horas Operación", path: "uptime_hours", unit: "h", format: "1", columns: 3 },
            { type: "kpi", label: "Temp. Control", path: "ctrl_temp", unit: "°C", format: "1", columns: 3 }
          ]
        },
        {
          title: "Registro de Eventos",
          widgets: [
            { type: "log", label: "Mensajes del Sistema", path: "messages" }
          ]
        }
      ]
    },
    {
      id: "estado-robot",
      label: "ESTADO ROBOT Y MAPEADO E/S",
      groups: [
        {
          title: "Estado General",
          widgets: [
            { type: "status", label: "Conexión", path: "estado.online", statusType: "online" },
            { type: "status", label: "Modo Operación", path: "estado.mode", statusType: "mode" },
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
            { type: "kpi", label: "Velocidad TCP", path: "tcp.speed", unit: "m/s", format: "3" }
          ]
        }
      ]
    },
    {
      id: "cinematica",
      label: "CINEMÁTICA Y DINÁMICA DE EJES",
      groups: [
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
      label: "DIAGNÓSTICO DE CONTROL",
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
            { type: "kpi", label: "Estado Seguridad", path: "estado.safety", unit: "", format: "text" },
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
