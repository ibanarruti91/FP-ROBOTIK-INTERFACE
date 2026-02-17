# FP Robotic Interface

Una SPA profesional construida con React + Vite + React Router para gestión de interfaces robóticas.

## 🚀 Características

- **Sidebar fija** de 320px con navegación vertical
- **Home interactivo** con planeta digital y nodos hexagonales orbitales
- **Páginas de telemetría y validación** con diseño profesional
- **Dark tech theme** con colores cian, púrpura y magenta
- **Animaciones suaves** y efectos hover con glow
- **Router Hash** para compatibilidad con GitHub Pages
- **Tipografías**: Orbitron (display) + Roboto (body)

## 📋 Páginas

### Home (`/`)
- Planeta digital central con anillos orbitales animados
- 3 nodos hexagonales flotantes con conexiones
- Navegación interactiva a todas las secciones

### Telemetría (`/telemetria`)
- Dashboard con métricas en tiempo real
- Tarjetas de CPU, Memoria, Red y Almacenamiento
- Indicadores visuales con barras de progreso

### Validación (`/validacion`)
- Editor de código con numeración de líneas
- Resultados de validación en tiempo real
- Sistema de alertas (success/warning/error)

## 🛠️ Tecnologías

- React 19.2
- Vite 7.3
- React Router DOM (HashRouter)
- CSS modular con variables personalizadas
- Google Fonts (Orbitron + Roboto)

## 📦 Instalación

```bash
npm install
```

## 🏃‍♂️ Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173/FP-ROBOTIK-INTERFACE/](http://localhost:5173/FP-ROBOTIK-INTERFACE/)

## 🏗️ Build

```bash
npm run build
```

## 🚀 Despliegue en GitHub Pages

El proyecto incluye un workflow de GitHub Actions que despliega automáticamente a GitHub Pages en cada push a `main`.

### Configuración manual:
1. Ve a Settings > Pages en tu repositorio
2. Selecciona "GitHub Actions" como fuente
3. El workflow `.github/workflows/deploy.yml` se encargará del despliegue

## 📁 Estructura del Proyecto

```
├── public/
│   ├── assets/
│   │   └── logo.png
│   └── .nojekyll
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Layout.css
│   │   ├── Sidebar.jsx
│   │   └── Sidebar.css
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   ├── Telemetria.jsx
│   │   ├── Telemetria.css
│   │   ├── Validacion.jsx
│   │   └── Validacion.css
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

## 🎨 Paleta de Colores

- **Fondo**: #0f172a / #0b1220
- **Panel**: rgba(12, 18, 30, 0.85)
- **Texto primario**: #ffffff
- **Texto secundario**: #94a3b8
- **Cian**: #00e5ff
- **Púrpura**: #a855f7
- **Magenta**: #ff33bb
- **Online**: #10b981

## ⚙️ Configuración

### Configuración de Cámaras

Las cámaras se configuran en el archivo `src/config/centros.js`. Cada centro puede tener su propia URL de stream MJPEG.

**IMPORTANTE**: No usar `localhost` o `127.0.0.1` en producción, ya que solo funcionará si el Web Server corre en el mismo PC.

```javascript
export const CENTROS = {
  "salesianos-urnieta": {
    nombre: "Salesianos Urnieta",
    baseUrl: "http://192.168.1.100:3000", // URL del servidor IoT
    cameraStreamUrl: "http://192.168.1.100:8081/video.mjpg", // URL del stream MJPEG
    estado: "ONLINE"
  }
};
```

**Formato de la URL de cámara:**
- Para uso local (desarrollo): `http://localhost:8081/video.mjpg`
- Para uso en red local: `http://<IP_DEL_SERVIDOR>:8081/video.mjpg`
- Para uso remoto: `http://<HOSTNAME_O_IP_PUBLICA>:8081/video.mjpg`

Donde `<IP_DEL_SERVIDOR>` es la dirección IP del equipo que ejecuta el servidor de streaming de la cámara.

## 📝 Licencia

MIT

