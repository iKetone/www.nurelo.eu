/*
 * Nurelo: 3D-Kacheln, Hintergrundprozess (Web Worker)
 * Die gesamte 3D-Arbeit läuft hier, nicht im Hauptthread: Grafikkontext, Umgebungslicht,
 * Übersetzung der Materialien und jedes Zeichnen. Der Hauptthread (tiles3d.js) schickt nur
 * Drehwinkel und bekommt fertige Bilder zurück. So kann die Seite nicht mehr einfrieren.
 *
 * Nachrichten vom Hauptthread:
 *   { type: 'init' }                                   Einrichtung starten
 *   { type: 'render', id, kind, size, rx, ry }         eine Kachel zeichnen
 * Antworten:
 *   { type: 'ready' } | { type: 'fail', msg } | { type: 'frame', id, bitmap }
 *
 * Build (three und esbuild müssen installiert sein):
 *   npx esbuild src/tiles3d.worker.src.js --bundle --minify --format=iife --outfile=tiles3d.worker.js
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial,
  PlaneGeometry, ExtrudeGeometry, Shape, CanvasTexture, SRGBColorSpace, DirectionalLight,
  PMREMGenerator, NoToneMapping
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

var COLORS = { st: 0x7a734a, am: 0xc59045, hn: 0xbf6d47 };
var CREAM = '#f2eadd';

var canvas, renderer, envMap, kinds = {};

function pause() { return new Promise(function (res) { setTimeout(res, 0); }); }

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
var FRONT_Z = DEPTH / 2 + BEVEL + 0.002;

// ---------- Symbole ----------
function drawGlyph(kind) {
  var c = new OffscreenCanvas(512, 512);
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

// ---------- Einrichtung in kleinen Schritten ----------
async function setup() {
  if (typeof OffscreenCanvas === 'undefined') throw new Error('kein OffscreenCanvas');
  canvas = new OffscreenCanvas(2, 2);
  renderer = new WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setPixelRatio(1);
  await pause();

  var pmrem = new PMREMGenerator(renderer);
  envMap = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: 128 }).texture;
  await pause();

  var tileGeo = new ExtrudeGeometry(roundedShape(0.82, 0.82, 0.27), {
    depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 10, curveSegments: 32
  });
  tileGeo.center();
  var glyphGeo = new PlaneGeometry(1, 1);
  await pause();

  var d = 0.75 / Math.tan((24 * Math.PI / 180) / 2);
  for (var kind in COLORS) {
    var scene = new Scene();
    scene.environment = envMap;
    scene.environmentIntensity = 0.66;
    var key = new DirectionalLight(0xffffff, 0.75); key.position.set(-1.5, 2.2, 3); scene.add(key);
    var mat = new MeshPhysicalMaterial({
      color: COLORS[kind], roughness: 0.34, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1
    });
    var group = new Group();
    group.add(new Mesh(tileGeo, mat));
    var glyph = new Mesh(glyphGeo, new MeshBasicMaterial({ map: drawGlyph(kind), transparent: true, toneMapped: false, depthWrite: false }));
    glyph.position.z = FRONT_Z; glyph.scale.set(0.84, 0.84, 1);
    group.add(glyph);
    scene.add(group);
    var cam = new PerspectiveCamera(24, 1, 0.1, 20);
    cam.position.set(0, 0, d);
    kinds[kind] = { scene: scene, cam: cam, group: group };
    await pause();
  }

  // Material im Hintergrund übersetzen, wo der Browser es unterstützt
  if (renderer.compileAsync) {
    try { await renderer.compileAsync(kinds.st.scene, kinds.st.cam); } catch (e) { /* wird beim ersten Zeichnen nachgeholt */ }
  }
  // Probezeichnung je Kachelart, damit Geometrie und Texturen schon auf der Grafikkarte liegen
  for (var k in kinds) { draw(k, 64, 0.16, -0.28); await pause(); }
}

function draw(kind, size, rx, ry) {
  var k = kinds[kind];
  if (!k) return null;
  if (canvas.width !== size) renderer.setSize(size, size, false);
  k.group.rotation.set(rx, ry, 0);
  renderer.render(k.scene, k.cam);
  return canvas.transferToImageBitmap();
}

self.onmessage = function (e) {
  var m = e.data;
  if (m.type === 'init') {
    setup().then(function () { self.postMessage({ type: 'ready' }); })
      .catch(function (err) { self.postMessage({ type: 'fail', msg: String(err && err.message || err) }); });
  } else if (m.type === 'render') {
    var bmp = draw(m.kind, m.size, m.rx, m.ry);
    if (bmp) self.postMessage({ type: 'frame', id: m.id, size: m.size, bitmap: bmp }, [bmp]);
  }
};
