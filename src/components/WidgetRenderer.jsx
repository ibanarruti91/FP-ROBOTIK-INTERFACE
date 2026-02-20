/**
 * WidgetRenderer - Renderiza widgets basándose en su tipo y configuración
 */

import { KpiCard, StatusPill, StatusDynamic, DataTable, LogPanel, SafetyPanel, DigitalIO, AnalogIO, GestionPanel, SecurityLedsPanel, ToolPanel, TcpPose, JointsGrid } from './TelemetryWidgets';
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
 * Renderiza un widget individual
 */
function renderWidget(widget, data, key) {
  const value = getNestedValue(data, widget.path);
  const compactClass = widget.compact ? 'compact' : '';
  
  switch (widget.type) {
    case 'kpi':
      // For KPI cards, pass raw value and let the component handle formatting
      return (
        <KpiCard
          key={key}
          label={widget.label}
          value={value}
          unit={widget.unit}
          className={`${widget.columns ? `span-${widget.columns}` : ''} ${compactClass}`}
          compact={widget.compact}
          format={widget.format}
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
    
    case 'status-dynamic':
      return (
        <StatusDynamic
          key={key}
          label={widget.label}
          value={value}
          statusType={widget.statusType}
          className={`${widget.columns ? `span-${widget.columns}` : ''} ${compactClass}`}
          compact={widget.compact}
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
    
    case 'camera': {
      const cameraClassName = [widget.columns ? `span-${widget.columns}` : 'full-width', compactClass]
        .filter(Boolean)
        .join(' ');
      return (
        <CameraWidget
          key={key}
          streamUrl={value}
          className={cameraClassName}
          dismissible={widget.dismissible || false}
          borderColor={widget.borderColor || null}
        />
      );
    }
    
    case 'safety-panel':
      return (
        <SafetyPanel
          key={key}
          value={value}
          className="full-width"
        />
      );
    
    case 'gestion-panel':
      return (
        <GestionPanel
          key={key}
          data={value}
          className="full-width"
        />
      );

    case 'security-leds':
      return (
        <SecurityLedsPanel
          key={key}
          data={value}
          className="full-width"
        />
      );

    case 'tool-panel':
      return (
        <ToolPanel
          key={key}
          data={value}
          className="full-width"
        />
      );

    case 'analog-io':
      return (
        <AnalogIO
          key={key}
          data={value}
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
  const groupClass = group.className || '';
  return (
    <div key={groupIndex} className={`widget-group ${compactClass} ${groupClass}`.trim()}>
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
export default function WidgetRenderer({ groups, data, sectionId }) {
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

  // Estado Robot: two independent flex columns so the right column
  // distributes its 4 panels evenly without being stretched by camera height.
  if (sectionId === 'estado-robot') {
    const LEFT_CLASSES  = new Set(['er-camera', 'er-digital-io']);
    const leftGroups    = groups.filter(g => LEFT_CLASSES.has(g.className));
    const rightGroups   = groups.filter(g => !LEFT_CLASSES.has(g.className));

    return (
      <div className="widget-renderer estado-robot-layout">
        <div className="er-left-column">
          {leftGroups.map((group, i) => renderGroup(group, data, i))}
        </div>
        <div className="er-right-column">
          {rightGroups.map((group, i) => renderGroup(group, data, i + leftGroups.length))}
        </div>
      </div>
    );
  }

  const layoutClasses = [
    'widget-renderer',
    sectionId === 'principal' ? 'principal-layout' : null,
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses}>
      {groups.map((group, index) => renderGroup(group, data, index))}
    </div>
  );
}
