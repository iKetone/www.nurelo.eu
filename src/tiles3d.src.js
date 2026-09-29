/*
 * Nurelo: 3D-Kacheln
 * Baut aus den CSS-Kacheln (.tile.big, .tile.chap, .tile.mini) echte 3D-Objekte.
 * Ein gemeinsamer WebGL-Renderer zeichnet jede Kachel und kopiert das Bild in deren Canvas.
 * Ohne WebGL bleibt die CSS-Kachel sichtbar.
 *
 * Build (three und esbuild müssen installiert sein):
 *   npx esbuild src/tiles3d.src.js --bundle --minify --format=iife --outfile=tiles3d.js
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial,
  PlaneGeometry, ExtrudeGeometry, Shape, CanvasTexture, SRGBColorSpace, DirectionalLight,
  PMREMGenerator, NoToneMapping
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function boot() {

var COLORS = { st: 0x7a734a, am: 0xc59045, hn: 0xbf6d47 };
var CREAM = '#f2eadd';
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// ---------- Renderer ----------
var renderer;
try {
  renderer = new WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true });
} catch (e) { renderer = null; }
if (!renderer) throw new Error('kein WebGL');

renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = NoToneMapping;
var dpr = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(1);

var pmrem = new PMREMGenerator(renderer);
var envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------- Geometrie: abgerundete Kachel ----------
function roundedShape(w, h, r) {
  var s = new Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
var DEPTH = 0.16, BEVEL = 0.09;
var tileGeo = new ExtrudeGeometry(roundedShape(0.82, 0.82, 0.27), {
  depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 10, curveSegments: 32
});
tileGeo.center();
var FRONT_Z = DEPTH / 2 + BEVEL + 0.002;
var glyphGeo = new PlaneGeometry(1, 1);

// ---------- Symbole ----------
function drawGlyph(kind) {
  var c = document.createElement('canvas'); c.width = c.height = 512;
  var g = c.getContext('2d');
  g.scale(512 / 24, 512 / 24);
  // Symbol auf 46 % der Fläche
  g.translate(12, 12); g.scale(0.5, 0.5); g.translate(-12, -12);
  function rr(x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function paint(dy, fill, alpha) {
    g.save(); g.translate(0, dy); g.globalAlpha = alpha; g.fillStyle = fill; g.strokeStyle = fill; g.lineCap = 'round';
    if (kind === 'st') {
      [[3, 3, 1], [13, 3, .55], [3, 13, .55], [13, 13, 1]].forEach(function (q) { g.globalAlpha = alpha * q[2]; rr(q[0], q[1], 8, 8, 2.6); g.fill(); });
    } else if (kind === 'am') {
      g.lineWidth = 2.4; g.beginPath(); g.moveTo(6, 19); g.lineTo(15, 19); g.arc(15, 15.5, 3.5, Math.PI / 2, -Math.PI / 2, true);
      g.lineTo(9, 12); g.arc(9, 8.5, 3.5, Math.PI / 2, -Math.PI / 2, false); g.lineTo(18, 5); g.stroke();
      g.beginPath(); g.arc(5, 19, 2.6, 0, 7); g.fill(); g.beginPath(); g.arc(19, 5, 2.6, 0, 7); g.fill();
    } else {
      g.beginPath(); g.arc(12, 12, 2.8, 0, 7); g.fill(); g.lineWidth = 2.2;
      [[5.7, 0.9], [10.5, 0.75]].forEach(function (a) {
        var r = a[0];
        g.beginPath(); g.arc(12, 12, r, Math.PI - 0.95, Math.PI + 0.95); g.stroke();
        g.beginPath(); g.arc(12, 12, r, -0.95, 0.95); g.stroke();
      });
    }
    g.restore();
  }
  paint(0.35, '#3a2414', 0.28);
  paint(0, CREAM, 1);
  var t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return t;
}
var glyphCache = {};

// ---------- Kacheln ----------
var tiles = [];
var pointer = { x: 0, y: 0 };
var raf = 0;

function makeTile(el) {
  var kind = ['st', 'am', 'hn'].filter(function (k) { return el.classList.contains(k); })[0];
  if (!kind) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'tile-gl'; canvas.setAttribute('aria-hidden', 'true');
  var host = el.querySelector('.tilt') || el;
  host.appendChild(canvas);

  var scene = new Scene();
  scene.environment = envMap;
  scene.environmentIntensity = 0.66;
  var key = new DirectionalLight(0xffffff, 0.75); key.position.set(-1.5, 2.2, 3); scene.add(key);

  var mat = new MeshPhysicalMaterial({
    color: COLORS[kind], roughness: 0.34, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1
  });
  var group = new Group();
  group.add(new Mesh(tileGeo, mat));
  glyphCache[kind] = glyphCache[kind] || drawGlyph(kind);
  var glyph = new Mesh(glyphGeo, new MeshBasicMaterial({ map: glyphCache[kind], transparent: true, toneMapped: false, depthWrite: false }));
  glyph.position.z = FRONT_Z; glyph.scale.set(0.84, 0.84, 1);
  group.add(glyph);
  scene.add(group);

  var cam = new PerspectiveCamera(24, 1, 0.1, 20);
  var d = 0.75 / Math.tan((24 * Math.PI / 180) / 2);
  cam.position.set(0, 0, d);

  var t = {
    el: el, canvas: canvas, ctx: canvas.getContext('2d'), scene: scene, cam: cam, group: group,
    depth: parseFloat(el.dataset.depth || 1), scroll: el.hasAttribute('data-scroll'),
    visible: false, rx: 0, ry: 0, w: 0, h: 0
  };
  el.classList.add('tile3d');
  tiles.push(t);
  sizeTile(t);
  return t;
}

function sizeTile(t) {
  var w = Math.max(2, Math.round(t.el.offsetWidth * 1.5 * dpr));
  if (w === t.w) return;
  t.w = t.h = w; t.canvas.width = t.canvas.height = w;
}

var lastW = 0;
function renderTile(t) {
  if (lastW !== t.w) { renderer.setSize(t.w, t.h, false); lastW = t.w; }
  renderer.render(t.scene, t.cam);
  t.ctx.clearRect(0, 0, t.w, t.h);
  t.ctx.drawImage(renderer.domElement, 0, 0, t.w, t.h);
}

function frame() {
  raf = 0;
  var moving = false;
  var still = reduce.matches;
  tiles.forEach(function (t) {
    if (!t.visible) return;
    var px = still ? 0 : pointer.x, py = still ? 0 : pointer.y;
    var ty = -0.28 + px * 0.6 * t.depth;
    var tx = 0.16 + py * 0.5 * t.depth;
    if (t.scroll && !still) {
      var r = t.el.getBoundingClientRect();
      var s = clamp(((r.top + r.height / 2) / window.innerHeight - 0.5) * 2, -1.5, 1.5);
      ty += s * 0.55 * t.depth; tx += -s * 0.22;
    }
    t.ry = lerp(t.ry, ty, 0.14); t.rx = lerp(t.rx, tx, 0.14);
    if (Math.abs(t.ry - ty) > 0.002 || Math.abs(t.rx - tx) > 0.002) moving = true;
    t.group.rotation.set(t.rx, t.ry, 0);
    renderTile(t);
  });
  if (moving) request();
}
function request() { if (!raf) raf = requestAnimationFrame(frame); }

// ---------- Start ----------
var els = [].slice.call(document.querySelectorAll('.tile.big, .tile.chap, .tile.mini'));
var made = els.map(makeTile).filter(Boolean);
if (!made.length) throw new Error('keine Kacheln');

if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var t = tiles.filter(function (x) { return x.el === en.target; })[0];
      if (t) { t.visible = en.isIntersecting; }
    });
    request();
  }, { rootMargin: '120px' });
  tiles.forEach(function (t) { io.observe(t.el); });
} else {
  tiles.forEach(function (t) { t.visible = true; });
}

if ('ResizeObserver' in window) {
  var ro = new ResizeObserver(function () { tiles.forEach(sizeTile); request(); });
  tiles.forEach(function (t) { ro.observe(t.el); });
}
window.addEventListener('pointermove', function (e) {
  if (e.pointerType === 'touch') return;
  pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  request();
}, { passive: true });
window.addEventListener('scroll', request, { passive: true });
window.addEventListener('resize', function () { dpr = Math.min(window.devicePixelRatio || 1, 2); tiles.forEach(sizeTile); request(); });
request();
}

try {
  boot();
} catch (e) {
  if (window.console) console.info('Nurelo: 3D-Kacheln nicht aktiv (' + e.message + ')');
}
