(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var mk = document.getElementById('mk');
  var stage = document.getElementById('mk-stage');
  if (!mk || !stage) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var scenes = [].slice.call(stage.querySelectorAll('.scene'));
  var figs = scenes.map(function (s) { return s.querySelector('.fig'); });
  var txts = scenes.map(function (s) { return s.querySelector('.txt'); });
  var bgs = [].slice.call(stage.querySelectorAll('.mk-bg i'));
  var N = scenes.length;
  var ticking = false, last = [];

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  function progress() {
    var r = mk.getBoundingClientRect();
    var total = r.height - stage.offsetHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }

  function reset() {
    scenes.forEach(function (s, i) { s.style.opacity = ''; s.classList.remove('on'); figs[i].style.transform = ''; txts[i].style.transform = ''; });
    bgs.forEach(function (b) { b.style.opacity = ''; });
    last = [];
  }

  function update() {
    ticking = false;
    var pinned = mk.classList.contains('pinned');
    if (pinned === reduce.matches) { mk.classList.toggle('pinned', !reduce.matches); reset(); if (reduce.matches) return; }
    if (!mk.classList.contains('pinned')) return;
    var s = progress() * N;             // 0 .. N, Szene i hat ihre Mitte bei i + 0.5
    var W = stage.clientWidth, narrow = W <= 860;
    scenes.forEach(function (sc, i) {
      var d = s - (i + 0.5);
      // Durchblendung: voll sichtbar bis ±0.38 um die Mitte, danach in kurzer Strecke aus; die Nachbarszene kommt erst, wenn diese weg ist
      var a = Math.abs(d);
      var v = smooth((0.5 - a) / 0.12);
      if (i === 0 && d < 0) v = 1;
      if (i === N - 1 && d > 0) v = 1;
      var key = v.toFixed(3) + '|' + d.toFixed(3);
      if (last[i] === key) return;
      last[i] = key;
      sc.style.opacity = v.toFixed(3);
      sc.classList.toggle('on', v > 0.6);
      var dx = clamp(d, -0.6, 0.6) * (narrow ? W * 0.25 : W * 0.14);
      figs[i].style.transform = 'translateX(calc(-50% + ' + (-dx).toFixed(1) + 'px))';
      txts[i].style.transform = narrow ? 'translateY(' + (-d * 36).toFixed(1) + 'px)' : 'translateY(calc(-50% + ' + (-d * 36).toFixed(1) + 'px))';
    });
    bgs[1].style.opacity = scenes.length > 1 ? smooth((s - 0.65) / 0.35).toFixed(3) : 0;
    bgs[2].style.opacity = scenes.length > 2 ? smooth((s - 1.65) / 0.35).toFixed(3) : 0;
  }

  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { last = []; schedule(); });
  reduce.addEventListener && reduce.addEventListener('change', function () { last = []; schedule(); });

  // Atmen nur, solange die Bühne im Bild ist
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { mk.classList.toggle('live', en[0].isIntersecting); }).observe(stage);
  } else mk.classList.add('live');

  mk.classList.toggle('pinned', !reduce.matches);
  update();
})();
