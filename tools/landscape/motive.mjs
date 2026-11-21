// Motive der Landschaft: Pflegeauto auf der Landstraße, Funkmast mit Signal, Mond und Sterne, Netz aus Fenstern,
// Sonnenaufgang mit Pfad und vier Wegmarken, Obstwiese mit Bank und Hochbeeten. Reines Node, keine Abhängigkeiten.
// Jede Funktion liefert SVG-Text; motiveSeam und motiveHero hängen sie an die Ebenen (Haken o.back vor, o.extra nach der Silhouette).
import { mix } from '../scenes/iso.mjs';

const f1 = (n) => Math.round(n * 10) / 10;
const rad = (d) => (d * Math.PI) / 180;

// ---------- Himmel ----------
export function moon(x, y, r, col = '#f6ecd2') {
  return `<circle cx="${x}" cy="${y}" r="${f1(r * 2.8)}" fill="${col}" opacity=".07"/><circle cx="${x}" cy="${y}" r="${f1(r * 1.8)}" fill="${col}" opacity=".1"/>`
    + `<path d="M${x} ${f1(y - r)}A${r} ${r} 0 0 0 ${x} ${f1(y + r)}A${f1(r * 1.35)} ${f1(r * 1.35)} 0 0 1 ${x} ${f1(y - r)}Z" fill="${col}"/>`;
}
// Sterne über dem Grat: runde und ein paar vierzackige
export function stars(rand, yAt, pts, n, x0, x1, yTop, col, op = 0.8) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + rand() * (x1 - x0), room = yAt(pts, x) - 8 - yTop, r = 0.8 + rand() * 1.2, big = rand() < 0.22;
    if (room < 6) continue;
    const y = yTop + rand() * room, o = f1(op * (0.55 + rand() * 0.45));
    s += big
      ? `<path d="M${f1(x)} ${f1(y - r * 3.2)}L${f1(x + r * 0.7)} ${f1(y - r * 0.7)}L${f1(x + r * 3.2)} ${f1(y)}L${f1(x + r * 0.7)} ${f1(y + r * 0.7)}L${f1(x)} ${f1(y + r * 3.2)}L${f1(x - r * 0.7)} ${f1(y + r * 0.7)}L${f1(x - r * 3.2)} ${f1(y)}L${f1(x - r * 0.7)} ${f1(y - r * 0.7)}Z" fill="${col}" opacity="${o}"/>`
      : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${col}" opacity="${o}"/>`;
  }
  return s;
}
// Sonne am Horizont: Schein und halbe Scheibe, der Grat der Ebene davor schneidet sie ab
export function sun(x, y, r) {
  const gr = Math.min(r * 5.2, y - 4); // der Schein klingt aus, bevor er den oberen Rand des Bildes erreicht (sonst bliebe dort eine harte Kante)
  return `<defs><radialGradient id="sg${x}"><stop offset="0" stop-color="#ffd48a" stop-opacity=".62"/><stop offset=".45" stop-color="#e9a55a" stop-opacity=".26"/><stop offset="1" stop-color="#e9a55a" stop-opacity="0"/></radialGradient></defs>`
    + `<circle cx="${x}" cy="${y}" r="${f1(gr)}" fill="url(#sg${x})"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffe3a8"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.72)}" fill="#fff1c9"/>`;
}

// ---------- Funk und Licht ----------
// Gittermast mit Signalwellen und Positionslicht
export function mast(x, y, h, col) {
  const w = h * 0.1, top = y - h;
  let d = `M${f1(x - w)} ${y}L${f1(x - 0.8)} ${f1(top)}M${f1(x + w)} ${y}L${f1(x + 0.8)} ${f1(top)}`;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const ya = y - (h * i) / n, yb = y - (h * (i + 1)) / n, wa = w * (1 - i / n), wb = w * (1 - (i + 1) / n);
    d += `M${f1(x - wa)} ${f1(ya)}L${f1(x + wb)} ${f1(yb)}M${f1(x + wa)} ${f1(ya)}L${f1(x - wb)} ${f1(yb)}`;
  }
  const cy = top - 12;
  let waves = '';
  [[12, 0.62], [22, 0.4], [33, 0.22]].forEach(([r, o]) => {
    const a = rad(58), dx = r * Math.sin(a), dy = r * Math.cos(a);
    waves += `<path d="M${f1(x - dx)} ${f1(top - dy + 2)}A${r} ${r} 0 0 1 ${f1(x + dx)} ${f1(top - dy + 2)}" fill="none" stroke="#ffe3a1" stroke-width="1.7" stroke-linecap="round" opacity="${o}"/>`;
  });
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.7" stroke-linecap="round"/>`
    + `<path d="M${x} ${f1(top)}L${x} ${f1(top - 9)}" stroke="${col}" stroke-width="1.7" stroke-linecap="round"/>`
    + `<circle cx="${x}" cy="${f1(top - 9)}" r="7" fill="#ffcf70" opacity=".28"/><circle cx="${x}" cy="${f1(top - 9)}" r="2.6" fill="#ffd98a"/>` + waves;
}
// Straßenlaterne mit warmem Schein
export function lamp(x, y, h, col) {
  const hy = y - h;
  return `<circle cx="${f1(x + 9)}" cy="${f1(hy + 10)}" r="22" fill="#ffd98a" opacity=".16"/><circle cx="${f1(x + 9)}" cy="${f1(hy + 8)}" r="11" fill="#ffd98a" opacity=".26"/>`
    + `<path d="M${f1(x - 1.3)} ${y}L${f1(x - 1.3)} ${f1(hy + 5)}Q${f1(x - 1.3)} ${f1(hy)} ${f1(x + 6)} ${f1(hy)}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>`
    + `<path d="M${f1(x + 4)} ${f1(hy - 1)}h10l-1.8 5h-6.4z" fill="${col}"/><rect x="${f1(x + 6)}" y="${f1(hy + 4)}" width="6" height="2" rx="1" fill="#ffe6a8"/>`;
}

// ---------- Land ----------
// Pflegeauto, Seitenansicht (Nullpunkt: Mitte der Standfläche), rot mit hellem Streifen und Dachschild
export function car(x, y, s, body = '#9e4e2e', trim = '#f4ead2', rot = 0) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${s})">`
    + `<ellipse cx="0" cy="0.4" rx="25" ry="2.2" fill="#000" opacity=".18"/>`
    + `<path d="M-23-4.5V-9.5Q-23-11.5-20-11.5H-12.5L-8.5-17.5H9.5L14.5-11.5H21.5Q24.5-11.5 24.5-8.5V-4.5Z" fill="${body}"/>`
    + `<path d="M-6.8-11.5L-3.8-15.6H0.2V-11.5ZM2.2-11.5V-15.6H8L11.6-11.5Z" fill="#f1e6cd" opacity=".92"/>`
    + `<rect x="-22.5" y="-8" width="46" height="1.7" fill="${trim}" opacity=".9"/>`
    + `<rect x="-1.8" y="-20.4" width="7" height="2.6" rx="1" fill="${trim}"/>`
    + `<circle cx="-14" cy="-3.4" r="3.8" fill="#2b211a"/><circle cx="14" cy="-3.4" r="3.8" fill="#2b211a"/><circle cx="-14" cy="-3.4" r="1.4" fill="#cdbf9f"/><circle cx="14" cy="-3.4" r="1.4" fill="#cdbf9f"/>`
    + `<rect x="21.4" y="-9.6" width="3" height="2" rx="1" fill="#ffe3a1"/></g>`;
}
// Strohballen, rund, von der Seite
export function bale(x, y, r, col, line) {
  return `<ellipse cx="${f1(x)}" cy="${f1(y + 0.5)}" rx="${f1(r * 1.15)}" ry="${f1(r * 0.28)}" fill="#000" opacity=".14"/>`
    + `<circle cx="${f1(x)}" cy="${f1(y - r)}" r="${f1(r)}" fill="${col}"/><circle cx="${f1(x)}" cy="${f1(y - r)}" r="${f1(r * 0.64)}" fill="none" stroke="${line}" stroke-width="1" opacity=".55"/><circle cx="${f1(x)}" cy="${f1(y - r)}" r="${f1(r * 0.28)}" fill="none" stroke="${line}" stroke-width="1" opacity=".55"/>`;
}
// Wegweiser mit zwei Schildern
export function signpost(x, y, s, col) {
  return `<rect x="${f1(x - 1.3 * s)}" y="${f1(y - 32 * s)}" width="${f1(2.6 * s)}" height="${f1(32 * s)}" fill="${col}"/>`
    + `<path d="M${f1(x - 1.3 * s)} ${f1(y - 31 * s)}h${f1(16 * s)}l${f1(4.2 * s)} ${f1(3.4 * s)}l${f1(-4.2 * s)} ${f1(3.4 * s)}h${f1(-16 * s)}z" fill="${col}"/>`
    + `<path d="M${f1(x + 1.3 * s)} ${f1(y - 22 * s)}h${f1(-14 * s)}l${f1(-4.2 * s)} ${f1(3.2 * s)}l${f1(4.2 * s)} ${f1(3.2 * s)}h${f1(14 * s)}z" fill="${col}"/>`;
}
// Gewundene Straße am Hang: folgt dem Grat in festem Abstand, mit Mittellinie
export function hillRoad(yAt, pts, x0, x1, drop, color, line, w) {
  const top = [], bot = [];
  for (let x = x0; x <= x1; x += 12) {
    const y = yAt(pts, x) + drop + 9 * Math.sin(x / 70);
    top.push([x, y - w / 2]); bot.push([x, y + w / 2]);
  }
  const d = `M${top.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}L${bot.reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}Z`;
  const mid = []; for (let x = x0; x <= x1; x += 12) mid.push([x, yAt(pts, x) + drop + 9 * Math.sin(x / 70)]);
  return `<path d="${d}" fill="${color}"/><path d="M${mid.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}" fill="none" stroke="${line}" stroke-width="1.1" stroke-dasharray="7 6" opacity=".7"/>`;
}
// Feldstreifen unter dem Grat: sanft gebogene Bänder in zwei Tönen
export function fieldBands(yAt, pts, x0, x1, c1, c2, n = 3, start = 16, gap = 15) {
  let s = '';
  for (let b = 0; b < n; b++) {
    const top = [], bot = [];
    for (let x = x0; x <= x1; x += 16) { top.push([x, yAt(pts, x) + start + b * gap]); bot.push([x, yAt(pts, x) + start + b * gap + gap * 0.55]); }
    s += `<path d="M${top.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}L${bot.reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}Z" fill="${b % 2 ? c1 : c2}" opacity=".5"/>`;
  }
  return s;
}

// ---------- Garten ----------
export function bench(x, y, s, col) {
  return `<rect x="${f1(x - 12 * s)}" y="${f1(y - 8.5 * s)}" width="${f1(24 * s)}" height="${f1(2.6 * s)}" rx="${f1(0.8 * s)}" fill="${col}"/>`
    + `<rect x="${f1(x - 12 * s)}" y="${f1(y - 16.5 * s)}" width="${f1(24 * s)}" height="${f1(2.2 * s)}" rx="${f1(0.8 * s)}" fill="${col}"/>`
    + `<rect x="${f1(x - 11 * s)}" y="${f1(y - 16.5 * s)}" width="${f1(1.8 * s)}" height="${f1(8 * s)}" fill="${col}"/><rect x="${f1(x + 9.2 * s)}" y="${f1(y - 16.5 * s)}" width="${f1(1.8 * s)}" height="${f1(8 * s)}" fill="${col}"/>`
    + `<rect x="${f1(x - 10 * s)}" y="${f1(y - 6 * s)}" width="${f1(2 * s)}" height="${f1(6.4 * s)}" fill="${col}"/><rect x="${f1(x + 8 * s)}" y="${f1(y - 6 * s)}" width="${f1(2 * s)}" height="${f1(6.4 * s)}" fill="${col}"/>`;
}
export function bed(x, y, w, h, wood, leaf) {
  let t = '';
  for (let i = 0; i < 5; i++) t += `<ellipse cx="${f1(x + (w * (i + 0.5)) / 5)}" cy="${f1(y - h - 1.6)}" rx="${f1(w / 11)}" ry="${f1(2.8 + (i % 2))}" fill="${leaf}"/>`;
  return `<rect x="${f1(x)}" y="${f1(y - h)}" width="${f1(w)}" height="${f1(h)}" rx="1.2" fill="${wood}"/>` + t;
}
// Apfelbaum: runde Krone (wie die Laubbäume der Ebenen) mit roten Früchten
export function appleTree(roundFn, rand, x, y, h, col, fruit) {
  const r = h * 0.34, cy = y - h + r;
  let dots = '';
  for (let i = 0; i < 7; i++) { const a = rand() * Math.PI * 2, d = rand() * r * 0.95; dots += `<circle cx="${f1(x + Math.cos(a) * d * 1.2)}" cy="${f1(cy + Math.sin(a) * d * 0.9 + r * 0.25)}" r="${f1(1.5 + rand() * 0.6)}" fill="${fruit}"/>`; }
  return `<path d="${roundFn(x, y, h, rand)}" fill="${col}"/>` + dots;
}

// ---------- Pfad mit vier Wegmarken (Ablauf) ----------
// Eine Kurve für alle Ebenen: in Ruhelage setzen sich ihre Stücke zu einem Weg zusammen, der sich von der Sonne nach vorn schlängelt
const pathX = (y) => 800 + 74 * Math.sin((y - 66) / 58);
const pathW = (y) => 1.6 + Math.max(0, y - 60) * 0.125;
export function pathRibbon(yAt, pts, color, fade = false) {
  const L = [], R = [];
  let started = false;
  for (let y = 40; y <= 300; y += 4) {
    const x = pathX(y);
    if (!started && y < yAt(pts, x) + 2) continue;
    started = true;
    L.push([x - pathW(y), y]); R.push([x + pathW(y), y]);
  }
  if (L.length < 2) return '';
  const d = `M${L.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}L${R.reverse().map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}Z`;
  if (!fade) return `<path d="${d}" fill="${color}"/>`;
  return `<defs><linearGradient id="pf" gradientUnits="userSpaceOnUse" x1="0" y1="190" x2="0" y2="298"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d}" fill="url(#pf)"/>`;
}
export function marker(x, y, s, n, post, sign, dot) {
  const cy = y - 31 * s, r = 7.4 * s, pos = { 1: [[0, 0]], 2: [[-2.2, 0], [2.2, 0]], 3: [[0, -2.2], [-2.4, 1.8], [2.4, 1.8]], 4: [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]] }[n];
  return `<path d="M${f1(x)} ${f1(y)}L${f1(x)} ${f1(cy)}" stroke="${post}" stroke-width="${f1(2 * s)}" stroke-linecap="round"/><circle cx="${f1(x)}" cy="${f1(cy)}" r="${f1(r)}" fill="${sign}"/>`
    + pos.map(([dx, dy]) => `<circle cx="${f1(x + dx * s)}" cy="${f1(cy + dy * s)}" r="${f1(1.25 * s)}" fill="${dot}"/>`).join('');
}

const lum = (hex) => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
export { lum };

// Welche Ebene trägt welches Motiv. Gilt für die Naht und die gleichfarbige Naht der Produktseite.
//   ctx: { W, H, k, color, light, yAt, pts[k], ptsOf(j), round }
export const MOTIVE = {
  am: 'road', 'p-am': 'road',
  hn: 'signal', 'p-hn': 'signal',
  pf: 'net',
  ab: 'dawn',
  'p-st': 'garden',
};

export function motiveSeam(kind, k, o, ctx) {
  const { yAt, pts, color } = ctx, dark = lum(color) < 0.55;
  const ink = mix(color, '#1c130c', dark ? 0.5 : 0.62);
  if (kind === 'road') {
    if (k === 1) o.extra = () => fieldBands(yAt, pts, 120, 1500, mix(color, '#f0cf86', 0.32), mix(color, '#5a5533', 0.22), 3) + bale(640, yAt(pts, 640) + 24, 8, mix(color, '#f3dc9c', 0.5), mix(color, '#7a5a2a', 0.5)) + bale(1010, yAt(pts, 1010) + 30, 9, mix(color, '#f3dc9c', 0.5), mix(color, '#7a5a2a', 0.5)) + bale(1042, yAt(pts, 1042) + 31, 8, mix(color, '#f3dc9c', 0.5), mix(color, '#7a5a2a', 0.5));
    if (k === 2) o.extra = () => {
      const road = hillRoad(yAt, pts, 380, 1320, 30, mix(color, dark ? '#fff2cf' : '#8a5f17', dark ? 0.36 : 0.26), '#fff6df', 12);
      const cx = 850, cy = yAt(pts, cx) + 30 + 9 * Math.sin(cx / 70), cy2 = yAt(pts, cx + 6) + 30 + 9 * Math.sin((cx + 6) / 70);
      return road + car(cx, cy + 4, 1.0, '#9e4e2e', '#f4ead2', (Math.atan2(cy2 - cy, 6) * 180) / Math.PI);
    };
    if (k === 3) o.extra = () => signpost(990, yAt(pts, 990) + 4, 0.95, mix(color, '#2a1f0c', 0.7));
  }
  if (kind === 'signal') {
    if (k === 0) o.back = (r) => moon(1010, 44, 14) + stars(r, yAt, pts, 16, 470, 1130, 14, '#f6ecd2', 0.85);
    if (k === 2) { o.houses && (o.houses.hi = 4); o.extra = () => mast(700, yAt(pts, 700) + 2, 112, ink); }
    if (k === 3) o.extra = () => lamp(930, yAt(pts, 930) + 3, 40, mix(color, '#1a0e08', 0.7));
  }
  if (kind === 'net') {
    if (k === 0) o.back = (r) => moon(1030, 48, 15) + stars(r, yAt, pts, 30, 470, 1130, 12, '#f6ecd2', 0.9);
    if (k === 1) { o.trees = null; o.houses = { n: 7, x0: 120, span: 0.86, s: 0.72, light: '#ffd98a', all: true, link: 12 }; }
    if (k === 2) { o.trees = null; o.houses = { n: 8, x0: 90, span: 0.9, s: 1.08, light: '#ffd98a', all: true, link: 18 }; }
  }
  if (kind === 'dawn') {
    const pathCol = mix(color, '#fff7e6', k === 3 ? 0.3 : 0.62);
    if (k === 0) o.back = () => sun(800, yAt(pts, 800) + 6, 30);
    const ptsNext = k < 3 ? ctx.ptsOf(k + 1) : null;
    o.extra = () => {
      let y = null;
      for (let t = 60; t <= 280; t += 2) { const x = pathX(t), top = yAt(pts, x) + 14; if (t > top && (!ptsNext || t < yAt(ptsNext, x) - 12)) { y = t; break; } }
      if (y === null) y = k === 3 ? 262 : yAt(pts, pathX(120)) + 24;
      return pathRibbon(yAt, pts, pathCol, k === 3) + marker(pathX(y) + pathW(y) + 7 + k * 2, y + 2, [0.5, 0.7, 0.95, 1.3][k], k + 1, mix(color, '#1c130c', 0.6), '#9e4e2e', '#f6ecd8');
    };
  }
  if (kind === 'garden') {
    if (k === 1) o.trees = { kind: 'round', density: 0.3, hmin: 16, hmax: 28 };
    if (k === 1) o.extra = (r) => appleTree(ctx.round, r, 560, yAt(pts, 560) + 3, 44, mix(color, '#2f3a14', 0.4), '#c9553a') + appleTree(ctx.round, r, 640, yAt(pts, 640) + 3, 34, mix(color, '#2f3a14', 0.4), '#c9553a') + appleTree(ctx.round, r, 1010, yAt(pts, 1010) + 3, 40, mix(color, '#2f3a14', 0.4), '#c9553a');
    if (k === 2) o.extra = (r) => {
      const wood = mix(color, '#4a3418', 0.55), leaf = mix(color, '#43611f', 0.55);
      return appleTree(ctx.round, r, 760, yAt(pts, 760) + 4, 70, mix(color, '#2f3a14', 0.5), '#c9553a') + bench(805, yAt(pts, 805) + 5, 1.15, mix(color, '#3a2c14', 0.7))
        + bed(900, yAt(pts, 900) + 8, 40, 10, wood, leaf) + bed(950, yAt(pts, 950) + 8, 40, 10, wood, leaf) + bed(1000, yAt(pts, 1000) + 8, 40, 10, wood, leaf);
    };
  }
}

// Hero: Auf dem vordersten Boden, der beim Überfahren ins Bild steigt, entsteht eine kleine Lichtung mit Apfelbaum, Bank und Hochbeeten
// (das Haus im Grünen, bevor das Kapitel Stationär beginnt). Davor liegt im Ruhezustand das App-Fenster, daher erst beim Aufsteigen zu sehen.
export function motiveHero(i, o, ctx) {
  if (i !== 6) return;
  const { yAt, pts } = ctx;
  o.trees = { ...o.trees, skip: [640, 900] };
  o.extra = (r) => {
    const wood = '#6d4d2c', leaf = '#8b9b4d';
    return appleTree(ctx.round, r, 690, yAt(pts, 690) + 4, 112, '#5a5533', '#d0603f') + bench(765, yAt(pts, 765) + 6, 1.7, '#3a3620')
      + bed(822, yAt(pts, 822) + 10, 46, 13, wood, leaf) + bed(878, yAt(pts, 878) + 10, 46, 13, wood, leaf);
  };
}
