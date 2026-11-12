// Szene "Stationär": ein aufgeschnittenes Pflegeheim mit drei Räumen (Bewohnerzimmer, Stationszimmer, Medikamentenraum).
// Erzeugt SVG als Text. Die Kamera fährt später per Skript (scene.js) auf die drei Fokusrahmen.
import { Iso, person, mix, shades } from './iso.mjs';

const PAL = {
  night: '#1a130d', ink: '#241b14', cream: '#f2eadd', paper: '#fbf7f0',
  olive: '#7a734a', oliveD: '#5a5533', oliveL: '#a5a06a', ochre: '#c59045', ochreD: '#8a5f17',
  terra: '#bf6d47', terraD: '#9e4e2e', terraL: '#e0876a', wood: '#b98a56', woodD: '#8c6238',
};
const H = 3.4;            // Wandhöhe
const RW = 7;             // Raumbreite und -tiefe
const WALL = '#f3ead9';   // Wandfarbe innen

// Wandstärke 0.35; Rückwand entlang x liegt bei y = -0.35..0, die entlang y bei x = x0-0.35..x0
function room(iso, x0, y0, o) {
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

function floorPlanks(iso, x0, y0, col) {
  let s = '';
  for (let v = 1; v < RW; v += 1) s += iso.line([x0 + 0.1, y0 + v, 0.15], [x0 + RW - 0.1, y0 + v, 0.15], col, 0.8, 'opacity=".55"');
  return s;
}

function checker(iso, x0, y0, a, b) {
  let s = '';
  for (let i = 0; i < RW; i++) for (let j = 0; j < RW; j++) {
    if ((i + j) % 2) s += iso.planeZ(0.15, x0 + i, x0 + i + 1, y0 + j, y0 + j + 1, b);
  }
  return s;
}

// ---------- Raum 1: Bewohnerzimmer ----------
function room1(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#dcc79b', accent: PAL.ochre });
  const L = 'room';
  let deco = floorPlanks(iso, x0, y0, '#bfa570');
  // Teppich
  deco += iso.planeZ(0.16, x0 + 2.6, x0 + 6.8, y0 + 2.2, y0 + 6.4, '#e6b49b');
  deco += iso.planeZ(0.17, x0 + 2.85, x0 + 6.55, y0 + 2.45, y0 + 6.15, '#d99d82');
  deco += iso.planeZ(0.18, x0 + 3.1, x0 + 6.3, y0 + 2.7, y0 + 5.9, '#e6b49b');
  iso.add(L, { depth: x0 + y0 + 2, svg: deco });
  // Fenster auf der Rückwand entlang x (Ebene y = y0)
  let win = iso.planeY(y0 + 0.01, x0 + 2.9, x0 + 6.1, 0.95, 2.95, '#fffaf0');
  win += iso.planeY(y0 + 0.02, x0 + 3.05, x0 + 5.95, 1.1, 2.8, 'url(#scn-glow)');
  win += iso.line([x0 + 4.5, y0 + 0.03, 1.1], [x0 + 4.5, y0 + 0.03, 2.8], '#fffaf0', 2);
  win += iso.line([x0 + 3.05, y0 + 0.03, 1.95], [x0 + 5.95, y0 + 0.03, 1.95], '#fffaf0', 2);
  // Lichteinfall auf dem Boden
  win += iso.polyN([[x0 + 3.1, y0 + 0.1, 0.19], [x0 + 5.9, y0 + 0.1, 0.19], [x0 + 6.9, y0 + 3.6, 0.19], [x0 + 4.1, y0 + 3.6, 0.19]], '#fff3d1', 'opacity=".22"');
  iso.add(L, { depth: x0 + y0 + 2.1, svg: win });
  // Bild über dem Bett (Rückwand entlang y, Ebene x = x0)
  iso.add(L, { depth: x0 + y0 + 2.1, svg: iso.planeX(x0 + 0.01, y0 + 1.3, y0 + 3.1, 1.9, 2.95, '#fffaf0') + iso.planeX(x0 + 0.02, y0 + 1.45, y0 + 2.95, 2.05, 2.8, PAL.oliveL) + iso.polyN([[x0 + 0.03, y0 + 1.6, 2.2], [x0 + 0.03, y0 + 2.5, 2.2], [x0 + 0.03, y0 + 2.5, 2.7], [x0 + 0.03, y0 + 1.6, 2.7]], PAL.ochre, 'opacity=".55"') });
  // Bett (Kopf an der Rückwand entlang x)
  const bx = x0 + 0.5;
  iso.add(L, iso.box(bx, y0 + 0.05, 0, 2.4, 0.22, 1.5, PAL.wood, { depth: x0 + y0 + 3 }));                 // Kopfteil
  iso.add(L, iso.box(bx, y0 + 0.27, 0.12, 2.4, 3.7, 0.4, PAL.woodD, { depth: x0 + y0 + 3.2 }));            // Rahmen
  iso.add(L, iso.box(bx + 0.05, y0 + 0.3, 0.52, 2.3, 3.6, 0.32, '#fbf7f0', { depth: x0 + y0 + 3.4 }));      // Matratze
  iso.add(L, iso.box(bx + 0.02, y0 + 1.7, 0.6, 2.36, 2.3, 0.3, PAL.olive, { depth: x0 + y0 + 3.6 }));       // Decke
  iso.add(L, iso.box(bx + 0.35, y0 + 0.45, 0.84, 1.7, 0.95, 0.22, '#f4d8c8', { depth: x0 + y0 + 3.7 }));    // Kissen
  // Nachttisch mit Lampe
  iso.add(L, iso.box(x0 + 3.15, y0 + 0.15, 0, 0.9, 0.85, 0.85, PAL.wood, { depth: x0 + y0 + 4.2 }));
  iso.add(L, iso.box(x0 + 3.5, y0 + 0.4, 0.85, 0.25, 0.25, 0.35, '#fff3d1', { depth: x0 + y0 + 4.5 }));
  // Sessel mit Bewohnerin
  const cx = x0 + 4.9, cy = y0 + 3.6;
  iso.add(L, iso.box(cx, cy, 0, 1.6, 0.35, 1.3, PAL.oliveL, { depth: cx + cy + 0.4 }));                      // Lehne
  iso.add(L, iso.box(cx, cy + 0.35, 0, 1.6, 1.25, 0.6, PAL.oliveL, { depth: cx + cy + 1.2 }));                // Sitz
  iso.add(L, { depth: cx + cy + 1.6, svg: person(iso, cx + 0.8, cy + 1.05, 0.55, { sit: true, body: PAL.terraL, skin: '#e3b894', hair: '#d9d2c3', legs: '#6b5a49', s: 0.95 }) });
  iso.add(L, iso.box(cx, cy + 0.35, 0.6, 0.28, 1.25, 0.4, mix(PAL.oliveL, '#000000', 0.12), { depth: cx + cy + 2.0 }));
  iso.add(L, iso.box(cx + 1.32, cy + 0.35, 0.6, 0.28, 1.25, 0.4, mix(PAL.oliveL, '#000000', 0.12), { depth: cx + cy + 2.7 }));
  // Pflegekraft mit Tablet am Bett
  iso.add(L, { depth: x0 + y0 + 8, svg: person(iso, x0 + 3.5, y0 + 3.2, 0.14, { body: PAL.oliveD, accent: PAL.ochre, tablet: true, skin: '#c8956d', hair: '#2b1d14' }) });
  // Pflanze
  iso.add(L, { depth: x0 + y0 + 9, svg: plant(iso, x0 + 6.3, y0 + 0.6, 0.14, 1) });
}

// ---------- Raum 2: Stationszimmer ----------
function room2(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#d4d3a8', accent: PAL.olive });
  const L = 'room';
  let deco = floorPlanks(iso, x0, y0, '#b3b27f');
  deco += iso.planeZ(0.16, x0 + 1.4, x0 + 6.0, y0 + 2.4, y0 + 6.2, '#c4c18d');
  iso.add(L, { depth: x0 + y0 + 2, svg: deco });
  // Dienstplan-Tafel an der Rückwand entlang x
  let board = iso.planeY(y0 + 0.01, x0 + 0.8, x0 + 5.8, 0.95, 2.95, '#fffaf0');
  board += iso.planeY(y0 + 0.02, x0 + 0.95, x0 + 5.65, 1.1, 2.8, '#f6efe2');
  const cols = ['#a5a06a', '#c59045', '#e0876a', '#7a734a', '#c59045'];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const xa = x0 + 1.05 + c * 0.77, xb = xa + 0.66, za = 1.2 + r * 0.42, zb = za + 0.32;
    const col = r === 0 ? PAL.oliveD : ((c + r * 2) % 5 === 0 ? '#ece3d1' : cols[(c * 3 + r) % cols.length]);
    board += iso.planeY(y0 + 0.03, xa, xb, za, zb, col, 'opacity=".95"');
  }
  iso.add(L, { depth: x0 + y0 + 2.1, svg: board });
  // Regal an der Rückwand entlang y
  let shelf = iso.planeX(x0 + 0.01, y0 + 1.0, y0 + 5.8, 1.9, 2.0, PAL.wood) + iso.planeX(x0 + 0.01, y0 + 1.0, y0 + 5.8, 1.1, 1.2, PAL.wood);
  const bind = [PAL.terra, PAL.oliveL, PAL.ochre, PAL.oliveD, PAL.terraL, PAL.ochre, PAL.olive, PAL.terra];
  for (let i = 0; i < 8; i++) shelf += iso.planeX(x0 + 0.02, y0 + 1.1 + i * 0.58, y0 + 1.1 + i * 0.58 + 0.46, 2.0, 2.7 - (i % 3) * 0.1, bind[i]);
  for (let i = 0; i < 7; i++) shelf += iso.planeX(x0 + 0.02, y0 + 1.1 + i * 0.66, y0 + 1.1 + i * 0.66 + 0.5, 1.2, 1.9 - (i % 2) * 0.12, bind[(i + 3) % 8]);
  iso.add(L, { depth: x0 + y0 + 2.2, svg: shelf });
  // Schreibtisch quer im Raum, Pflegedienstleitung sitzt dahinter, Bildschirme zeigen ihr die Vorderseite
  const dx = x0 + 1.6, dy = y0 + 3.5, DD = dx + 4.6 + dy + 1.4;
  const sx = x0 + 3.2, sy = y0 + 2.0;
  iso.add(L, iso.box(sx, sy, 0, 1.3, 0.3, 1.3, '#3d2e22', { depth: sx + sy + 0.4 }));                       // Stuhllehne
  iso.add(L, iso.box(sx, sy + 0.3, 0, 1.3, 1.0, 0.5, '#3d2e22', { depth: sx + sy + 0.9 }));                 // Sitz
  iso.add(L, { depth: sx + sy + 1.4, svg: person(iso, sx + 0.65, sy + 0.95, 0.5, { sit: true, body: PAL.terraD, skin: '#8d5a3c', hair: '#1c140e', legs: '#2b2218', s: 1 }) });
  iso.add(L, iso.box(dx, dy + 0.1, 0, 0.14, 1.2, 0.82, PAL.woodD, { depth: DD - 0.5 }));
  iso.add(L, iso.box(dx + 4.46, dy + 0.1, 0, 0.14, 1.2, 0.82, PAL.woodD, { depth: DD - 0.4 }));
  iso.add(L, iso.box(dx, dy + 1.26, 0, 4.6, 0.14, 0.82, PAL.woodD, { depth: DD - 0.3 }));                   // Blende
  iso.add(L, iso.box(dx, dy, 0.82, 4.6, 1.4, 0.1, PAL.wood, { depth: DD }));
  for (const [mx, w] of [[dx + 0.6, 1.4], [dx + 2.4, 1.4]]) {
    iso.add(L, iso.box(mx, dy + 0.35, 0.92, w, 0.1, 0.95, PAL.ink, { depth: DD + 0.2 }));
    iso.add(L, iso.box(mx + 0.55, dy + 0.4, 0.92, 0.3, 0.2, 0.12, '#3b2e22', { depth: DD + 0.1 }));
  }
  iso.add(L, iso.box(dx + 3.9, dy + 0.55, 0.92, 0.5, 0.4, 0.28, PAL.cream, { depth: DD + 0.3 }));            // Ordner
  iso.add(L, iso.box(dx + 3.9, dy + 0.55, 1.2, 0.5, 0.4, 0.06, PAL.ochre, { depth: DD + 0.31 }));
  // Pflanze
  iso.add(L, { depth: x0 + y0 + 20, svg: plant(iso, x0 + 6.3, y0 + 0.9, 0.14, 1) });
}

// ---------- Raum 3: Medikamentenraum ----------
function room3(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#ddd5c2', accent: PAL.terra });
  const L = 'room';
  iso.add(L, { depth: x0 + y0 + 2, svg: checker(iso, x0, y0, '#ddd5c2', '#cfc6b0') });
  // Schrankwand an der Rückwand entlang x
  for (let i = 0; i < 3; i++) {
    const cx = x0 + 0.5 + i * 1.95;
    iso.add(L, iso.box(cx, y0 + 0.05, 0.14, 1.85, 0.95, 2.6, PAL.terraD, { depth: cx + y0 + 3 }));
    let d = '';
    for (let r = 0; r < 4; r++) {
      const za = 0.4 + r * 0.6;
      d += iso.planeY(y0 + 1.01, cx + 0.12, cx + 1.73, za, za + 0.5, mix(PAL.terraD, '#ffffff', 0.12));
      d += iso.planeY(y0 + 1.02, cx + 0.75, cx + 1.1, za + 0.22, za + 0.28, PAL.ochre);
    }
    iso.add(L, { depth: cx + y0 + 3.05, svg: d });
  }
  // Wandregal mit Medikamentenschachteln an der Rückwand entlang y
  let shelf = iso.planeX(x0 + 0.01, y0 + 1.2, y0 + 5.8, 1.5, 1.6, PAL.wood) + iso.planeX(x0 + 0.01, y0 + 1.2, y0 + 5.8, 2.4, 2.5, PAL.wood);
  const boxes = [PAL.cream, PAL.ochre, PAL.terraL, PAL.oliveL, '#fffaf0', PAL.terra, PAL.cream, PAL.ochre];
  for (let i = 0; i < 8; i++) {
    shelf += iso.planeX(x0 + 0.02, y0 + 1.3 + i * 0.55, y0 + 1.3 + i * 0.55 + 0.44, 1.6, 2.1 - (i % 3) * 0.08, boxes[i]);
    shelf += iso.planeX(x0 + 0.02, y0 + 1.3 + i * 0.55 + 0.05, y0 + 1.3 + i * 0.55 + 0.39, 1.8 - (i % 3) * 0.04, 1.86 - (i % 3) * 0.04, mix(boxes[i], '#000000', 0.25));
    shelf += iso.planeX(x0 + 0.02, y0 + 1.3 + (7 - i) * 0.55, y0 + 1.3 + (7 - i) * 0.55 + 0.44, 2.5, 3.0 - (i % 2) * 0.1, boxes[(i + 3) % 8]);
  }
  iso.add(L, { depth: x0 + y0 + 2.2, svg: shelf });
  // Medikamentenwagen
  const tx = x0 + 3.2, ty = y0 + 2.9;
  iso.add(L, iso.box(tx, ty, 0.15, 1.6, 1.0, 1.0, '#f2eadd', { depth: tx + ty + 2.6 }));
  let dr = '';
  for (let r = 0; r < 3; r++) {
    dr += iso.planeY(ty + 1.01, tx + 0.1, tx + 1.5, 0.28 + r * 0.3, 0.28 + r * 0.3 + 0.24, mix('#f2eadd', '#000000', 0.07));
    dr += iso.planeY(ty + 1.02, tx + 0.65, tx + 0.95, 0.38 + r * 0.3, 0.42 + r * 0.3, PAL.terraD);
  }
  iso.add(L, { depth: tx + ty + 2.7, svg: dr });
  iso.add(L, iso.box(tx - 0.05, ty - 0.05, 1.15, 1.7, 1.1, 0.1, PAL.ink, { depth: tx + ty + 2.9 }));
  // Becher auf dem Wagen
  const cups = [PAL.ochre, PAL.terraL, PAL.oliveL, PAL.cream];
  cups.forEach((c, i) => iso.add(L, iso.box(tx + 0.12 + i * 0.38, ty + 0.3, 1.25, 0.28, 0.28, 0.26, c, { depth: tx + ty + 3.1 + i * 0.01 })));
  // Pflegekraft mit Tablet
  iso.add(L, { depth: x0 + y0 + 9, svg: person(iso, x0 + 2.3, y0 + 3.9, 0.14, { body: PAL.olive, accent: PAL.terra, tablet: true, skin: '#e8c3a0', hair: '#7a4a2a' }) });
  // Pflanze
  iso.add(L, { depth: x0 + y0 + 20, svg: plant(iso, x0 + 6.3, y0 + 5.9, 0.14, 1.0) });
}

function plant(iso, wx, wy, wz, s = 1) {
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
function panel(content, w = 176, h = 124) {
  return `<g>
    <path d="M-10 -14 L0 0 L10 -14z" fill="${PAL.paper}"/>
    <rect x="${-w / 2}" y="${-h - 14}" width="${w}" height="${h}" rx="16" fill="${PAL.paper}" stroke="#ddd1bf" stroke-width="1.5"/>
    <g transform="translate(${-w / 2} ${-h - 14})">${content}</g></g>`;
}

const popVoice = panel(`
  <circle cx="34" cy="38" r="20" fill="${PAL.ochre}"/>
  <rect x="29" y="26" width="10" height="17" rx="5" fill="${PAL.paper}"/>
  <path d="M25 39 a9 9 0 0 0 18 0 M34 48 v5" stroke="${PAL.paper}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <g fill="${PAL.ochre}" class="scn-wave">
    <rect x="62" y="30" width="5" height="16" rx="2.5"/><rect x="71" y="22" width="5" height="32" rx="2.5"/><rect x="80" y="27" width="5" height="22" rx="2.5"/><rect x="89" y="18" width="5" height="40" rx="2.5"/><rect x="98" y="26" width="5" height="24" rx="2.5"/>
  </g>
  <path d="M84 74 v14 M78 84 l6 7 l6 -7" stroke="${PAL.oliveD}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="20" y="96" width="136" height="9" rx="4.5" fill="#ece3d1"/><rect x="20" y="96" width="98" height="9" rx="4.5" fill="${PAL.olive}"/>
  <rect x="20" y="110" width="104" height="5" rx="2.5" fill="#ddd1bf"/>
  <circle cx="148" cy="22" r="11" fill="${PAL.olive}"/><path d="M142 22 l4 4.5 l8 -9" stroke="${PAL.paper}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);

const popPlan = panel(`
  <rect x="16" y="14" width="96" height="14" rx="4" fill="${PAL.oliveD}"/>
  ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${16 + c * 20}" y="${36 + r * 15}" width="16" height="11" rx="3" fill="${['#a5a06a', '#c59045', '#e0876a', '#7a734a', '#ece3d1'][(c * 2 + r * 3) % 5]}"/>`).join('')).join('')}
  <circle cx="142" cy="30" r="15" fill="none" stroke="#ece3d1" stroke-width="6"/>
  <path d="M142 15 a15 15 0 1 1 -14.2 20" fill="none" stroke="${PAL.olive}" stroke-width="6" stroke-linecap="round"/>
  <path d="M135 30 l5 5.5 l9 -10" stroke="${PAL.oliveD}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="122" y="58" width="38" height="6" rx="3" fill="#ddd1bf"/><rect x="122" y="70" width="28" height="6" rx="3" fill="#ddd1bf"/>
  <rect x="16" y="102" width="128" height="9" rx="4.5" fill="#ece3d1"/><rect x="16" y="102" width="128" height="9" rx="4.5" fill="${PAL.ochre}"/>`);

const popMeds = panel(`
  ${[0, 1, 2].map((i) => `<g transform="translate(0 ${i * 31})">
    <g transform="translate(34 30) rotate(-35)"><rect x="-16" y="-8" width="32" height="16" rx="8" fill="${[PAL.terra, PAL.ochre, PAL.olive][i]}"/><rect x="-16" y="-8" width="16" height="16" rx="8" fill="${[PAL.terraL, '#e3b36a', PAL.oliveL][i]}"/></g>
    <rect x="62" y="23" width="${[70, 58, 64][i]}" height="7" rx="3.5" fill="#ddd1bf"/><rect x="62" y="36" width="${[44, 40, 36][i]}" height="5" rx="2.5" fill="#ece3d1"/>
    <circle cx="150" cy="32" r="10" fill="${PAL.olive}"/><path d="M145 32 l3.5 4 l7 -8" stroke="${PAL.paper}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')}`);

// ---------- Gesamtszene ----------
export function buildStationaer() {
  const iso = new Iso();
  const R1 = [0, 0], R2 = [11, 0], R3 = [22, 0];

  // Boden (Gelände) mit Schatten
  const slab = iso.box(-2, -2, -0.9, 33, 12, 0.9, '#e9dfcc', { shade: { top: '#efe6d3', left: '#cbbfa6', right: '#b3a78e' }, depth: -100 });
  const shadow = iso.polyN([[-3.2, -3, -0.9], [32.4, -3, -0.9], [32.4, 11.6, -0.9], [-3.2, 11.6, -0.9]], '#000000', 'opacity=".16"');
  let ground = '';
  // Flur: hellere Streifen vor den Räumen
  ground += iso.planeZ(0.01, -2, 31, 7.6, 10, '#f4ecdc');
  for (let x = -2; x < 31; x += 3) ground += iso.line([x, 7.6, 0.02], [x, 10, 0.02], '#e2d7c1', 1);
  ground += iso.line([-2, 7.6, 0.02], [31, 7.6, 0.02], '#e2d7c1', 1.4);
  // Datenlinie durch den Flur (animiert per CSS)
  const path = [[3.5, 7.0], [3.5, 8.8], [14.5, 8.8], [14.5, 7.0]];
  const path2 = [[14.5, 8.8], [25.5, 8.8], [25.5, 7.0]];
  const toD = (pp) => pp.map((q, i) => { const [X, Y] = iso.p(q[0], q[1], 0.05); return (i ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1); }).join(' ');
  ground += `<path class="scn-link" d="${toD(path)} ${toD(path2).slice(0)}" fill="none" stroke="${PAL.ochre}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 9"/>`;
  [[3.5, 7.0], [14.5, 7.0], [25.5, 7.0]].forEach(([x, y]) => { const [X, Y] = iso.p(x, y, 0.06); ground += `<ellipse cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" rx="13" ry="6.5" fill="${PAL.ochre}" opacity=".35"/><ellipse cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" rx="6" ry="3" fill="${PAL.ochre}"/>`; });
  // Pflanzen und Bänke im Flur
  const flur = [];
  [[8.7, 8.6, 1.0], [19.7, 8.6, 1.1], [29.0, 8.6, 1.0], [-0.8, 8.5, 1.1]].forEach(([x, y, s]) => flur.push(plant(iso, x, y, 0, s)));

  room1(iso, ...R1); room2(iso, ...R2); room3(iso, ...R3);

  const rooms = iso.flush('room');

  // Pop-ups: Spitze über dem Raum, ein dünner Faden führt zu dem Ort, an dem die Funktion greift
  const at = (x, y, z) => iso.peek(x, y, z);
  const tab = (x, y) => { const q = iso.peek(x, y, 0.14); return [q[0] + 22, q[1] - 66]; };
  const pops = [
    { i: 1, at: at(R1[0] + 3.4, 3.4, 4.9), to: tab(R1[0] + 3.5, 3.2), svg: popVoice },
    { i: 2, at: at(R2[0] + 3.4, 3.4, 4.9), to: iso.peek(R2[0] + 3.3, 0.03, 2.0), svg: popPlan },
    { i: 3, at: at(R3[0] + 3.4, 3.4, 4.9), to: tab(R3[0] + 2.3, 3.9), svg: popMeds },
  ];
  const popSvg = pops.map((p) => {
    const dx = p.to[0] - p.at[0], dy = p.to[1] - p.at[1];
    return `<g class="scn-pop" data-i="${p.i}" transform="translate(${p.at[0].toFixed(1)} ${p.at[1].toFixed(1)})">
      <g class="scn-pop-in"><line x1="0" y1="0" x2="${dx.toFixed(1)}" y2="${dy.toFixed(1)}" stroke="${PAL.ochre}" stroke-width="2.4" stroke-dasharray="1 6" stroke-linecap="round"/>
      <circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="9" fill="${PAL.ochre}" opacity=".3"/><circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="4.2" fill="${PAL.ochre}"/>
      ${p.svg}</g></g>`;
  }).join('');

  // Sichtfeld je Raum (Bildschirmkoordinaten): Raumgrundriss und Wand plus das Pop-up darüber (176 x 138 Einheiten über der Spitze)
  const box = (x0, pop) => {
    const pts = [iso.peek(x0 - 0.4, -0.4, H), iso.peek(x0 + RW, -0.4, H), iso.peek(x0 + RW, RW, 0), iso.peek(x0 - 0.4, RW, 0), iso.peek(x0 + RW, -0.4, 0), iso.peek(x0 - 0.4, RW, H)];
    pts.push([pop.at[0] - 92, pop.at[1] - 146], [pop.at[0] + 92, pop.at[1]]);
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  };
  const focus = [null, box(R1[0], pops[0]), box(R2[0], pops[1]), box(R3[0], pops[2])];

  // Maße der Zeichnung (die Pop-ups ragen über die Räume hinaus)
  const pad = 60;
  const popTop = Math.min(...pops.map((p) => p.at[1] - 146));
  const minX = Math.floor(iso.min[0] - pad), minY = Math.floor(Math.min(iso.min[1], popTop) - pad), maxX = Math.ceil(iso.max[0] + pad), maxY = Math.ceil(iso.max[1] + pad);
  const vbw = maxX - minX, vbh = maxY - minY;
  const shift = ([x, y, w, h]) => [x - minX, y - minY, w, h].map((v) => Math.round(v));
  focus[0] = [0, 0, vbw, vbh];
  for (let i = 1; i < 4; i++) focus[i] = shift(focus[i]);

  const defs = `<defs>
    <linearGradient id="scn-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc"/><stop offset="1" stop-color="#f6d9a0"/></linearGradient>
  </defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbw} ${vbh}" aria-hidden="true" focusable="false">${defs}
    <g class="scn-world"><g transform="translate(${-minX} ${-minY})">${shadow}${slab.svg}${ground}${rooms}${flur.join('')}${popSvg}</g></g></svg>`;
  return { svg, vbw, vbh, focus };
}
