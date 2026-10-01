// Tour 404: Minispiel für die Fehlerseite. Läuft nur dort, ohne Bibliotheken.
// Eine gepunktete Route wächst mit jedem Einsatz. Steuerung: Wischen oder Pfeiltasten (WASD).
(function () {
  var field = document.getElementById('g-field');
  var section = document.getElementById('game');
  var canvas = document.getElementById('g-canvas');
  if (!field || !section || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var overlay = document.getElementById('g-overlay');
  var elTitle = document.getElementById('g-title');
  var elText = document.getElementById('g-text');
  var btn = document.getElementById('g-btn');
  var elScore = document.getElementById('g-score');
  var elBest = document.getElementById('g-best');

  var de = /^de/i.test(navigator.language || 'de');
  var T = de ? {
    title: 'Tour 404', aria: 'Minispiel Tour 404',
    intro: 'Diese Seite ist nicht erreichbar, eure Tour schon. Lenkt per Wischen oder mit den Pfeiltasten. Oliv und Senf zählen 1 Punkt, ein Alarm in Terrakotta zählt 3. Die Route darf sich nicht kreuzen.',
    play: 'Spielen', again: 'Nochmal', over: 'Tour beendet', paused: 'Pausiert', resume: 'Weiter',
    score: 'Einsätze', best: 'Rekord',
  } : {
    title: 'Tour 404', aria: 'Mini game Tour 404',
    intro: 'This page is not reachable, but your tour is. Steer by swiping or with the arrow keys. Olive and mustard are worth 1 point, an alarm in terracotta is worth 3. The route must not cross itself.',
    play: 'Play', again: 'Again', over: 'Tour over', paused: 'Paused', resume: 'Resume',
    score: 'Stops', best: 'Best',
  };

  var CELL = 28;
  var css = getComputedStyle(document.documentElement);
  function col(n, d) { return (css.getPropertyValue(n) || d).trim() || d; }
  var C = {
    paper: col('--paper', '#fbf7f0'), line: col('--line', '#ddd1bf'), ink: col('--ink', '#241b14'), cream: col('--cream', '#f2eadd'),
    st: col('--olive', '#7a734a'), am: col('--ochre', '#c59045'), hn: col('--terra', '#bf6d47'), ring: col('--terra-d', '#9e4e2e'),
  };
  var GLYPH_AM = new Path2D('M6 19h9a3.5 3.5 0 000-7H9a3.5 3.5 0 010-7h9');
  var GLYPH_HN = new Path2D('M8 8a5.7 5.7 0 000 8M16 8a5.7 5.7 0 010 8M4.6 4.6a10.5 10.5 0 000 14.8M19.4 4.6a10.5 10.5 0 010 14.8');

  var KEY = 'nurelo-tour404';
  var best = 0;
  try { best = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) {}

  var cols, rows, dpr;
  var snake, dir, queue, grow, score, item, alarm, normals, state; // state: idle | play | pause | over
  var acc, last, raf = 0;

  function layout() {
    var w = Math.min(section.clientWidth || 360, 720);
    cols = Math.max(12, Math.min(26, Math.floor(w / CELL)));
    rows = Math.max(11, Math.min(20, Math.floor((window.innerHeight - 110) / CELL))); // Feld und Zähler passen in ein Fenster
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = cols * CELL * dpr; canvas.height = rows * CELL * dpr;
    canvas.style.width = cols * CELL + 'px'; canvas.style.height = rows * CELL + 'px';
    field.style.width = cols * CELL + 'px';
    elScore.parentNode.style.width = cols * CELL + 'px';
  }

  function setScore() {
    elScore.textContent = T.score + ': ' + score;
    elBest.textContent = T.best + ': ' + best;
  }

  function freeCell() {
    for (var n = 0; n < 200; n++) {
      var x = Math.floor(Math.random() * cols), y = Math.floor(Math.random() * rows), ok = true;
      for (var i = 0; i < snake.length; i++) if (snake[i].x === x && snake[i].y === y) { ok = false; break; }
      if (ok && item && item.x === x && item.y === y) ok = false;
      if (ok && alarm && alarm.x === x && alarm.y === y) ok = false;
      if (ok) return { x: x, y: y };
    }
    return null;
  }

  function reset() {
    var y = Math.floor(rows / 2), x = Math.max(3, Math.floor(cols / 3));
    snake = [{ x: x, y: y }, { x: x - 1, y: y }, { x: x - 2, y: y }];
    dir = { x: 1, y: 0 }; queue = []; grow = 0; score = 0; normals = 0; alarm = null; item = null;
    item = freeCell(); item.k = 'st';
    acc = 0;
    setScore();
  }

  function steer(d) {
    if (state !== 'play') return;
    var ref = queue.length ? queue[queue.length - 1] : dir;
    if ((d.x === ref.x && d.y === ref.y) || (d.x === -ref.x && d.y === -ref.y)) return;
    if (queue.length < 2) queue.push(d);
  }

  function interval() { return Math.max(75, 140 - 5 * Math.floor(score / 5)); }

  function step() {
    if (queue.length) dir = queue.shift();
    var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (h.x < 0 || h.y < 0 || h.x >= cols || h.y >= rows) return finish();
    var len = snake.length - (grow > 0 ? 0 : 1); // das Ende rückt nach, außer die Route wächst
    for (var i = 0; i < len; i++) if (snake[i].x === h.x && snake[i].y === h.y) return finish();
    snake.unshift(h);
    var pts = 0;
    if (alarm && alarm.x === h.x && alarm.y === h.y) { pts = 3; alarm = null; }
    else if (h.x === item.x && h.y === item.y) {
      pts = 1; normals++;
      var k = item.k === 'st' ? 'am' : 'st';
      item = null; item = freeCell() || { x: 0, y: 0 }; item.k = k;
      if (!alarm && normals % 5 === 0) { var a = freeCell(); if (a) { alarm = a; alarm.ttl = 6000; } }
    }
    if (pts) { score += pts; grow += pts; setScore(); }
    if (grow > 0) grow--; else snake.pop();
  }

  function frame(now) {
    raf = 0;
    if (state !== 'play') return;
    var dt = Math.min(now - last, 100); last = now;
    acc += dt;
    if (alarm) { alarm.ttl -= dt; if (alarm.ttl <= 0) alarm = null; }
    var iv = interval();
    while (acc >= iv && state === 'play') { acc -= iv; step(); }
    draw();
    if (state === 'play') raf = requestAnimationFrame(frame);
  }

  function glyph(kind, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy); var s = size * 0.5 / 24; ctx.scale(s, s); ctx.translate(-12, -12);
    ctx.fillStyle = ctx.strokeStyle = C.cream; ctx.lineCap = 'round';
    if (kind === 'st') {
      ctx.fillRect(3, 3, 8, 8); ctx.fillRect(13, 13, 8, 8);
      ctx.globalAlpha = 0.55; ctx.fillRect(13, 3, 8, 8); ctx.fillRect(3, 13, 8, 8);
    } else if (kind === 'am') {
      ctx.lineWidth = 2.6; ctx.stroke(GLYPH_AM);
      ctx.beginPath(); ctx.arc(5, 19, 2.6, 0, 6.3); ctx.arc(19, 5, 2.6, 0, 6.3); ctx.fill();
    } else {
      ctx.lineWidth = 2.2; ctx.stroke(GLYPH_HN);
      ctx.beginPath(); ctx.arc(12, 12, 2.8, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function tile(it, ringFrac) {
    var size = CELL * 0.84, cx = (it.x + 0.5) * CELL, cy = (it.y + 0.5) * CELL;
    ctx.fillStyle = C[it.k]; roundRect(cx - size / 2, cy - size / 2, size, size, size * 0.3); ctx.fill();
    glyph(it.k, cx, cy, size);
    if (ringFrac) {
      ctx.strokeStyle = C.ring; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringFrac); ctx.stroke();
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, cols * CELL, rows * CELL);
    ctx.fillStyle = C.line;
    for (var x = 0; x <= cols; x++) for (var y = 0; y <= rows; y++) ctx.fillRect(x * CELL - 1, y * CELL - 1, 2, 2);
    // Route als gepunktete Linie vom Ende bis zum Fahrzeug
    ctx.strokeStyle = C.ink; ctx.lineWidth = CELL * 0.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.setLineDash([0, CELL * 0.44]);
    ctx.beginPath();
    for (var i = snake.length - 1; i >= 0; i--) {
      var px = (snake[i].x + 0.5) * CELL, py = (snake[i].y + 0.5) * CELL;
      if (i === snake.length - 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.setLineDash([]);
    tile(item);
    if (alarm) tile({ x: alarm.x, y: alarm.y, k: 'hn' }, Math.max(0, alarm.ttl / 6000));
    // Fahrzeug
    var h = snake[0], hs = CELL * 0.82, hx = (h.x + 0.5) * CELL, hy = (h.y + 0.5) * CELL;
    ctx.fillStyle = C.ink; roundRect(hx - hs / 2, hy - hs / 2, hs, hs, hs * 0.3); ctx.fill();
    ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(hx + dir.x * CELL * 0.18, hy + dir.y * CELL * 0.18, CELL * 0.11, 0, 6.3); ctx.fill();
  }

  function showOverlay(title, text, label) {
    elTitle.textContent = title; elText.textContent = text; btn.textContent = label;
    overlay.hidden = false;
    btn.focus({ preventScroll: true });
  }

  function start() {
    if (state === 'idle' || state === 'over') { layout(); reset(); }
    state = 'play';
    overlay.hidden = true;
    section.scrollIntoView({ block: 'start' });
    canvas.focus({ preventScroll: true });
    last = performance.now();
    draw();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (state !== 'play') return;
    state = 'pause';
    showOverlay(T.paused, '', T.resume);
  }

  function finish() {
    state = 'over';
    if (score > best) { best = score; try { localStorage.setItem(KEY, String(best)); } catch (e) {} }
    setScore();
    draw();
    showOverlay(T.over, T.score + ': ' + score + ' · ' + T.best + ': ' + best, T.again);
  }

  // ---------- Eingaben ----------
  var KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
  document.addEventListener('keydown', function (e) {
    if (state !== 'play') return;
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { pause(); return; }
    var k = KEYS[e.key];
    if (k) { e.preventDefault(); steer({ x: k[0], y: k[1] }); }
  });

  var p0 = null;
  field.addEventListener('pointerdown', function (e) {
    if (state !== 'play') return;
    p0 = { x: e.clientX, y: e.clientY };
    try { field.setPointerCapture(e.pointerId); } catch (err) {}
  });
  field.addEventListener('pointermove', function (e) {
    if (!p0 || state !== 'play') return;
    var dx = e.clientX - p0.x, dy = e.clientY - p0.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    steer(Math.abs(dx) > Math.abs(dy) ? { x: dx > 0 ? 1 : -1, y: 0 } : { x: 0, y: dy > 0 ? 1 : -1 });
    p0 = { x: e.clientX, y: e.clientY };
  });
  function endPointer() { p0 = null; }
  field.addEventListener('pointerup', endPointer);
  field.addEventListener('pointercancel', endPointer);

  btn.addEventListener('click', start);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { if (!en[0].isIntersecting) pause(); }, { threshold: 0.1 }).observe(field);
  }

  // ---------- Start ----------
  canvas.setAttribute('aria-label', T.aria);
  section.hidden = false;
  state = 'idle';
  layout(); reset(); draw();
  showOverlay(T.title, T.intro, T.play);
  btn.blur();
})();
