/*
 * Nurelo: Schlussfahrt in den Kontakt
 *
 * Eine festgepinnte Bühne mit zwei Ebenen, die dieselbe Kamera teilen:
 *  - ein Canvas zeichnet Ringe, Kanten und Staub (2D-Projektion, kein WebGL, keine Bibliothek),
 *  - die Kontaktkarte bleibt echtes HTML (Text, Links) und liegt per CSS 3D im selben Raum.
 * Brennweite und Perspektive sind für beide gleich, deshalb passen Linien und Karte zusammen.
 *
 * Die Karte trägt data-z (Tiefe im Tunnel, negativ). Am Ende der Fahrt steht sie in ihrer CSS-Größe vor der Kamera.
 * Ohne Skript oder bei reduzierter Bewegung bleibt der einfache Grundzustand (siehe tunnel.css).
 */
(function () {
  'use strict';
  var sec = document.querySelector('[data-tn]');
  if (!sec) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(pointer: fine)').matches;
  var weak = window.matchMedia('(pointer: coarse)').matches && !!navigator.deviceMemory && navigator.deviceMemory <= 2;

  var D0 = 3.2;            // Referenztiefe: dort ist die Karte in ihrer CSS-Größe
  var GAP = 1.35;          // Abstand der Ringe
  var CREAM = [242, 234, 221], OCHRE = [197, 144, 69], TERRA = [191, 109, 71], OLIVE = [163, 168, 107];

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (fine) window.addEventListener('pointermove', function (e) { pointer.tx = e.clientX / window.innerWidth - 0.5; pointer.ty = e.clientY / window.innerHeight - 0.5; kick(); }, { passive: true });

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  var stage = sec.querySelector('.tn-stage');
  var cv = sec.querySelector('.tn-cv');
  var world = sec.querySelector('.tn-world');
  var card = world.querySelector('.tn-card');
  var ctx = cv.getContext('2d', { alpha: true });
  var cardZ = +card.getAttribute('data-z');
  var endZ = cardZ + D0;                       // Kamerastand am Ende: die Karte steht in Lesegröße vor uns

  var vw = 0, vh = 0, dpr = 1, f = 800, A = 3.4, B = 2.1, R = 0.95, FARD = 28, RINGS = 40, LEN = 54;
  var dust = [], rings = [];
  var visible = false, raf = 0, last = 0, lastDraw = 0, cur = 0, pinned = false;
  var cardO = -1, cardVis = false, cardLive = false;
  var t0 = performance.now();
  // Das leise Schwanken der Kamera läuft nur kurz nach dem Scrollen. Nach 5 s Ruhe klingt es aus und die Zeichenschleife hält an
  // (WCAG 2.2.2: selbst startende Bewegung darf nicht dauerhaft laufen; spart nebenbei Akku). Scrollen weckt alles wieder auf.
  var CALM_AFTER = 5000, lastMove = performance.now(), calm = 1;

  function buildGeometry() {
    LEN = RINGS * GAP;
    rings = [];
    for (var k = 0; k < RINGS; k++) rings.push({ z: -k * GAP, c: [OCHRE, TERRA, OLIVE, CREAM][k % 4] });
    dust = [];
    var n = weak ? 120 : (vw < 860 ? 260 : 520);
    for (var i = 0; i < n; i++) dust.push([(Math.random() * 2 - 1) * (A - 0.3), (Math.random() * 2 - 1) * (B - 0.2), 2 - Math.random() * (LEN + 6)]);
  }

  function layout() {
    vw = stage.clientWidth || window.innerWidth; vh = stage.clientHeight || window.innerHeight;
    var aspect = vw / vh;
    var fov = clamp(60 + (1 / aspect - 1) * 26, 60, 96) * Math.PI / 180;
    f = (vh / 2) / Math.tan(fov / 2);
    if (aspect >= 1) { A = 3.4; B = 2.1; } else { A = 2.5; B = clamp(2.1 / Math.max(aspect, .4) * 0.62, 2.1, 3.4); }
    R = Math.min(A, B) * 0.45;
    FARD = weak ? 20 : 28;
    RINGS = Math.ceil((Math.abs(endZ) + FARD) / GAP) + 2;
    dpr = Math.min(window.devicePixelRatio || 1, weak ? 1 : (vw < 860 ? 1.5 : 2));
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    world.style.perspective = f.toFixed(1) + 'px';
    buildGeometry();
    last = 0; render(true);
  }

  function progress() {
    var r = sec.getBoundingClientRect(), span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }
  function path(p) { return lerp(0, endZ, smooth(p * 1.04 - 0.02) * 0.6 + p * 0.4); }

  function fogA(d) { return clamp((FARD - d) / (FARD - 5), 0, 1) * clamp((d - 0.3) / 0.9, 0, 1); }

  function draw(camZ, cx, cy, roll) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr, 0, 0, dpr, cv.width / 2, cv.height / 2);
    ctx.rotate(roll);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    var k, s, d, a;
    // Kanten entlang der Tiefe
    var ex = A - R * 0.3, ey = B - R * 0.3, s1 = f / 1.2, s2 = f / FARD;
    [[-1, -1, OCHRE], [1, -1, TERRA], [-1, 1, OLIVE], [1, 1, CREAM]].forEach(function (q) {
      var x1 = (q[0] * ex - cx) * s1, y1 = -(q[1] * ey - cy) * s1, x2 = (q[0] * ex - cx) * s2, y2 = -(q[1] * ey - cy) * s2;
      var g = ctx.createLinearGradient(x1, y1, x2, y2), c = q[2];
      g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',.5)'); g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    // Ringe
    for (k = 0; k < rings.length; k++) {
      var rg = rings[k]; d = camZ - rg.z;
      if (d < 0.3 || d > FARD) continue;
      a = Math.min(1, fogA(d) * 1.15); if (a < 0.01) continue;
      s = f / d;
      ctx.strokeStyle = 'rgba(' + rg.c[0] + ',' + rg.c[1] + ',' + rg.c[2] + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = clamp(1.3 + 3 / d, 1.3, 4);
      ctx.beginPath(); rrect(ctx, (-A - cx) * s, -(B - cy) * s, 2 * A * s, 2 * B * s, R * s); ctx.stroke();
    }
    // Staub
    ctx.fillStyle = '#f2eadd';
    var hw = vw / 2 + 6, hh = vh / 2 + 6;
    for (k = 0; k < dust.length; k++) {
      var p = dust[k]; d = camZ - p[2];
      if (d < 0.3 || d > FARD) continue;
      s = f / d;
      var sx = (p[0] - cx) * s, sy = -(p[1] - cy) * s;
      if (sx > hw || sx < -hw || sy > hh || sy < -hh) continue;
      var sz = clamp(0.03 * s, 0.7, 3);
      ctx.globalAlpha = fogA(d) * 0.75;
      ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // Die Karte fliegt aus dem Nebel heran; sie taucht erst auf, wenn die Fahrt beginnt
  function place(camZ, cx, cy, p) {
    var d = camZ - cardZ, o = 0;
    if (d > 0.35 && d < 24) o = clamp((16 - d) / 6, 0, 1) * clamp(p * 14, 0, 1);
    o = Math.round(o * 50) / 50;
    if (o < 0.02) { if (cardVis) { card.style.visibility = 'hidden'; cardVis = false; } cardO = 0; return; }
    var u = f / D0;
    card.style.transform = 'translate3d(' + (-cx * u).toFixed(1) + 'px,' + (cy * u).toFixed(1) + 'px,' + (f * (1 - d / D0)).toFixed(1) + 'px) translate(-50%,-50%)';
    if (o !== cardO) { cardO = o; card.style.opacity = o; }
    if (!cardVis) { card.style.visibility = 'visible'; cardVis = true; }
    var live = o > 0.6 && d < 7;
    if (live !== cardLive) { cardLive = live; card.classList.toggle('live', live); }
  }

  function render(force) {
    if (!pinned) return;
    var p = progress();
    cur = force ? p : cur;
    var camZ = path(cur);
    var sway = 1 - smooth((cur - 0.72) / 0.28);      // am Ende steht alles still
    var now = performance.now(), t = (now - t0) / 1000;
    calm += ((now - lastMove > CALM_AFTER ? 0 : 1) - calm) * 0.04;
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
    var cx = Math.sin(t * 0.45) * 0.07 * sway * calm + pointer.x * 0.3 * sway;
    var cy = Math.cos(t * 0.37) * 0.045 * sway * calm - pointer.y * 0.2 * sway;
    var roll = force ? 0 : clamp((progress() - cur) * 1.6, -0.045, 0.045);
    draw(camZ, cx, cy, roll);
    world.style.transform = 'rotate(' + roll.toFixed(4) + 'rad)';
    place(camZ, cx, cy, cur);
  }

  function tick(now) {
    raf = 0;
    if (!visible || document.hidden || !pinned) return;
    if (weak && now - lastDraw < 33) { raf = requestAnimationFrame(tick); return; }
    var dt = last ? Math.min(now - last, 64) : 16; last = now; lastDraw = now;
    var target = progress();
    cur += (target - cur) * (1 - Math.exp(-dt / 120));
    render(false);
    // Alles ausgeklungen (Kamera am Ziel, Schwanken aus, Zeiger eingeholt): keine weiteren Bilder, bis wieder gescrollt wird
    var still = calm < 0.004 && Math.abs(target - cur) < 0.0004 && Math.abs(pointer.tx - pointer.x) < 0.0008 && Math.abs(pointer.ty - pointer.y) < 0.0008;
    if (!still) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf && visible && pinned) { last = 0; raf = requestAnimationFrame(tick); } }
  window.addEventListener('scroll', function () { lastMove = performance.now(); kick(); }, { passive: true });

  function setup() {
    pinned = !reduce.matches;
    sec.classList.toggle('pinned', pinned);
    if (pinned) {
      sec.style.setProperty('--tn-len', sec.getAttribute('data-len') || 260);
      layout(); kick();
    } else {
      world.style.transform = ''; world.style.perspective = '';
      card.removeAttribute('style'); card.classList.remove('live'); cardVis = false; cardO = -1; cardLive = false;
    }
  }
  if (reduce.addEventListener) reduce.addEventListener('change', setup); else reduce.addListener(setup);
  window.addEventListener('resize', function () { if (pinned) layout(); });
  document.addEventListener('visibilitychange', kick);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; kick(); }, { rootMargin: '30% 0px' }).observe(sec);
  } else { visible = true; }
  setup();

  // Links auf #kontakt landen am Ende der Fahrt (Kontaktkarte in Lesegröße), nicht am Anfang des leeren Tunnels
  function toContact(smoothly) {
    if (!sec.classList.contains('pinned')) return false;
    window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + sec.offsetHeight - window.innerHeight, behavior: smoothly && !reduce.matches ? 'smooth' : 'auto' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#kontakt"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    if (toContact(true)) { e.preventDefault(); if (history.replaceState) history.replaceState(null, '', '#kontakt'); }
  });
  if (location.hash === '#kontakt') window.addEventListener('load', function () { setTimeout(function () { toContact(false); }, 60); });
})();
