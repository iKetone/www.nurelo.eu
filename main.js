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

  // ---------- Kapitel-Stapel mit Tiefe ----------
  // Die klebenden Kapitel verschieben ihre Position beim Überfahren nicht, deshalb taugt keine View-Timeline: Der Fortschritt kommt aus der
  // Lage des jeweils nächsten Kapitels (unten im Fenster = 0, an seinem Klebeplatz = 1). Erst alle Lagen lesen, dann schreiben;
  // will-change nur, solange eine Karte unterwegs ist. Nur Verkleinern: ein zusätzliches Abdunkeln über die ganze Karte kostete im
  // Messlauf ohne Grafikkarte deutlich mehr Bildzeit und ist deshalb entfallen.
  if (chapterBox) {
    (function () {
      var cards = [].slice.call(chapterBox.children);
      var deep = window.matchMedia('(min-width: 861px) and (min-height: 701px)');
      var sticks = [], busy = false;
      function readSticks() { sticks = cards.map(function (el) { return parseFloat(getComputedStyle(el).top) || 0; }); }
      function depth() {
        busy = false;
        var on = deep.matches && !reduce.matches, H = window.innerHeight;
        var tops = cards.map(function (el) { return el.getBoundingClientRect().top; });
        cards.forEach(function (el, i) {
          if (i === cards.length - 1) return;
          var p = on ? Math.min(1, Math.max(0, (H - tops[i + 1]) / (H - sticks[i + 1]))) : 0;
          p = Math.round(p * 200) / 200;
          if (el._p === p) return;
          el._p = p;
          var active = p > 0 && p < 1;
          el.style.willChange = active ? 'transform' : '';
          el.style.transform = p ? 'scale(' + (1 - 0.035 * p).toFixed(4) + ')' : '';
        });
      }
      function ask() { if (!busy) { busy = true; requestAnimationFrame(depth); } }
      window.addEventListener('scroll', ask, { passive: true });
      window.addEventListener('resize', function () { readSticks(); ask(); });
      deep.addEventListener && deep.addEventListener('change', ask);
      reduce.addEventListener && reduce.addEventListener('change', ask);
      readSticks(); depth();
    })();
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

  // ---------- Aktuelle Stelle in der Navigation ----------
  // Ein schmales Band bei 40 % der Fensterhöhe: der Abschnitt, der es zuletzt (im Dokument) kreuzt, ist der aktuelle.
  // IntersectionObserver statt Scroll-Handler, damit keine Positionen gelesen werden müssen.
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var linkFor = {};
    [].slice.call(links.querySelectorAll('a[href^="#"]')).forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });
    var secs = [].slice.call(document.querySelectorAll('main > section[id], .chapters > section[id]'));
    if (!secs.length || !Object.keys(linkFor).length) return;
    secs.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    var inBand = {}, shown = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { inBand[en.target.id] = en.isIntersecting; });
      var cur = null;
      secs.forEach(function (sec) { if (inBand[sec.id]) cur = sec.id; });
      var a = cur && linkFor[cur] || null;
      if (a === shown) return;
      if (shown) shown.removeAttribute('aria-current');
      if (a) a.setAttribute('aria-current', 'location');
      shown = a;
    }, { rootMargin: '-40% 0px -59% 0px' });
    secs.forEach(function (sec) { spy.observe(sec); });
  })();

  // ---------- Fenster in den Kapiteln: Bewegung nur im Bild ----------
  // .live schaltet die CSS-Abläufe der Fenster, solange sie im Bild sind
  (function () {
    var wins = [].slice.call(document.querySelectorAll('.chapter .app-window'));
    if (!wins.length || !('IntersectionObserver' in window)) return;
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('live', en.isIntersecting); });
    }, { threshold: 0.3 });
    wins.forEach(function (w) { io2.observe(w); });
  })();

  // ---------- Gleitender Unterstrich in der Navigation (Desktop) ----------
  // Ein einziges Element, das per transform zum aktuellen Link gleitet; die Markierung (aria-current) setzen weiterhin der Scroll-Spy
  // und die Seitenvorlage, hier wird nur mitgelesen.
  (function () {
    var wide = window.matchMedia('(min-width: 861px)');
    var ind = document.createElement('span');
    ind.className = 'nav-ind'; ind.setAttribute('aria-hidden', 'true');
    links.appendChild(ind);
    var placed = false;
    function place() {
      var a = links.querySelector('a[aria-current]');
      if (!wide.matches || !a) { ind.classList.remove('on'); links.classList.remove('has-ind'); return; }
      links.classList.add('has-ind');
      if (!placed) ind.classList.add('still');
      ind.style.transform = 'translateX(' + a.offsetLeft + 'px) scaleX(' + a.offsetWidth + ')';
      ind.classList.add('on');
      if (!placed) { placed = true; void ind.offsetWidth; ind.classList.remove('still'); }
    }
    new MutationObserver(place).observe(links, { attributes: true, attributeFilter: ['aria-current'], subtree: true });
    window.addEventListener('resize', function () { placed = false; place(); });
    wide.addEventListener && wide.addEventListener('change', function () { placed = false; place(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placed = false; place(); });
    place();
  })();

  // ---------- Wortweises Aufhellen ausgewählter Überschriften und Einleitungen ----------
  // Nur Wörter (nicht Buchstaben): bleibt in allen Sprachen lesbar, der Text steht unverändert im Dokument. Die Wörter werden erst
  // zerlegt, wenn der Browser scroll-gesteuerte Animationen kann und Bewegung erlaubt ist; sonst bleibt der Text unberührt.
  (function () {
    if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) || reduce.matches) return;
    var targets = [].slice.call(document.querySelectorAll('.platform-head h2, .platform-head .chapter-lead, .steps-sec .section-head h2, .steps-sec .section-head .lead'));
    targets.forEach(function (el) {
      var words = [];
      (function walk(node) {
        [].slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var parts = n.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
            parts.forEach(function (t) {
              if (!t) return;
              if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
              var s = document.createElement('span'); s.className = 'w'; s.textContent = t; words.push(s); frag.appendChild(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
        });
      })(el);
      words.forEach(function (w, i) { w.style.setProperty('--f', words.length > 1 ? (i / (words.length - 1)).toFixed(3) : '0'); });
      if (words.length) el.classList.add('words');
    });
  })();

  // ---------- Hilfsfunktionen ----------
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // 3D-Kacheln erst nach dem Laden und im Leerlauf nachladen, damit nichts ruckelt
  // Auf schwachen Handys bleiben die Kacheln in CSS, das Treiben startet dann sofort
  function lowPower() {
    return narrow.matches && ((navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));
  }
  // Glasflächen (siehe styles.css, .no-blur): nur auf Touch-Geräten, die höchstens 2 GB Speicher melden.
  // Die Kernzahl zählt hier nicht: Safari meldet sie gedeckelt und deviceMemory gar nicht, ein iPhone soll das Glas zeigen.
  if (window.matchMedia('(max-width: 860px) and (pointer: coarse)').matches &&
      navigator.deviceMemory && navigator.deviceMemory <= 2) root.classList.add('no-blur');
  function load3d() {
    if (lowPower()) { window.dispatchEvent(new Event('nurelo3d')); return; }
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
    // Die Ankerpunkte liegen im App-Fenster: ohne dessen Kippen und Verschieben messen, sonst wandern die Kacheln mit
    var tf = win.style.transform; win.style.transform = '';
    var s = stage.getBoundingClientRect();
    W = s.width; H = s.height;
    ['st', 'am', 'hn'].forEach(function (k) {
      var r = stage.querySelector('[data-anchor="' + k + '"]').getBoundingClientRect();
      anchors[k] = { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
    });
    win.style.transform = tf;
  }

  // Die Scroll-Sequenz läuft auch mobil; nur bei reduzierter Bewegung bleibt der Hero statisch
  function animated() { return !reduce.matches; }

  var pointer = { x: 0, y: 0 };
  var tilts = [].slice.call(document.querySelectorAll('.tile .tilt'));
  tilts.forEach(function (el) { el._cur = { rx: 0, ry: 0 }; });
  var needTilt = false;
  // Neigung nur für Kacheln im Bild berechnen (spart Stilarbeit, wenn der Mauszeiger über anderen Abschnitten liegt)
  var tilesSeen = 0;
  [].slice.call(document.querySelectorAll('.tile')).forEach(function (t) { t._vis = true; tilesSeen++; });

  // Sanftes Treiben und Mitreagieren der Satelliten (nur in der verstreuten Phase)
  var DRIFT = { raf: 0, visible: true, enabled: false, t0: 0, last: 0, ps: { x: 0, y: 0 }, t1: 0, t2: 0 };
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
  // Auf Touch-Geräten reichen 30 Bilder pro Sekunde: das Treiben ist langsam und spart dort Akku
  var coarse = window.matchMedia('(pointer: coarse)');
  function driftFrame(now) {
    DRIFT.raf = 0;
    if (!driftAllowed()) return;
    if (!(coarse.matches && now - DRIFT.last < 30)) {
      DRIFT.last = now;
      DRIFT.ps.x = lerp(DRIFT.ps.x, pointer.x, 0.05);
      DRIFT.ps.y = lerp(DRIFT.ps.y, pointer.y, 0.05);
      setStage(DRIFT.t1, DRIFT.t2);
    }
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
      // --g wird von den Kindern geerbt (Graustufe): nur schreiben, wenn der Wert sich ändert
      var op = 1 - smooth(0.5, 1, t2), g = (1 - e1).toFixed(3);
      if (el._op !== op) { el._op = op; el.style.opacity = op; }
      if (el._g !== g) { el._g = g; el.style.setProperty('--g', g); }
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg) scale(' + sc + ')';
    });
  }

  function heroProgress() {
    var r = hero.getBoundingClientRect();
    // Höhe der Bühne statt der Fensterhöhe, damit die Browserleiste am Handy den Verlauf nicht springen lässt
    var total = r.height - stage.offsetHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 1;
  }

  var stageLive = true;
  function update() {
    if (animated() !== hero.classList.contains('pinned')) {
      hero.classList.toggle('pinned', animated());
      measure();
    }
    var pinned = hero.classList.contains('pinned');
    // Ist der Hero aus dem Bild, genügt es, den Endzustand einmal zu schreiben
    if (!DRIFT.visible && !stageLive) { updateTilt(); return; }
    stageLive = DRIFT.visible;
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
      // Das Fenster liegt zuerst leicht nach hinten gekippt und tiefer und richtet sich auf, bis es flach steht
      var wk = smooth(0.36, 0.72, p);
      win.style.transform = wk >= 1 ? '' : 'perspective(1200px) translateY(' + ((1 - wk) * 46).toFixed(1) + 'px) rotateX(' + ((1 - wk) * 9).toFixed(2) + 'deg)';
    } else {
      [h1a, h1b, more, hint, win].forEach(function (el) { el.style.opacity = ''; el.style.pointerEvents = ''; el.style.transform = ''; });
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
    var live = tilts.filter(function (el) {
      var tile = el.parentNode;
      if (tile.classList.contains('tile3d')) { if (el.style.transform) el.style.transform = ''; return false; }
      return tile._vis;
    });
    // erst alle Positionen lesen, dann schreiben (kein Lesen nach Schreiben)
    var tops = live.map(function (el) {
      var tile = el.parentNode;
      return tile.hasAttribute('data-scroll') && !still ? tile.getBoundingClientRect() : null;
    });
    live.forEach(function (el, i) {
      var tile = el.parentNode;
      var depth = parseFloat(tile.dataset.depth || 1);
      var tx = still ? 0 : pointer.x, ty = still ? 0 : pointer.y;
      var ry = tx * 24 * depth, rx = -ty * 24 * depth;
      var lift = 0;
      var r = tops[i];
      if (r) {
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
    if (DRIFT.visible || tilesSeen > 0) schedule();
  }, { passive: true });
  reduce.addEventListener && reduce.addEventListener('change', schedule);
  narrow.addEventListener && narrow.addEventListener('change', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); schedule(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      DRIFT.visible = en[0].isIntersecting;
      if (DRIFT.visible) stageLive = true;
      schedule(); driftKick();
    }).observe(hero);
    // Kacheln: Sichtbarkeit merken, damit nur das Nötige neu berechnet wird
    var tileIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var was = en.target._vis, now = en.isIntersecting;
        if (was === now) return;
        en.target._vis = now; tilesSeen += now ? 1 : -1;
      });
      schedule();
    }, { rootMargin: '80px' });
    [].slice.call(document.querySelectorAll('.tile')).forEach(function (t) { tileIO.observe(t); });
  }
  document.addEventListener('visibilitychange', driftKick);

  hero.classList.toggle('pinned', animated());
  measure();
  update();

  // Notfalls ohne 3D starten (Skript blockiert, sehr langsames Gerät)
  function failsafe() { setTimeout(enableDrift, 4500); }
  if (document.readyState === 'complete') failsafe(); else window.addEventListener('load', failsafe);
})();
