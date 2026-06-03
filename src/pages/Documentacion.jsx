import './Documentacion.css';

function Documentacion() {
  return (
    <div className="documentacion-page">
      <div className="universal-header">
        <h1 className="universal-title">DOCUMENTACIÓN DEL PROYECTO</h1>
        <p className="universal-description">Guías, manuales y recursos para poner en marcha FP Robotik Interface</p>
      </div>

      <div className="documentacion-content">
        <div className="doc-card">
          <div className="doc-card-header">
            <span className="doc-icon">📚</span>
            <h2>Recursos disponibles</h2>
          </div>
          <div className="doc-card-body">
            <p>
              En este apartado se centralizan las guías, manuales, plantillas, vídeos, ejemplos y recursos
              necesarios para poner en marcha y utilizar FP Robotik Interface en otros centros.
            </p>
            <p>Desde el Site de documentación se puede acceder a:</p>
            <ul className="doc-list">
              <li>primeros pasos del proyecto;</li>
              <li>manuales de IOT2040, Node-RED y web centralizada;</li>
              <li>plantilla oficial de Node-RED;</li>
              <li>documentación del conversor;</li>
              <li>scripts URScript y ejemplos prácticos;</li>
              <li>vídeos y materiales didácticos;</li>
              <li>aportaciones de otros centros.</li>
            </ul>
          </div>
        </div>

        <div className="doc-cta">
          <a
            href="https://sites.google.com/salesianosurnieta.com/sitefprobotikinterfacerev2/site-fp-robotik-interface"
            target="_blank"
            rel="noopener noreferrer"
            className="doc-btn-primary"
          >
            <span className="doc-btn-icon">🌐</span>
            Abrir Site de documentación
          </a>
        </div>
      </div>
    </div>
  );
}

export default Documentacion;
