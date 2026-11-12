// Gemeinsame Bausteine der Szenen: Farben, Raumhülle, Pflanze, Pop-up-Tafel und das Zusammensetzen der Zeichnung.
import { mix, personWorking } from './iso.mjs';

export const PAL = {
  night: '#1a130d', ink: '#241b14', cream: '#f2eadd', paper: '#fbf7f0',
  olive: '#7a734a', oliveD: '#5a5533', oliveL: '#a5a06a', ochre: '#c59045', ochreD: '#8a5f17',
  terra: '#bf6d47', terraD: '#9e4e2e', terraL: '#e0876a', wood: '#b98a56', woodD: '#8c6238',
};
export const H = 3.4;            // Wandhöhe
export const RW = 7;             // Raumbreite und -tiefe
export const WALL = '#f3ead9';   // Wandfarbe innen

// Wandstärke 0.35; Rückwand entlang x liegt bei y = -0.35..0, die entlang y bei x = x0-0.35..x0
export function room(iso, x0, y0, o) {
  const L = 'room';
  // Boden
  iso.add(L, iso.box(x0, y0, 0, RW, RW, 0.14, o.floor, { depth: x0 + y0 + 1 }));
  // Rückwände
  const wallShade = { top: '#fffaf0', left: WALL, right: mix(WALL, '#000000', 0.1) };
  iso.add(L, iso.box(x0 - 0.35, y0 - 0.35, 0, RW + 0.35, 0.35, H, WALL, { shade: wallShade, depth: x0 + y0 + 1.5 }));
  iso.add(L, iso.box(x0 - 0.35, y0, 0, 0.35, RW, H, WALL, { shade: wallShade, depth: x0 + y0 + 1.6 }));
  // Fußleisten
  const baseB = mix(WALL, o.accent, 0.35);
  iso.add(L, { depth: x0 + y0 + 1.7, svg: iso.planeY(y0, x0, x0 + RW, 0.14, 0.42, baseB) + iso.planeX(x0, y0, y0 + RW, 0.14, 0.42, mix(baseB, '#000000', 0.1)) });
}

export function floorPlanks(iso, x0, y0, col) {
  let s = '';
  for (let v = 1; v < RW; v += 1) s += iso.line([x0 + 0.1, y0 + v, 0.15], [x0 + RW - 0.1, y0 + v, 0.15], col, 0.8, 'opacity=".55"');
  return s;
}

export function checker(iso, x0, y0, a, b) {
  let s = '';
  for (let i = 0; i < RW; i++) for (let j = 0; j < RW; j++) {
    if ((i + j) % 2) s += iso.planeZ(0.15, x0 + i, x0 + i + 1, y0 + j, y0 + j + 1, b);
  }
  return s;
}

export function plant(iso, wx, wy, wz, s = 1) {
  const [X, Y] = iso.p(wx, wy, wz);
  return `<g transform="translate(${X.toFixed(1)} ${Y.toFixed(1)}) scale(${s})">
    <ellipse cx="0" cy="3" rx="16" ry="6" fill="#000" opacity=".16"/>
    <path d="M-12 0 L-9 -22 L9 -22 L12 0z" fill="${PAL.terra}"/><rect x="-10" y="-25" width="20" height="5" rx="2" fill="${PAL.terraD}"/>
    <path d="M0 -24 C-26 -34 -22 -62 -8 -64 C-2 -48 -2 -36 0 -24z" fill="${PAL.oliveL}"/>
    <path d="M0 -24 C26 -34 22 -62 8 -64 C2 -48 2 -36 0 -24z" fill="${PAL.olive}"/>
    <path d="M0 -24 C-4 -44 -2 -70 0 -78 C4 -62 4 -44 0 -24z" fill="${mix(PAL.olive, '#ffffff', 0.15)}"/></g>`;
}

// ---------- schwebende Oberflächen ("Pop-ups") ----------
// Jede Tafel ist 176 x 124 Einheiten groß, ihr Fußpunkt (Spitze) liegt bei (0, 0), die Tafel schwebt darüber.
export function panel(content, w = 176, h = 124) {
  return `<g>
    <path d="M-10 -14 L0 0 L10 -14z" fill="${PAL.paper}"/>
    <rect x="${-w / 2}" y="${-h - 14}" width="${w}" height="${h}" rx="16" fill="${PAL.paper}" stroke="#ddd1bf" stroke-width="1.5"/>
    <g transform="translate(${-w / 2} ${-h - 14})">${content}</g></g>`;
}


// Fügt Raumebene, Pop-ups und Kamerarahmen zusammen. cfg: { R: [[x0, y0], ...], pops: [{ at, to, svg }], shadow, slab, ground, front, extra }
//   front = SVG vor den Räumen (Pflanzen, Bäume, Fahrzeug), extra = { k: [[x, y], ...] } zusätzliche Bildpunkte für das Sichtfeld von Raum k (0-basiert)
export function assemble(iso, cfg) {
  const { R, pops, shadow, slab, ground, front = '', extra = {} } = cfg;
  const rooms = iso.flush('room');
  const popSvg = pops.map((p) => {
    const dx = p.to[0] - p.at[0], dy = p.to[1] - p.at[1];
    return `<g class="scn-pop" data-i="${p.i}" transform="translate(${p.at[0].toFixed(1)} ${p.at[1].toFixed(1)})">
      <g class="scn-pop-in"><line x1="0" y1="0" x2="${dx.toFixed(1)}" y2="${dy.toFixed(1)}" stroke="${PAL.ochre}" stroke-width="2.4" stroke-dasharray="1 6" stroke-linecap="round"/>
      <circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="9" fill="${PAL.ochre}" opacity=".3"/><circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="4.2" fill="${PAL.ochre}"/>
      ${p.svg}</g></g>`;
  }).join('');

  // Sichtfeld je Raum (Bildschirmkoordinaten): Raumgrundriss und Wand plus das Pop-up darüber (176 x 138 Einheiten über der Spitze)
  const box = (x0, pop, more = []) => {
    const pts = [iso.peek(x0 - 0.4, -0.4, H), iso.peek(x0 + RW, -0.4, H), iso.peek(x0 + RW, RW, 0), iso.peek(x0 - 0.4, RW, 0), iso.peek(x0 + RW, -0.4, 0), iso.peek(x0 - 0.4, RW, H), ...more];
    pts.push([pop.at[0] - 92, pop.at[1] - 146], [pop.at[0] + 92, pop.at[1]]);
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  };
  const focus = [null, ...R.map((r, k) => box(r[0], pops[k], (extra[k] || []).map(([x, y, z = 0]) => iso.peek(x, y, z))))];

  // Maße der Zeichnung (die Pop-ups ragen über die Räume hinaus)
  const pad = 60;
  const popTop = Math.min(...pops.map((p) => p.at[1] - 146));
  const minX = Math.floor(iso.min[0] - pad), minY = Math.floor(Math.min(iso.min[1], popTop) - pad), maxX = Math.ceil(iso.max[0] + pad), maxY = Math.ceil(iso.max[1] + pad);
  const vbw = maxX - minX, vbh = maxY - minY;
  const shift = ([x, y, w, h]) => [x - minX, y - minY, w, h].map((v) => Math.round(v));
  focus[0] = [0, 0, vbw, vbh];
  for (let i = 1; i < focus.length; i++) focus[i] = shift(focus[i]);

  const defs = `<defs>
    <linearGradient id="scn-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc"/><stop offset="1" stop-color="#f6d9a0"/></linearGradient>
  </defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbw} ${vbh}" aria-hidden="true" focusable="false">${defs}
    <g class="scn-world"><g transform="translate(${-minX} ${-minY})">${shadow}${slab.svg}${ground}${rooms}${front}${popSvg}</g></g></svg>`;
  return { svg, vbw, vbh, focus };
}

// ---------- weitere Bausteine (Ambulant und Hausnotruf) ----------
const f1 = (n) => Math.round(n * 10) / 10;

// Baum für den Gehweg
export function tree(iso, wx, wy, s = 1) {
  const [X, Y] = iso.p(wx, wy, 0);
  return `<g transform="translate(${f1(X)} ${f1(Y)}) scale(${s})">
    <ellipse cx="0" cy="3" rx="28" ry="9" fill="#000" opacity=".14"/>
    <rect x="-4" y="-36" width="8" height="38" rx="3" fill="${PAL.woodD}"/>
    <circle cx="-14" cy="-54" r="22" fill="${PAL.olive}"/><circle cx="13" cy="-60" r="24" fill="${PAL.oliveL}"/><circle cx="-1" cy="-76" r="22" fill="${mix(PAL.olive, '#ffffff', 0.12)}"/></g>`;
}

// Kreis in einer senkrechten Ebene y = const (Rad eines Fahrzeugs von der Seite)
function discY(iso, cx, y, cz, r, fill) {
  const pts = [];
  for (let i = 0; i < 20; i++) { const t = (i / 20) * Math.PI * 2; pts.push([cx + Math.cos(t) * r, y, cz + Math.sin(t) * r]); }
  return iso.polyN(pts, fill);
}

// Kleinwagen (Einsatzfahrzeug), Länge entlang x, Front zeigt nach +x; (x, y) ist die hintere linke Ecke am Boden
export function car(iso, x, y, o = {}) {
  const body = o.body || PAL.terra, items = [];
  const win = '#dbe7e4';
  items.push({ depth: 0, svg: iso.polyN([[x - 0.2, y + 0.1, 0.02], [x + 3.6, y + 0.1, 0.02], [x + 3.6, y + 1.75, 0.02], [x - 0.2, y + 1.75, 0.02]], '#000000', 'opacity=".15"') });
  items.push(iso.box(x, y, 0.22, 3.4, 1.5, 0.55, body, { depth: 10 }));
  items.push(iso.box(x + 0.75, y + 0.08, 0.77, 1.85, 1.34, 0.55, mix(body, '#ffffff', 0.08), { depth: 11 }));
  const yc = y + 1.43;
  items.push({ depth: 11.5, svg: iso.planeY(yc, x + 0.9, x + 1.6, 0.86, 1.27, win) + iso.planeY(yc, x + 1.75, x + 2.5, 0.86, 1.27, win) + iso.planeX(x + 2.61, y + 0.2, y + 1.3, 0.86, 1.27, mix(win, '#000000', 0.08)) });
  items.push({ depth: 11.6, svg: iso.planeY(y + 1.51, x + 0.05, x + 3.35, 0.4, 0.52, PAL.ochre) + iso.planeX(x + 3.41, y + 0.12, y + 0.42, 0.5, 0.66, '#fff3d1') + iso.planeX(x + 3.41, y + 1.08, y + 1.38, 0.5, 0.66, '#fff3d1') });
  items.push(iso.box(x + 1.3, y + 0.5, 1.32, 0.5, 0.5, 0.16, PAL.cream, { depth: 11.7 }));
  for (const wx of [x + 0.75, x + 2.65]) items.push({ depth: 12, svg: discY(iso, wx, y + 1.52, 0.32, 0.34, '#2b2218') + discY(iso, wx, y + 1.53, 0.32, 0.16, '#d9d2c3') });
  return items.sort((a, b) => a.depth - b.depth).map((i) => i.svg).join('');
}

// Regal mit Ordnern an der Wand x = x0 (zwei Bretter, Ordnerrücken)
export function binderShelf(iso, x0, y0, L, dpt) {
  let shelf = iso.planeX(x0 + 0.01, y0 + 1.0, y0 + 5.8, 1.9, 2.0, PAL.wood) + iso.planeX(x0 + 0.01, y0 + 1.0, y0 + 5.8, 1.1, 1.2, PAL.wood);
  const bind = [PAL.terra, PAL.oliveL, PAL.ochre, PAL.oliveD, PAL.terraL, PAL.ochre, PAL.olive, PAL.terra];
  for (let i = 0; i < 8; i++) shelf += iso.planeX(x0 + 0.02, y0 + 1.1 + i * 0.58, y0 + 1.1 + i * 0.58 + 0.46, 2.0, 2.7 - (i % 3) * 0.1, bind[i]);
  for (let i = 0; i < 7; i++) shelf += iso.planeX(x0 + 0.02, y0 + 1.1 + i * 0.66, y0 + 1.1 + i * 0.66 + 0.5, 1.2, 1.9 - (i % 2) * 0.12, bind[(i + 3) % 8]);
  iso.add(L, { depth: dpt ?? x0 + y0 + 2.2, svg: shelf });
}

// Arbeitsplatz an der Wand: Schreibtisch, Bildschirm, Tastatur, Bürostuhl und eine Person von hinten bei der Arbeit.
// axis 'x': Tisch an der linken Wand (x = x0), Blick nach -x.  axis 'y': Tisch an der Rückwand (y = y0), Blick nach -y.
// o: off (Abstand des Tisches vom Raumrand entlang der Wand), len (Tischlänge), content(sc, face, T, v1, v2) liefert den Bildschirminhalt, person: Farben
export function workstation(iso, L, x0, y0, o = {}) {
  const axis = o.axis || 'x', TOP = 0.86, U0 = 0.4, DW = 1.4, DL = o.len || 3.4, off = o.off ?? 1.9, PV = off + DL / 2;
  const SEAT = 0.55, CH = '#6b5a49';
  const bx = (u, v, du, dv, z, h, col, depth) => (axis === 'x' ? iso.box(x0 + u, y0 + v, z, du, dv, h, col, { depth }) : iso.box(x0 + v, y0 + u, z, dv, du, h, col, { depth }));
  const sc = (u, v1, v2, z1, z2, fill) => (axis === 'x' ? iso.planeX(x0 + u, y0 + v1, y0 + v2, z1, z2, fill) : iso.planeY(y0 + u, x0 + v1, x0 + v2, z1, z2, fill));
  const W = (u, v) => (axis === 'x' ? [x0 + u, y0 + v] : [x0 + v, y0 + u]);
  const dd = x0 + y0 + U0 + off + DW + DL;
  for (const [lx, ly] of [[0.06, 0.08], [DW - 0.2, 0.08], [0.06, DL - 0.18], [DW - 0.2, DL - 0.18]]) iso.add(L, bx(U0 + lx, off + ly, 0.14, 0.1, 0, TOP, PAL.woodD, x0 + y0 + U0 + off + lx + ly + 1));
  iso.add(L, bx(U0, off, DW, DL, TOP, 0.1, PAL.wood, dd));
  const mv = PV - 0.85, face = U0 + 0.61;
  iso.add(L, bx(U0 + 0.55, PV - 0.2, 0.3, 0.4, TOP + 0.1, 0.1, '#3b2e22', dd + 0.1));
  iso.add(L, bx(U0 + 0.5, mv, 0.1, 1.7, TOP + 0.2, 1.0, PAL.ink, dd + 0.2));
  const scol = [PAL.oliveL, PAL.ochre, PAL.terraL, PAL.olive];
  let scr = sc(face, mv + 0.09, mv + 1.61, TOP + 0.29, TOP + 1.11, '#f6efe2');
  if (o.content) scr += o.content(sc, face + 0.01, TOP, mv);
  else {
    scr += sc(face + 0.01, mv + 0.16, mv + 1.54, TOP + 0.94, TOP + 1.04, PAL.oliveD);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) scr += sc(face + 0.01, mv + 0.16 + c * 0.28, mv + 0.16 + c * 0.28 + 0.23, TOP + 0.36 + r * 0.14, TOP + 0.36 + r * 0.14 + 0.1, scol[(r + c * 2) % 4]);
  }
  iso.add(L, { depth: dd + 0.21, svg: scr });
  iso.add(L, bx(U0 + 0.9, PV - 0.55, 0.4, 1.1, TOP + 0.1, 0.05, '#d9d2c3', dd + 0.5));
  iso.add(L, bx(U0 + 0.95, PV - 1.05, 0.22, 0.16, TOP + 0.1, 0.06, '#d9d2c3', dd + 0.6));
  iso.add(L, bx(U0 + 0.55, off + DL - 0.6, 0.5, 0.45, TOP + 0.1, 0.28, PAL.cream, dd + 0.3));
  iso.add(L, bx(U0 + 0.55, off + DL - 0.6, 0.5, 0.45, TOP + 0.38, 0.06, PAL.ochre, dd + 0.31));
  // Bürostuhl: Sitz und Fuß vor, Rückenlehne hinter (näher am Betrachter) der Person
  const PU = U0 + DW + 0.6, pe = o.person || {};
  iso.add(L, bx(PU - 0.1, PV - 0.1, 0.2, 0.2, 0, SEAT, '#2b2218', dd + 0.7));
  iso.add(L, bx(PU - 0.6, PV - 0.05, 1.2, 0.1, 0, 0.1, '#2b2218', dd + 0.65));
  iso.add(L, bx(PU - 0.05, PV - 0.6, 0.1, 1.2, 0, 0.1, '#2b2218', dd + 0.66));
  iso.add(L, bx(PU - 0.6, PV - 0.6, 1.2, 1.2, SEAT - 0.14, 0.14, CH, dd + 0.8));
  const [px, py] = W(PU, PV);
  iso.add(L, { depth: dd + 1.0, svg: personWorking(iso, px, py, SEAT, { fwd: axis === 'x' ? [-1, 0] : [0, -1], seat: SEAT, thigh: 0.85, body: pe.body || PAL.terraD, skin: pe.skin || '#8d5a3c', hair: pe.hair || '#3a2418', legs: pe.legs || '#3a2e22', shoe: '#1a130d',
    hands: [[...W(U0 + 1.1, PV - 0.3), TOP + 0.2], [...W(U0 + 1.1, PV + 0.3), TOP + 0.2]] }) });
  iso.add(L, bx(PU + 0.62, PV - 0.55, 0.16, 1.1, SEAT + 0.25, 0.8, CH, dd + 1.5));
  return { screenAt: (z = 1.5) => iso.peek(...(axis === 'x' ? [x0 + face, y0 + PV, TOP + z] : [x0 + PV, y0 + face, TOP + z])) };
}

// Straßenlaterne
export function lamp(iso, wx, wy, s = 1) {
  const [X, Y] = iso.p(wx, wy, 0);
  return `<g transform="translate(${f1(X)} ${f1(Y)}) scale(${s})">
    <ellipse cx="0" cy="2" rx="10" ry="4" fill="#000" opacity=".16"/>
    <rect x="-3" y="-92" width="6" height="94" rx="3" fill="${PAL.ink}"/>
    <path d="M0 -90 q0 -10 14 -10" stroke="${PAL.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="8" y="-102" width="22" height="9" rx="4.5" fill="#fff3d1" stroke="${PAL.ink}" stroke-width="2.5"/></g>`;
}
