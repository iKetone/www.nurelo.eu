/* Prototyp A: Fenster-Zoom
   Jede Karte (Fenster) hat eine Tiefe d = Index minus Fortschritt. d = 0 ist die lesbare Karte,
   d > 0 liegt weiter hinten (kleiner, schwächer), d < 0 ist durchflogen (größer, blendet aus).
   Es werden nur transform und opacity geschrieben (Compositor), einmal pro Bild und nur bei Bewegung. */
(function () {
  'use strict';
  var root = document.documentElement;
  var sec = document.getElementById('zm');
  if (!sec) return;
  var layers = [].slice.call(sec.querySelectorAll('.zm-layer'));
  var hint = sec.querySelector('.zm-hint');
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('js');
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  var last = -1, ticking = false, narrow = false;
  function progress() {
    var r = sec.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }
  function draw() {
    ticking = false;
    var p = progress();
    if (Math.abs(p - last) < 0.0004) return;
    last = p;
    var n = layers.length;
    var a = p * (n - 1);
    for (var i = 0; i < n; i++) {
      var d = i - a;
      // Größe: Basis ist 66 % der Layer-Größe bei d = 0, jede Stufe nach hinten halbiert nahezu
      var s = 0.66 * Math.pow(0.52, d);
      var o;
      if (d > 0) o = clamp((3.4 - d) / 1.8, 0, 1);
      else o = clamp((1 + d / 0.95 + 0.16), 0, 1);
      if (i === n - 1 && d <= 0) o = 1;           // die letzte Karte bleibt stehen
      var l = layers[i];
      l.style.opacity = o < 0.01 ? 0 : o.toFixed(3);
      l.style.transform = 'scale(' + s.toFixed(4) + ')';
      l.style.zIndex = n - i;
      // Text nur an der lesbaren Karte: vorausliegende und durchflogene zeigen nur ihren Rahmen
      var ct = d >= 0 ? clamp(1 - d * 2.4, 0, 1) : clamp(1 + d * 2.6, 0, 1);
      l.style.setProperty('--ct', ct.toFixed(3));
      l.classList.toggle('on', o > 0.6 && Math.abs(d) < 0.6);
    }
    if (hint) hint.style.setProperty('--hint', clamp(1 - p * 12, 0, 1).toFixed(3));
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }
  function setup() {
    var on = !mq.matches;
    sec.classList.toggle('pinned', on);
    if (!on) layers.forEach(function (l) { l.style.cssText = ''; l.style.removeProperty('--ct'); });
    last = -1; req();
  }
  mq.addEventListener ? mq.addEventListener('change', setup) : mq.addListener(setup);
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { last = -1; req(); });
  setup();
})();
