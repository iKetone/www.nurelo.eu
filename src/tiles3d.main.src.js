/*
 * Nurelo: 3D-Kacheln, Hauptseite
 * Legt über die CSS-Kacheln (.tile.big, .tile.chap, .tile.mini) je ein Bild-Canvas und lässt
 * ein Hintergrundprogramm (tiles3d.worker.js) die 3D-Kacheln zeichnen. Hier laufen nur
 * Drehwinkel, Sichtbarkeit und das Anzeigen fertiger Bilder, nichts davon blockiert die Seite.
 * Ohne Worker, OffscreenCanvas oder WebGL bleibt die CSS-Kachel sichtbar.
 *
 * Build:  npx esbuild src/tiles3d.main.src.js --minify --format=iife --outfile=tiles3d.js
 * (Der Hintergrundprozess wird separat gebaut, siehe src/tiles3d.worker.src.js.)
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function announce() { window.dispatchEvent(new Event('nurelo3d')); }
  function fail(msg) {
    if (window.console) console.info('Nurelo: 3D-Kacheln nicht aktiv (' + msg + ')');
    announce();
  }

  if (!window.Worker || !window.OffscreenCanvas || !window.createImageBitmap) { fail('Browser unterstützt es nicht'); return; }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var tiles = [];
  var pointer = { x: 0, y: 0 };
  var raf = 0;
  var ready = false;

  // ---------- Kacheln ----------
  function makeTile(el, id) {
    var kind = ['st', 'am', 'hn'].filter(function (k) { return el.classList.contains(k); })[0];
    if (!kind) return null;
    var canvas = document.createElement('canvas');
    canvas.className = 'tile-gl';
    canvas.setAttribute('aria-hidden', 'true');
    (el.querySelector('.tilt') || el).appendChild(canvas);
    var t = {
      id: id, el: el, kind: kind, canvas: canvas, ctx: canvas.getContext('bitmaprenderer'),
      depth: parseFloat(el.dataset.depth || 1), scroll: el.hasAttribute('data-scroll'),
      visible: false, shown: false, pending: false,
      rx: 0.16, ry: -0.28, w: 0, sent: null
    };
    sizeTile(t);
    return t;
  }

  function sizeTile(t) { t.w = Math.max(2, Math.round(t.el.offsetWidth * 1.5 * dpr)); }

  // ---------- Bilder anfordern und anzeigen ----------
  function send(t) {
    t.pending = true;
    t.sent = { rx: t.rx, ry: t.ry, w: t.w };
    worker.postMessage({ type: 'render', id: t.id, kind: t.kind, size: t.w, rx: t.rx, ry: t.ry });
  }

  function changed(t) {
    var s = t.sent;
    return !s || s.w !== t.w || Math.abs(s.rx - t.rx) > 0.0005 || Math.abs(s.ry - t.ry) > 0.0005;
  }

  function frame() {
    raf = 0;
    if (!ready) return;
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
      if (!t.pending && changed(t)) send(t);
    });
    if (moving) request();
  }
  function request() { if (!raf) raf = requestAnimationFrame(frame); }

  // ---------- Hintergrundprozess ----------
  var worker;
  try {
    worker = new Worker('/tiles3d.worker.js');
  } catch (e) { fail('Worker nicht startbar'); return; }

  worker.onerror = function () { if (!ready) fail('Hintergrundprozess fehlgeschlagen'); };
  worker.onmessage = function (e) {
    var m = e.data;
    if (m.type === 'ready') {
      ready = true;
      announce();
      request();
    } else if (m.type === 'fail') {
      fail(m.msg);
      worker.terminate();
    } else if (m.type === 'frame') {
      var t = tiles[m.id];
      if (!t) { m.bitmap.close(); return; }
      t.pending = false;
      t.ctx.transferFromImageBitmap(m.bitmap);
      if (!t.shown) { t.shown = true; t.el.classList.add('tile3d'); }
      if (changed(t)) request();
    }
  };

  // ---------- Start ----------
  var els = [].slice.call(document.querySelectorAll('.tile.big, .tile.chap, .tile.mini'));
  els.forEach(function (el) { var t = makeTile(el, tiles.length); if (t) tiles.push(t); });
  if (!tiles.length) { fail('keine Kacheln'); return; }
  worker.postMessage({ type: 'init' });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var t = tiles.filter(function (x) { return x.el === en.target; })[0];
        if (t) t.visible = en.isIntersecting;
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
})();
