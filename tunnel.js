/*
 * Nurelo: Tunnel (Einfahrt nach dem Hero, Schlussfahrt in den Kontakt)
 *
 * Eine festgepinnte Bühne mit zwei Ebenen, die dieselbe Kamera teilen:
 *  - ein Canvas zeichnet Ringe, Kanten und Staub (2D-Projektion, kein WebGL, keine Bibliothek),
 *  - die Karten bleiben echtes HTML (Text, Links, Figuren) und liegen per CSS 3D im selben Raum.
 * Brennweite und Perspektive sind für beide gleich, deshalb passen Linien und Karten zusammen.
 *
 * Karten tragen data-z (Tiefe im Tunnel, negativ), data-x/data-y (Weltmaß, 1 Einheit = f / 3,2 px in Lesetiefe),
 * data-yaw (Drehung in Grad), Figuren data-h (Höhe in Welteinheiten), Haltestellen data-stop, das Ziel data-final.
 * Ohne Skript oder bei reduzierter Bewegung bleibt der einfache Grundzustand (siehe tunnel.css).
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var nodes = [].slice.call(document.querySelectorAll('[data-tn]'));
  if (!nodes.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(pointer: fine)').matches;
  var weak = window.matchMedia('(pointer: coarse)').matches && !!navigator.deviceMemory && navigator.deviceMemory <= 2;

  var READ = 3.4;          // Lesetiefe der Haltestellen (Einheiten vor der Kamera)
  var D0 = 3.2;            // Referenztiefe: dort ist eine Karte in ihrer CSS-Größe
  var GAP = 1.35;          // Abstand der Ringe
  var CREAM = [242, 234, 221], OCHRE = [197, 144, 69], TERRA = [191, 109, 71], OLIVE = [163, 168, 107];

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (fine) window.addEventListener('pointermove', function (e) { pointer.tx = e.clientX / window.innerWidth - 0.5; pointer.ty = e.clientY / window.innerHeight - 0.5; }, { passive: true });

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function Tunnel(sec) {
    var self = this;
    var kind = sec.getAttribute('data-tn');
    var stage = sec.querySelector('.tn-stage');
    var cv = sec.querySelector('.tn-cv');
    var world = sec.querySelector('.tn-world');
    var hint = sec.querySelector('.tn-hint');
    var ctx = cv.getContext('2d', { alpha: true });
    var items = [].slice.call(world.children).map(function (el) {
      return { el: el, z: +el.getAttribute('data-z'), x: +el.getAttribute('data-x'), y: +el.getAttribute('data-y'), yaw: +el.getAttribute('data-yaw') || 0,
        h: +el.getAttribute('data-h') || 0, nx: el.getAttribute('data-nx'), ny: el.getAttribute('data-ny'), nh: el.getAttribute('data-nh'),
        fig: el.classList.contains('tn-fig'), final: el.hasAttribute('data-final'), stop: el.hasAttribute('data-stop'),
        o: -1, vis: false, live: false, zi: '' };
    });
    // Haltestellen der Kamera
    var stops = [0];
    if (kind === 'out') { var fin = items.filter(function (i) { return i.final; })[0]; stops.push(fin.z + D0); }
    else items.filter(function (i) { return i.stop; }).sort(function (a, b) { return b.z - a.z; }).forEach(function (i) { stops.push(i.z + READ); });
    var endZ = stops[stops.length - 1];

    var vw = 0, vh = 0, dpr = 1, f = 800, u = 250, A = 3.4, B = 2.1, R = 0.95, xs = 1, FARD = 28, RINGS = 40, LEN = 54;
    var dust = [], rings = [];
    var visible = false, raf = 0, last = 0, lastDraw = 0, cur = 0, pinned = false;
    var t0 = performance.now();

    function buildGeometry() {
      LEN = RINGS * GAP;
      rings = [];
      for (var k = 0; k < RINGS; k++) {
        var z = -k * GAP, c;
        if (kind === 'out') c = [OCHRE, TERRA, OLIVE, CREAM][k % 4];
        else if (z > -7) c = k % 3 === 0 ? CREAM : OCHRE;
        else if (z > -14.5) c = k % 4 === 0 ? CREAM : OLIVE;
        else if (z > -22.5) c = k % 4 === 0 ? CREAM : OCHRE;
        else c = k % 4 === 0 ? CREAM : TERRA;
        rings.push({ z: z, c: c });
      }
      dust = [];
      var n = weak ? 120 : (vw < 860 ? 260 : 520);
      for (var i = 0; i < n; i++) dust.push([(Math.random() * 2 - 1) * (A - 0.3), (Math.random() * 2 - 1) * (B - 0.2), 2 - Math.random() * (LEN + 6)]);
    }

    function layout() {
      vw = stage.clientWidth || window.innerWidth; vh = stage.clientHeight || window.innerHeight;
      var aspect = vw / vh;
      var fov = clamp(60 + (1 / aspect - 1) * 26, 60, 96) * Math.PI / 180;
      f = (vh / 2) / Math.tan(fov / 2);
      u = f / D0;
      xs = aspect < 0.8 ? 0.26 : 1;
      if (aspect >= 1) { A = 3.4; B = 2.1; } else { A = 2.5; B = clamp(2.1 / Math.max(aspect, .4) * 0.62, 2.1, 3.4); }
      R = Math.min(A, B) * 0.45;
      FARD = weak ? 20 : 28;
      RINGS = Math.ceil((Math.abs(endZ) + FARD) / GAP) + 2;
      dpr = Math.min(window.devicePixelRatio || 1, weak ? 1 : (vw < 860 ? 1.5 : 2));
      cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
      world.style.perspective = f.toFixed(1) + 'px';
      items.forEach(function (it) { if (it.fig) it.el.style.height = (((aspect < 0.8 && it.nh !== null ? +it.nh : it.h)) * u).toFixed(1) + 'px'; });
      buildGeometry();
      last = 0; self.render(true);
    }

    function progress() {
      var r = sec.getBoundingClientRect(), span = r.height - window.innerHeight;
      return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    }
    function path(p) {
      if (kind === 'out') return lerp(stops[0], stops[1], smooth(p * 1.04 - 0.02) * 0.6 + p * 0.4);
      var n = stops.length - 1, uu = clamp(p, 0, 1) * n, i = Math.min(Math.floor(uu), n - 1), fr = uu - i;
      return lerp(stops[i], stops[i + 1], smooth((fr - 0.24) / 0.52));
    }

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

    function place(camZ, cx, cy, p) {
      for (var i = 0; i < items.length; i++) {
        var it = items[i], d = camZ - it.z, o = 0;
        if (d > 0.35 && d < 24) {
          o = it.fig && !it.stop ? clamp((11.5 - d) / 3.5, 0, 1) : clamp((16 - d) / 6, 0, 1);
          if (!it.final) o *= it.fig ? clamp((d - 1.4) / 2.2, 0, 1) : clamp((d - 0.5) / 1.5, 0, 1);
          else o *= clamp(p * 14, 0, 1);              // das Ziel taucht erst auf, wenn die Fahrt beginnt
        }
        o = Math.round(o * 50) / 50;
        if (o < 0.02) { if (it.vis) { it.el.style.visibility = 'hidden'; it.vis = false; } it.o = 0; continue; }
        var nar = xs < 1;
        var ix = nar && it.nx !== null ? +it.nx : it.x * xs, iy = nar && it.ny !== null ? +it.ny : it.y;
        var X = (ix - cx) * u, Y = -(iy - cy) * u, Z = f * (1 - d / D0);
        it.el.style.transform = 'translate3d(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px,' + Z.toFixed(1) + 'px) rotateY(' + (it.yaw * (xs < 1 ? 0.6 : 1)).toFixed(1) + 'deg) translate(-50%,-50%)';
        if (o !== it.o) { it.o = o; it.el.style.opacity = o; }
        if (!it.vis) { it.el.style.visibility = 'visible'; it.vis = true; }
        var zi = String(1000 - Math.round(d * 10));
        if (zi !== it.zi) { it.zi = zi; it.el.style.zIndex = zi; }
        var live = o > 0.6 && d < 7;
        if (live !== it.live) { it.live = live; it.el.classList.toggle('live', live); }
      }
    }

    this.render = function (force) {
      if (!pinned) return;
      var p = progress();
      cur = force ? p : cur;
      var camZ = path(cur);
      var sway = kind === 'out' ? 1 - smooth((cur - 0.72) / 0.28) : 1;
      var t = (performance.now() - t0) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
      var cx = (Math.sin(t * 0.45) * 0.07 * sway + pointer.x * 0.3 * sway);
      var cy = (Math.cos(t * 0.37) * 0.045 * sway - pointer.y * 0.2 * sway);
      var roll = force ? 0 : clamp((progress() - cur) * 1.6, -0.045, 0.045);
      draw(camZ, cx, cy, roll);
      world.style.transform = 'rotate(' + roll.toFixed(4) + 'rad)';
      place(camZ, cx, cy, cur);
      if (hint) hint.style.setProperty('--hint', clamp(1 - cur * 16, 0, 1).toFixed(3));
    };

    function tick(now) {
      raf = 0;
      if (!visible || document.hidden || !pinned) return;
      raf = requestAnimationFrame(tick);
      if (weak && now - lastDraw < 33) return;
      var dt = last ? Math.min(now - last, 64) : 16; last = now; lastDraw = now;
      cur += (progress() - cur) * (1 - Math.exp(-dt / 120));
      self.render(false);
    }
    this.kick = function () { if (!raf && visible && pinned) { last = 0; raf = requestAnimationFrame(tick); } };

    this.setup = function () {
      pinned = !reduce.matches;
      sec.classList.toggle('pinned', pinned);
      if (pinned) {
        sec.style.setProperty('--tn-len', sec.getAttribute('data-len') || 400);
        layout(); this.kick();
      } else {
        world.style.transform = ''; world.style.perspective = '';
        items.forEach(function (it) { it.el.removeAttribute('style'); it.el.classList.remove('live'); it.vis = false; it.o = -1; });
      }
    };
    this.resize = function () { if (pinned) layout(); };
    this.setVisible = function (v) { visible = v; this.kick(); };
    this.section = sec;
    this.endScroll = function () { return sec.getBoundingClientRect().top + window.scrollY + sec.offsetHeight - window.innerHeight; };
  }

  var tunnels = nodes.map(function (n) { return new Tunnel(n); });
  function setup() { tunnels.forEach(function (t) { t.setup(); }); }
  if (reduce.addEventListener) reduce.addEventListener('change', setup); else reduce.addListener(setup);
  window.addEventListener('resize', function () { tunnels.forEach(function (t) { t.resize(); }); });
  document.addEventListener('visibilitychange', function () { tunnels.forEach(function (t) { t.kick(); }); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { tunnels.forEach(function (t) { if (t.section === en.target) t.setVisible(en.isIntersecting); }); });
    }, { rootMargin: '30% 0px' });
    tunnels.forEach(function (t) { io.observe(t.section); });
  } else tunnels.forEach(function (t) { t.setVisible(true); });
  setup();

  // Links auf #kontakt landen am Ende der Schlussfahrt (Kontaktkarte in Lesegröße), nicht am Anfang des leeren Tunnels
  var contact = tunnels.filter(function (t) { return t.section.id === 'kontakt'; })[0];
  if (contact) {
    var toContact = function (smoothly) {
      if (!contact.section.classList.contains('pinned')) return false;
      window.scrollTo({ top: contact.endScroll(), behavior: smoothly && !reduce.matches ? 'smooth' : 'auto' });
      return true;
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="#kontakt"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      if (toContact(true)) { e.preventDefault(); if (history.replaceState) history.replaceState(null, '', '#kontakt'); }
    });
    if (location.hash === '#kontakt') window.addEventListener('load', function () { setTimeout(function () { toContact(false); }, 60); });
  }
})();
