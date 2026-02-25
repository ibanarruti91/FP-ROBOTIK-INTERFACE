/**
 * PerformanceChart – Gráfico de líneas dinámico SVG
 * Muestra el historial de velocidad (mm/s) y potencia (W) de los últimos 30 segundos.
 * Título: RENDIMIENTO DINÁMICO
 */

import { useState, useEffect, useRef } from 'react';
import './PerformanceChart.css';

const HISTORY_SECONDS = 30;
const TICK_INTERVAL_MS = 1000;

// SVG viewport constants
const W = 600;
const H = 200;
const PAD_L = 52;
const PAD_R = 52;
const PAD_T = 24;
const PAD_B = 36;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

// buildPath receives toY as a function that accepts the full data point object.
// Callers pass either toYSpeed or toYPower, each of which reads the relevant field.
function buildPath(history, toX, toYPoint) {
  if (history.length < 2) return '';
  return history
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.time).toFixed(1)},${toYPoint(p).toFixed(1)}`)
    .join(' ');
}

function niceMax(values) {
  const raw = Math.max(0, ...values);
  if (raw === 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return Math.ceil((raw * 1.15) / mag) * mag;
}

export function PerformanceChart({ data }) {
  // Ensure speed and power are finite numbers or null
  const toFiniteOrNull = (v) => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
  };
  const speed = toFiniteOrNull(data?.speed);
  const power = toFiniteOrNull(data?.power);

  const historyRef = useRef([]);
  const [renderHistory, setRenderHistory] = useState([]);

  // Append new point when data changes
  useEffect(() => {
    if (speed === null && power === null) return;
    const t = Date.now();
    const cutoff = t - HISTORY_SECONDS * 1000;
    historyRef.current = [
      ...historyRef.current.filter(p => p.time > cutoff),
      { time: t, speed: speed ?? 0, power: power ?? 0 },
    ];
    setRenderHistory([...historyRef.current]);
  }, [speed, power]);

  // Trim stale points every second to keep the X axis scrolling
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      const cutoff = t - HISTORY_SECONDS * 1000;
      const trimmed = historyRef.current.filter(p => p.time > cutoff);
      historyRef.current = trimmed;
      setRenderHistory([...trimmed]);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Use the latest data point's timestamp as the right edge of the chart.
  // This avoids calling Date.now() or reading refs during render.
  const latestTime = renderHistory.length > 0
    ? renderHistory[renderHistory.length - 1].time
    : 0;
  const now = latestTime;
  const tMin = now - HISTORY_SECONDS * 1000;

  const maxSpeed = niceMax(renderHistory.map(p => p.speed));
  const maxPower = niceMax(renderHistory.map(p => p.power));

  const toX = (t) => PAD_L + ((t - tMin) / (HISTORY_SECONDS * 1000)) * CHART_W;
  const toYSpeed = (p) => PAD_T + CHART_H - (p.speed / maxSpeed) * CHART_H;
  const toYPower = (p) => PAD_T + CHART_H - (p.power / maxPower) * CHART_H;

  const speedPath = buildPath(renderHistory, toX, toYSpeed);
  const powerPath = buildPath(renderHistory, toX, toYPower);

  // Latest values for legend
  const lastSpeed = renderHistory.length > 0 ? renderHistory[renderHistory.length - 1].speed : null;
  const lastPower = renderHistory.length > 0 ? renderHistory[renderHistory.length - 1].power : null;

  // Y-axis ticks (left → speed, right → power)
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  // X-axis time labels
  const xLabels = [
    { frac: 0,    label: '30s' },
    { frac: 1/3,  label: '20s' },
    { frac: 2/3,  label: '10s' },
    { frac: 1,    label: 'Ahora' },
  ];

  return (
    <div className="perf-chart card-glass">
      <div className="perf-chart-header">
        <span className="perf-chart-title">RENDIMIENTO DINÁMICO</span>
        <div className="perf-chart-legend">
          <span className="perf-legend-item perf-legend-speed">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#00e5ff" strokeWidth="2.5"/></svg>
            Velocidad {lastSpeed !== null ? `${lastSpeed.toFixed(0)} mm/s` : '–'}
          </span>
          <span className="perf-legend-item perf-legend-power">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#ffbf00" strokeWidth="2.5"/></svg>
            Potencia {lastPower !== null ? `${lastPower.toFixed(0)} W` : '–'}
          </span>
        </div>
      </div>

      <svg
        className="perf-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Subtle grid lines */}
        {yTicks.map(frac => {
          const y = PAD_T + CHART_H * (1 - frac);
          return (
            <line
              key={frac}
              x1={PAD_L} y1={y}
              x2={PAD_L + CHART_W} y2={y}
              stroke="rgba(148,163,184,0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Vertical grid lines at X ticks */}
        {xLabels.map(({ frac }) => {
          const x = PAD_L + frac * CHART_W;
          return (
            <line
              key={frac}
              x1={x} y1={PAD_T}
              x2={x} y2={PAD_T + CHART_H}
              stroke="rgba(148,163,184,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Left Y-axis labels (speed) */}
        {yTicks.filter(f => f > 0).map(frac => {
          const y = PAD_T + CHART_H * (1 - frac);
          const val = Math.round(maxSpeed * frac);
          return (
            <text key={frac} x={PAD_L - 6} y={y + 4} textAnchor="end" className="perf-axis-label perf-axis-speed">
              {val}
            </text>
          );
        })}

        {/* Right Y-axis labels (power) */}
        {yTicks.filter(f => f > 0).map(frac => {
          const y = PAD_T + CHART_H * (1 - frac);
          const val = Math.round(maxPower * frac);
          return (
            <text key={frac} x={PAD_L + CHART_W + 6} y={y + 4} textAnchor="start" className="perf-axis-label perf-axis-power">
              {val}
            </text>
          );
        })}

        {/* X-axis time labels */}
        {xLabels.map(({ frac, label }) => {
          const x = PAD_L + frac * CHART_W;
          return (
            <text key={frac} x={x} y={H - 6} textAnchor="middle" className="perf-axis-label perf-axis-time">
              {label}
            </text>
          );
        })}

        {/* Left Y-axis unit */}
        <text x={PAD_L - 6} y={PAD_T - 8} textAnchor="end" className="perf-axis-unit perf-axis-speed">mm/s</text>

        {/* Right Y-axis unit */}
        <text x={PAD_L + CHART_W + 6} y={PAD_T - 8} textAnchor="start" className="perf-axis-unit perf-axis-power">W</text>

        {/* Chart border */}
        <rect
          x={PAD_L} y={PAD_T}
          width={CHART_W} height={CHART_H}
          fill="none"
          stroke="rgba(148,163,184,0.18)"
          strokeWidth="1"
        />

        {/* Speed line */}
        {speedPath && (
          <path
            d={speedPath}
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="perf-line"
          />
        )}

        {/* Power line */}
        {powerPath && (
          <path
            d={powerPath}
            fill="none"
            stroke="#ffbf00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="perf-line"
          />
        )}

        {/* Latest point dots */}
        {renderHistory.length > 0 && (() => {
          const last = renderHistory[renderHistory.length - 1];
          return (
            <>
              <circle cx={toX(last.time)} cy={toYSpeed(last)} r="3.5" fill="#00e5ff" className="perf-dot" />
              <circle cx={toX(last.time)} cy={toYPower(last)} r="3.5" fill="#ffbf00" className="perf-dot" />
            </>
          );
        })()}

        {/* No-data placeholder */}
        {renderHistory.length < 2 && (
          <text x={W / 2} y={H / 2 + 4} textAnchor="middle" className="perf-no-data">
            En espera de datos MQTT…
          </text>
        )}
      </svg>
    </div>
  );
}
