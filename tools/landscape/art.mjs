// Zeichnet die Landschaftsebenen (SVG als Text) für den Hero und die Kapitelübergänge. Reines Node, keine Abhängigkeiten.
// Jede Ebene ist eine Silhouette (Hügel oder Berge, darauf Bäume, Häuser), von hinten nach vorn immer dunkler.
import { mix } from '../scenes/iso.mjs';
import { MOTIVE, motiveSeam, motiveHero } from './motive.mjs';

export function prng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function valueNoise(rand) {
  const N = 512, v = Array.from({ length: N }, rand), sm = (t) => t * t * (3 - 2 * t);
  return (x) => { const i = Math.floor(x), f = x - i; const a = v[((i % N) + N) % N], b = v[(((i + 1) % N) + N) % N]; return a + (b - a) * sm(f); };
}
function fbm(n, x, oct = 4, gain = 0.5) { let s = 0, a = 1, fr = 1, t = 0; for (let o = 0; o < oct; o++) { s += a * n(x * fr + o * 31.7); t += a; a *= gain; fr *= 2.03; } return s / t; }
const f1 = (n) => Math.round(n * 10) / 10;

// Höhenlinie: base = mittlere Höhe von oben, amp = Ausschlag, scale = Länge der Wellen, peak = Anteil schroffer Gipfel (0 bis 1)
function ridge(rand, W, o) {
  const n1 = valueNoise(rand), n2 = valueNoise(rand);
  const step = o.step || (o.peak ? 5 : 10), pts = [];
  for (let x = -step; x <= W + step; x += step) {
    const a = (fbm(n1, x / o.scale, o.oct || 4, o.gain || 0.5) - 0.5) * 2;
    const r = 1 - Math.abs((fbm(n2, x / (o.scale * 1.15), 3, 0.55) - 0.5) * 2 * 1.9);
    const y = o.base - o.amp * (a * (1 - (o.peak || 0)) + (o.peak || 0) * (r * 1.1 - 0.35));
    pts.push([x, y]);
  }
  return pts;
}
function ridgePath(pts, H, smooth) {
  let d = `M${f1(pts[0][0])} ${H} L${f1(pts[0][0])} ${f1(pts[0][1])}`;
  if (smooth) for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += ` Q${f1(pts[i][0])} ${f1(pts[i][1])} ${f1(mx)} ${f1(my)}`; }
  else for (let i = 1; i < pts.length; i++) d += ` L${f1(pts[i][0])} ${f1(pts[i][1])}`;
  return d + ` L${f1(pts[pts.length - 1][0])} ${H} Z`;
}
const yAt = (pts, x) => { const i = Math.max(0, Math.min(pts.length - 2, Math.floor((x - pts[0][0]) / (pts[1][0] - pts[0][0])))); const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t; };

// Nadelbaum aus gestapelten Dreiecken
function fir(x, y, h, w, rand) {
  const tiers = h > 70 ? 6 : h > 38 ? 5 : 4, th = (h * 0.95) / (tiers * 0.62 + 0.38);
  let d = `M${f1(x - w * 0.06)} ${f1(y + 3)} L${f1(x - w * 0.06)} ${f1(y - h * 0.12)} L${f1(x + w * 0.06)} ${f1(y - h * 0.12)} L${f1(x + w * 0.06)} ${f1(y + 3)}Z`;
  for (let i = 0; i < tiers; i++) {
    const top = y - h + i * th * 0.62, ww = w * (0.42 + 0.58 * (i / (tiers - 1))) * (0.92 + rand() * 0.16), lean = (rand() - 0.5) * w * 0.05;
    d += `M${f1(x + lean)} ${f1(top)} L${f1(x - ww / 2)} ${f1(top + th)} L${f1(x + ww / 2)} ${f1(top + th)}Z`;
  }
  return d;
}
// Laubbaum: Stamm und drei Kugeln
function round(x, y, h, rand) {
  const r = h * 0.34, cy = y - h + r;
  const c = (cx, cyy, rr) => `M${f1(cx - rr)} ${f1(cyy)} a${f1(rr)} ${f1(rr)} 0 1 0 ${f1(rr * 2)} 0 a${f1(rr)} ${f1(rr)} 0 1 0 ${f1(-rr * 2)} 0Z`;
  return `M${f1(x - 1.6)} ${f1(y + 3)} L${f1(x - 1.6)} ${f1(y - h * 0.4)} L${f1(x + 1.6)} ${f1(y - h * 0.4)} L${f1(x + 1.6)} ${f1(y + 3)}Z` + c(x, cy, r) + c(x - r * 0.7, cy + r * 0.45, r * 0.78) + c(x + r * 0.7, cy + r * 0.4, r * 0.8);
}
// Haus mit Satteldach, Fenster getrennt (leuchten)
function house(x, y, s, rand) {
  const w = 26 * s * (0.9 + rand() * 0.3), h = 17 * s, rh = 12 * s;
  return { body: `M${f1(x)} ${f1(y + 3)} L${f1(x)} ${f1(y - h)} L${f1(x + w / 2)} ${f1(y - h - rh)} L${f1(x + w)} ${f1(y - h)} L${f1(x + w)} ${f1(y + 3)}Z M${f1(x + w * 0.72)} ${f1(y - h - rh * 0.55)} l${f1(4 * s)} 0 l0 ${f1(-9 * s)} l${f1(-4 * s)} 0Z`, win: [[x + w * 0.2, y - h * 0.7, w * 0.22, h * 0.34], [x + w * 0.58, y - h * 0.7, w * 0.22, h * 0.34]], w };
}

// Eine Ebene als eigenes SVG. o: color, top (hellerer Ton am Grat), ridge{...}, trees{kind, density, hmin, hmax, wr}, houses{n, s}, smooth, extra(svg), W, H
export function layerSvg(o, seed) {
  const W = o.W || 1600, H = o.H || 620, rand = prng(seed);
  const pts = ridge(rand, W, o.ridge);
  const gid = 'g' + seed;
  const grad = `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.top || o.color}"/><stop offset=".55" stop-color="${o.color}"/></linearGradient>`;
  let body = `<path d="${ridgePath(pts, H, o.smooth !== false && !o.ridge.peak)}" fill="url(#${gid})"/>`, extra = '';
  const t = o.trees;
  if (t) {
    let d = '';
    const cl = valueNoise(rand);
    for (let x = 6; x < W; x += t.gap ? t.gap * (0.6 + rand() * 0.9) : 7 + rand() * 16) {
      const clump = Math.max(0, Math.min(1, (fbm(cl, x / 110, 2, 0.5) - 0.28) * 2.6));
      if (rand() > t.density * (0.25 + 0.95 * clump)) continue;
      const h = t.hmin + rand() * (t.hmax - t.hmin);
      // an Hängen und auf Graten stehen
      const tree = t.kind === 'round' ? round(x, yAt(pts, x) + 2, h, rand) : fir(x, yAt(pts, x) + 2, h, h * (t.wr || 0.46), rand);
      if (!(t.skip && x > t.skip[0] && x < t.skip[1])) d += tree; // Lücke erst nach dem Zeichnen, damit die Zufallsfolge gleich bleibt
    }
    body += `<path d="${d}" fill="${o.top || o.color}"/>`;
  }
  if (o.houses) {
    let d = '', win = '', nodes = [];
    for (let i = 0; i < o.houses.n; i++) {
      const x = o.houses.x0 + (W * o.houses.span * i) / Math.max(1, o.houses.n - 1) + (rand() - 0.5) * 60;
      const hs = house(x, yAt(pts, x + 12) + 2, o.houses.s * (0.85 + rand() * 0.35), rand);
      d += hs.body;
      hs.win.forEach(([wx, wy, ww, wh], wi) => {
        const on = rand() < 0.75 || o.houses.all; // all: alle Fenster leuchten (Vorschau ?motive)
        if (!on) return;
        const hi = o.houses.hi === i; // hi: dieses Haus hat ein besonders helles Fenster
        if (hi && wi === 0) win += `<rect x="${f1(wx - 4)}" y="${f1(wy - 4)}" width="${f1(ww + 8)}" height="${f1(wh + 8)}" rx="4" fill="#ffe9a8" opacity=".3"/>`;
        win += `<rect x="${f1(wx)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}" rx="1" fill="${hi ? '#fff3c4' : o.houses.light || '#ffd98a'}"/>`;
        if (o.houses.link && wi === 0) nodes.push([wx + ww / 2, wy + wh / 2]);
      });
    }
    body += `<path d="${d}" fill="${o.color}"/>` + win;
    if (nodes.length > 1) { // Leitungen: hängende Kurven von Fenster zu Fenster, an den Fenstern ein Schein
      nodes.sort((a, b) => a[0] - b[0]);
      let c = `M${f1(nodes[0][0])} ${f1(nodes[0][1])}`;
      for (let i = 1; i < nodes.length; i++) c += ` Q${f1((nodes[i - 1][0] + nodes[i][0]) / 2)} ${f1((nodes[i - 1][1] + nodes[i][1]) / 2 + o.houses.link)} ${f1(nodes[i][0])} ${f1(nodes[i][1])}`;
      body += `<path d="${c}" fill="none" stroke="${o.houses.light || '#ffd98a'}" stroke-width="1.3" opacity=".55"/>` + nodes.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="${o.houses.light || '#ffd98a'}" opacity=".2"/>`).join('');
    }
  }
  // Haken für die Motive (Vorschau ?motive): back liegt hinter der Silhouette (Sonne, Mond, Sterne), extra davor. Eigene Zufallsfolge, die Silhouette bleibt gleich.
  const r2 = prng((seed ^ 0x5bd1e995) >>> 0);
  const back = o.back ? o.back(r2, pts, W, H) : '';
  if (o.extra) extra = o.extra(r2, pts, W, H);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice"><defs>${grad}</defs>${back}${body}${extra}</svg>`;
}

// ---------- Hero: Morgenlandschaft in sieben Ebenen, von hellem Creme hinten bis zum Oliv des ersten Kapitels vorn ----------
export const HERO = {
  W: 1600, H: 640,
  layers: [
    { color: '#ecdcb9', top: '#f4e8cb', ridge: { base: 245, amp: 120, scale: 230, peak: 0.55, oct: 4 } },
    { color: '#dec99a', top: '#e8d6ac', ridge: { base: 305, amp: 95, scale: 175, peak: 0.45, oct: 4 } },
    { color: '#c8b784', top: '#d4c496', ridge: { base: 350, amp: 62, scale: 150, oct: 4 }, trees: { kind: 'fir', density: 0.55, hmin: 18, hmax: 36 } },
    { color: '#abA46a', top: '#b6b076', ridge: { base: 392, amp: 56, scale: 120, oct: 4 }, trees: { kind: 'fir', density: 0.62, hmin: 30, hmax: 56 } },
    { color: '#868150', top: '#908b5a', ridge: { base: 436, amp: 52, scale: 100, oct: 4 }, trees: { kind: 'fir', density: 0.68, hmin: 46, hmax: 80 }, houses: { n: 2, x0: 330, span: 0.55, s: 0.9, light: '#ffe3a1' } },
    { color: '#6b6641', top: '#726d46', ridge: { base: 488, amp: 46, scale: 92, oct: 4 }, trees: { kind: 'fir', density: 0.72, hmin: 66, hmax: 118 }, houses: { n: 1, x0: 1180, span: 0, s: 1.25, light: '#ffe3a1' } },
    { color: '#5a5533', top: '#5a5533', ridge: { base: 556, amp: 34, scale: 84, oct: 4 }, trees: { kind: 'fir', density: 0.3, hmin: 110, hmax: 190, gap: 70 } },
  ],
  speeds: [0.04, 0.08, 0.16, 0.28, 0.46, 0.7, 1.12], // die vorderste steigt etwas weiter als das Kapitel (siehe land.css, land-rise)
};
export function heroLayers(mot = false) {
  const os = HERO.layers.map((l, i) => ({ ...l, ridge: { ...l.ridge }, trees: l.trees && { ...l.trees }, W: HERO.W, H: HERO.H }));
  if (mot) os.forEach((o, i) => { const seed = 101 + i * 17; motiveHero(i, o, { yAt, round, pts: ridge(prng(seed), HERO.W, o.ridge) }); });
  return os.map((o, i) => layerSvg(o, 101 + i * 17));
}

// Himmelsebene: weiche Wolkenbänke und ein paar Vögel (fast unbeweglich)
export function heroSky() {
  const rand = prng(77), W = HERO.W, H = HERO.H;
  const cloud = (cx, cy, w, h, col, op) => {
    let d = '';
    const n = 5 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) { const t = i / (n - 1), rx = w * (0.16 + 0.16 * Math.sin(t * Math.PI)) * (0.8 + rand() * 0.4), ry = h * (0.5 + 0.5 * Math.sin(t * Math.PI)) * (0.7 + rand() * 0.4); d += `<ellipse cx="${f1(cx - w / 2 + t * w)}" cy="${f1(cy - ry * 0.3)}" rx="${f1(rx)}" ry="${f1(ry)}"/>`; }
    return `<g fill="${col}" opacity="${op}">${d}<rect x="${f1(cx - w / 2)}" y="${f1(cy - 1)}" width="${f1(w)}" height="${f1(h * 0.34)}" rx="${f1(h * 0.17)}"/></g>`;
  };
  let svg = cloud(300, 250, 380, 60, '#f7e6c2', 0.7) + cloud(1290, 200, 420, 70, '#f6e3bb', 0.75) + cloud(980, 300, 260, 40, '#f4dcae', 0.6) + cloud(520, 150, 240, 36, '#f9eed4', 0.7);
  for (const [x, y, s] of [[640, 170, 1], [690, 140, 0.8], [760, 190, 0.9], [1010, 130, 0.7], [1070, 160, 0.85]]) svg += `<path d="M${x - 9 * s} ${y} q${4.5 * s} ${-6 * s} ${9 * s} 0 q${4.5 * s} ${-6 * s} ${9 * s} 0" fill="none" stroke="#8a7a52" stroke-width="${f1(1.6 * s)}" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">${svg}</svg>`;
}

// ---------- Nähte zwischen zwei Kapiteln: drei Zwischenebenen, die vorderste hat die Farbe des neuen Kapitels ----------
export const SEAMS = {
  am: { from: '#5a5533', to: '#c59045', motif: 'round' },   // Stationär (Oliv) zu Ambulant (Ocker): Felder im Nachmittagslicht
  hn: { from: '#c59045', to: '#9e4e2e', motif: 'house' },   // Ambulant zu Hausnotruf (Terra): Dorf am Abend, Fenster leuchten
  pf: { from: '#9e4e2e', to: '#241b14', motif: 'fir' },     // Hausnotruf zu Plattform (Nacht): Nadelwald im Dämmern
  ab: { from: '#241b14', to: '#f2eadd', motif: 'mist' },    // Plattform zu Ablauf (Creme): Morgennebel über dunklen Kämmen
  // Produktseiten: vom Seitenkopf in der Produktfarbe zur Szene auf Creme
  'p-st': { from: '#5a5533', to: '#f2eadd', motif: 'fir' },
  'p-am': { from: '#c59045', to: '#f2eadd', motif: 'round' },
  'p-hn': { from: '#9e4e2e', to: '#f2eadd', motif: 'house' },
};
export const SEAM_SPEEDS = [0.14, 0.34, 0.62, 1];
// mot: Vorschau ?motive mit den neuen Motiven (motive.mjs); ohne mot bleibt alles wie es war
export function seamLayers(id, mot = false) {
  const s = SEAMS[id], W = 1600, H = 300, ts = [0.24, 0.48, 0.74, 1];
  const col = (t) => mix(s.from, s.to, t);
  // Läuft die Naht in eine helle Fläche, tragen nur die hinteren Ebenen Bäume; helle Bäume vor dunklem Grund sähen wie Schnee aus
  const light = (() => { const h = mix(s.to, '#000000', 0); const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7; })();
  const base = [78, 118, 160, 214], amp = [44, 40, 34, 28], scale = [260, 190, 140, 110];
  const seed = (k) => 500 + k * 13 + id.charCodeAt(0);
  const os = ts.map((t, k) => {
    const color = col(t), top = mix(color, '#ffffff', k === 3 ? 0 : 0.07);
    const o = { W, H, color, top, ridge: { base: base[k], amp: amp[k], scale: scale[k], peak: k === 0 && s.motif !== 'mist' ? 0.4 : 0, oct: 4 } };
    if (s.motif === 'fir') o.trees = { kind: 'fir', density: [0.35, 0.55, 0.7, 0.42][k], hmin: [12, 22, 36, 64][k], hmax: [22, 38, 62, 110][k], gap: k === 3 ? 56 : undefined };
    if (s.motif === 'round') o.trees = k === 0 ? null : { kind: 'round', density: [0, 0.35, 0.45, 0.3][k], hmin: [0, 16, 26, 44][k], hmax: [0, 26, 40, 78][k], gap: k === 3 ? 60 : undefined };
    if (s.motif === 'house') { if (k >= 1) o.trees = { kind: 'fir', density: [0, 0.4, 0.5, 0.3][k], hmin: [0, 18, 28, 52][k], hmax: [0, 30, 48, 90][k], gap: k === 3 ? 70 : undefined }; if (k === 2) o.houses = { n: 9, x0: 90, span: 0.9, s: 1.15, light: '#ffd98a' }; if (k === 1) o.houses = { n: 7, x0: 140, span: 0.85, s: 0.7, light: '#f3c97a' }; }
    if (s.motif === 'mist') { o.ridge.amp = [60, 40, 26, 18][k]; o.ridge.scale = [200, 260, 300, 340][k]; if (k === 0) o.trees = { kind: 'fir', density: 0.5, hmin: 14, hmax: 30 }; }
    if (light && k >= 2) { delete o.trees; if (k === 2 && o.houses) o.houses.s *= 0.8; }
    return o;
  });
  if (mot && MOTIVE[id]) {
    const ptsOf = (j) => ridge(prng(seed(j)), W, os[j].ridge);
    os.forEach((o, k) => motiveSeam(MOTIVE[id], k, o, { W, H, k, color: o.color, light, yAt, pts: ptsOf(k), ptsOf, round }));
  }
  return os.map((o, k) => layerSvg(o, seed(k)));
}
