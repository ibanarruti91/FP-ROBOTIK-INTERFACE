import './Informacion.css';

function Informacion() {
  return (
    <div className="informacion-page">
      <header className="informacion-header">
        <h1>INFORMACIÓN DEL PROYECTO</h1>
        <p className="informacion-description">
          Detalles sobre FP Robotic Interface y la colaboración educativa
        </p>
      </header>
      
      <div className="informacion-content">
        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">🎓</span>
            <h2>Sobre el Proyecto</h2>
          </div>
          <div className="info-card-body">
            <p>
              <strong>FP Robotic Interface</strong> es una plataforma profesional de gestión de interfaces robóticas 
              desarrollada como parte de un proyecto de colaboración educativa entre instituciones líderes en formación técnica.
            </p>
            <p>
              Esta Single Page Application (SPA) proporciona herramientas avanzadas para telemetría multicentros, 
              validación de código y conversión de programas Blocky, diseñada específicamente para entornos educativos 
              y profesionales en el campo de la robótica.
            </p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <span className="info-icon">🤝</span>
            <h2>Colaboración</h2>
          </div>
          <div className="info-card-body">
            <p>
              Este proyecto es el resultado de la colaboración entre:
            </p>
            <ul className="collaboration-list">
              <li>
                <strong>Salesianos Urnieta</strong> - Centro de formación profesional con amplia experiencia en tecnología educativa
              </li>
              <li>
                <strong>CIFP Repélega</strong> - Centro Integrado de Formación Profesional especializado en automatización y robótica
              </li>
            </ul>
            <p>
              Juntos, trabajamos para proporcionar a los estudiantes herramientas modernas y profesionales 
              que faciliten su aprendizaje en programación y control de sistemas robóticos.
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
      </div>
    </div>
  );
}

export default Informacion;
