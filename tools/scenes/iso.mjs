// Isometrische Zeichenhilfe für die Szenen auf den Produktseiten (reines Node, keine Abhängigkeiten).
// Weltkoordinaten: x läuft nach rechts unten, y nach links unten, z nach oben. Die Kamera schaut von (+x, +y, +z) auf den Ursprung.
// Sichtbar sind bei einem Quader die Oberseite, die +y-Fläche (links vorn) und die +x-Fläche (rechts vorn).

export const A = 26;   // Pixel je Einheit in x und y (waagerecht)
export const B = 15;   // Pixel je Einheit in x und y (senkrecht)
export const C = 30;   // Pixel je Einheit in z

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
export const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
export const rgb2hex = (c) => '#' + c.map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map((v, i) => v + (y[i] - v) * t)); };
// Flächenfarben eines Quaders: Licht kommt von links oben
export const shades = (base) => ({ top: mix(base, '#ffffff', 0.2), left: base, right: mix(base, '#000000', 0.2) });

const f = (n) => Math.round(n * 10) / 10;

export class Iso {
  constructor() { this.min = [1e9, 1e9]; this.max = [-1e9, -1e9]; this.layers = {}; }

  p(x, y, z = 0) {
    const X = (x - y) * A, Y = (x + y) * B - z * C;
    if (X < this.min[0]) this.min[0] = X; if (Y < this.min[1]) this.min[1] = Y;
    if (X > this.max[0]) this.max[0] = X; if (Y > this.max[1]) this.max[1] = Y;
    return [X, Y];
  }
  // Bildschirmposition, ohne die Grenzen der Zeichnung zu verändern
  peek(x, y, z = 0) { return [(x - y) * A, (x + y) * B - z * C]; }
  pts(list) { return list.map((q) => q.map(f).join(',')).join(' '); }
  poly(list3d, fill, extra = '') {
    const pts = list3d.map(([x, y, z]) => this.p(x, y, z));
    return `<polygon points="${this.pts(pts)}" fill="${fill}" stroke="${fill}" stroke-width=".7" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
  }
  // Fläche ohne Kontur (für Details auf Flächen)
  polyN(list3d, fill, extra = '') {
    const pts = list3d.map(([x, y, z]) => this.p(x, y, z));
    return `<polygon points="${this.pts(pts)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
  }
  line(a, b, stroke, w = 1, extra = '') {
    const p1 = this.p(...a), p2 = this.p(...b);
    return `<line x1="${f(p1[0])}" y1="${f(p1[1])}" x2="${f(p2[0])}" y2="${f(p2[1])}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"${extra ? ' ' + extra : ''}/>`;
  }

  // Quader: (x, y, z) ist die hintere untere Ecke, (w, d, h) die Maße in x, y, z
  box(x, y, z, w, d, h, col, o = {}) {
    const s = o.shade || shades(col);
    const top = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
    const right = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
    const left = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]];
    const svg = `<g>${this.poly(left, o.left || s.left)}${this.poly(right, o.right || s.right)}${this.poly(top, o.top || s.top)}</g>`;
    return { depth: o.depth ?? (x + w + y + d) + z * 0.001 + h * 0.0005, svg };
  }
  // Ebene auf y = const (Rückwand entlang x), von x1..x2 und z1..z2
  planeY(y, x1, x2, z1, z2, fill, extra = '') { return this.polyN([[x1, y, z1], [x2, y, z1], [x2, y, z2], [x1, y, z2]], fill, extra); }
  // Ebene auf x = const (Rückwand entlang y)
  planeX(x, y1, y2, z1, z2, fill, extra = '') { return this.polyN([[x, y1, z1], [x, y2, z1], [x, y2, z2], [x, y1, z2]], fill, extra); }
  // Ebene auf z = const (Boden oder Tischplatte)
  planeZ(z, x1, x2, y1, y2, fill, extra = '') { return this.polyN([[x1, y1, z], [x2, y1, z], [x2, y2, z], [x1, y2, z]], fill, extra); }

  // Ebene zeichnen und sortieren
  add(layer, item) { (this.layers[layer] = this.layers[layer] || []).push(item); }
  flush(layer) { return (this.layers[layer] || []).sort((a, b) => a.depth - b.depth).map((i) => i.svg).join(''); }
  svgOf(item) { return item.svg; }
}

// ---------- einfache Figuren (flach, zum Betrachter gerichtet) ----------
// Fußpunkt bei Bildschirmposition (X, Y). scale 1 = etwa 1,7 Einheiten hoch.
export function person(iso, wx, wy, wz, o = {}) {
  const [X, Y] = iso.p(wx, wy, wz);
  const s = o.s || 1, body = o.body || '#5a5533', skin = o.skin || '#e8c3a0', hair = o.hair || '#3a2a1e', sit = o.sit;
  const h = sit ? 58 : 84, w = 22;           // Rumpf
  const legH = sit ? 14 : 30;
  const parts = [];
  // Schatten
  parts.push(`<ellipse cx="0" cy="2" rx="${w * 0.9}" ry="5.5" fill="#000" opacity=".18"/>`);
  // Beine
  parts.push(`<rect x="${-w / 2 + 2}" y="${-legH}" width="7" height="${legH}" rx="3" fill="${o.legs || '#2b2218'}"/><rect x="${w / 2 - 9}" y="${-legH}" width="7" height="${legH}" rx="3" fill="${o.legs || '#2b2218'}"/>`);
  // Rumpf
  parts.push(`<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h - legH + 6}" rx="9" fill="${body}"/>`);
  if (o.accent) parts.push(`<rect x="${-w / 2}" y="${-h + 16}" width="${w}" height="4" fill="${o.accent}"/>`);
  // Arme
  if (o.tablet) {
    parts.push(`<rect x="${w / 2 - 3}" y="${-h + 14}" width="7" height="26" rx="3.5" fill="${body}" transform="rotate(-24 ${w / 2} ${-h + 14})"/>`);
    parts.push(`<rect x="${w / 2 + 3}" y="${-h + 4}" width="18" height="24" rx="3" fill="#241b14" transform="rotate(-12 ${w / 2 + 12} ${-h + 16})"/><rect x="${w / 2 + 5}" y="${-h + 7}" width="14" height="18" rx="2" fill="#f2c37a" transform="rotate(-12 ${w / 2 + 12} ${-h + 16})"/>`);
  } else {
    parts.push(`<rect x="${-w / 2 - 4}" y="${-h + 10}" width="7" height="30" rx="3.5" fill="${body}"/><rect x="${w / 2 - 3}" y="${-h + 10}" width="7" height="30" rx="3.5" fill="${body}"/>`);
  }
  // Kopf und Haare
  parts.push(`<circle cx="0" cy="${-h - 11}" r="12" fill="${skin}"/>`);
  parts.push(`<path d="M-12 ${-h - 12} a12 12 0 0 1 24 0 c-4 -5 -9 -7 -12 -7 c-4 0 -9 2 -12 7z" fill="${hair}"/>`);
  return `<g transform="translate(${f(X)} ${f(Y)}) scale(${s})">${parts.join('')}</g>`;
}
