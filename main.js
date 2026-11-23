(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 860px), (max-height: 700px)');

  // ---------- Menü am Handy ----------
  // Eine Fläche über den ganzen Bildschirm (styles.css, „Menü am Handy“). Ihre Form ist ein SVG-Pfad, der während der Bewegung
  // in jedem Bild neu berechnet wird: eine weiche Welle, die von rechts hereinläuft (angelehnt an hellomonday.com).
  var links = document.getElementById('nav-links');
  var menuBtn = document.getElementById('menu-btn');
  var mnav = document.getElementById('mnav');
  var menuOpen = false;
  if (menuBtn && mnav) (function () {
    var svg = mnav.querySelector('.mnav-shape');
    var face = svg.querySelector('path');
    var items = [].slice.call(mnav.querySelectorAll('.mnav-links li, .mnav-item'));
    var W = 0, H = 0, p = 0, from = 0, to = 0, t0 = 0, dur = 1, raf = 0, closeTimer = 0;
    var f1 = function (n) { return Math.round(n * 10) / 10; };
    // Schneller Start, weiches Auslaufen (beim Schließen umgekehrt: sanft los, dann zügig hinaus)
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    // Weiche Kurve durch Punkte (Catmull-Rom als kubische Bézier-Abschnitte)
    function through(pts) {
      var d = '';
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i - 1] || pts[i], b = pts[i], c = pts[i + 1], e = pts[i + 2] || c;
        d += ' C' + f1(b[0] + (c[0] - a[0]) / 6) + ' ' + f1(b[1] + (c[1] - a[1]) / 6) + ' ' + f1(c[0] - (e[0] - b[0]) / 6) + ' ' + f1(c[1] - (e[1] - b[1]) / 6) + ' ' + f1(c[0]) + ' ' + f1(c[1]);
      }
      return d;
    }
    // Welle: Die Kante läuft von rechts nach links. Unterwegs biegt sie sich (am stärksten in der Mitte des Wegs):
    // Die Mitte eilt voraus, oben und unten bleiben zurück, dazu eine kleine Welle, die an der Kante entlangläuft.
    function wave(e) {
      var A = W * 0.3 * Math.sin(Math.PI * e), x0 = W * (1 - e), prof = [1, 0.42, -0.32, 0.08, 0.62], pts = [];
      for (var i = 0; i < prof.length; i++) {
        var v = i / (prof.length - 1);
        pts.push([x0 + A * (prof[i] + 0.22 * Math.sin(Math.PI * 2 * (v * 1.1 - e * 0.9))), v * H]);
      }
      var last = pts[pts.length - 1];
      return 'M' + (W + 2) + ' -2L' + f1(pts[0][0]) + ' -2L' + f1(pts[0][0]) + ' 0' + through(pts) + 'L' + f1(last[0]) + ' ' + (H + 2) + 'L' + (W + 2) + ' ' + (H + 2) + 'Z';
    }
    function draw() { face.setAttribute('d', wave(ease(p))); }
    function tick(now) {
      var k = Math.min(1, (now - t0) / dur);
      p = from + (to - from) * k;
      draw();
      if (k < 1) raf = requestAnimationFrame(tick);
      else { raf = 0; if (to === 0 && !menuOpen) mnav.hidden = true; }
    }
    function run(target, ms) {
      from = p; to = target; dur = Math.max(1, ms * Math.abs(target - p)); t0 = performance.now();
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function size() {
      var r = svg.getBoundingClientRect();
      W = Math.round(r.width) || window.innerWidth; H = Math.round(r.height) || window.innerHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    }
    // Die Einträge kommen, sobald die Welle sie erreicht hat
    items.forEach(function (el, i) { el.style.setProperty('--d', String(220 + i * 45)); });

    function open() {
      if (menuOpen) return;
      menuOpen = true;
      clearTimeout(closeTimer);
      mnav.hidden = false;
      size();
      root.classList.add('mnav-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      if (reduce.matches) { if (raf) { cancelAnimationFrame(raf); raf = 0; } p = 1; draw(); } else run(1, 560);
      // Einträge erst im nächsten Bild auf „offen“, damit ihr Übergang startet
      requestAnimationFrame(function () { if (menuOpen) mnav.classList.add('is-open'); });
      var first = mnav.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    }
    function close(instant) {
      if (!menuOpen) return;
      menuOpen = false;
      mnav.classList.remove('is-open');
      [].slice.call(mnav.querySelectorAll('details[open]')).forEach(function (d) { d.open = false; });   // offene Sprachliste mit zuklappen
      menuBtn.setAttribute('aria-expanded', 'false');
      root.classList.remove('mnav-open');   // sofort: ein Sprung zu einem Abschnitt soll schon während des Schließens scrollen können
      if (mnav.contains(document.activeElement)) menuBtn.focus({ preventScroll: true });
      if (instant || reduce.matches) { if (raf) { cancelAnimationFrame(raf); raf = 0; } p = 0; draw(); mnav.hidden = true; return; }
      // Die Einträge gehen zuerst, dann zieht sich die Fläche zurück
      closeTimer = setTimeout(function () { if (!menuOpen) run(0, 480); }, 90);
    }
    menuBtn.addEventListener('click', function () { if (menuOpen) close(); else open(); });
    mnav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') {
        // Erst die offene Sprachliste schließen, dann das Menü
        var dd = mnav.querySelector('details[open]');
        if (dd) { dd.open = false; dd.querySelector('summary').focus(); return; }
        close(); menuBtn.focus({ preventScroll: true }); return;
      }
      if (e.key !== 'Tab') return;
      // Fokus bleibt im Menü und am Knopf (der Rest der Seite liegt darunter); Links in der geschlossenen Sprachliste zählen nicht
      var f = [menuBtn].concat([].slice.call(mnav.querySelectorAll('a, summary')).filter(function (el) { return el.getClientRects().length > 0; }));
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
    });
    var mobile = window.matchMedia('(max-width: 860px)');
    var onWide = function () { if (!mobile.matches) close(true); };
    if (mobile.addEventListener) mobile.addEventListener('change', onWide);
    window.addEventListener('resize', function () { if (menuOpen) { size(); if (!raf) draw(); } });
  })();

  // ---------- Navigation: beim Runterscrollen aus dem Bild, beim Hochscrollen wieder herein ----------
  // Offen gehaltenes Menü, Sprachwähler und Tastaturfokus in der Leiste halten sie sichtbar; ganz oben ist sie immer da.
  var nav = document.querySelector('header.nav');
  if (nav) {
    var navY = window.scrollY, navDist = 0, navAway = false, navTick = false;
    var navShow = function (show) {
      if (show === !navAway) return;
      navAway = !show;
      nav.classList.toggle('nav-away', navAway);
    };
    var navHold = function () {
      return menuOpen || !!document.querySelector('details.lang[open]') || nav.contains(document.activeElement);
    };
    var navScroll = function () {
      navTick = false;
      var y = window.scrollY, dy = y - navY;
      navY = y;
      if (y < 80 || navHold()) { navDist = 0; navShow(true); return; }
      if (dy === 0) return;
      if ((dy > 0) !== (navDist > 0)) navDist = 0;          // Richtungswechsel: Weg neu zählen
      navDist += dy;
      if (navDist > 28) navShow(false);                      // runter: erst nach einem kleinen Stück ausblenden
      else if (navDist < -10) navShow(true);                 // hoch: sofort wieder herein
    };
    window.addEventListener('scroll', function () { if (!navTick) { navTick = true; requestAnimationFrame(navScroll); } }, { passive: true });
    nav.addEventListener('focusin', function () { navShow(true); });
  }

  // ---------- Sprachwähler ----------
  // Zwei Stück: in der Leiste und im Menü am Handy. Ein Klick daneben schließt die Liste, ebenso Escape
  // (im Menü übernimmt das der Menü-Code, damit Escape nicht gleichzeitig das Menü schließt).
  var langBoxes = [].slice.call(document.querySelectorAll('details.lang'));
  if (langBoxes.length) {
    document.addEventListener('click', function (e) { langBoxes.forEach(function (box) { if (!box.contains(e.target)) box.open = false; }); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      langBoxes.forEach(function (box) { if (box.open && !box.closest('.mnav')) { box.open = false; box.querySelector('summary').focus(); } });
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
        var on = deep.matches && !reduce.matches && !root.classList.contains('land'), H = window.innerHeight;
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
    // Leiste (Desktop) und Menü am Handy tragen dieselben Links, beide bekommen die Markierung
    var linkFor = {};
    [].slice.call(document.querySelectorAll('#nav-links a[href^="#"], #mnav .mnav-links a[href^="#"]')).forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      (linkFor[id] = linkFor[id] || []).push(a);
    });
    var secs = [].slice.call(document.querySelectorAll('main > section[id], .chapters > section[id]'));
    if (!secs.length || !Object.keys(linkFor).length) return;
    secs.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    var inBand = {}, shown = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { inBand[en.target.id] = en.isIntersecting; });
      var cur = null;
      secs.forEach(function (sec) { if (inBand[sec.id]) cur = sec.id; });
      var id = cur && linkFor[cur] ? cur : null;
      if (id === shown) return;
      if (shown) linkFor[shown].forEach(function (a) { a.removeAttribute('aria-current'); });
      if (id) linkFor[id].forEach(function (a) { a.setAttribute('aria-current', 'location'); });
      shown = id;
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
  // und die Seitenvorlage, hier wird nur mitgelesen. Drei Dinge gegen Unruhe: Nach einem Klick auf einen Link bleibt der Strich bis zum
  // Ende der Scrollfahrt am Ziel (statt über die Zwischenabschnitte zu hüpfen), eine kurze Lücke ohne aktuellen Abschnitt blendet ihn
  // nicht aus, und nach dem Ausblenden springt er an die neue Stelle statt aus der alten herüberzugleiten.
  (function () {
    var wide = window.matchMedia('(min-width: 861px)');
    var ind = document.createElement('span');
    ind.className = 'nav-ind'; ind.setAttribute('aria-hidden', 'true');
    links.appendChild(ind);
    var placed = false, forced = null, forceTimer = 0, hideTimer = 0;
    function show(a, snap) {
      clearTimeout(hideTimer);
      links.classList.add('has-ind');
      if (snap) ind.classList.add('still');
      ind.style.transform = 'translateX(' + a.offsetLeft + 'px) scaleX(' + a.offsetWidth + ')';
      ind.classList.add('on');
      if (snap) { void ind.offsetWidth; ind.classList.remove('still'); }
    }
    function place() {
      var a = forced || links.querySelector('a[aria-current]');
      if (!wide.matches) { clearTimeout(hideTimer); ind.classList.remove('on'); links.classList.remove('has-ind'); placed = false; return; }
      if (!a) {
        if (!ind.classList.contains('on') || hideTimer) return;
        hideTimer = setTimeout(function () { hideTimer = 0; ind.classList.remove('on'); links.classList.remove('has-ind'); placed = false; }, 260);
        return;
      }
      clearTimeout(hideTimer); hideTimer = 0;
      show(a, !placed);
      placed = true;
    }
    function release() { forced = null; place(); }
    links.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      forced = a; clearTimeout(forceTimer); forceTimer = setTimeout(release, 1600); place();
    });
    window.addEventListener('scrollend', function () { if (forced) { clearTimeout(forceTimer); forceTimer = setTimeout(release, 120); } });
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

  // Glasflächen (siehe styles.css, .no-blur): nur auf Touch-Geräten, die höchstens 2 GB Speicher melden.
  // Die Kernzahl zählt hier nicht: Safari meldet sie gedeckelt und deviceMemory gar nicht, ein iPhone soll das Glas zeigen.
  if (window.matchMedia('(max-width: 860px) and (pointer: coarse)').matches &&
      navigator.deviceMemory && navigator.deviceMemory <= 2) root.classList.add('no-blur');

  // ---------- Kachel-Neigung (Maus + Scroll) ----------
  // Die Kacheln sind flach illustriert (styles.css), die Tiefe entsteht durch CSS-Neigung mit Perspektive.
  var pointer = { x: 0, y: 0 };
  var tilts = [].slice.call(document.querySelectorAll('.tile .tilt'));
  tilts.forEach(function (el) { el._cur = { rx: 0, ry: 0 }; });
  var needTilt = false;
  function updateTilt() {
    var moving = false;
    var still = reduce.matches;
    var live = tilts.filter(function (el) { return el.parentNode._vis; });
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
      var r = tops[i];
      if (r) {
        // Kapitel-Kacheln: Position bleibt fest am Fenster, nur ein leichtes Schwenken um die senkrechte Achse (Scroll und Maus)
        var s = clamp(((r.top + r.height / 2) / window.innerHeight - 0.5) * 2, -1.5, 1.5);
        ry = clamp(tx * 8 + s * 9, -14, 14); rx = 0;
      }
      var c = el._cur;
      c.rx = lerp(c.rx, rx, 0.14); c.ry = lerp(c.ry, ry, 0.14);
      if (Math.abs(c.rx - rx) > 0.05 || Math.abs(c.ry - ry) > 0.05) moving = true;
      el.style.transform = 'perspective(700px) rotateX(' + c.rx.toFixed(2) + 'deg) rotateY(' + c.ry.toFixed(2) + 'deg)';
    });
    if (moving && !needTilt) { needTilt = true; requestAnimationFrame(tiltFrame); }
  }
  function tiltFrame() { needTilt = false; updateTilt(); }

  // ---------- Abendszene im Kontakt der Produktseiten ----------
  // Setzt --p (0 bis 1) auf .dusk-scene (land.css „Abendszene“): 0, wenn die Landschaft am unteren Rand ins Bild kommt,
  // 1, wenn sie ganz im Bild steht und ein Stück weitergescrollt ist; die Bewegung läuft also, solange man sie sieht.
  // Gemessen an der kleinen Fensterhöhe (svh, fest), damit nichts springt, wenn am Handy die Browserleiste ein- oder ausklappt.
  (function () {
    var scene = document.querySelector('.dusk-scene');
    if (!scene) return;
    var sec = scene.parentNode, band = scene.querySelector('.dusk-l'), vh = 0, bh = 1, last = -1, tick = false, near = true;
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    function measure() { vh = probe.offsetHeight || window.innerHeight; bh = Math.max(1, band ? band.offsetHeight : 300); }
    function update() {
      tick = false;
      var p = 1;
      if (!reduce.matches) { var r = sec.getBoundingClientRect(); p = clamp((vh + bh - r.bottom) / (bh * 1.6), 0, 1); }
      p = Math.round(p * 1000) / 1000;
      if (p !== last) { last = p; scene.style.setProperty('--p', String(p)); }
    }
    function request() { if (!tick && near) { tick = true; requestAnimationFrame(update); } }
    measure(); update();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { near = en[0].isIntersecting; if (near) request(); }, { rootMargin: '200px 0px' }).observe(sec);
    }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', function () { measure(); request(); });
    if (reduce.addEventListener) reduce.addEventListener('change', request);
  })();

  // ---------- Hero-Bühne ----------
  var hero = document.getElementById('top');
  var stage = document.getElementById('stage');
  // Unterseiten haben keine Hero-Bühne, dort neigt sich nur die Kachel; der Rest gilt nur für die Startseite
  if (!hero || !stage) {
    if (tilts.length) {
      tilts.forEach(function (el) { el.parentNode._vis = true; });
      var kick = function () { if (!needTilt) { needTilt = true; requestAnimationFrame(tiltFrame); } };
      window.addEventListener('scroll', kick, { passive: true });
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
        kick();
      }, { passive: true });
      kick();
    }
    return;
  }
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

  // Neigung nur für Kacheln im Bild berechnen (spart Stilarbeit, wenn der Mauszeiger über anderen Abschnitten liegt)
  var tilesSeen = 0;
  [].slice.call(document.querySelectorAll('.tile')).forEach(function (t) { t._vis = true; tilesSeen++; });

  // Sanftes Treiben und Mitreagieren der Satelliten (nur in der verstreuten Phase)
  var DRIFT = { raf: 0, visible: true, enabled: false, t0: 0, last: 0, ps: { x: 0, y: 0 }, t1: 0, t2: 0 };
  // Das Treiben startet nach dem Laden im Leerlauf, damit der Seitenaufbau ruhig bleibt (siehe Ende der Datei).
  function enableDrift() {
    if (DRIFT.enabled) return;
    DRIFT.enabled = true; DRIFT.t0 = performance.now();
    driftKick();
  }
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
      var sy = H * 0.56 + parseFloat(el.dataset.sy) * H * 0.7;   // etwas tiefer als die Mitte, damit die Kacheln nicht in die (jetzt längere) Überschrift ragen
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
    // Landschaft: nach der Sequenz steht die Bühne noch 45 % einer Fensterhöhe still, dann fährt das Kapitel 100 % darüber
    var total = r.height - stage.offsetHeight - (root.classList.contains('land') ? stage.offsetHeight * 1.45 : 0);
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
    if (root.classList.contains('land')) {
      // Morgen: Dunst löst sich, Sonne steigt, Himmel wird warm, im selben Takt wie die Kacheln sich sortieren
      var dawn = pinned ? smooth(0, 1, t1).toFixed(3) : '1';
      if (hero._dawn !== dawn) { hero._dawn = dawn; hero.style.setProperty('--dawn', dawn); }
    }
    setStage(t1, t2);
    updateTilt();
    driftKick();
  }


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
  root.classList.remove('hero-boot');   // ab jetzt zeichnet das Skript den Hero (siehe styles.css, html.hero-boot)

  // Treiben nach dem Laden im Leerlauf starten
  function startDrift() {
    if ('requestIdleCallback' in window) window.requestIdleCallback(enableDrift, { timeout: 3000 });
    else setTimeout(enableDrift, 1200);
  }
  if (document.readyState === 'complete') startDrift(); else window.addEventListener('load', startDrift);
})();
