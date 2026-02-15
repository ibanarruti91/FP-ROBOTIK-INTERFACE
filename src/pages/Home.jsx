/* =========================
   HOME (NEXUS CENTRAL) - FIX “APLASTADO”
   Sustituye TODO tu Home.css por este
   ========================= */

.home-space {
  position: relative;
  width: 100%;
  min-height: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;

  /* Fondo */
  background: radial-gradient(1200px 800px at 55% 45%, rgba(0,229,255,0.06), transparent 60%),
              radial-gradient(900px 650px at 35% 60%, rgba(168,85,247,0.06), transparent 55%),
              linear-gradient(180deg, #060b14, #040712);
}

/* =========================
   Partículas (simple, sin WebGL)
   ========================= */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  opacity: 0.35;
  filter: blur(0.5px);
  animation: floatParticle 10s linear infinite;
}

.particle-0 { background: rgba(0,229,255,0.8); }
.particle-1 { background: rgba(168,85,247,0.8); }
.particle-2 { background: rgba(16,185,129,0.8); }

/* Distribución pseudo-aleatoria (20 partículas, repetible) */
.particles .particle:nth-child(1)  { left: 10%; top: 22%; animation-duration: 12s; }
.particles .particle:nth-child(2)  { left: 18%; top: 58%; animation-duration: 14s; }
.particles .particle:nth-child(3)  { left: 25%; top: 35%; animation-duration: 11s; }
.particles .particle:nth-child(4)  { left: 32%; top: 70%; animation-duration: 16s; }
.particles .particle:nth-child(5)  { left: 40%; top: 18%; animation-duration: 13s; }
.particles .particle:nth-child(6)  { left: 48%; top: 55%; animation-duration: 10s; }
.particles .particle:nth-child(7)  { left: 55%; top: 28%; animation-duration: 15s; }
.particles .particle:nth-child(8)  { left: 62%; top: 78%; animation-duration: 12s; }
.particles .particle:nth-child(9)  { left: 70%; top: 42%; animation-duration: 17s; }
.particles .particle:nth-child(10) { left: 78%; top: 20%; animation-duration: 12s; }
.particles .particle:nth-child(11) { left: 84%; top: 62%; animation-duration: 14s; }
.particles .particle:nth-child(12) { left: 90%; top: 38%; animation-duration: 11s; }
.particles .particle:nth-child(13) { left: 12%; top: 85%; animation-duration: 18s; }
.particles .particle:nth-child(14) { left: 28%; top: 10%; animation-duration: 12s; }
.particles .particle:nth-child(15) { left: 44%; top: 84%; animation-duration: 16s; }
.particles .particle:nth-child(16) { left: 60%; top: 10%; animation-duration: 13s; }
.particles .particle:nth-child(17) { left: 74%; top: 86%; animation-duration: 15s; }
.particles .particle:nth-child(18) { left: 88%; top: 10%; animation-duration: 12s; }
.particles .particle:nth-child(19) { left: 6%;  top: 45%; animation-duration: 14s; }
.particles .particle:nth-child(20) { left: 95%; top: 75%; animation-duration: 16s; }

@keyframes floatParticle {
  0%   { transform: translate3d(0, 0, 0); opacity: 0.25; }
  50%  { transform: translate3d(0, -18px, 0); opacity: 0.55; }
  100% { transform: translate3d(0, 0, 0); opacity: 0.25; }
}

/* =========================
   Órbitas SVG
   ========================= */
.orbital-rings {
  position: absolute;
  width: min(86vmin, 860px);
  height: min(86vmin, 860px);
  z-index: 1;
  opacity: 0.35;
  pointer-events: none;
}

.orbit {
  fill: none;
  stroke: rgba(255,255,255,0.12);
  stroke-width: 0.35;
}

.orbit-1 { stroke: rgba(0,229,255,0.22); }
.orbit-2 { stroke: rgba(168,85,247,0.18); }
.orbit-3 { stroke: rgba(16,185,129,0.16); }

/* =========================
   Planeta central (NO deformar)
   ========================= */
.planet-wrapper {
  position: absolute;
  z-index: 2;

  /* Cuadrado asegurado para evitar “aplastado” */
  width: min(38vmin, 420px);
  aspect-ratio: 1 / 1;

  display: grid;
  place-items: center;

  /* Ajuste fino de composición (mueve todo el sistema si lo necesitas) */
  transform: translate3d(0, 0, 0);
}

.planet-glow {
  position: absolute;
  inset: -18%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(0,229,255,0.35), transparent 62%);
  filter: blur(10px);
  opacity: 0.8;
  z-index: 0;
}

.planet-central {
  position: relative;
  z-index: 1;

  /* Clave: no deformar */
  width: 100%;
  height: 100%;
  object-fit: contain;

  /* si tu PNG ya trae mucho glow, baja esto */
  filter: drop-shadow(0 0 22px rgba(0,229,255,0.35));
  animation: planetFloat 7.5s ease-in-out infinite;
}

@keyframes planetFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}

/* =========================
   Nodos orbitando (NO deformar)
   ========================= */
.space-node {
  position: absolute;
  z-index: 3;
  cursor: pointer;
  user-select: none;

  /* Área clicable estable */
  width: min(16vmin, 170px);
  aspect-ratio: 1 / 1;

  display: grid;
  place-items: center;

  /* variable por nodo */
  --node-color: #00e5ff;
}

.node-halo {
  position: absolute;
  inset: -18%;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--node-color) 55%, transparent), transparent 62%);
  filter: blur(10px);
  opacity: 0.55;
  transition: opacity 240ms ease, transform 240ms ease;
}

.node-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.node-image {
  width: 100%;
  height: 100%;

  /* Clave: no deformar */
  object-fit: contain;

  filter: drop-shadow(0 0 18px color-mix(in srgb, var(--node-color) 45%, transparent));
  transition: transform 220ms ease, filter 220ms ease;
}

.node-label {
  position: absolute;
  bottom: -30px;
  width: max-content;
  max-width: 220px;
  text-align: center;

  padding: 0.45rem 0.75rem;
  border-radius: 999px;

  background: rgba(10, 20, 35, 0.55);
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(10px);

  box-shadow: 0 0 22px rgba(0,0,0,0.35);
}

.node-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: rgba(255,255,255,0.92);
  letter-spacing: 0.2px;
}

/* Hover (suave) */
.space-node:hover .node-halo {
  opacity: 0.9;
  transform: scale(1.03);
}

.space-node:hover .node-image {
  transform: translateY(-2px) scale(1.03);
  filter: drop-shadow(0 0 26px color-mix(in srgb, var(--node-color) 60%, transparent));
}

/* =========================
   Posiciones de los nodos (ajústalas a gusto)
   ========================= */
.node-1 { transform: translate3d(-32vmin, -10vmin, 0); }
.node-2 { transform: translate3d( 34vmin, -18vmin, 0); }
.node-3 { transform: translate3d(-18vmin,  22vmin, 0); }
.node-4 { transform: translate3d( 36vmin,  18vmin, 0); }

/* Animación orbital leve (sin WebGL) */
.node-1 { animation: orbitA 9.5s ease-in-out infinite; }
.node-2 { animation: orbitB 10.5s ease-in-out infinite; }
.node-3 { animation: orbitC 11.2s ease-in-out infinite; }
.node-4 { animation: orbitD 10.0s ease-in-out infinite; }

@keyframes orbitA {
  0%,100% { transform: translate3d(-32vmin, -10vmin, 0) translateY(0); }
  50%     { transform: translate3d(-30vmin, -12vmin, 0) translateY(-6px); }
}
@keyframes orbitB {
  0%,100% { transform: translate3d(34vmin, -18vmin, 0) translateY(0); }
  50%     { transform: translate3d(32vmin, -16vmin, 0) translateY(-7px); }
}
@keyframes orbitC {
  0%,100% { transform: translate3d(-18vmin, 22vmin, 0) translateY(0); }
  50%     { transform: translate3d(-20vmin, 20vmin, 0) translateY(-6px); }
}
@keyframes orbitD {
  0%,100% { transform: translate3d(36vmin, 18vmin, 0) translateY(0); }
  50%     { transform: translate3d(34vmin, 20vmin, 0) translateY(-7px); }
}

/* =========================
   Responsive
   ========================= */
@media (max-width: 900px) {
  .orbital-rings {
    width: min(92vmin, 720px);
    height: min(92vmin, 720px);
  }

  .planet-wrapper {
    width: min(44vmin, 360px);
  }

  .space-node {
    width: min(18vmin, 150px);
  }

  .node-label {
    bottom: -28px;
    padding: 0.4rem 0.65rem;
  }

  .node-title { font-size: 0.88rem; }
}

@media (max-width: 600px) {
  /* En móvil, compacta posiciones para que no se “salgan” */
  .planet-wrapper {
    width: min(54vmin, 320px);
  }

  .space-node {
    width: min(20vmin, 130px);
  }

  .node-1 { transform: translate3d(-22vmin, -16vmin, 0); }
  .node-2 { transform: translate3d( 24vmin, -18vmin, 0); }
  .node-3 { transform: translate3d(-20vmin,  20vmin, 0); }
  .node-4 { transform: translate3d( 24vmin,  18vmin, 0); }
}
