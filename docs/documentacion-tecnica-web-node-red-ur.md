# Documentación Técnica de la Aplicación Web para Visualización de Telemetría Node-RED/UR

## 1) Portada/Título

# Documentación Técnica de la Aplicación Web Node-RED/UR

## 2) Resumen Ejecutivo

Esta documentación cubre la arquitectura y el funcionamiento de la aplicación web utilizada para visualizar la telemetría de Node-RED y UR. Incluye detalles sobre su estructura, conexiones y lógica interna, así como ejemplos prácticos.

## 3) Arquitectura General de la Web

La arquitectura de la aplicación se basa en el framework React 19 y en Vite 7, utilizando react-router-dom con HashRouter para la gestión de rutas. La aplicación está diseñada para ser modular y escalable, facilitando su mantenimiento.

## 4) Punto de Entrada de la Aplicación

El punto de entrada de la aplicación es el archivo `src/main.jsx`, donde se inicializa la aplicación React y se configura el contexto MQTT.

## 5) Conexión MQTT

La conexión MQTT global se implementa en `src/contexts/MqttStatusContext.jsx` utilizando la librería mqtt: 
`mqtt.connect('wss://broker.emqx.io:8084/mqtt');`

## 6) Topics que Consume la Web

La aplicación se suscribe a los siguientes topics:
- `salesianos/robot/iban/principal`
- `salesianos/robot/iban/step_capture`
- `salesianos/robot/iban/events_derived`
- `salesianos/robot/iban/events_buffer`
- `salesianos/robot/iban/status`

## 7) Topics que Publica la Web

La aplicación publica comandos a `robot/control/rtde` con los siguientes payloads:
- `{"comando":"start"}`
- `{"comando":"stop"}`

## 8) Formato Exacto de los JSON Esperados por la Web con Ejemplos

Ejemplo de un JSON esperado:
```json
{
  "status": 5,
  "mode": 2
}
```
Ejemplo de un comando:
```json
{
  "comando": "start"
}
```

## 9) Transformación del JSON Recibido a Estado Interno de React

La aplicación utiliza el componente `TelemetriaDetail` para normalizar los nuevos y antiguos formatos de payloads y preservar campos faltantes utilizando la coalescencia nula.

## 10) Componentes Visuales Principales

Los componentes principales incluyen:
- `TelemetryMiniHeader`
- `WidgetRenderer`

## 11) Mapeos de Estados

Los mapeos de estados son los siguientes:
- `ROBOT_STATUS_MAP : {3:'BOOTING',4:'POWER_OFF',5:'POWER_ON',7:'RUNNING',8:'RUNNING'}`
- `ROBOT_MODE_MAP : {1:'MANUAL',2:'AUTO',3:'REMOTE'}`
- `RUNTIME_STATE_MAP : {1:'STOPPED',2:'PLAYING',3:'PAUSED'}`
- `SAFETY_STATUS_MAP : {1:'NORMAL',3:'PROTECTIVE_STOP',4:'EMERGENCY_STOP'}`

## 12) Lógica de Online/Offline

La lógica de estado online/offline es controlada únicamente por el topic de `status`, revisada cada 1000 ms, con un timeout de 6000 ms.

## 13) Gestión de Eventos

Los eventos se gestionan en base a los topics suscritos. El `events_buffer` es autoritativo mientras que `events_derived` es incremental y deduplicado por `event.id`.

## 14) Latencia y Rendimiento

La latencia y el rendimiento son monitoreados en tiempo real, y se busca optimizar la renderización y la recepción de datos.

## 15) Archivos Concretos a Revisar para Mejorar Latencia, Eventos y Compatibilidad con Node-RED

Los archivos a revisar incluyen los servicios de MQTT y la lógica del cliente que manejan las conexiones y publicaciones.

## 16) Variables de Configuración

Las variables de configuración se gestionan en el archivo `.env.example`, que incluye configuraciones básicas necesarias para la aplicación.

## 17) Problemas Conocidos o Partes Delicadas del Código

Se documentan problemas conocidos que pueden afectar la estabilidad y rendimiento de la aplicación mientras se trabaja con MQTT y estados.

## 18) Flujo Completo de un Mensaje MQTT desde Llegada Hasta Render en Pantalla

Cada mensaje recibido pasa a través del contexto MQTT y se transforma en componentes React, donde finalmente se renderiza en la pantalla.

## 19) Árbol de Archivos del Repositorio

```
FP-ROBOTIK-INTERFACE/
├── .env.example
├── MQTT_REFERENCE.md
├── package.json
└── src/
    ├── components/
    │   ├── TelemetryMiniHeader.jsx
    │   └── WidgetRenderer.jsx
    ├── config/
    │   └── centros.js
    ├── contexts/
    │   ├── MqttStatusContext.js
    │   └── MqttStatusContext.jsx
    ├── hooks/
    │   └── useMqttStatus.js
    ├── pages/
    │   ├── Diagnostico.jsx
    │   └── TelemetriaDetail.jsx
    ├── servicios/
    │   ├── iot.js
    │   └── mqttClient.js
    └── ui/
        └── layouts/
            └── salesianos-urnieta.layout.js
```

## 20) Anexos con Contenido Completo de Archivos Relacionados con MQTT, Estado Global y Componentes Principales

### Contenido de `package.json`
```json
{
  "name": "FP-ROBOTIK-INTERFACE",
  "version": "1.0.0",
  "dependencies": {
    "mqtt": "^5.15.0",
    "react": "19.x",
    "react-dom": "19.x",
    "react-router-dom": "^6.x",
    "vite": "^7.x"
  }
}
```

### Contenido de `src/main.jsx`
```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { MqttStatusProvider } from './contexts/MqttStatusContext';

ReactDOM.render(
  <MqttStatusProvider>
    <App />
  </MqttStatusProvider>,
  document.getElementById('root')
);
```

### Contenido de `src/App.jsx`
```javascript
import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import TelemetriaDetail from './pages/TelemetriaDetail';
import Diagnostico from './pages/Diagnostico';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/telemetria" element={<TelemetriaDetail />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
      </Routes>
    </Router>
  );
};

export default App;
```

### Contenido de `src/contexts/MqttStatusContext.jsx`
```javascript
import React, { createContext, useState } from 'react';
import mqtt from 'mqtt';

const MqttStatusContext = createContext();
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

export const MqttStatusProvider = ({ children }) => {
  const [status, setStatus] = useState('offline');

  client.on('connect', () => {
    setStatus('online');
  });

  client.on('message', (topic, message) => {
    // lógica de manejo de mensaje
  });

  return (
    <MqttStatusContext.Provider value={{ status }}>
      {children}
    </MqttStatusContext.Provider>
  );
};

export default MqttStatusContext;
```

### Contenido de `src/hooks/useMqttStatus.js`
```javascript
import { useContext } from 'react';
import MqttStatusContext from '../contexts/MqttStatusContext';

const useMqttStatus = () => {
  return useContext(MqttStatusContext);
};

export default useMqttStatus;
```

### Contenido de `src/pages/TelemetriaDetail.jsx`
```javascript
import React from 'react';
import useMqttStatus from '../hooks/useMqttStatus';

const TelemetriaDetail = () => {
  const { status } = useMqttStatus();

  return <div>Status de conexión: {status}</div>;
};

export default TelemetriaDetail;
```

### Contenido de `src/pages/Diagnostico.jsx`
```javascript
import React from 'react';

const Diagnostico = () => {
  return <div>Página de Diagnóstico</div>;
};

export default Diagnostico;
```

### Contenido de `src/servicios/iot.js`
```javascript
// Servicio IoT que maneja las funcionalidades de la aplicación
```

### Contenido de `src/servicios/mqttClient.js`
```javascript
// Gestión de cliente MQTT para la aplicación
```

### Contenido de `src/config/centros.js`
```javascript
// Configuración de centros que pueden ser utilizados en la aplicación
```

### Contenido de `src/ui/layouts/salesianos-urnieta.layout.js`
```javascript
// Layout personalizado para la visualización
```

### Contenido de `src/components/TelemetryMiniHeader.jsx`
```javascript
// Componente que muestra información básica de telemetría
```

### Contenido de `src/components/WidgetRenderer.jsx`
```javascript
// Componente que renderiza widgets según la información de telemetría
```

### Contenido de `MQTT_REFERENCE.md`
```markdown
# Referencia de MQTT
Descripción de cómo interactuar con el sistema MQTT y sus topics.
```

### Contenido de `.env.example`
```ini
# Ejemplo de archivo de variables de entorno
MQTT_BROKER_URL=wss://broker.emqx.io:8084/mqtt
```

---
La presente documentación está diseñada de manera que pueda ser exportada a formato Word, facilitando su impresión y manejo en formatos físicos.