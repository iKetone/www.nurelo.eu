/* Szene auf den Produktseiten: beim Scrollen fährt die Kamera durch das aufgeschnittene Haus (Zeichnung aus tools/scenes).
   Ohne Skript oder bei reduzierter Bewegung bleibt die Seite im Ruhezustand (siehe scene.css). */
(function () {
  'use strict';
  var sec = document.getElementById('szene');
  if (!sec) return;

  var svg = sec.querySelector('svg');
  var world = svg && svg.querySelector('.scn-world');
  var focus, vb;
  try { focus = JSON.parse(sec.dataset.focus); vb = sec.dataset.vb.split(' '); } catch (e) { return; }
  if (!svg || !world || !focus || focus.length < 4) return;

  var track = sec.querySelector('.scn-track');
  var stage = sec.querySelector('.scn-stage');
  var intro = sec.querySelector('.scn-intro');
  var steps = sec.querySelector('.scn-steps');
  var cards = [].slice.call(sec.querySelectorAll('.scn-card'));
  var pops = [].slice.call(sec.querySelectorAll('.scn-pop'));
  var dots = [].slice.call(sec.querySelectorAll('.scn-dots li'));
  var link = sec.querySelector('.scn-link');
  var staticBox = svg.getAttribute('viewBox');
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Fahrplan: [Fortschritt, Kamera (0 = ganzes Haus, 1 bis 3 = Räume), Schritt (0 Einstieg, 1 bis 3 Räume, 4 Abschluss)]
  var STOPS = [
    [0.00, 0, 0], [0.07, 0, 0],
    [0.19, 1, 1], [0.33, 1, 1],
    [0.45, 2, 2], [0.59, 2, 2],
    [0.71, 3, 3], [0.85, 3, 3],
    [0.95, 0, 4], [1.00, 0, 4]
  ];

  var wasPinned = false, live = false, W = 0, H = 0, D = 1, cams = [], raf = 0, lastKey = '';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Bildausschnitt je Kamera: das Fokusrechteck soll in den freien Bereich neben bzw. über der Textkarte passen
  function measure() {
    W = stage.clientWidth; H = stage.clientHeight;
    D = Math.max(1, track.offsetHeight - H);
    var wide = W >= 900 && H >= 560;
    var rx, ry, rw, rh;
    if (wide) {
      var ir = intro.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      rx = ir.right - sr.left + 28; ry = 84; rw = W - rx - 44; rh = H - ry - 28;
    } else {
      var ph = Math.max(intro.offsetHeight, steps.offsetHeight);
      rx = 8; ry = 78; rw = W - 16 - 18; rh = H - ry - ph - 30;
    }
    rw = Math.max(rw, 120); rh = Math.max(rh, 120);
    cams = focus.map(function (f, k) {
      // Das ganze Haus darf auf großen Bildschirmen etwas unter die Textkarte reichen (dort ist nur leere Bodenplatte)
      var ox = k === 0 && wide ? 150 : 0;
      var s = Math.min((rw + ox) / f[2], rh / f[3]) * 0.97;
      return {
        s: s,
        cx: f[0] + f[2] / 2 - ((rx - ox + (rw + ox) / 2) - W / 2) / s,
        cy: f[1] + f[3] / 2 - ((ry + rh / 2) - H / 2) / s
      };
    });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    lastKey = '';
  }

  function frame() {
    raf = 0;
    if (!live) return;
    var r = track.getBoundingClientRect();
    var p = clamp(-r.top / D, 0, 1);
    var pinned = r.top <= 0 && r.bottom >= H;
    if (pinned !== wasPinned) { wasPinned = pinned; document.documentElement.classList.toggle('scn-pinned', pinned); }
    var i = 0;
    while (i < STOPS.length - 2 && p >= STOPS[i + 1][0]) i++;
    var a = STOPS[i], b = STOPS[i + 1];
    var t = b[0] > a[0] ? clamp((p - a[0]) / (b[0] - a[0]), 0, 1) : 0;
    var moving = a[1] !== b[1];
    var e = moving ? t * t * (3 - 2 * t) : 0;
    var ca = cams[a[1]], cb = cams[b[1]];
    // Zoom auf der Strecke geometrisch mischen, in der Mitte der Fahrt etwas aus dem Haus heben
    var s = ca.s * Math.pow(cb.s / ca.s, e);
    if (moving) s /= 1 + (a[1] && b[1] ? 0.22 : 0.08) * Math.sin(Math.PI * e);
    var cx = lerp(ca.cx, cb.cx, e), cy = lerp(ca.cy, cb.cy, e);
    var tx = W / 2 - cx * s, ty = H / 2 - cy * s;
    world.setAttribute('transform', 'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') scale(' + s.toFixed(4) + ')');
    if (link) link.style.strokeDashoffset = (-p * 520).toFixed(1);

    // Karte und Fortschritt: Wechsel in der Mitte der Fahrt
    var step = moving && t >= 0.5 ? b[2] : a[2];
    // Pop-ups: erscheinen kurz vor der Ankunft, bleiben bis kurz nach dem Aufbruch; im Abschluss sind alle da
    var onSet = [];
    for (var k = 1; k <= 3; k++) {
      var on;
      if (!moving) on = a[2] === k || a[2] === 4;
      else on = (b[2] === k && t > 0.7) || (a[2] === k && (b[2] === 4 || t < 0.1)) || (b[2] === 4 && t > 0.6);
      if (on) onSet.push(k);
    }
    var key = step + ':' + onSet.join('');
    if (key === lastKey) return;
    lastKey = key;
    cards.forEach(function (c) { c.classList.toggle('on', +c.dataset.i === step); });
    dots.forEach(function (d, j) { d.classList.toggle('on', j === step); });
    pops.forEach(function (g) { g.classList.toggle('on', onSet.indexOf(+g.dataset.i) >= 0); });
  }

  function request() { if (!raf) raf = requestAnimationFrame(frame); }
  function onResize() { if (!live) return; measure(); request(); }

  function start() {
    if (live) return;
    live = true;
    sec.classList.add('scn-on');
    measure();
    frame();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
  }

  function stop() {
    if (!live) return;
    live = false;
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', onResize);
    sec.classList.remove('scn-on');
    wasPinned = false; document.documentElement.classList.remove('scn-pinned');
    svg.setAttribute('viewBox', staticBox);
    world.removeAttribute('transform');
    if (link) link.style.strokeDashoffset = '';
    cards.concat(pops, dots).forEach(function (n) { n.classList.remove('on'); });
    lastKey = '';
  }

  function apply() { if (mq.matches) stop(); else start(); }
  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
})();
