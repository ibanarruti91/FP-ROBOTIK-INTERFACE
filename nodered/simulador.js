/**
 * Nodo función de Node-RED – Simulador de Robot UR3e
 *
 * Pega este código en un nodo "function" de Node-RED conectado
 * a un nodo "mqtt out" con el topic: salesianos/robot/iban/principal
 *
 * El nodo inject debe disparar cada ~1 segundo (intervalo repetitivo).
 *
 * Variable de contexto usada para animación continua:
 *   flow.paso  – contador entero que incrementa en cada mensaje
 */

// ── Contador de paso (persiste entre ejecuciones del nodo function) ────────
let paso = flow.get('paso') || 0;
paso++;
flow.set('paso', paso);

// ── Corrientes realistas por articulación (A) ─────────────────────────────
// Cada joint oscila con frecuencia ligeramente distinta para simular carga variable
const currents = Array(6).fill(0).map((_, i) =>
    parseFloat((1.0 + Math.random() * 0.5 + Math.sin(paso * (0.1 + i * 0.05))).toFixed(2))
);

// ── Posiciones articulares (rad) – movimiento sinusoidal suave ────────────
const basePositions = [1.57, -1.57, 1.57, -1.57, 1.57, 0.0];
const positions = basePositions.map((base, i) =>
    parseFloat((base + 0.1 * Math.sin(paso * (0.05 + i * 0.02))).toFixed(4))
);

// ── Temperaturas (°C) – variación lenta ───────────────────────────────────
const baseTemps = [28.5, 29.1, 30.0, 27.8, 28.0, 27.5];
const temperatures = baseTemps.map((base, i) =>
    parseFloat((base + 0.5 * Math.sin(paso * 0.01 + i)).toFixed(1))
);

// ── Potencia total (W) ────────────────────────────────────────────────────
// Se rellena en robot_power Y en telemetry.power para máxima compatibilidad
const power = parseFloat((150 + 30 * Math.sin(paso * 0.05) + Math.random() * 5).toFixed(1));

// ── Velocidad TCP (mm/s) ──────────────────────────────────────────────────
const speed = parseFloat((200 + 50 * Math.abs(Math.sin(paso * 0.07))).toFixed(1));

// ── Temperatura del controlador (°C) ──────────────────────────────────────
const controllerTemp = parseFloat((38 + 2 * Math.sin(paso * 0.02)).toFixed(1));

// ── Tensión principal (V) ─────────────────────────────────────────────────
const mainVoltage = parseFloat((48 + Math.random() * 0.4 - 0.2).toFixed(2));

// ── Carga CPU (%) ─────────────────────────────────────────────────────────
const cpuLoad = parseFloat((30 + 20 * Math.abs(Math.sin(paso * 0.03)) + Math.random() * 5).toFixed(1));

// ── Ciclos completados ────────────────────────────────────────────────────
const ciclos = Math.floor(paso / 10);

// ── TCP pose ──────────────────────────────────────────────────────────────
const tcpX = parseFloat((312 + 10 * Math.sin(paso * 0.04)).toFixed(2));
const tcpY = parseFloat((-120 + 5 * Math.cos(paso * 0.04)).toFixed(2));
const tcpZ = parseFloat((450 + 8 * Math.sin(paso * 0.03)).toFixed(2));

// ── Construcción del payload ──────────────────────────────────────────────
msg.payload = {
    programa: {
        nombre: "pick_and_place.urp",
        status_id: 3,
        estado: "RUNNING"
    },
    sistema: {
        modo_operacion: "REMOTE",
        estado_maquina: "POWER_ON",
        potencia_total: power,
        temperatura_control: controllerTemp,
        velocidad_tcp: speed
    },
    estadisticas: {
        tiempo_ciclo: parseFloat((4.5 + 0.3 * Math.sin(paso * 0.02)).toFixed(2)),
        horas_operacion: parseFloat((1234 + paso / 3600).toFixed(2))
    },
    eventos: [
        { hora: new Date().toTimeString().slice(0, 8), msg: "Ciclo completado #" + ciclos }
    ],
    estado: {
        online: true,
        mode: "REMOTE",
        safety: "NORMAL",
        emergencia_parada: false,
        proteccion: false
    },
    seguridad: {
        safety: "NORMAL"
    },
    // robot_power y telemetry.power llevan el mismo valor para compatibilidad
    robot_power: power,
    cycle_time: parseFloat((4.5 + 0.3 * Math.sin(paso * 0.02)).toFixed(2)),
    uptime_hours: parseFloat((1234 + paso / 3600).toFixed(2)),
    ctrl_temp: controllerTemp,
    last_error: "",
    tcp: {
        position:    { x: tcpX, y: tcpY, z: tcpZ },
        orientation: { rx: 3.14159, ry: 0.0, rz: 1.5708 },
        speed: parseFloat((speed / 1000).toFixed(4)),
        velocity:    { x: 0.18, y: -0.10, z: 0.0 }
    },
    joints: {
        positions:    positions,
        temperatures: temperatures,
        currents:     currents      // ← valores no-cero calculados arriba
    },
    digital_io: {
        inputs:               [true, false, false, true, false, false, false, false],
        outputs:              [false, false, true, false, false, false, false, false],
        configurable_inputs:  [false, false, false, false, false, false, false, false],
        configurable_outputs: [false, false, false, false, false, false, false, false]
    },
    analog_io: {
        ai: [parseFloat((3 + Math.random() * 0.5).toFixed(2)), 0.0],
        ao: [5.0, 2.5]
    },
    herramienta: {
        tension:   24.0,
        corriente: parseFloat((820 + 30 * Math.sin(paso * 0.06)).toFixed(1)),
        potencia:  parseFloat((20 + 1 * Math.sin(paso * 0.06)).toFixed(2))
    },
    // Sub-objeto telemetry para los widgets del Menú Principal
    telemetry: {
        speed:           speed,
        power:           power,    // ← mismo valor que robot_power
        controller_temp: controllerTemp,
        main_voltage:    mainVoltage,
        cpu_load:        cpuLoad,
        ciclos:          ciclos
    }
};

return msg;
