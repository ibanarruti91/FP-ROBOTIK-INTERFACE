/**
 * WidgetRenderer - Renderiza widgets basándose en su tipo y configuración
 */

import { KpiCard, StatusPill, StatusDynamic, DataTable, LogPanel, SafetyPanel, DigitalIO, AnalogIO, GestionPanel, SecurityLedsPanel, ToolPanel, TcpPose, JointsGrid, SystemMetricCard } from './TelemetryWidgets';
import { CameraWidget } from './CameraWidget';
import { PerformanceChart } from './PerformanceChart';
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

    case 'performance-chart':
      return (
        <PerformanceChart
          key={key}
          data={value}
        />
      );

    case 'sys-metric':
      return (
        <SystemMetricCard
          key={key}
          label={widget.label}
          value={value}
          unit={widget.unit}
          showBar={widget.showBar || false}
          icon={widget.icon || null}
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

  // Estado Robot (HARDWARE E/S): 2-column — Camera (left, full height) | Digital IO + Analog + Tool stacked (right)
  if (sectionId === 'estado-robot') {
    const cameraGroups  = groups.filter(g => g.className === 'er-camera');
    const digitalGroups = groups.filter(g => g.className === 'er-digital-io');
    const analogGroups  = groups.filter(g => g.className === 'er-analog');
    const toolGroups    = groups.filter(g => g.className === 'er-herramienta');
    const d = cameraGroups.length;
    const di = d + digitalGroups.length;
    const da = di + analogGroups.length;

    return (
      <div className="widget-renderer estado-robot-layout">
        <div className="er-left-column">
          {cameraGroups.map((group, i) => renderGroup(group, data, i))}
        </div>
        <div className="er-right-column">
          {digitalGroups.map((group, i) => renderGroup(group, data, d + i))}
          {analogGroups.map((group, i) => renderGroup(group, data, di + i))}
          {toolGroups.map((group, i) => renderGroup(group, data, da + i))}
        </div>
      </div>
    );
  }

  // Cinemática: left column (Camera + Power), right column (TCP Pose + Joints)
  if (sectionId === 'cinematica') {
    const LEFT_CLASSES  = new Set(['cin-camera', 'cin-potencia']);
    const leftGroups    = groups.filter(g => LEFT_CLASSES.has(g.className));
    const rightGroups   = groups.filter(g => !LEFT_CLASSES.has(g.className));

    return (
      <div className="widget-renderer cinematica-layout">
        <div className="cin-left-column">
          {leftGroups.map((group, i) => renderGroup(group, data, i))}
        </div>
        <div className="cin-right-column">
          {rightGroups.map((group, i) => renderGroup(group, data, i + leftGroups.length))}
        </div>
      </div>
    );
  }

  // Diagnóstico: camera (left 50%) | data panels (right 50%) — same height; log full-width below
  if (sectionId === 'diagnostico') {
    const cameraGroups = groups.filter(g => g.className === 'diag-camera');
    const dataGroups   = groups.filter(g => g.className === 'diag-data');
    const logGroups    = groups.filter(g => g.className === 'diag-log');
    const dataOffset   = cameraGroups.length;
    const logOffset    = dataOffset + dataGroups.length;

    return (
      <div className="widget-renderer diagnostico-layout">
        <div className="diag-left-column">
          {cameraGroups.map((group, i) => renderGroup(group, data, i))}
        </div>
        <div className="diag-right-column">
          {dataGroups.map((group, i) => renderGroup(group, data, dataOffset + i))}
        </div>
        <div className="diag-log-row">
          {logGroups.map((group, i) => renderGroup(group, data, logOffset + i))}
        </div>
      </div>
    );
  }

  // Principal: camera (left) | chart (70%) + sys-cards (30%) — or legacy metrics/events
  if (sectionId === 'principal') {
    const cameraGroups   = groups.filter(g => g.className === 'principal-camera');
    const chartGroups    = groups.filter(g => g.className === 'principal-chart');
    const sysCardsGroups = groups.filter(g => g.className === 'principal-sys-cards');

    // New 3-column layout (chart + sys-cards present)
    if (chartGroups.length > 0 || sysCardsGroups.length > 0) {
      const chartOffset    = cameraGroups.length;
      const sysCardsOffset = chartOffset + chartGroups.length;
      return (
        <div className="widget-renderer principal-three-col">
          <div className="principal-camera-col">
            {cameraGroups.map((group, i) => renderGroup(group, data, i))}
          </div>
          <div className="principal-chart-col">
            {chartGroups.map((group, i) => renderGroup(group, data, chartOffset + i))}
          </div>
          <div className="principal-cards-col">
            {sysCardsGroups.map((group, i) => renderGroup(group, data, sysCardsOffset + i))}
          </div>
        </div>
      );
    }

    // Legacy 2-column layout (metrics + events)
    const metricsGroups = groups.filter(g => g.className === 'principal-metrics');
    const eventsGroups  = groups.filter(g => g.className === 'principal-events');
    const metricsOffset = cameraGroups.length;
    const eventsOffset  = metricsOffset + metricsGroups.length;

    return (
      <div className="widget-renderer principal-two-col">
        <div className="principal-left-column">
          {cameraGroups.map((group, i) => renderGroup(group, data, i))}
        </div>
        <div className="principal-right-column">
          {metricsGroups.map((group, i) => renderGroup(group, data, metricsOffset + i))}
        </div>
        <div className="principal-events-row">
          {eventsGroups.map((group, i) => renderGroup(group, data, eventsOffset + i))}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-renderer">
      {groups.map((group, index) => renderGroup(group, data, index))}
    </div>
  );
}
