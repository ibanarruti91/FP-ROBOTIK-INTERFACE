/**
 * WidgetRenderer - Renderiza widgets basándose en su tipo y configuración
 */

import { KpiCard, StatusPill, DataTable, LogPanel, SafetyPanel, DigitalIO, TcpPose, JointsGrid } from './TelemetryWidgets';
import { CameraWidget } from './CameraWidget';
import './WidgetRenderer.css';

/**
 * Obtiene un valor anidado de un objeto usando una ruta de punto
 * @param {Object} obj - Objeto de datos
 * @param {string} path - Ruta separada por puntos (ej: "tcp.position.x")
 * @returns {*} Valor encontrado o undefined
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Formatea un valor según el formato especificado
 */
function formatValue(value, format) {
  if (value === null || value === undefined) return '--';
  
  if (format === 'text') {
    return value || '--';
  }
  
  if (typeof value === 'number') {
    const decimals = parseInt(format, 10);
    const validDecimals = isNaN(decimals) ? 0 : Math.max(0, decimals);
    return value.toFixed(validDecimals);
  }
  
  return String(value);
}

/**
 * Renderiza un widget individual
 */
function renderWidget(widget, data, key) {
  const value = getNestedValue(data, widget.path);
  const compactClass = widget.compact ? 'compact' : '';
  
  switch (widget.type) {
    case 'kpi':
      return (
        <KpiCard
          key={key}
          label={widget.label}
          value={formatValue(value, widget.format)}
          unit={widget.unit}
          className={`${widget.columns ? `span-${widget.columns}` : ''} ${compactClass}`}
          compact={widget.compact}
        />
      );
    
    case 'status':
      return (
        <StatusPill
          key={key}
          label={widget.label}
          value={value}
          statusType={widget.statusType}
          className={`${widget.columns ? `span-${widget.columns}` : ''} ${compactClass}`}
        />
      );
    
    case 'table':
      return (
        <DataTable
          key={key}
          label={widget.label}
          data={value}
          unit={widget.unit}
          format={widget.format}
        />
      );
    
    case 'log':
      return (
        <LogPanel
          key={key}
          messages={value}
          className={`full-width ${compactClass}`}
          compact={widget.compact}
        />
      );
    
    case 'camera':
      return (
        <CameraWidget
          key={key}
          streamUrl={value}
          className={widget.columns ? `span-${widget.columns}` : 'full-width'}
        />
      );
    
    case 'safety-panel':
      return (
        <SafetyPanel
          key={key}
          value={value}
          className="full-width"
        />
      );
    
    case 'digital-io':
      return (
        <DigitalIO
          key={key}
          data={value}
          ioCount={widget.ioCount || 32}
          className="full-width"
        />
      );
    
    case 'tcp-pose':
      return (
        <TcpPose
          key={key}
          data={value}
          className="full-width"
        />
      );
    
    case 'joints-grid':
      return (
        <JointsGrid
          key={key}
          data={value}
          className="full-width"
        />
      );
    
    default:
      return (
        <div key={key} className="widget-unknown">
          Widget type "{widget.type}" not implemented
        </div>
      );
  }
}

/**
 * Renderiza un grupo de widgets
 */
function renderGroup(group, data, groupIndex) {
  const compactClass = group.compact ? 'compact' : '';
  return (
    <div key={groupIndex} className={`widget-group ${compactClass}`}>
      {group.title && <h3 className="group-title">{group.title}</h3>}
      <div className={`widget-grid ${compactClass}`}>
        {group.widgets.map((widget, widgetIndex) => 
          renderWidget(widget, data, `${groupIndex}-${widgetIndex}`)
        )}
      </div>
    </div>
  );
}

/**
 * Componente principal WidgetRenderer
 */
export default function WidgetRenderer({ groups, data }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="renderer-empty">
        No hay widgets configurados para esta vista
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="renderer-loading">
        Cargando datos de telemetría...
      </div>
    );
  }
  
  return (
    <div className="widget-renderer">
      {groups.map((group, index) => renderGroup(group, data, index))}
    </div>
  );
}
