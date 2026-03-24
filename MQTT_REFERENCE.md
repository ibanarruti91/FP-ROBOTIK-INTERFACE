# Referencia MQTT – Listado completo de datos

Listado técnico completo de **todos** los datos que la interfaz web consume
vía MQTT, con tipo de dato, unidad, formato de visualización, rango / enum
de valores válidos y notas de implementación.

> **Cómo leer esta referencia**
> - **Ruta JSON** – ruta exacta dentro del payload (notación de punto).
> - **Tipo** – `string` · `number` · `boolean` · `array<boolean>[8]` · etc.
> - **Unidad** – unidad de ingeniería que el frontend muestra al usuario.
> - **Formato UI** – número de decimales o tipo de presentación.
> - **Rango / Enum** – valores válidos o límites conocidos.
> - **★** – campo leído por el **mini-cabecero**, visible en **todas** las pestañas.

---

## 1. Configuración del broker

| Parámetro | Valor |
|-----------|-------|
| **Broker** | `broker.emqx.io` |
| **Puerto** | `8084` (WSS – WebSocket Secure) |
| **Topic principal** | `salesianos/robot/iban/principal` |
| **Topic validación** | `salesianos/robot/iban/step_capture` |
| **QoS** | `0` |
| **Payload** | JSON serializado (objeto JavaScript → `JSON.stringify`) |

> Puedes publicar **solo los campos que cambian**; los valores omitidos
> conservan su estado anterior en la interfaz (merge con `??`).

---

## 2. Estructura raíz del payload (topic `principal`)

```
{
  program_name      string
  program_id        number
  rtde              { safety_status, robot_mode, program_state }
  telemetry         { speed, power, controller_temp, main_voltage, cpu_load, ciclos }
  sistema           { modo_operacion, estado_maquina, potencia_total, temperatura_control, velocidad_tcp }
  tcp               { position: {x,y,z}, orientation: {rx,ry,rz}, speed, velocity: {x,y,z} }
  joints            { positions[6], temperatures[6], currents[6], power, potencia_total, consumo_movimiento }
  digital_io        { inputs[8], outputs[8], configurable_inputs[8], configurable_outputs[8] }
  analog_io         { ai[2], ao[2] }
  herramienta       { tension, corriente, potencia }
  estado            { online, mode, safety, emergencia_parada, proteccion, analogas }
  seguridad         { safety }
  programa          { nombre, status_id, id, ciclos, estado }
  estadisticas      { tiempo_ciclo, horas_operacion }
  eventos           [ { hora, msg } ]
  robot_power       number
  cycle_time        number
  uptime_hours      number
  ctrl_temp         number
  last_error        string
  messages          [ { time, msg } ]
  camera            { stream }
}
```

---

## 3. Mini-cabecero (★ visible en TODAS las pestañas)

Estos cinco badges se muestran permanentemente en la parte superior de la pantalla,
independientemente de la pestaña activa. Leen directamente del payload MQTT crudo.

| # | Dato | Ruta JSON | Tipo | Formato UI | Rango / Enum | Notas |
|---|------|-----------|------|-----------|--------------|-------|
| 1 | ★ Nombre programa | `program_name` | `string` | texto en mayúsculas | cualquier string | Nombre del fichero `.urp` activo |
| 2 | ★ ID programa | `program_id` | `number` entero | `[ID]` prefijado | entero positivo | Se muestra como `[105]` junto al nombre |
| 3 | ★ Estado Seguridad | `rtde.safety_status` | `number` entero | `[ID] ETIQUETA` | ver tabla 3.1 | Controla el color del badge |
| 4 | ★ Modo Robot | `rtde.robot_mode` | `number` entero | `[ID] ETIQUETA` | ver tabla 3.2 | Controla el color del badge |
| 5 | ★ Estado Programa | `rtde.program_state` | `number` entero | `[ID] ETIQUETA` | ver tabla 3.3 | Controla el color del badge |
| 6 | ★ Frenos | *(derivado)* | — | `LIBERADOS` / `BLOQUEADOS` | `robot_mode === 7` → LIBERADOS | No se envía; se calcula en el frontend |

### 3.1 – Tabla de IDs: `rtde.safety_status`

| ID | Etiqueta UI | Color badge |
|----|-------------|-------------|
| 1 | NORMAL | Verde |
| 2 | REDUCIDO | Verde |
| 3 | PARADA PROTECTORA | Naranja |
| 4 | PARADA EMERGENCIA | Rojo parpadeante |
| 5 | PARADA SALVAGUARDA | Naranja |
| 6 | EM. SISTEMA EXTERNO | Rojo sólido |
| 7 | EM. ROBOT | Rojo sólido |
| 8 | VIOLACIÓN LÍMITES | Rojo parpadeante |
| 9 | FALLO DE HARDWARE | Rojo sólido |
| 11 | DETENIDO | Gris |

### 3.2 – Tabla de IDs: `rtde.robot_mode`

| ID | Etiqueta UI | Color badge |
|----|-------------|-------------|
| 0 | DESCONECTADO | Gris |
| 1 | CONFIRMAR SEGURIDAD | Amarillo |
| 2 | INICIANDO SISTEMA | Amarillo |
| 3 | MOTORES APAGADOS | Gris |
| 4 | MOTORES ENCENDIDOS | Ámbar |
| 5 | ARRANCANDO | Azul |
| 6 | LIBERACIÓN MANUAL | Azul |
| 7 | OPERATIVO | Verde |

### 3.3 – Tabla de IDs: `rtde.program_state`

| ID | Etiqueta UI | Color badge |
|----|-------------|-------------|
| 0 | NO INICIALIZADO | Gris |
| 1 | DETENIDO | Rojo |
| 2 | EN EJECUCIÓN | Verde |
| 3 | PAUSANDO... | Amarillo |
| 4 | EN PAUSA | Amarillo |
| 5 | REANUDANDO... | Azul |

---

## 4. Pestaña PRINCIPAL

### 4.1 – Cámara en vivo

| # | Dato | Ruta JSON | Tipo | Formato UI | Rango / Enum | Notas |
|---|------|-----------|------|-----------|--------------|-------|
| 7 | Stream cámara | `camera.stream` | `string` | URL embebida en `<img>` | URL MJPEG / RTSP | Si está vacío o nulo, el widget no se muestra |

### 4.2 – Tarjetas de sistema (`principal-sys-cards`)

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango típico | Notas |
|---|------|-----------|------|--------|-----------|--------------|-------|
| 8 | Temperatura Sistema | `telemetry.controller_temp` | `number` | °C | 1 decimal | 20 – 80 | Fallback: `sistema.temperatura_control` |
| 9 | Tensión Principal | `telemetry.main_voltage` | `number` | V | 1 decimal | 22 – 26 | Sin fallback automático |
| 10 | Carga CPU | `telemetry.cpu_load` | `number` | % | 0 decimales + barra | 0 – 100 | Barra de progreso proporcional |
| 11 | Consumo Actual | `telemetry.power` | `number` | W | 0 decimales | 0 – 500 | Fallback: `sistema.potencia_total` |
| 12 | Velocidad TCP | `telemetry.speed` | `number` | mm/s | 0 decimales | 0 – 1500 | Fallback: `sistema.velocidad_tcp` |
| 13 | Eficiencia (Ciclos) | `telemetry.ciclos` | `number` | — | 0 decimales | 0 – ∞ | Contador de ciclos; fallback: `programa.ciclos` |

### 4.3 – Gráfico de rendimiento dinámico

El gráfico SVG muestra los últimos **30 segundos** con dos series simultáneas:

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango típico | Notas |
|---|------|-----------|------|--------|-----------|--------------|-------|
| 14 | Velocidad TCP (gráfico) | `telemetry.speed` | `number` | mm/s | entero en eje Y izquierdo | 0 – 1500 | Línea cian (`#00e5ff`) |
| 15 | Potencia (gráfico) | `telemetry.power` | `number` | W | entero en eje Y derecho | 0 – 500 | Línea ámbar (`#ffbf00`) |

---

## 5. Pestaña ESTADO HARDWARE E/S

### 5.1 – E/S Digital (matriz 4 × 8)

Cada campo es un **array de 8 booleanos** (índice 0 = canal 0, índice 7 = canal 7).

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Valores válidos | Notas |
|---|------|-----------|------|--------|-----------|-----------------|-------|
| 16 | Entradas Digitales DI0–DI7 | `digital_io.inputs` | `array<boolean>[8]` | — | LED azul (activo) / apagado | `true` / `false` | Fila DI en la matriz |
| 17 | Entradas Configurables CI0–CI7 | `digital_io.configurable_inputs` | `array<boolean>[8]` | — | LED azul (activo) / apagado | `true` / `false` | Fila CI en la matriz |
| 18 | Salidas Digitales DO0–DO7 | `digital_io.outputs` | `array<boolean>[8]` | — | LED magenta (activo) / apagado | `true` / `false` | Fila DO en la matriz |
| 19 | Salidas Configurables CO0–CO7 | `digital_io.configurable_outputs` | `array<boolean>[8]` | — | LED magenta (activo) / apagado | `true` / `false` | Fila CO en la matriz |

### 5.2 – E/S Analógica

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango | Notas |
|---|------|-----------|------|--------|-----------|-------|-------|
| 20 | Entrada Analógica AI0 | `analog_io.ai[0]` | `number` | V | 2 decimales + barra | 0 – 10 V | Barra cian proporcional a 10 V |
| 21 | Entrada Analógica AI1 | `analog_io.ai[1]` | `number` | V | 2 decimales + barra | 0 – 10 V | Barra cian proporcional a 10 V |
| 22 | Salida Analógica AO0 | `analog_io.ao[0]` | `number` | V | 2 decimales + barra | 0 – 10 V | Barra magenta proporcional a 10 V |
| 23 | Salida Analógica AO1 | `analog_io.ao[1]` | `number` | V | 2 decimales + barra | 0 – 10 V | Barra magenta proporcional a 10 V |

### 5.3 – Seguridad (LEDs)

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Valores válidos | Notas |
|---|------|-----------|------|--------|-----------|-----------------|-------|
| 24 | Parada de Emergencia | `estado.emergencia_parada` | `boolean` | — | LED rojo parpadeante (ACTIVA) / verde (OK) | `true` / `false` | Si no se envía, se deriva de `estado.safety`: `EMERGENCY_STOP` → `true`; cualquier otro valor no nulo → `false` |
| 25 | Protección activa | `estado.proteccion` | `boolean` | — | LED rojo parpadeante (ACTIVA) / verde (OK) | `true` / `false` | Si no se envía, se deriva de `estado.safety`: `PROTECTIVE_STOP` o `REDUCED` → `true`; cualquier otro valor no nulo → `false` |

### 5.4 – Herramienta

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango típico | Notas |
|---|------|-----------|------|--------|-----------|--------------|-------|
| 26 | Tensión herramienta | `herramienta.tension` | `number` | V | 2 decimales | 0 – 30 V | Normalmente 24 V para herramientas UR |
| 27 | Corriente herramienta | `herramienta.corriente` | `number` | mA | 1 decimal | 0 – 2000 mA | |
| 28 | Potencia herramienta | `herramienta.potencia` | `number` | W | 2 decimales | 0 – 48 W | **Opcional.** Si se omite: `tension × corriente / 1000` |

---

## 6. Pestaña CINEMÁTICA

### 6.1 – Diagnóstico de Potencia

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango típico | Notas |
|---|------|-----------|------|--------|-----------|--------------|-------|
| 29 | Consumo total articulaciones | `joints.power` | `number` | W | 0 decimales | 0 – 500 W | Aliases aceptados: `joints.potencia_total`, `joints.consumo_movimiento`. Si `joints.currents` está presente, el frontend recalcula: `Σ(corriente[i] × 24 V)`. Si todos los valores de `currents` son cero y ya existe un estado previo válido, se congela el último valor (evita parpadeo en arranque). Si no existe estado previo (carga inicial), el widget muestra **N/A** hasta recibir corrientes distintas de cero |
| 30 | Velocidad TCP (cinemática) | `sistema.velocidad_tcp` | `number` | m/s | 3 decimales | 0 – 1.5 m/s | Widget independiente del gráfico de la pestaña Principal |

### 6.2 – TCP Pose (posición y orientación cartesiana)

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango típico | Notas |
|---|------|-----------|------|--------|-----------|--------------|-------|
| 31 | Posición X | `tcp.position.x` | `number` | mm | 2 decimales | −800 – 800 mm | Coordenada cartesiana del TCP |
| 32 | Posición Y | `tcp.position.y` | `number` | mm | 2 decimales | −800 – 800 mm | |
| 33 | Posición Z | `tcp.position.z` | `number` | mm | 2 decimales | −800 – 800 mm | |
| 34 | Orientación RX | `tcp.orientation.rx` | `number` | rad | 3 decimales | −π – π | Vector de rotación eje X |
| 35 | Orientación RY | `tcp.orientation.ry` | `number` | rad | 3 decimales | −π – π | |
| 36 | Orientación RZ | `tcp.orientation.rz` | `number` | rad | 3 decimales | −π – π | |

> **Nota:** `tcp.speed` (m/s) y `tcp.velocity.{x,y,z}` (m/s) también son
> aceptados en el payload pero no se muestran en ningún widget actualmente.

### 6.3 – Articulaciones J1–J6

Arrays de **6 elementos** (índice 0 = Joint 1, índice 5 = Joint 6).

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango típico | Notas |
|---|------|-----------|------|--------|-----------|--------------|-------|
| 37 | Posición J1–J6 | `joints.positions` | `array<number>[6]` | rad | 3 decimales | −2π – 2π | Posición angular de cada articulación |
| 38 | Corriente J1–J6 | `joints.currents` | `array<number>[6]` | A | 2 decimales | 0 – 5 A | **Crítico:** usado para calcular la potencia total (`× 24 V`). Si todos son 0, la interfaz congela el último valor válido |
| 39 | Temperatura J1–J6 | `joints.temperatures` | `array<number>[6]` | °C | 1 decimal + barra de color | 20 – 80 °C | Verde < 30 °C · Ámbar 30–40 °C · Rojo > 40 °C |

---

## 7. Pestaña DIAGNÓSTICO

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango típico | Notas |
|---|------|-----------|------|--------|-----------|--------------|-------|
| 40 | Temperatura Controlador | `ctrl_temp` | `number` | °C | 1 decimal | 20 – 80 °C | |
| 41 | Potencia Robot | `robot_power` | `number` | W | 0 decimales | 0 – 1000 W | Potencia total del controlador UR |
| 42 | Último Error | `last_error` | `string` | — | texto literal | cualquier string | String vacío `""` si no hay error |
| 43 | Tiempo de Operación | `uptime_hours` | `number` | h | 1 decimal | 0 – ∞ | Horas desde el último arranque |
| 44 | Tiempo Ciclo Promedio | `cycle_time` | `number` | s | 1 decimal | 0 – 9999 s | Tiempo medio del ciclo del programa |
| 45 | Log del sistema | `messages` | `array<object>` | — | lista de filas `hora: mensaje` | ver §7.1 | Historial de mensajes del robot |

### 7.1 – Estructura de cada elemento de `messages`

```json
{ "time": "HH:MM:SS", "msg": "Texto del mensaje" }
```

| Campo | Tipo | Formato | Notas |
|-------|------|---------|-------|
| `time` | `string` | `"HH:MM:SS"` | Hora del evento |
| `msg` | `string` | texto libre | Descripción del evento |

---

## 8. Topic de Validación / Captura de pasos

**Topic:** `salesianos/robot/iban/step_capture`

Este topic se usa exclusivamente en la pestaña **Validación** para registrar
capturas de posición TCP en pasos definidos del programa.

| # | Dato | Ruta JSON | Tipo | Unidad | Formato UI | Rango / Valores | Notas |
|---|------|-----------|------|--------|-----------|-----------------|-------|
| 46 | ID de paso | `step_id` | `number` o `string` | — | texto / número | definido por el programa | Identificador del paso capturado |
| 47 | Timestamp | `timestamp` | `number` | ms (Unix epoch) | `HH:MM:SS` (local) | entero positivo | `new Date(timestamp).toLocaleTimeString()` |
| 48 | Nombre programa | `program_name` | `string` | — | texto | cualquier string | Nombre del programa activo al capturar |
| 49 | Posición X (capture) | `tcp_position_mm.x` | `number` | mm | 2 decimales | −800 – 800 mm | Coordenada X en el momento de captura |
| 50 | Posición Y (capture) | `tcp_position_mm.y` | `number` | mm | 2 decimales | −800 – 800 mm | |
| 51 | Posición Z (capture) | `tcp_position_mm.z` | `number` | mm | 2 decimales | −800 – 800 mm | |

Ejemplo de payload `step_capture`:

```json
{
  "step_id":       5,
  "timestamp":     1712000000000,
  "program_name":  "proceso_soldadura.urp",
  "tcp_position_mm": {
    "x": 312.45,
    "y": -120.30,
    "z": 450.00
  }
}
```

---

## 9. Campos legacy / fallback (también soportados)

La interfaz acepta estos campos del **formato antiguo** y los mapea
automáticamente a la estructura interna. Recomendado migrar al formato nuevo.

| # | Campo legacy | Ruta JSON | Tipo | Mapeado a (interno) | Notas |
|---|-------------|-----------|------|---------------------|-------|
| 52 | Nombre programa (legacy) | `programa.nombre` | `string` | `programa.nombre` | Fallback de `program_name` |
| 53 | ID programa (legacy) | `programa.status_id` / `programa.id` | `number` | `programa.status_id` | Fallback de `program_id` |
| 54 | Estado ejecución (legacy) | `programa.estado` | `string` | `programa.estado` | `PLAYING` · `RUNNING` · `PAUSED` · `STOPPED` |
| 55 | Ciclos (legacy) | `programa.ciclos` | `number` | `telemetry.ciclos` | Fallback de `telemetry.ciclos` |
| 56 | Modo operación (legacy) | `sistema.modo_operacion` | `string` o `number` | `sistema.modo_operacion` | `REMOTE` · `AUTO` · `MANUAL` o ID numérico (1=MANUAL, 2=AUTO, 3=REMOTE) |
| 57 | Estado máquina (legacy) | `sistema.estado_maquina` | `string` o `number` | `sistema.estado_maquina` | `POWER_ON` · `POWER_OFF` · `BOOTING` · `RUNNING` · `EMERGENCY_STOP` o ID numérico |
| 58 | Potencia total (legacy) | `sistema.potencia_total` | `number` | `telemetry.power` | Fallback de `telemetry.power` |
| 59 | Temperatura control (legacy) | `sistema.temperatura_control` | `number` | `telemetry.controller_temp` | Fallback de `telemetry.controller_temp` |
| 60 | Velocidad TCP (legacy) | `sistema.velocidad_tcp` | `number` | `telemetry.speed` y `sistema.velocidad_tcp` | Fallback de `telemetry.speed` |
| 61 | Tiempo ciclo (legacy) | `estadisticas.tiempo_ciclo` | `number` | `estadisticas.tiempo_ciclo` | Fallback de `cycle_time` |
| 62 | Horas operación (legacy) | `estadisticas.horas_operacion` | `number` | `estadisticas.horas_operacion` | Fallback de `uptime_hours` |
| 63 | Log eventos (legacy) | `eventos` | `array<object>` | `eventos` | Estructura: `{ "hora": "HH:MM:SS", "msg": "..." }` |
| 64 | Online (legacy) | `estado.online` | `boolean` | `estado.online` | `true` = conectado |
| 65 | Modo estado (legacy) | `estado.mode` | `string` | `estado.mode` | `REMOTE` · `AUTO` · `MANUAL` |
| 66 | Seguridad (legacy path 1) | `estado.safety` | `string` | `estado.safety` / `seguridad.safety` | `NORMAL` · `PROTECTIVE_STOP` · `EMERGENCY_STOP` · `RECOVERY` · `REDUCED` |
| 67 | Seguridad (legacy path 2) | `seguridad.safety` | `string` | `seguridad.safety` / `estado.safety` | Mismo enum que campo anterior |
| 68 | Analógicas (legacy) | `estado.analogas` | `array<number>[4]` | `analog_io.ai[0..1]` y `analog_io.ao[0..1]` | `[AI0, AI1, AO0, AO1]` (V, 0–10) |

---

## 10. Resumen ordenado: todos los campos (48 campos activos)

| # | Ruta JSON | Tipo | Unidad | Formato UI | Rango / Enum |
|---|-----------|------|--------|-----------|--------------|
| 1 | `program_name` | `string` | — | Texto mayúsculas | Nombre de fichero `.urp` |
| 2 | `program_id` | `number` entero | — | `[ID]` | Entero ≥ 0 |
| 3 | `rtde.safety_status` | `number` entero | — | `[ID] ETIQUETA` | 1–9, 11 (ver §3.1) |
| 4 | `rtde.robot_mode` | `number` entero | — | `[ID] ETIQUETA` | 0–7 (ver §3.2) |
| 5 | `rtde.program_state` | `number` entero | — | `[ID] ETIQUETA` | 0–5 (ver §3.3) |
| 6 | `camera.stream` | `string` | — | URL embebida | URL MJPEG/RTSP |
| 7 | `telemetry.controller_temp` | `number` | °C | 1 decimal | 20–80 |
| 8 | `telemetry.main_voltage` | `number` | V | 1 decimal | 22–26 |
| 9 | `telemetry.cpu_load` | `number` | % | 0 decimales + barra | 0–100 |
| 10 | `telemetry.power` | `number` | W | 0 decimales | 0–500 |
| 11 | `telemetry.speed` | `number` | mm/s | 0 decimales | 0–1500 |
| 12 | `telemetry.ciclos` | `number` | — | 0 decimales | 0–∞ |
| 13 | `digital_io.inputs` | `array<boolean>[8]` | — | LED azul/apagado | `[true/false ×8]` |
| 14 | `digital_io.configurable_inputs` | `array<boolean>[8]` | — | LED azul/apagado | `[true/false ×8]` |
| 15 | `digital_io.outputs` | `array<boolean>[8]` | — | LED magenta/apagado | `[true/false ×8]` |
| 16 | `digital_io.configurable_outputs` | `array<boolean>[8]` | — | LED magenta/apagado | `[true/false ×8]` |
| 17 | `analog_io.ai[0]` | `number` | V | 2 decimales + barra cian | 0–10 |
| 18 | `analog_io.ai[1]` | `number` | V | 2 decimales + barra cian | 0–10 |
| 19 | `analog_io.ao[0]` | `number` | V | 2 decimales + barra magenta | 0–10 |
| 20 | `analog_io.ao[1]` | `number` | V | 2 decimales + barra magenta | 0–10 |
| 21 | `estado.emergencia_parada` | `boolean` | — | LED rojo/verde | `true` / `false` |
| 22 | `estado.proteccion` | `boolean` | — | LED rojo/verde | `true` / `false` |
| 23 | `herramienta.tension` | `number` | V | 2 decimales | 0–30 |
| 24 | `herramienta.corriente` | `number` | mA | 1 decimal | 0–2000 |
| 25 | `herramienta.potencia` | `number` | W | 2 decimales | 0–48 · opcional |
| 26 | `joints.power` | `number` | W | 0 decimales | 0–500 · opcional |
| 27 | `joints.currents` | `array<number>[6]` | A | 2 decimales | 0–5 A por eje |
| 28 | `tcp.position.x` | `number` | mm | 2 decimales | −800–800 |
| 29 | `tcp.position.y` | `number` | mm | 2 decimales | −800–800 |
| 30 | `tcp.position.z` | `number` | mm | 2 decimales | −800–800 |
| 31 | `tcp.orientation.rx` | `number` | rad | 3 decimales | −π–π |
| 32 | `tcp.orientation.ry` | `number` | rad | 3 decimales | −π–π |
| 33 | `tcp.orientation.rz` | `number` | rad | 3 decimales | −π–π |
| 34 | `joints.positions` | `array<number>[6]` | rad | 3 decimales | −2π–2π |
| 35 | `joints.temperatures` | `array<number>[6]` | °C | 1 decimal + barra | 20–80 |
| 36 | `ctrl_temp` | `number` | °C | 1 decimal | 20–80 |
| 37 | `robot_power` | `number` | W | 0 decimales | 0–1000 |
| 38 | `last_error` | `string` | — | texto literal | `""` si sin error |
| 39 | `uptime_hours` | `number` | h | 1 decimal | 0–∞ |
| 40 | `cycle_time` | `number` | s | 1 decimal | 0–9999 |
| 41 | `messages` | `array<{time,msg}>` | — | lista de filas | ver §7.1 |
| 42 | `sistema.velocidad_tcp` | `number` | m/s | 3 decimales | 0–1.5 |
| — | *(Validación – topic `step_capture`)* | | | | |
| 43 | `step_id` | `number`/`string` | — | texto | definido por programa |
| 44 | `timestamp` | `number` | ms epoch | `HH:MM:SS` | entero positivo |
| 45 | `program_name` | `string` | — | texto | nombre `.urp` |
| 46 | `tcp_position_mm.x` | `number` | mm | 2 decimales | −800–800 |
| 47 | `tcp_position_mm.y` | `number` | mm | 2 decimales | −800–800 |
| 48 | `tcp_position_mm.z` | `number` | mm | 2 decimales | −800–800 |

---

## 11. Payload de ejemplo completo (formato recomendado)

```json
{
  "program_name": "pick_and_place.urp",
  "program_id": 105,

  "rtde": {
    "safety_status": 1,
    "robot_mode":    7,
    "program_state": 2
  },

  "telemetry": {
    "speed":           250.0,
    "power":           148.0,
    "controller_temp": 38.5,
    "main_voltage":    24.1,
    "cpu_load":        32.0,
    "ciclos":          1234
  },

  "sistema": {
    "modo_operacion":     "REMOTE",
    "estado_maquina":     "POWER_ON",
    "potencia_total":     148.0,
    "temperatura_control": 38.5,
    "velocidad_tcp":       0.25
  },

  "tcp": {
    "position":    { "x": 312.45, "y": -120.30, "z": 450.00 },
    "orientation": { "rx": 3.14159, "ry": 0.0, "rz": 1.5708 },
    "speed":       0.25,
    "velocity":    { "x": 0.18, "y": -0.10, "z": 0.0 }
  },

  "joints": {
    "positions":    [1.57, -1.57, 1.57, -1.57, 1.57, 0.0],
    "temperatures": [28.5, 29.1, 30.0, 27.8, 28.0, 27.5],
    "currents":     [0.45, 0.52, 0.38, 0.41, 0.35, 0.22],
    "power":        51.84
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
  },

  "estado": {
    "online":            true,
    "mode":              "REMOTE",
    "safety":            "NORMAL",
    "emergencia_parada": false,
    "proteccion":        false
  },

  "robot_power":  148.0,
  "cycle_time":   4.72,
  "uptime_hours": 1234.5,
  "ctrl_temp":    38.5,
  "last_error":   "",

  "messages": [
    { "time": "10:23:01", "msg": "Programa iniciado" },
    { "time": "10:22:55", "msg": "Conexión establecida" }
  ],

  "camera": {
    "stream": "http://192.168.1.100:8080/?action=stream"
  }
}
```

---

## 12. Notas de implementación para Node-RED

1. **Serialización** – Configura el nodo `mqtt out` en modo **JSON** o añade
   `msg.payload = JSON.stringify(msg.payload)` en un nodo `function` previo.

2. **Actualizaciones parciales** – Puedes publicar mensajes con solo los campos
   que han cambiado; la interfaz hace merge con el estado anterior (`??`).

3. **Potencia de articulaciones** – Si envías `joints.currents`, la interfaz
   calcula la potencia total como `Σ(corriente[i] × 24 V)` e ignora
   `joints.power`. Si todos los valores de `currents` son cero (arranque
   Node-RED), la interfaz congela el último valor válido.

4. **Potencia herramienta** – Si no envías `herramienta.potencia`, la interfaz
   la calcula automáticamente como `tension × corriente / 1000`.

5. **Frenos** – No es necesario enviar el estado de los frenos; se deriva
   automáticamente de `rtde.robot_mode`: si es `7` → LIBERADOS, cualquier
   otro valor → BLOQUEADOS.

6. **Cámara** – El campo `camera.stream` acepta URL MJPEG o RTSP. Si la URL ya
   está configurada mediante variable de entorno (`VITE_CAMERA_*`), no es
   necesario enviarla por MQTT.

7. **Log de eventos** – `eventos` (legacy) usa `{ "hora": "HH:MM:SS", "msg": "..." }`.
   `messages` (nuevo) usa `{ "time": "HH:MM:SS", "msg": "..." }`.

8. **Compatibilidad legacy** – Todos los campos del §9 siguen siendo aceptados;
   la migración al formato nuevo (§11) no es obligatoria.
