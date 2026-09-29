(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 860px), (max-height: 700px)');

  // ---------- Menü ----------
  var menuBtn = document.getElementById('menu-btn');
  var links = document.getElementById('nav-links');
  function setMenu(open) {
    links.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  links.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // ---------- Sprachwähler ----------
  var langBox = document.querySelector('details.lang');
  if (langBox) {
    document.addEventListener('click', function (e) { if (!langBox.contains(e.target)) langBox.open = false; });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && langBox.open) { langBox.open = false; langBox.querySelector('summary').focus(); }
    });
  }

  // ---------- Nach oben ----------
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    var toggleTop = function () { toTop.classList.toggle('show', window.scrollY > window.innerHeight * 0.8); };
    window.addEventListener('scroll', toggleTop, { passive: true });
    toggleTop();
  }

  // ---------- Sprung zu gestapelten Kapiteln ----------
  // Klebende Kapitel liegen beim Hochscrollen schon "oben", der Browser hält den Anker dann für erreicht.
  // Deshalb das Ziel aus der ungeklebten Position berechnen.
  var chapterBox = document.querySelector('.chapters');
  if (chapterBox) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var id = a.getAttribute('href').slice(1);
      var target = id && document.getElementById(id);
      if (!target || target.parentNode !== chapterBox || getComputedStyle(target).position !== 'sticky') return;
      var y = chapterBox.getBoundingClientRect().top + window.scrollY;
      for (var s = target.previousElementSibling; s; s = s.previousElementSibling) y += s.offsetHeight;
      y -= parseFloat(getComputedStyle(target).top) || 0;
      e.preventDefault();
      window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    });
  }

  // ---------- Reveal ----------
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- Hilfsfunktionen ----------
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // 3D-Kacheln erst nach dem Laden und im Leerlauf nachladen, damit nichts ruckelt
  function load3d() {
    var s = document.createElement('script');
    s.src = '/tiles3d.js'; s.async = true;
    document.body.appendChild(s);
  }
  function later() {
    if ('requestIdleCallback' in window) window.requestIdleCallback(load3d, { timeout: 3000 });
    else setTimeout(load3d, 1200);
  }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);

  // ---------- Hero-Bühne ----------
  var hero = document.getElementById('top');
  var stage = document.getElementById('stage');
  // Unterseiten haben keine Hero-Bühne, der Rest gilt nur für die Startseite
  if (!hero || !stage) return;
  var bigs = [].slice.call(stage.querySelectorAll('[data-tile="big"]'));
  var sats = [].slice.call(stage.querySelectorAll('[data-tile="sat"]'));
  var h1a = stage.querySelector('.h1-a');
  var h1b = stage.querySelector('.h1-b');
  var more = stage.querySelector('.hero-more');
  var hint = stage.querySelector('.scroll-hint');
  var win = stage.querySelector('.app-window');
  var anchors = {};
  var W = 0, H = 0;

  function measure() {
    var s = stage.getBoundingClientRect();
    W = s.width; H = s.height;
    ['st', 'am', 'hn'].forEach(function (k) {
      var r = stage.querySelector('[data-anchor="' + k + '"]').getBoundingClientRect();
      anchors[k] = { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
    });
  }

  function animated() { return !reduce.matches && !narrow.matches; }

  var pointer = { x: 0, y: 0 };
  var tilts = [].slice.call(document.querySelectorAll('.tile .tilt'));
  tilts.forEach(function (el) { el._cur = { rx: 0, ry: 0 }; });
  var needTilt = false;

  // Sanftes Treiben und Mitreagieren der Satelliten (nur in der verstreuten Phase)
  var DRIFT = { raf: 0, visible: true, enabled: false, t0: 0, ps: { x: 0, y: 0 }, t1: 0, t2: 0 };
  // Das Treiben startet erst, wenn die 3D-Einrichtung fertig ist (oder nach einer Wartezeit),
  // damit ihre kurzen Blockaden in einen Moment fallen, in dem sich noch nichts bewegt.
  function enableDrift() {
    if (DRIFT.enabled) return;
    DRIFT.enabled = true; DRIFT.t0 = performance.now();
    driftKick();
  }
  window.addEventListener('nurelo3d', enableDrift);
  function driftAllowed() {
    return DRIFT.enabled && hero.classList.contains('pinned') && !reduce.matches && DRIFT.visible && !document.hidden && DRIFT.t2 < 1;
  }
  function driftFrame() {
    DRIFT.raf = 0;
    if (!driftAllowed()) return;
    DRIFT.ps.x = lerp(DRIFT.ps.x, pointer.x, 0.05);
    DRIFT.ps.y = lerp(DRIFT.ps.y, pointer.y, 0.05);
    setStage(DRIFT.t1, DRIFT.t2);
    DRIFT.raf = requestAnimationFrame(driftFrame);
  }
  function driftKick() { if (!DRIFT.raf && driftAllowed()) DRIFT.raf = requestAnimationFrame(driftFrame); }

  function setStage(t1, t2) {
    var pinned = hero.classList.contains('pinned');
    bigs.forEach(function (el) {
      var a = anchors[el.dataset.kind]; if (!a) return;
      var k = pinned ? t2 : 1;
      var sc = lerp(0.35, 1, k);
      var op = pinned ? clamp(k * 1.6, 0, 1) : 1;
      var tf = 'translate3d(' + a.x + 'px,' + lerp(a.y + 50, a.y, k) + 'px,0) scale(' + sc + ')';
      // nur schreiben, wenn sich etwas ändert (spart Arbeit im Treiben-Takt)
      if (el._op !== op) { el._op = op; el.style.opacity = op; }
      if (el._tf !== tf) { el._tf = tf; el.style.transform = tf; }
    });
    if (!pinned) return;
    var order = { st: 0, am: 1, hn: 2 };
    var T = performance.now() / 1000;
    var still = reduce.matches;
    var A = clamp(Math.min(W, H) * 0.018, 8, 16);
    // sanft einblenden, damit die Kacheln beim Start nicht springen
    var ramp = DRIFT.enabled ? smooth(0, 1, (performance.now() - DRIFT.t0) / 1800) : 0;
    sats.forEach(function (el, idx) {
      var a = anchors[el.dataset.kind]; if (!a) return;
      var i = +el.dataset.i;
      var sx = W / 2 + parseFloat(el.dataset.sx) * W * 0.95;
      var sy = H / 2 + parseFloat(el.dataset.sy) * H * 0.8;
      var ang = (i / 3) * Math.PI * 2 + order[el.dataset.kind] * 0.9 - 1.2;
      var rad = 0.5 * Math.min(W, H) * 0.19 + 36;
      var cx = a.x + Math.cos(ang) * rad;
      var cy = a.y + Math.sin(ang) * rad * 0.8;
      var e1 = smooth(0, 1, t1), e2 = smooth(0, 1, t2);
      var x = lerp(lerp(sx, cx, e1), a.x, e2);
      var y = lerp(lerp(sy, cy, e1), a.y, e2);
      var rot = lerp(parseFloat(el.dataset.sr), 0, e1);
      var sc = lerp(1, 0.25, e2);
      // Treiben: 9 bis 16 s je Zyklus, klingt mit der Sortierung ab
      var calm = 1 - e1;
      var period = 9 + ((idx * 5) % 8), w = 6.2832 / period, ph = idx * 1.9;
      var dx = still ? 0 : ramp * calm * A * Math.sin(T * w + ph);
      var dy = still ? 0 : ramp * calm * A * Math.cos(T * w * 0.8 + ph * 1.3);
      var dr = still ? 0 : ramp * calm * 4 * Math.sin(T * w * 0.6 + ph * 0.7);
      // Mitreagieren mit der Maus: 10 bis 20 px, endet mit dem Verschmelzen
      var pf = still ? 0 : ramp * (1 - e2) * (10 + (idx % 3) * 5);
      x += dx + DRIFT.ps.x * pf; y += dy + DRIFT.ps.y * pf; rot += dr;
      el.style.opacity = 1 - smooth(0.5, 1, t2);
      el.style.setProperty('--g', (1 - e1).toFixed(3));
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg) scale(' + sc + ')';
    });
  }

  function heroProgress() {
    var r = hero.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 1;
  }

  function update() {
    if (animated() !== hero.classList.contains('pinned')) {
      hero.classList.toggle('pinned', animated());
      measure();
    }
    var pinned = hero.classList.contains('pinned');
    var p = pinned ? heroProgress() : 1;
    var t1 = smooth(0, 0.5, p);
    var t2 = smooth(0.5, 0.92, p);
    if (pinned) {
      h1a.style.opacity = 1 - smooth(0.38, 0.55, p);
      h1b.style.opacity = smooth(0.48, 0.66, p);
      more.style.opacity = smooth(0.6, 0.8, p);
      more.style.pointerEvents = p > 0.7 ? 'auto' : 'none';
      hint.style.opacity = 1 - smooth(0, 0.12, p);
      win.style.opacity = smooth(0.42, 0.62, p);
    } else {
      [h1a, h1b, more, hint, win].forEach(function (el) { el.style.opacity = ''; el.style.pointerEvents = ''; });
    }
    DRIFT.t1 = t1; DRIFT.t2 = t2;
    setStage(t1, t2);
    updateTilt();
    driftKick();
  }

  // ---------- Kachel-Neigung (Maus + Scroll) ----------
  function updateTilt() {
    var moving = false;
    var still = reduce.matches;
    tilts.forEach(function (el) {
      var tile = el.parentNode;
      if (tile.classList.contains('tile3d')) { if (el.style.transform) el.style.transform = ''; return; }
      var depth = parseFloat(tile.dataset.depth || 1);
      var tx = still ? 0 : pointer.x, ty = still ? 0 : pointer.y;
      var ry = tx * 24 * depth, rx = -ty * 24 * depth;
      var lift = 0;
      if (tile.hasAttribute('data-scroll') && !still) {
        var r = tile.getBoundingClientRect();
        var s = clamp(((r.top + r.height / 2) / window.innerHeight - 0.5) * 2, -1.5, 1.5);
        ry += s * 26 * depth; rx += -s * 12; lift = s * -14;
      }
      var c = el._cur;
      c.rx = lerp(c.rx, rx, 0.14); c.ry = lerp(c.ry, ry, 0.14); c.l = lerp(c.l || 0, lift, 0.14);
      if (Math.abs(c.rx - rx) > 0.05 || Math.abs(c.ry - ry) > 0.05) moving = true;
      el.style.transform = 'perspective(700px) translateY(' + c.l.toFixed(1) + 'px) rotateX(' + c.rx.toFixed(2) + 'deg) rotateY(' + c.ry.toFixed(2) + 'deg)';
    });
    if (moving && !needTilt) { needTilt = true; requestAnimationFrame(tiltFrame); }
  }
  function tiltFrame() { needTilt = false; updateTilt(); }

  // ---------- Events ----------
  var ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { measure(); schedule(); });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    schedule();
  }, { passive: true });
  reduce.addEventListener && reduce.addEventListener('change', schedule);
  narrow.addEventListener && narrow.addEventListener('change', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); schedule(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { DRIFT.visible = en[0].isIntersecting; driftKick(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', driftKick);

  hero.classList.toggle('pinned', animated());
  measure();
  update();

  // Notfalls ohne 3D starten (Skript blockiert, sehr langsames Gerät)
  function failsafe() { setTimeout(enableDrift, 4500); }
  if (document.readyState === 'complete') failsafe(); else window.addEventListener('load', failsafe);
})();
