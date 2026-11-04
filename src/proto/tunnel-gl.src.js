/*
 * Prototyp C: WebGL-Tunnel (Vorschau)
 * Leuchtende Linienringe in den Markenfarben, Nebel, Staub und schwebende Tafeln (auch die Figur).
 * Die Kamera fährt beim Scrollen durch den Tunnel, mit etwas Nachlauf und leichtem Schwanken.
 *
 * Build (three muss installiert sein):
 *   npx esbuild src/proto/tunnel-gl.src.js --bundle --minify --format=iife --outfile=vorschau/tunnel/webgl/tunnel.js
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Fog, Color, Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture,
  TextureLoader, SRGBColorSpace, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, DoubleSide
} from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

var sec = document.getElementById('gl');
var holder = document.getElementById('gl-canvas');
if (sec && holder) start();

function start() {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var BG = 0x1a130e;
  var A = 3.4, B = 2.1, R = 0.95;           // Halbbreite, Halbhöhe, Eckenradius des Tunnels
  var GAP = 1.35, RINGS = 46, LEN = GAP * (RINGS - 1);
  var PALETTE = [0xc59045, 0xbf6d47, 0xa3a86b, 0xf2eadd];
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var renderer;
  try { renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { sec.classList.add('failed'); return; }
  renderer.setClearColor(BG, 1);
  holder.appendChild(renderer.domElement);

  var scene = new Scene();
  scene.fog = new Fog(BG, 5, 30);
  var camera = new PerspectiveCamera(60, 1, 0.1, 90);

  // ---------- Ringe und Kanten ----------
  function outline() {
    var pts = [], seg = 7, corners = [[A - R, B - R, 0], [-(A - R), B - R, 0.5], [-(A - R), -(B - R), 1], [A - R, -(B - R), 1.5]];
    corners.forEach(function (c) {
      for (var i = 0; i <= seg; i++) {
        var a = (c[2] + i / seg * 0.5) * Math.PI;
        pts.push([c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]);
      }
    });
    return pts;
  }
  var pts = outline(), pos = [], col = [], tmp = new Color();
  for (var k = 0; k < RINGS; k++) {
    tmp.setHex(PALETTE[k % PALETTE.length]);
    var z = -k * GAP;
    for (var j = 0; j < pts.length; j++) {
      var p = pts[j], q = pts[(j + 1) % pts.length];
      pos.push(p[0], p[1], z, q[0], q[1], z);
      col.push(tmp.r, tmp.g, tmp.b, tmp.r, tmp.g, tmp.b);
    }
  }
  [[A - R * 0.3, B - R * 0.3], [-(A - R * 0.3), B - R * 0.3], [-(A - R * 0.3), -(B - R * 0.3)], [A - R * 0.3, -(B - R * 0.3)]].forEach(function (c, n) {
    tmp.setHex(PALETTE[n % PALETTE.length]);
    pos.push(c[0], c[1], 0, c[0], c[1], -LEN);
    col.push(tmp.r * 0.55, tmp.g * 0.55, tmp.b * 0.55, tmp.r * 0.55, tmp.g * 0.55, tmp.b * 0.55);
  });
  var lg = new LineSegmentsGeometry();
  lg.setPositions(pos); lg.setColors(col);
  var lm = new LineMaterial({ linewidth: 2.2, vertexColors: true, transparent: true, opacity: 0.95, fog: true });
  scene.add(new LineSegments2(lg, lm));

  // ---------- Staub ----------
  var dp = [], N = 900;
  for (var i = 0; i < N; i++) dp.push((Math.random() * 2 - 1) * (A - 0.3), (Math.random() * 2 - 1) * (B - 0.2), 2 - Math.random() * (LEN + 6));
  var dg = new BufferGeometry(); dg.setAttribute('position', new Float32BufferAttribute(dp, 3));
  var dust = new Points(dg, new PointsMaterial({ color: 0xf2eadd, size: 0.035, transparent: true, opacity: 0.7, sizeAttenuation: true, fog: true, depthWrite: false }));
  scene.add(dust);

  // ---------- Tafeln ----------
  var panels = [];
  function wrapText(ctx, text, x, y, maxW, lh) {
    var words = text.split(' '), line = '', yy = y;
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t;
    });
    if (line) ctx.fillText(line, x, yy);
  }
  function textTexture(o) {
    var c = document.createElement('canvas'); c.width = 1200; c.height = 720;
    var g = c.getContext('2d');
    g.fillStyle = o.bg; g.beginPath(); g.roundRect(8, 8, 1184, 704, 56); g.fill();
    g.lineWidth = 8; g.strokeStyle = o.line; g.stroke();
    g.fillStyle = o.accent; g.font = '800 44px Karla, system-ui, sans-serif'; g.textBaseline = 'alphabetic';
    g.letterSpacing = '8px'; g.fillText(o.kicker.toUpperCase(), 80, 140); g.letterSpacing = '0px';
    g.fillStyle = o.ink; g.font = '800 128px Karla, system-ui, sans-serif'; wrapText(g, o.title, 80, 300, 1040, 128);
    g.fillStyle = o.sub; g.font = '500 48px Karla, system-ui, sans-serif'; wrapText(g, o.text, 80, 560, 1040, 62);
    var t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function addPanel(tex, w, h, x, y, z, yaw) {
    var m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: tex, transparent: true, fog: true, side: DoubleSide, depthWrite: true, alphaTest: 0.08 }));
    m.position.set(x, y, z); m.rotation.y = yaw; m.userData = { x: x, y: y, yaw: yaw, ph: Math.random() * 6.28 };
    scene.add(m); panels.push(m); return m;
  }
  var loader = new TextureLoader();
  function addImage(url, h, x, y, z, yaw) {
    loader.load(url, function (t) {
      t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
      var asp = t.image.width / t.image.height;
      addPanel(t, h * asp, h, x, y, z, yaw);
    });
  }

  var PLAN = [
    { z: -8, x: -1.75, y: 0.15, yaw: 0.32, kind: 'text', kicker: 'Stationär', title: 'Pflege im Heim, alles im Blick', text: 'Planung, Dokumentation und Abrechnung in einem Ablauf.', bg: '#c59045', line: '#f2eadd', ink: '#241b14', accent: '#241b14', sub: '#3a2a1c' },
    { z: -13.5, x: 1.85, y: -0.15, yaw: -0.28, kind: 'img', url: '/maskottchen/p1.webp', h: 3.0 },
    { z: -19, x: 1.75, y: 0.1, yaw: -0.32, kind: 'text', kicker: 'Ambulant', title: 'Touren, die sich selbst ordnen', text: 'Einsatzplanung und mobile Erfassung für unterwegs.', bg: '#bf6d47', line: '#f2eadd', ink: '#241b14', accent: '#241b14', sub: '#3a2418' },
    { z: -24.5, x: -1.8, y: -0.45, yaw: 0.28, kind: 'img', url: '/maskottchen/p2.webp', h: 2.0 },
    { z: -30, x: -1.75, y: 0.1, yaw: 0.32, kind: 'text', kicker: 'Hausnotruf', title: 'Da, wenn es darauf ankommt', text: 'Alarmkette, Geräte und Einsätze zuverlässig verbunden.', bg: '#5a5533', line: '#a3a86b', ink: '#f2eadd', accent: '#c59045', sub: '#dcd3c2' },
    { z: -35.5, x: 1.85, y: -0.15, yaw: -0.28, kind: 'img', url: '/maskottchen/p3.webp', h: 3.0 },
    { z: -41, x: 1.75, y: 0.1, yaw: -0.32, kind: 'text', kicker: 'Plattform', title: 'Module nach Bedarf', text: 'Eine Basis, Schnittstellen zu den Systemen, die ihr schon nutzt.', bg: '#f2eadd', line: '#c59045', ink: '#241b14', accent: '#9e4e2e', sub: '#5a4a3c' }
  ];
  var ENDZ = -49.5, CAM_END = -43.5;

  function buildPanels() {
    PLAN.forEach(function (p) {
      if (p.kind === 'text') addPanel(textTexture(p), 3.0, 1.8, p.x, p.y, p.z, p.yaw);
      else addImage(p.url, p.h, p.x, p.y, p.z, p.yaw);
    });
    loader.load('/logo-240.webp', function (t) { t.colorSpace = SRGBColorSpace; addPanel(t, 1.7, 1.7, 0, 0.5, ENDZ, 0); });
  }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('800 64px Karla'), document.fonts.load('500 32px Karla')]).then(buildPanels, buildPanels);
  } else buildPanels();

  // ---------- Größe ----------
  var vw = 0, vh = 0, narrow = false;
  function resize() {
    vw = holder.clientWidth || window.innerWidth; vh = holder.clientHeight || window.innerHeight;
    narrow = vw / vh < 0.8;
    var dpr = Math.min(window.devicePixelRatio || 1, vw < 860 ? 1.5 : 2);
    renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, false);
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    lm.resolution.set(vw, vh);
    camera.aspect = vw / vh;
    camera.fov = clamp(60 + (vh / vw - 1) * 26, 60, 96);
    camera.updateProjectionMatrix();
    panels.forEach(function (m) { m.position.x = m.userData.x * (narrow ? 0.62 : 1); m.scale.setScalar(narrow ? 0.88 : 1); });
  }
  window.addEventListener('resize', resize);

  // ---------- Fortschritt, Kamera ----------
  var cur = 0, target = 0, px = 0, py = 0, tpx = 0, tpy = 0, visible = true, raf = 0, t0 = performance.now(), ctaOn = false;
  var cta = document.getElementById('gl-cta'), hint = sec.querySelector('.gl-hint');
  function progress() {
    var r = sec.getBoundingClientRect(), span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) { tpx = e.clientX / window.innerWidth - 0.5; tpy = e.clientY / window.innerHeight - 0.5; }, { passive: true });
  }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    var t = (now - t0) / 1000;
    var still = reduce.matches;
    target = still ? 0.12 : progress();
    cur += (target - cur) * (still ? 1 : 0.075);
    var vel = target - cur;
    var z = cur * CAM_END;
    px += (tpx - px) * 0.05; py += (tpy - py) * 0.05;
    var sway = still ? 0 : 1;
    camera.position.set(Math.sin(t * 0.45) * 0.16 * sway + px * 0.5, Math.cos(t * 0.37) * 0.1 * sway - py * 0.3, z);
    camera.rotation.set(py * 0.06, -px * 0.1, clamp(vel * 3.2, -0.12, 0.12) + Math.sin(t * 0.3) * 0.01 * sway);
    panels.forEach(function (m) {
      var u = m.userData; m.position.y = u.y + Math.sin(t * 0.8 + u.ph) * 0.05 * sway; m.rotation.y = u.yaw + Math.sin(t * 0.5 + u.ph) * 0.04 * sway;
    });
    renderer.render(scene, camera);
    var on = cur > 0.9;
    if (on !== ctaOn) { ctaOn = on; if (cta) cta.classList.toggle('on', on); }
    if (hint) hint.style.setProperty('--hint', clamp(1 - cur * 14, 0, 1).toFixed(3));
    if (!still || !raf) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }, { rootMargin: '10% 0px' }).observe(sec);
  document.addEventListener('visibilitychange', kick);
  function pin() { sec.classList.toggle('pinned', !reduce.matches); resize(); kick(); }
  (reduce.addEventListener ? reduce.addEventListener('change', pin) : reduce.addListener(pin));
  pin();
  document.documentElement.classList.add('js');
  sec.classList.add('ready');
}
