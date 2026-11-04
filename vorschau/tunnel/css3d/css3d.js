/* Prototyp B: CSS-3D-Tunnel
   Die Welt (.t3-world) fährt per translateZ auf den Betrachter zu. Ringe und Kanten werden hier erzeugt.
   Geschrieben werden pro Bild nur die Welt-Transformation und die Deckkraft der Ringe (Nebel). */
(function () {
  'use strict';
  var root = document.documentElement;
  var sec = document.getElementById('t3');
  var world = document.getElementById('world');
  if (!sec || !world) return;
  var hint = sec.querySelector('.t3-hint');
  var cards = [].slice.call(world.querySelectorAll('.t3-card, .t3-end'));
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  var COLORS = ['#c59045', '#bf6d47', '#a3a86b', '#f2eadd'];
  var RINGS = 15, END = 12;
  var rings = [], gap = 460, cam = -1, ticking = false, built = false;

  function build() {
    if (built) return; built = true;
    for (var i = 0; i < RINGS; i++) {
      var r = document.createElement('i');
      r.className = 'ring'; r.style.setProperty('--c', COLORS[i % COLORS.length]);
      world.insertBefore(r, world.firstChild); rings.push({ el: r, i: i, o: -1 });
    }
    // vier Kanten entlang der Tiefe, zeichnen sich bis zum Ende
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q, n) {
      var e = document.createElement('i'); e.className = 'edge'; e.dataset.x = q[0]; e.dataset.y = q[1];
      e.style.setProperty('--c', COLORS[n % COLORS.length]); world.insertBefore(e, world.firstChild);
    });
  }
  function layoutEdges() {
    var cs = getComputedStyle(sec);
    var g = parseFloat(cs.getPropertyValue('--gap')) || 460; gap = g;
    var vw = window.innerWidth, vh = window.innerHeight;
    var rw = parseFloat(cs.getPropertyValue('--rw')) / 100 * vw, rh = parseFloat(cs.getPropertyValue('--rh')) / 100 * vh;
    var len = (RINGS - 1) * g;
    [].forEach.call(world.querySelectorAll('.edge'), function (e) {
      var x = +e.dataset.x * rw / 2, y = +e.dataset.y * rh / 2;
      e.style.width = len + 'px';
      e.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotateY(90deg)';
    });
  }
  function progress() {
    var r = sec.getBoundingClientRect(), span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }
  function draw() {
    ticking = false;
    var p = progress();
    if (Math.abs(p - cam) < 0.0003) return;
    cam = p;
    var z = p * END * gap;                       // wie weit die Welt auf uns zugefahren ist
    world.style.transform = 'translate3d(0,0,' + z.toFixed(1) + 'px)';
    for (var k = 0; k < rings.length; k++) {
      var ring = rings[k], dist = ring.i * gap - z;   // Abstand vor der Kamera, in Pixeln
      var o = 0;
      if (dist > 0.5 * gap) o = clamp((9.5 * gap - dist) / (3.5 * gap), 0, 1) * clamp((dist - 0.5 * gap) / (0.8 * gap), 0, 1);
      o = Math.round(o * 50) / 50;
      if (o !== ring.o) { ring.o = o; ring.el.style.opacity = o; }
    }
    // Tafeln: im Nebel schwach, nahe vorbei blenden sie aus (die letzte bleibt stehen)
    for (var c = 0; c < cards.length; c++) {
      var cd = cards[c], cz = parseFloat(cd.style.getPropertyValue('--k')) * gap - z;
      var co = clamp((8 * gap - cz) / (3.2 * gap), 0.0, 1);
      if (!cd.classList.contains('t3-end')) co *= clamp((cz + 0.9 * gap) / (1.1 * gap), 0, 1);
      co = Math.round(co * 50) / 50;
      if (cd._o !== co) { cd._o = co; cd.style.opacity = co; }
    }
    if (hint) hint.style.setProperty('--hint', clamp(1 - p * 12, 0, 1).toFixed(3));
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }
  function setup() {
    var on = !mq.matches;
    sec.classList.toggle('pinned', on);
    if (on) {
      build();
      // Ringe liegen im Raum: Abstand nach hinten = Index mal Abstand
      layoutEdges();
      rings.forEach(function (r) { r.el.style.transform = 'translateZ(' + (-r.i * gap) + 'px)'; });
    } else world.style.transform = '';
    cam = -1; req();
  }
  mq.addEventListener ? mq.addEventListener('change', setup) : mq.addListener(setup);
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { if (sec.classList.contains('pinned')) { layoutEdges(); rings.forEach(function (r) { r.el.style.transform = 'translateZ(' + (-r.i * gap) + 'px)'; }); } cam = -1; req(); });
  // leichtes Mitwandern des Fluchtpunkts mit dem Zeiger (nur Desktop)
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      sec.style.setProperty('--px', ((e.clientX / window.innerWidth - .5) * -6).toFixed(2));
      sec.style.setProperty('--py', ((e.clientY / window.innerHeight - .5) * -6).toFixed(2));
    }, { passive: true });
  }
  setup();
})();
