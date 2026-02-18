import './Informacion.css';

function Informacion() {
  return (
    <div className="informacion-page">
      <div className="universal-header">
        <h1 className="universal-title">INFORMACIÓN DEL PROYECTO</h1>
        <p className="universal-description">Detalles sobre FP Robotic Interface y la colaboración educativa</p>
      </div>
      
      <div className="informacion-content">
        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">🎓</span>
            <h2>FP-Robotik Interface: Ecosistema Abierto de Robótica</h2>
          </div>
          <div className="info-card-body">
            <h3>Propósito y Visión</h3>
            <p>
              Esta plataforma es una interfaz HMI (Human-Machine Interface) de código abierto diseñada para la red de Formación Profesional de Euskadi. 
              Permite centralizar la telemetría, el control remoto y la programación colaborativa, conectando diferentes celdas robóticas 
              bajo un estándar común de monitorización.
            </p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">🌐</span>
            <h2>Arquitectura de Red (Flujo de Datos)</h2>
          </div>
          <div className="info-card-body">
            <ul className="architecture-list">
              <li>
                <strong>Captura en Planta:</strong> Los datos se extraen de controladores industriales (como la serie e-Series de Universal Robots).
              </li>
              <li>
                <strong>Procesamiento Edge:</strong> Dispositivos Siemens IOT2040 con Node-RED actúan como nodos de comunicación en cada centro.
              </li>
              <li>
                <strong>Protocolo:</strong> La información se transmite vía MQTT (broker emqx.io) en formato JSON, garantizando baja latencia.
              </li>
              <li>
                <strong>Frontend:</strong> Aplicación SPA en React con un sistema de Watchdog que valida la conectividad real de cada nodo de la red.
              </li>
            </ul>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">🤝</span>
            <h2>Innovación y Colaboración</h2>
          </div>
          <div className="info-card-body">
            <p>
              Proyecto impulsado por <strong>Tknika</strong> para fomentar la digitalización y la Industria 4.0. 
              Desarrollado mediante la colaboración estratégica entre los departamentos de robótica de 
              <strong> CIFP Repélega LHII</strong> y <strong>Salesianos Urnieta</strong>, con una arquitectura preparada 
              para la futura integración de nuevos centros y tecnologías.
            </p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">⚙️</span>
            <h2>Características Técnicas</h2>
          </div>
          <div className="info-card-body">
            <ul className="features-list">
              <li>
                <span className="feature-label">Frontend:</span>
                <span>React 19.2 + Vite 7.3</span>
              </li>
              <li>
                <span className="feature-label">Navegación:</span>
                <span>React Router DOM (HashRouter)</span>
              </li>
              <li>
                <span className="feature-label">Diseño:</span>
                <span>Dark tech theme con CSS modular</span>
              </li>
              <li>
                <span className="feature-label">Tipografías:</span>
                <span>Orbitron (display) + Roboto (body)</span>
              </li>
              <li>
                <span className="feature-label">Despliegue:</span>
                <span>GitHub Pages con CI/CD automático</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">📦</span>
            <h2>Módulos Disponibles</h2>
          </div>
          <div className="info-card-body">
            <ul className="modules-list">
              <li>
                <strong>Inicio:</strong> Panel principal con acceso rápido a todas las funcionalidades
              </li>
              <li>
                <strong>Telemetría Multicentros:</strong> Dashboard con métricas en tiempo real de múltiples centros
              </li>
              <li>
                <strong>Interfaz Conversor Blocky:</strong> Herramienta para convertir programas visuales a código
              </li>
              <li>
                <strong>Control de Validación:</strong> Sistema de validación y verificación de código
              </li>
            </ul>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">📄</span>
            <h2>Licencia y Código</h2>
          </div>
          <div className="info-card-body">
            <p>
              Este proyecto se distribuye bajo la <strong>Licencia MIT</strong>, permitiendo su uso, 
              modificación y distribución con fines educativos y comerciales.
            </p>
            <p className="version-info">
              <strong>Versión:</strong> 0.0.0 (En desarrollo)
            </p>
          </div>
        </div>

        <div className="logos-container">
          <img src={`${import.meta.env.BASE_URL}assets/logo gobierno vasco.png`} alt="Gobierno Vasco" className="partner-logo" />
          <img src={`${import.meta.env.BASE_URL}assets/tknika_logo.jfif`} alt="Tknika" className="partner-logo" />
          <img src={`${import.meta.env.BASE_URL}assets/logo repelaga.png`} alt="CIFP Repélega" className="partner-logo" />
          <img src={`${import.meta.env.BASE_URL}assets/logo salesianos.jpg`} alt="Salesianos Urnieta" className="partner-logo" />
        </div>
      </div>
    </div>
  );
}

export default Informacion;
