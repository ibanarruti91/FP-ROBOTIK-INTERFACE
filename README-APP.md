# FP Robotic Interface

Centro de mando web diseñado para monitorizar, programar y validar robots industriales de forma remota y sencilla.

## Características

- 🎨 **Dark Mode por defecto** con esquema de colores cyan/magenta
- 🧭 **React Router** con navegación suave entre páginas
- 📱 **Layout responsive** con sidebar fijo de 320px
- 🎯 **Sin dependencias UI externas** - CSS puro con variables
- ⚡ **Vite** para desarrollo rápido y builds optimizados

## Estructura del Proyecto

```
FP-ROBOTIK-INTERFACE/
├── src/
│   ├── components/
│   │   └── DashboardLayout.jsx    # Layout con sidebar y área principal
│   ├── pages/
│   │   ├── Home.jsx               # Página de inicio
│   │   ├── TelemetriaPage.jsx     # Página de telemetría
│   │   ├── ConversorPage.jsx      # Página de conversor
│   │   └── ValidacionPage.jsx     # Página de validación
│   ├── App.jsx                     # Configuración de rutas
│   ├── main.jsx                    # Punto de entrada
│   └── styles.css                  # Estilos globales con variables CSS
├── index.html
├── package.json
└── vite.config.js
```

## Rutas

- `/` - Página de inicio
- `/telemetria` - Página de telemetría
- `/conversor` - Página de conversor (Blockly)
- `/validacion` - Página de validación de trayectorias

## Instalación y Desarrollo

### Requisitos previos
- Node.js (versión 16 o superior)
- npm o yarn

### Instalar dependencias

```bash
npm install
```

### Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Construir para producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`

### Vista previa de producción

```bash
npm run preview
```

## Tecnologías Utilizadas

- **React 18** - Biblioteca UI
- **React Router v6** - Enrutamiento del lado del cliente
- **Vite** - Herramienta de construcción y desarrollo
- **CSS Variables** - Para tematización consistente

## Paleta de Colores (CSS Variables)

```css
--bg-primary: #0a0e27      /* Fondo principal */
--bg-secondary: #141829    /* Fondo sidebar */
--panel-bg: #1a1f38        /* Fondo paneles */
--border-color: #2a3150    /* Color de bordes */
--text-primary: #e4e6eb    /* Texto principal */
--text-secondary: #9ca3af  /* Texto secundario */
--accent-cyan: #00ffcc     /* Acento cyan */
--accent-magenta: #ff00ff  /* Acento magenta */
--hover-bg: #252b47        /* Fondo hover */
--active-bg: #2d3451       /* Fondo activo */
```

## Próximos Pasos

Las páginas actuales son estructuras vacías listas para ser implementadas con:
- Dashboard de telemetría con métricas en tiempo real
- Interfaz de conversor Blockly para programación visual
- Sistema de validación de trayectorias con comparación teórica vs real

## Licencia

Este proyecto es parte del programa de Formación Profesional en Robótica.
