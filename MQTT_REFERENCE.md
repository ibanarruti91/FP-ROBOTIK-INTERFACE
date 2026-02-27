# Referencia MQTT – Node-RED Output Configuration

Listado técnico completo de todos los datos dinámicos que la interfaz web consume
vía MQTT.  Usa esta guía para configurar los nodos **mqtt out** de Node-RED.

---

## Configuración del broker

| Parámetro | Valor |
|-----------|-------|
| **Broker** | `broker.emqx.io` |
| **Puerto** | `8084` (WSS / WebSocket seguro) |
| **Topic** | `salesianos/robot/iban/principal` |
| **QoS** | 0 |
| **Formato** | JSON (`msg.payload` debe ser un objeto JSON serializado) |

---

## Estructura general del payload JSON

La interfaz acepta **dos formatos** de payload, ambos soportados simultáneamente:

### Formato nuevo (recomendado – compatible con el flujo Node-RED actual)

```json
{
  "program_name":  "<string>",
  "program_id":    <número>,
  "rtde": {
    "safety_status": <número>,
    "robot_mode":    <número>,
    "program_state": <número>
  },
  "telemetry":   { ... },
  "sistema":     { ... },
  "tcp":         { ... },
  "joints":      { ... },
  "digital_io":  { ... },
  "analog_io":   { ... },
  "herramienta": { ... },
  "robot_power":   <número>,
  "cycle_time":    <número>,
  "uptime_hours":  <número>,
  "ctrl_temp":     <número>,
  "last_error":    "<string>",
  "messages":      [ ... ]
}
```

### Formato legacy (también soportado)

```json
{
  "programa":    { ... },
  "sistema":     { ... },
  "estadisticas":{ ... },
  "eventos":     [ ... ],
  "estado":      { ... },
  "tcp":         { ... },
  "joints":      { ... },
  "digital_io":  { ... },
  "analog_io":   { ... },
  "herramienta": { ... },
  "robot_power":   <número>,
  "cycle_time":    <número>,
  "uptime_hours":  <número>,
  "ctrl_temp":     <número>,
  "last_error":    "<string>"
}
```

Puedes enviar **solo los campos que cambian** en cada mensaje; los valores no
incluidos conservan su estado anterior en la interfaz.

---

## Pestaña: MENÚ PRINCIPAL (`principal`)

Estos indicadores aparecen en la pestaña principal.  Además, el mini-cabecero
que se muestra en **todas** las pestañas usa los campos marcados con ★.

### Gráfico dinámico + Tarjetas de sistema (nuevo diseño)

Los widgets del nuevo diseño de telemetría leen del sub-objeto `telemetry`:

| Dato Dinámico | ID / Variable Exacta | Unidad / Valores válidos |
|---------------|----------------------|--------------------------|
| Velocidad (gráfico) | `telemetry.speed` | mm/s (número) |
| Potencia (gráfico)  | `telemetry.power` | W (número) |
| Temperatura Sistema | `telemetry.controller_temp` | °C (número) |
| Tensión Principal   | `telemetry.main_voltage` | V (número) |
| Carga CPU           | `telemetry.cpu_load` | % (0–100, número) |

> **Compatibilidad hacia atrás:** si `telemetry.speed` / `telemetry.power` /
> `telemetry.controller_temp` no están presentes, la interfaz los toma
> automáticamente de `sistema.velocidad_tcp`, `sistema.potencia_total` y
> `sistema.temperatura_control` respectivamente.

### Campos del mini-cabecero (★) y de estado general

**Formato nuevo** (`program_name`, `program_id`, `rtde.*`):

| Dato Dinámico | ID / Variable Exacta | Unidad / Valores válidos |
|---------------|----------------------|--------------------------|
| Nombre del programa ★ | `program_name` | string |
| ID del programa ★ | `program_id` | número entero |
| Modo robot (RTDE) ★ | `rtde.robot_mode` | número entero (7 = RUNNING) |
| Estado programa (RTDE) ★ | `rtde.program_state` | número entero (1 = STOPPED, 2 = PLAYING, 3 = PAUSED) |
| Estado seguridad (RTDE) ★ | `rtde.safety_status` | número entero (1 = NORMAL, 3 = PROTECTIVE_STOP, 4 = EMERGENCY_STOP) |

**Formato legacy** (también soportado):

| Dato Dinámico | ID / Variable Exacta | Unidad / Valores válidos |
|---------------|----------------------|--------------------------|
| Estado máquina ★ | `sistema.estado_maquina` | `POWER_ON` \| `POWER_OFF` \| `IDLE` \| `BOOTING` \| `EMERGENCY_STOP` |
| Modo operación ★ | `sistema.modo_operacion` | `REMOTE` \| `AUTO` \| `LOCAL` \| `TEACH` \| `MANUAL` |
| Estado seguridad ★ | `estado.safety` | `NORMAL` \| `PROTECTIVE_STOP` \| `EMERGENCY_STOP` \| `RECOVERY` \| `REDUCED` |
| Estado ejecución ★ | `programa.estado` | `PLAYING` \| `RUNNING` \| `PAUSED` \| `STOPPED` |
| Nombre del programa ★ | `programa.nombre` | string |
| ID estado programa ★ | `programa.status_id` | número entero |

---

## Pestaña: CINEMÁTICA Y DINÁMICA DE EJES (`cinematica`)

### Diagnóstico de Potencia

El widget **"Consumo total de articulaciones"** lee, por orden de prioridad:
`joints.currents` → calcula automáticamente la potencia en el frontend (24 V × Σ corrientes).
Opcionalmente puedes enviar el valor ya calculado:

| Dato Dinámico | ID / Variable Exacta | Unidad |
|---------------|----------------------|--------|
| Consumo total articulaciones | `joints.power` | W |
| Consumo total (alias) | `joints.potencia_total` | W |
| Consumo total (alias) | `joints.consumo_movimiento` | W |
| Velocidad TCP | `sistema.velocidad_tcp` | m/s |

> **Nota:** si `joints.currents` está disponible la interfaz calcula la potencia
> total automáticamente como `Σ(corriente[i] × 24 V)`, independientemente del
> valor de `joints.power`.  Esto evita problemas cuando el ensamblador de
> Node-RED ejecuta antes de que el nodo de cambio de cinemática haya actualizado
> el contexto global (condición de carrera).
>
> Si todos los valores de `joints.currents` son cero (situación que ocurre
> cuando el global `ur_joint_currents` aún no ha sido poblado tras un reinicio
> de Node-RED), la interfaz conserva el último estado válido de las
> articulaciones en lugar de mostrar 0 W.  Esto evita que el widget de consumo
> parpadee a cero durante el intervalo de arranque de Node-RED.

### Estado Cartesiano del TCP (X, Y, Z, RX, RY, RZ)

| Dato Dinámico | ID / Variable Exacta | Unidad |
|---------------|----------------------|--------|
| Posición X | `tcp.position.x` | mm |
| Posición Y | `tcp.position.y` | mm |
| Posición Z | `tcp.position.z` | mm |
| Orientación RX | `tcp.orientation.rx` | rad |
| Orientación RY | `tcp.orientation.ry` | rad |
| Orientación RZ | `tcp.orientation.rz` | rad |
| Velocidad escalar TCP | `tcp.speed` | m/s |

### Estado de Servomotores (J1–J6)

Los tres parámetros de cada articulación se envían como **arrays de 6 elementos**
(índice 0 = Joint 1, índice 5 = Joint 6).

| Dato Dinámico | ID / Variable Exacta | Unidad |
|---------------|----------------------|--------|
| Posición Joint 1–6 | `joints.positions` | rad (array `[J1, J2, J3, J4, J5, J6]`) |
| Temperatura Joint 1–6 | `joints.temperatures` | °C (array `[J1, J2, J3, J4, J5, J6]`) |
| Corriente Joint 1–6 | `joints.currents` | A (array `[J1, J2, J3, J4, J5, J6]`) |

Ejemplo:
```json
"joints": {
  "positions":    [1.57, -1.57, 1.57, -1.57, 1.57, 0.0],
  "temperatures": [28.5, 29.1, 30.0, 27.8, 28.0, 27.5],
  "currents":     [0.45, 0.52, 0.38, 0.41, 0.35, 0.22],
  "power":        51.84,
  "potencia_total": 51.84,
  "consumo_movimiento": 51.84
}
```


---

## Pestaña: DIAGNÓSTICO (`diagnostico`)

| Dato Dinámico | ID / Variable Exacta | Unidad |
|---------------|----------------------|--------|
| Potencia Robot | `robot_power` | W |
| Temperatura Controlador | `ctrl_temp` | °C |
| Tiempo de Operación | `uptime_hours` | h |
| Tiempo Ciclo Promedio | `cycle_time` | s |
| Último Error | `last_error` | string |
| Log del sistema | `messages` | array de objetos `{ "time": "HH:MM:SS", "msg": "string" }` |

---

## Pestaña: HARDWARE E/S (`estado-robot`)

### E/S Digital (4 filas × 8 canales)

Cada campo es un **array booleano de 8 elementos** (índice 0–7).

| Dato Dinámico | ID / Variable Exacta | Valores |
|---------------|----------------------|---------|
| Entradas Digitales DI0–DI7 | `digital_io.inputs` | `[true/false, …]` (8 elementos) |
| Salidas Digitales DO0–DO7 | `digital_io.outputs` | `[true/false, …]` (8 elementos) |
| Entradas Configurables CI0–CI7 | `digital_io.configurable_inputs` | `[true/false, …]` (8 elementos) |
| Salidas Configurables CO0–CO7 | `digital_io.configurable_outputs` | `[true/false, …]` (8 elementos) |

Ejemplo:
```json
"digital_io": {
  "inputs":               [true, false, false, true, false, false, false, false],
  "outputs":              [false, false, true, false, false, false, false, false],
  "configurable_inputs":  [false, false, false, false, false, false, false, false],
  "configurable_outputs": [false, false, false, false, false, false, false, false]
}
```

### E/S Analógica (rango 0–10 V)

| Dato Dinámico | ID / Variable Exacta | Unidad |
|---------------|----------------------|--------|
| Entrada Analógica AI0 | `analog_io.ai[0]` | V (0–10) |
| Entrada Analógica AI1 | `analog_io.ai[1]` | V (0–10) |
| Salida Analógica AO0 | `analog_io.ao[0]` | V (0–10) |
| Salida Analógica AO1 | `analog_io.ao[1]` | V (0–10) |

Ejemplo:
```json
"analog_io": {
  "ai": [3.25, 0.0],
  "ao": [5.0,  2.5]
}
```

### Seguridad

| Dato Dinámico | ID / Variable Exacta | Valores |
|---------------|----------------------|---------|
| Estado Seguridad | `estado.safety` | `NORMAL` \| `PROTECTIVE_STOP` \| `EMERGENCY_STOP` \| `RECOVERY` \| `REDUCED` |
| Parada de Emergencia | `estado.emergencia_parada` | `true` / `false` |
| Protección activa | `estado.proteccion` | `true` / `false` |

### Herramienta

| Dato Dinámico | ID / Variable Exacta | Unidad |
|---------------|----------------------|--------|
| Tensión | `herramienta.tension` | V |
| Corriente | `herramienta.corriente` | mA |
| Potencia | `herramienta.potencia` | W (opcional; si se omite, la interfaz lo calcula como `tension × corriente / 1000`) |

---

## Payload de ejemplo completo

```json
{
  "programa": {
    "nombre": "pick_and_place.urp",
    "status_id": 3,
    "estado": "RUNNING"
  },
  "sistema": {
    "modo_operacion": "REMOTE",
    "estado_maquina": "POWER_ON",
    "potencia_total": 150,
    "temperatura_control": 38.5,
    "velocidad_tcp": 250.0
  },
  "estadisticas": {
    "tiempo_ciclo": 4.72,
    "horas_operacion": 1234.5
  },
  "eventos": [
    { "hora": "10:23:01", "msg": "Programa iniciado" },
    { "hora": "10:22:55", "msg": "Conexión establecida" }
  ],
  "estado": {
    "online": true,
    "mode": "REMOTE",
    "safety": "NORMAL",
    "emergencia_parada": false,
    "proteccion": false
  },
  "robot_power": 148.0,
  "cycle_time": 4.72,
  "uptime_hours": 1234.5,
  "ctrl_temp": 38.5,
  "last_error": "",
  "tcp": {
    "position":    { "x": 312.45, "y": -120.30, "z": 450.00 },
    "orientation": { "rx": 3.14159, "ry": 0.0, "rz": 1.5708 },
    "speed": 0.25,
    "velocity":    { "x": 0.18, "y": -0.10, "z": 0.0 }
  },
  "joints": {
    "positions":    [1.57, -1.57, 1.57, -1.57, 1.57, 0.0],
    "temperatures": [28.5, 29.1, 30.0, 27.8, 28.0, 27.5],
    "currents":     [0.45, 0.52, 0.38, 0.41, 0.35, 0.22]
  },
  "digital_io": {
    "inputs":               [true, false, false, true, false, false, false, false],
    "outputs":              [false, false, true, false, false, false, false, false],
    "configurable_inputs":  [false, false, false, false, false, false, false, false],
    "configurable_outputs": [false, false, false, false, false, false, false, false]
  },
  "analog_io": {
    "ai": [3.25, 0.0],
    "ao": [5.0,  2.5]
  },
  "herramienta": {
    "tension":   24.0,
    "corriente": 850.0,
    "potencia":  20.4
  }
}
```

---

## Notas para Node-RED

1. **Función de preparación del payload** – En un nodo `function` antes del nodo
   `mqtt out`, serializa el objeto con `msg.payload = JSON.stringify(msg.payload)`
   si todavía no está en formato string, o configura el nodo mqtt out en modo
   **"JSON"** para que lo haga automáticamente.

2. **Actualizaciones parciales** – Puedes publicar mensajes que solo contengan
   los campos modificados.  La interfaz web aplica un merge con el estado previo
   usando el operador `??` (nullish coalescing).

3. **Log de eventos** – El array `eventos` (pestaña Principal) usa las claves
   `{ "hora": "HH:MM:SS", "msg": "..." }`.  El array `messages` (pestaña
   Diagnóstico) usa `{ "time": "HH:MM:SS", "msg": "..." }`.

4. **Herramienta** – Si no envías `herramienta.potencia`, la interfaz la calcula
   automáticamente como `tension × corriente / 1000`.

5. **Cámara** – El campo `camera.stream` acepta una URL MJPEG/RTSP.  Si ya está
   configurado mediante variable de entorno (`VITE_CAMERA_*`) no es necesario
   enviarlo por MQTT.
