import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#0f172a',
          color: '#ff3366',
          fontFamily: "'Orbitron', sans-serif",
          padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <div style={{ fontSize: '3em', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ marginBottom: '1rem' }}>Error de Aplicación</h1>
            <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>
              La aplicación encontró un error. Por favor, recarga la página o contacta con soporte.
            </p>
            <details style={{
              background: 'rgba(255, 51, 102, 0.1)',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '0.9em'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                Detalles técnicos
              </summary>
              <pre style={{
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              aria-label="Recargar la página para intentar nuevamente"
              style={{
                marginTop: '2rem',
                padding: '1rem 2rem',
                background: '#00e5ff',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: '600'
              }}
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
