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

Las URLs de las cámaras se configuran mediante **variables de entorno** para facilitar el despliegue en diferentes entornos (desarrollo, producción, red local).

**IMPORTANTE**: No usar `localhost` o `127.0.0.1` en producción, ya que solo funcionará si el Web Server corre en el mismo PC. Si el Web Server corre en otro equipo, la URL debe usar la IP o hostname del servidor que ejecuta el stream MJPEG.

#### Configuración paso a paso:

1. **Copiar el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Editar `.env` con tus URLs:**
   ```bash
   # Salesianos Urnieta - Camera Stream URL
   VITE_CAMERA_SALESIANOS_URNIETA=http://192.168.1.100:8081/video.mjpg
   
   # CIFP Repélega - Camera Stream URL
   VITE_CAMERA_REPELEGA=http://192.168.1.200:8081/video.mjpg
   
   # IoT Server URLs (opcional)
   VITE_IOT_SALESIANOS_URNIETA=http://192.168.1.100:3000
   VITE_IOT_REPELEGA=http://192.168.1.200:3000
   ```

3. **Reiniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

#### Ejemplos de URLs según el entorno:

| Entorno | Ejemplo de URL | Cuándo usar |
|---------|---------------|-------------|
| **Desarrollo local** | `http://localhost:8081/video.mjpg` | Cuando el servidor de cámara corre en tu mismo PC |
| **Red local** | `http://192.168.1.100:8081/video.mjpg` | Cuando el servidor está en tu red local |
| **Remoto/Producción** | `http://miservidor.com:8081/video.mjpg` | Cuando el servidor es accesible por Internet |

#### Notas adicionales:

- Si dejas las variables vacías, se mostrará un placeholder en lugar del stream de la cámara
- Las variables de entorno se leen en tiempo de build, por lo que necesitas reconstruir (`npm run build`) si cambias los valores en producción
- Para desarrollo, el servidor de Vite recargará automáticamente al detectar cambios en `.env`

## 📡 Referencia MQTT (Node-RED)

Para configurar los nodos **mqtt out** de Node-RED consulta la guía técnica
completa con todas las variables, unidades y ejemplos de payload:

👉 **[MQTT_REFERENCE.md](./MQTT_REFERENCE.md)**

Incluye tablas detalladas para cada pestaña de la interfaz:
- **Menú Principal** – 6 indicadores clave + mini-cabecero de estado
- **Cinemática** – TCP pose (X/Y/Z/RX/RY/RZ) y servomotores J1–J6
- **Diagnóstico** – Potencia, temperatura, errores y log del sistema
- **Hardware E/S** – E/S digital (DI/DO/CI/CO), analógica (AI/AO) y herramienta

## 📝 Licencia

MIT

