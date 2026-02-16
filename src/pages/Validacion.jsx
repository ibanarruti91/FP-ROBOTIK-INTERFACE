import { useNavigate } from 'react-router-dom';
import './Validacion.css';

function Validacion() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Control de validación código</h1>
        <div className="status-badge online">
          <span className="status-dot"></span>
          Sistema Online
        </div>
      </div>
      
      <div className="page-content">
        <div className="info-card">
          <div className="card-icon">✓</div>
          <h2>Sistema de Validación</h2>
          <p>
            Módulo de control y validación de código robótico.
            Verificación automática de sintaxis y análisis de seguridad.
          </p>
        </div>

        <div className="validation-panel">
          <div className="code-section">
            <h3>Editor de Código</h3>
            <div className="code-editor">
              <div className="code-line">
                <span className="line-number">1</span>
                <span className="code-text">function initRobot() {'{'}</span>
              </div>
              <div className="code-line">
                <span className="line-number">2</span>
                <span className="code-text">  robot.connect();</span>
              </div>
              <div className="code-line">
                <span className="line-number">3</span>
                <span className="code-text">  robot.calibrate();</span>
              </div>
              <div className="code-line">
                <span className="line-number">4</span>
                <span className="code-text">  return robot.status;</span>
              </div>
              <div className="code-line">
                <span className="line-number">5</span>
                <span className="code-text">{'}'}</span>
              </div>
            </div>
          </div>

          <div className="validation-results">
            <h3>Resultados de Validación</h3>
            <div className="result-item success">
              <span className="result-icon">✓</span>
              <span>Sintaxis correcta</span>
            </div>
            <div className="result-item success">
              <span className="result-icon">✓</span>
              <span>Sin errores de seguridad</span>
            </div>
            <div className="result-item success">
              <span className="result-icon">✓</span>
              <span>Optimización aprobada</span>
            </div>
            <div className="result-item warning">
              <span className="result-icon">⚠</span>
              <span>Variable no utilizada en línea 4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Validacion;
