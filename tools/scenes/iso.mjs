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
  const legH = sit ? 0 : 30;
  const parts = [];
  const legCol = o.legs || '#2b2218';
  if (!sit) {
    parts.push(`<ellipse cx="0" cy="2" rx="${w * 0.9}" ry="5.5" fill="#000" opacity=".18"/>`);
    parts.push(`<rect x="${-w / 2 + 2}" y="${-legH}" width="7" height="${legH}" rx="3" fill="${legCol}"/><rect x="${w / 2 - 9}" y="${-legH}" width="7" height="${legH}" rx="3" fill="${legCol}"/>`);
    parts.push(`<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h - legH + 6}" rx="9" fill="${body}"/>`);
  } else {
    // Sitzend: Der Rumpf sitzt auf der Sitzfläche (wz = Höhe der Sitzfläche), die Oberschenkel zeigen nach vorn (+y, im Bild nach links unten),
    // die Unterschenkel hängen vor der Sitzkante bis zum Boden (o.seat = Sitzhöhe in Einheiten).
    const k = 1 / s, thigh = o.thigh || 0.8, seat = o.seat || 0.6;
    const fx = -A * thigh * k, fy = B * thigh * k, sh = seat * C * k;
    const sx = A * 0.22 * k, sy = B * 0.22 * k;           // Abstand der Beine in x-Richtung
    const knee = (sg) => [sg * sx + fx, sg * sy - 4 + fy];
    parts.push(`<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h + 2}" rx="9" fill="${body}"/>`);
    const leg = (sg) => {
      const [kx, ky] = knee(sg), [hx, hy] = [sg * sx, sg * sy - 4];
      return `<path d="M${f(hx)} ${f(hy)} L${f(kx)} ${f(ky)}" stroke="${legCol}" stroke-width="10" stroke-linecap="round" fill="none"/>`
        + `<rect x="${f(kx - 4.5)}" y="${f(ky)}" width="9" height="${f(sh)}" rx="4" fill="${legCol}"/>`
        + `<rect x="${f(kx - 10)}" y="${f(ky + sh - 5)}" width="15" height="7" rx="3.5" fill="${o.shoe || '#241b14'}"/>`;
    };
    parts.push(leg(-1), leg(1));
  }
  // Funk-Rufknopf an einer Kordel um den Hals
  if (o.pendant) parts.push(`<path d="M-5 ${-h + 1} L0 ${-h + 24} L5 ${-h + 1}" stroke="${o.pendant}" stroke-width="1.6" fill="none"/><circle cx="0" cy="${-h + 26}" r="5" fill="${o.pendant}"/><circle cx="0" cy="${-h + 26}" r="2" fill="#fffaf0"/>`);
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

// Sitzende Figur von hinten bei der Arbeit am Schreibtisch.
// (wx, wy, wz) = Hüfte auf der Sitzfläche, o.fwd = Blickrichtung als Weltvektor (z. B. [-1, 0]), o.hands = zwei Weltpunkte der Hände.
export function personWorking(iso, wx, wy, wz, o = {}) {
  const [X, Y] = iso.p(wx, wy, wz);
  const s = o.s || 1, body = o.body || '#5a5533', skin = o.skin || '#e8c3a0', hair = o.hair || '#3a2a1e';
  const legCol = o.legs || '#2b2218', shoe = o.shoe || '#1a130d';
  const fwd = o.fwd || [-1, 0], perp = [-fwd[1], fwd[0]];
  const seat = o.seat || 0.55, thigh = o.thigh || 0.8;
  const rel = ([x, y, z]) => { const q = iso.peek(x, y, z); return [(q[0] - X) / s, (q[1] - Y) / s]; };
  const h = 54, w = 22;
  const parts = [];
  // Beine: Oberschenkel nach vorn, Unterschenkel hängen bis zum Boden, Füße zeigen nach vorn
  for (const sg of [-1, 1]) {
    const hip = rel([wx + perp[0] * sg * 0.22, wy + perp[1] * sg * 0.22, wz]);
    const kx = wx + perp[0] * sg * 0.22 + fwd[0] * thigh, ky = wy + perp[1] * sg * 0.22 + fwd[1] * thigh;
    const knee = rel([kx, ky, wz]), floor = rel([kx, ky, wz - seat]);
    const toe = rel([kx + fwd[0] * 0.28, ky + fwd[1] * 0.28, wz - seat]);
    parts.push(`<path d="M${f(hip[0])} ${f(hip[1] - 3)} L${f(knee[0])} ${f(knee[1] - 3)}" stroke="${legCol}" stroke-width="10" stroke-linecap="round" fill="none"/>`
      + `<path d="M${f(knee[0])} ${f(knee[1] - 3)} L${f(floor[0])} ${f(floor[1] - 3)}" stroke="${legCol}" stroke-width="8.5" stroke-linecap="round" fill="none"/>`
      + `<path d="M${f(floor[0])} ${f(floor[1] - 2)} L${f(toe[0])} ${f(toe[1] - 2)}" stroke="${shoe}" stroke-width="7" stroke-linecap="round" fill="none"/>`);
  }
  // Rumpf von hinten, darüber Nacken und Kopf mit Haaren
  parts.push(`<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h + 2}" rx="9" fill="${body}"/>`);
  parts.push(`<rect x="-3.5" y="${-h - 4}" width="7" height="7" rx="3" fill="${skin}"/>`);
  // Gesicht schaut nach vorn zum Bildschirm: ein schmaler Hautrand an der Vorderseite des Kopfes, der Rest ist Haar
  parts.push(`<circle cx="-3" cy="${-h - 11}" r="11.5" fill="${skin}"/>`);
  parts.push(`<circle cx="1" cy="${-h - 12}" r="12" fill="${hair}"/>`);
  parts.push(`<path d="M-6 ${-h - 21} q6 -3 12 -1" stroke="#ffffff" stroke-opacity=".14" stroke-width="3" stroke-linecap="round" fill="none"/>`);
  // Arme: Oberarm hängt am Rumpf, Unterarm geht nach vorn zur Hand, so bleiben die Längen natürlich
  for (const [i, hd] of (o.hands || []).entries()) {
    const sg = i === 0 ? -1 : 1, sh = [sg * 9, -h + 12], hand = rel(hd);
    const el = [sg * 12.5, -h + 12 + 17];
    parts.push(`<path d="M${f(sh[0])} ${f(sh[1])} L${f(el[0])} ${f(el[1])} L${f(hand[0])} ${f(hand[1])}" stroke="${body}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`);
    parts.push(`<circle cx="${f(hand[0])}" cy="${f(hand[1])}" r="3.8" fill="${skin}"/>`);
  }
  return `<g transform="translate(${f(X)} ${f(Y)}) scale(${s})">${parts.join('')}</g>`;
}
