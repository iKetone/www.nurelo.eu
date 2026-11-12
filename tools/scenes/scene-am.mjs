// Szene "Ambulant": ein Tag im ambulanten Dienst. Büro (Einsatzplanung), Wohnung der Klientin oder des Klienten (Einsatz vor Ort),
// Büro (Abrechnung), davor die Straße mit dem Einsatzfahrzeug. Zeichnung als SVG-Text, die Kamera fährt per scene.js.
import { Iso, person, mix } from './iso.mjs';
import { PAL, room, floorPlanks, plant, tree, lamp, car, panel, binderShelf, workstation, assemble } from './kit.mjs';

// ---------- Raum 1: Büro, Einsatzplanung ----------
function office1(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#d9d1b8', accent: PAL.ochre });
  const L = 'room';
  let deco = floorPlanks(iso, x0, y0, '#bdb292');
  deco += iso.planeZ(0.16, x0 + 1.6, x0 + 6.0, y0 + 2.4, y0 + 6.2, '#cdc7a0');
  iso.add(L, { depth: x0 + y0 + 2, svg: deco });
  // Kartentafel an der Rückwand entlang x: Straßen, Fluss, Park und die Tour mit vier Stationen
  const Y = y0 + 0.03;
  let map = iso.planeY(y0 + 0.01, x0 + 0.8, x0 + 5.8, 0.95, 2.95, '#fffaf0');
  map += iso.planeY(y0 + 0.02, x0 + 0.95, x0 + 5.65, 1.1, 2.8, '#eef0dc');
  map += iso.planeY(Y, x0 + 1.05, x0 + 2.3, 1.2, 1.95, '#cfd8a8') + iso.planeY(Y, x0 + 4.0, x0 + 5.5, 2.0, 2.7, '#cfd8a8');
  map += iso.line([x0 + 0.95, Y, 2.5], [x0 + 3.0, Y, 1.55], '#bcd3d3', 7) + iso.line([x0 + 3.0, Y, 1.55], [x0 + 5.65, Y, 1.25], '#bcd3d3', 7);
  map += iso.line([x0 + 0.95, Y, 1.6], [x0 + 5.65, Y, 2.35], '#ffffff', 3.2) + iso.line([x0 + 2.7, Y, 1.1], [x0 + 3.5, Y, 2.8], '#ffffff', 3.2) + iso.line([x0 + 4.6, Y, 1.1], [x0 + 4.2, Y, 2.8], '#ffffff', 3);
  const route = [[1.5, 1.45], [2.5, 2.2], [3.55, 1.75], [4.45, 2.5]];
  for (let i = 0; i < route.length - 1; i++) map += iso.line([x0 + route[i][0], Y + 0.01, route[i][1]], [x0 + route[i + 1][0], Y + 0.01, route[i + 1][1]], PAL.ochre, 3.2, 'stroke-dasharray="1 6"');
  route.forEach(([rx, rz]) => { const [X, Yp] = iso.p(x0 + rx, Y + 0.02, rz); map += `<circle cx="${X.toFixed(1)}" cy="${Yp.toFixed(1)}" r="7" fill="${PAL.terra}" stroke="#fffaf0" stroke-width="2.4"/><circle cx="${X.toFixed(1)}" cy="${Yp.toFixed(1)}" r="2.2" fill="#fffaf0"/>`; });
  iso.add(L, { depth: x0 + y0 + 2.1, svg: map });
  binderShelf(iso, x0, y0, L);
  const ws = workstation(iso, L, x0, y0, { axis: 'x', person: { body: PAL.olive, skin: '#c8956d', hair: '#2b1d14', legs: '#3a2e22' } });
  iso.add(L, { depth: x0 + y0 + 20, svg: plant(iso, x0 + 6.3, y0 + 0.9, 0.14, 1) });
  return { board: iso.peek(x0 + 3.3, y0 + 0.03, 2.0), ws };
}

// ---------- Raum 2: Wohnung der Klientin oder des Klienten ----------
function flat(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#e0d0ae', accent: PAL.terra });
  const L = 'room';
  let deco = floorPlanks(iso, x0, y0, '#c4b088');
  deco += iso.planeZ(0.16, x0 + 0.9, x0 + 5.6, y0 + 2.4, y0 + 6.3, '#d9b9a4') + iso.planeZ(0.17, x0 + 1.15, x0 + 5.35, y0 + 2.65, y0 + 6.05, '#e9cdb9');
  iso.add(L, { depth: x0 + y0 + 2, svg: deco });
  // Fenster auf der Rückwand entlang x, Bild über dem Sofa
  let win = iso.planeY(y0 + 0.01, x0 + 4.4, x0 + 6.6, 0.95, 2.95, '#fffaf0') + iso.planeY(y0 + 0.02, x0 + 4.55, x0 + 6.45, 1.1, 2.8, 'url(#scn-glow)');
  win += iso.line([x0 + 5.5, y0 + 0.03, 1.1], [x0 + 5.5, y0 + 0.03, 2.8], '#fffaf0', 2) + iso.line([x0 + 4.55, y0 + 0.03, 1.95], [x0 + 6.45, y0 + 0.03, 1.95], '#fffaf0', 2);
  win += iso.polyN([[x0 + 4.6, y0 + 0.1, 0.19], [x0 + 6.4, y0 + 0.1, 0.19], [x0 + 6.9, y0 + 3.4, 0.19], [x0 + 5.1, y0 + 3.4, 0.19]], '#fff3d1', 'opacity=".2"');
  win += iso.planeY(y0 + 0.02, x0 + 1.1, x0 + 3.4, 1.8, 2.8, '#fffaf0') + iso.planeY(y0 + 0.03, x0 + 1.25, x0 + 3.25, 1.95, 2.65, PAL.oliveL) + iso.polyN([[x0 + 1.25, y0 + 0.04, 1.95], [x0 + 2.4, y0 + 0.04, 1.95], [x0 + 1.9, y0 + 0.04, 2.45]], PAL.olive, 'opacity=".5"');
  iso.add(L, { depth: x0 + y0 + 2.1, svg: win });
  // Anrichte mit Bilderrahmen an der Wand x = x0
  iso.add(L, iso.box(x0 + 0.1, y0 + 3.3, 0, 0.9, 2.5, 0.95, PAL.wood, { depth: x0 + y0 + 3.5 }));
  iso.add(L, iso.box(x0 + 0.3, y0 + 3.6, 0.95, 0.12, 0.5, 0.55, '#fffaf0', { depth: x0 + y0 + 3.6 }));
  iso.add(L, iso.box(x0 + 0.3, y0 + 4.5, 0.95, 0.12, 0.7, 0.45, '#fffaf0', { depth: x0 + y0 + 3.7 }));
  // Sofa an der Rückwand, Klient sitzt darauf, linke Armlehne hinter ihm, rechte davor
  const sx = x0 + 0.9, sy = y0 + 0.3, SEAT = 0.75, sofa = PAL.terraL, arm = mix(PAL.terraL, '#000000', 0.12);
  iso.add(L, iso.box(sx, sy, 0, 3.4, 0.45, 1.9, sofa, { depth: sx + sy + 0.5 }));
  iso.add(L, iso.box(sx, sy + 0.45, 0, 3.4, 1.5, SEAT, sofa, { depth: sx + sy + 1.2 }));
  iso.add(L, iso.box(sx, sy + 0.45, SEAT, 0.34, 1.5, 0.32, arm, { depth: sx + sy + 1.4 }));
  iso.add(L, iso.box(sx + 0.5, sy + 0.5, SEAT, 0.9, 0.5, 0.45, mix(sofa, '#ffffff', 0.2), { depth: sx + sy + 1.5 }));              // Kissen
  iso.add(L, { depth: sx + sy + 2.2, svg: person(iso, sx + 2.0, sy + 1.0, SEAT, { sit: true, seat: SEAT, thigh: 0.85, body: PAL.oliveL, skin: '#e3b894', hair: '#d9d2c3', legs: '#5a4a3c', shoe: '#3a2c20', s: 0.88 }) });
  iso.add(L, iso.box(sx + 3.06, sy + 0.45, SEAT, 0.34, 1.5, 0.32, arm, { depth: sx + sy + 4.2 }));
  // Couchtisch mit Tasse
  iso.add(L, iso.box(x0 + 3.0, y0 + 3.3, 0, 1.5, 0.95, 0.5, PAL.wood, { depth: x0 + y0 + 8 }));
  iso.add(L, iso.box(x0 + 3.3, y0 + 3.55, 0.5, 0.26, 0.26, 0.22, PAL.cream, { depth: x0 + y0 + 8.1 }));
  // Pflegekraft mit Tablet vor dem Sofa
  iso.add(L, { depth: x0 + y0 + 9, svg: person(iso, x0 + 1.9, y0 + 4.5, 0.14, { body: PAL.olive, accent: PAL.ochre, tablet: true, skin: '#e8c3a0', hair: '#7a4a2a' }) });
  iso.add(L, { depth: x0 + y0 + 20, svg: plant(iso, x0 + 6.3, y0 + 5.9, 0.14, 1.1) });
  return { tab: (() => { const q = iso.peek(x0 + 1.9, y0 + 4.5, 0.14); return [q[0] + 22, q[1] - 66]; })() };
}

// ---------- Raum 3: Büro, Abrechnung ----------
function office2(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#dcd5c0', accent: PAL.olive });
  const L = 'room';
  let deco = floorPlanks(iso, x0, y0, '#bfb89c');
  deco += iso.planeZ(0.16, x0 + 1.6, x0 + 6.2, y0 + 2.2, y0 + 6.0, '#cbc6a4');
  iso.add(L, { depth: x0 + y0 + 2, svg: deco });
  // Pinnwand mit Belegen über dem Schreibtisch (Rückwand entlang x)
  let board = iso.planeY(y0 + 0.01, x0 + 2.3, x0 + 5.9, 2.35, 3.15, '#fffaf0') + iso.planeY(y0 + 0.02, x0 + 2.42, x0 + 5.78, 2.47, 3.03, '#e9dec9');
  [[2.6, 2.55], [3.5, 2.6], [4.4, 2.52], [5.1, 2.62]].forEach(([bx, bz], i) => { board += iso.planeY(y0 + 0.03, x0 + bx, x0 + bx + 0.6, bz, bz + 0.38, i % 2 ? '#fffaf0' : '#f6efe2') + iso.planeY(y0 + 0.04, x0 + bx + 0.08, x0 + bx + 0.48, bz + 0.2, bz + 0.25, '#ddd1bf'); });
  iso.add(L, { depth: x0 + y0 + 2.1, svg: board });
  binderShelf(iso, x0, y0, L);
  // Schreibtisch an der Rückwand: Rechnung mit Positionen auf dem Bildschirm
  const ws = workstation(iso, L, x0, y0, {
    axis: 'y', off: 2.4, len: 3.2, person: { body: PAL.oliveD, skin: '#e8c3a0', hair: '#7a4a2a', legs: '#4a3a2c' },
    content: (sc, face, T, mv) => {
      let s = sc(face, mv + 0.16, mv + 1.54, T + 0.94, T + 1.04, PAL.ochre);
      for (let r = 0; r < 5; r++) {
        const z = T + 0.84 - r * 0.115;
        s += sc(face, mv + 0.16, mv + 0.16 + [0.9, 0.7, 0.8, 0.6, 0.85][r], z - 0.07, z, '#ddd1bf') + sc(face, mv + 1.3, mv + 1.5, z - 0.07, z, r === 4 ? PAL.ochre : PAL.olive);
      }
      return s;
    },
  });
  // Ablagewagen mit Drucker und Papier
  iso.add(L, iso.box(x0 + 0.7, y0 + 0.5, 0, 1.5, 1.1, 0.85, PAL.woodD, { depth: x0 + y0 + 4 }));
  let dr = '';
  for (let r = 0; r < 2; r++) dr += iso.planeY(y0 + 1.61, x0 + 0.8, x0 + 2.1, 0.12 + r * 0.38, 0.12 + r * 0.38 + 0.3, mix(PAL.woodD, '#ffffff', 0.12)) + iso.planeY(y0 + 1.62, x0 + 1.25, x0 + 1.65, 0.24 + r * 0.38, 0.28 + r * 0.38, PAL.ochre);
  iso.add(L, { depth: x0 + y0 + 4.05, svg: dr });
  iso.add(L, iso.box(x0 + 0.85, y0 + 0.65, 0.85, 1.2, 0.8, 0.4, PAL.cream, { depth: x0 + y0 + 4.2 }));
  iso.add(L, iso.box(x0 + 0.95, y0 + 0.85, 1.25, 1.0, 0.45, 0.05, '#fffaf0', { depth: x0 + y0 + 4.3 }));
  iso.add(L, { depth: x0 + y0 + 20, svg: plant(iso, x0 + 6.4, y0 + 0.9, 0.14, 1.0) });
  return { screen: ws.screenAt(1.5) };
}

// ---------- schwebende Oberflächen ----------
const popTour = panel(`
  <rect x="14" y="14" width="92" height="68" rx="10" fill="#eaefd8"/>
  <rect x="22" y="20" width="30" height="20" rx="6" fill="#cfd8a8"/><rect x="66" y="52" width="32" height="20" rx="6" fill="#cfd8a8"/>
  <path d="M14 64 Q50 44 106 56" stroke="#bcd3d3" stroke-width="7" fill="none"/>
  <path d="M14 52 L106 36 M58 14 L68 82 M88 14 L82 82" stroke="#fffaf0" stroke-width="4" fill="none"/>
  <path d="M28 70 L48 50 L72 58 L94 28" stroke="${PAL.ochre}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 7"/>
  ${[[28, 70], [48, 50], [72, 58], [94, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${PAL.terra}" stroke="${PAL.paper}" stroke-width="2.2"/><circle cx="${x}" cy="${y}" r="2" fill="${PAL.paper}"/>`).join('')}
  <rect x="118" y="38" width="42" height="14" rx="7" fill="${PAL.terra}"/><path d="M127 38 l5 -9 h16 l5 9z" fill="${PAL.terraD}"/>
  <circle cx="128" cy="53" r="5.5" fill="${PAL.ink}"/><circle cx="150" cy="53" r="5.5" fill="${PAL.ink}"/>
  <circle cx="148" cy="20" r="10" fill="${PAL.olive}"/><path d="M143 20 l3.5 4 l7 -8" stroke="${PAL.paper}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="126" cy="78" r="9" fill="${PAL.oliveL}"/><circle cx="126" cy="75" r="3.2" fill="${PAL.paper}"/><path d="M119.5 84 q6.5 -7 13 0z" fill="${PAL.paper}"/>
  <rect x="142" y="73" width="20" height="6" rx="3" fill="#ddd1bf"/><rect x="142" y="83" width="14" height="5" rx="2.5" fill="#ece3d1"/>
  <rect x="16" y="98" width="128" height="9" rx="4.5" fill="#ece3d1"/><rect x="16" y="98" width="96" height="9" rx="4.5" fill="${PAL.olive}"/>
  <rect x="16" y="112" width="86" height="5" rx="2.5" fill="#ddd1bf"/>`);

const popVisit = panel(`
  <g fill="none" stroke="${PAL.terra}" stroke-width="3.4" stroke-linecap="round">
    <path d="M16 40 a24 24 0 0 1 36 0 M23 47 a15 15 0 0 1 22 0 M29 54 a7 7 0 0 1 10 0"/><path d="M14 18 L56 62" stroke="${PAL.terraD}"/>
  </g>
  <circle cx="34" cy="60" r="3" fill="${PAL.terra}"/>
  ${[0, 1, 2].map((i) => `<g transform="translate(0 ${i * 22})"><rect x="72" y="20" width="14" height="14" rx="4" fill="${PAL.olive}"/><path d="M75.5 27 l3 3.4 l5.5 -6.4" stroke="${PAL.paper}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="94" y="23" width="${[50, 42, 36][i]}" height="7" rx="3.5" fill="#ddd1bf"/></g>`).join('')}
  <circle cx="152" cy="18" r="0" fill="none"/>
  <rect x="16" y="82" width="144" height="32" rx="9" fill="#f6efe2" stroke="#ddd1bf" stroke-width="1.5"/>
  <path d="M30 104 q6 -26 12 -6 t10 -2 q4 -14 9 0 t12 -4 q5 -10 10 0 t12 -2" stroke="${PAL.oliveD}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M24 106 h128" stroke="#ddd1bf" stroke-width="1.5" stroke-dasharray="3 4"/>
  <circle cx="148" cy="30" r="0" fill="none"/>`);

const popBill = panel(`
  <rect x="28" y="12" width="46" height="60" rx="6" fill="#ece3d1"/>
  <rect x="18" y="20" width="46" height="60" rx="6" fill="${PAL.paper}" stroke="#ddd1bf" stroke-width="1.5"/>
  <rect x="26" y="30" width="30" height="6" rx="3" fill="${PAL.ochre}"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="26" y="${44 + i * 8}" width="${[28, 22, 26, 18][i]}" height="4.5" rx="2.2" fill="#ddd1bf"/>`).join('')}
  <path d="M78 52 h24 m-8 -8 l8 8 l-8 8" stroke="${PAL.oliveD}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M108 44 L134 24 L160 44z" fill="${PAL.oliveD}"/>
  ${[0, 1, 2].map((i) => `<rect x="${114 + i * 16}" y="48" width="8" height="24" rx="2" fill="${PAL.oliveL}"/>`).join('')}
  <rect x="108" y="74" width="52" height="7" rx="2.5" fill="${PAL.olive}"/>
  <rect x="18" y="92" width="40" height="13" rx="6.5" fill="${PAL.ochre}"/><rect x="64" y="92" width="26" height="13" rx="6.5" fill="${PAL.terraL}"/>
  <circle cx="142" cy="97" r="10" fill="${PAL.olive}"/><path d="M137 97 l3.5 4 l7 -8" stroke="${PAL.paper}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="18" y="112" width="124" height="5" rx="2.5" fill="#ddd1bf"/>`);

// ---------- Gesamtszene ----------
export function buildAmbulant() {
  const iso = new Iso();
  const R1 = [0, 0], R2 = [11, 0], R3 = [22, 0];

  const slab = iso.box(-2, -2, -0.9, 33, 12, 0.9, '#e9dfcc', { shade: { top: '#efe6d3', left: '#cbbfa6', right: '#b3a78e' }, depth: -100 });
  const shadow = iso.polyN([[-3.2, -3, -0.9], [32.4, -3, -0.9], [32.4, 11.6, -0.9], [-3.2, 11.6, -0.9]], '#000000', 'opacity=".16"');
  let ground = '';
  // Gehweg und Straße vor den Gebäuden
  ground += iso.planeZ(0.01, -2, 31, 7.6, 8.4, '#f6eedf') + iso.planeZ(0.01, -2, 31, 8.4, 10, '#dcd4c2');
  ground += iso.line([-2, 8.4, 0.02], [31, 8.4, 0.02], '#cfc6b0', 2) + iso.line([-2, 7.6, 0.02], [31, 7.6, 0.02], '#e2d7c1', 1.4);
  for (let x = -1.5; x < 30; x += 2.4) ground += iso.line([x, 9.4, 0.02], [x + 1.2, 9.4, 0.02], '#f6eedf', 2.4);
  // Datenlinie über den Gehweg (läuft mit dem Scrollen)
  const toD = (pp) => pp.map((q, i) => { const [X, Y] = iso.p(q[0], q[1], 0.05); return (i ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1); }).join(' ');
  ground += `<path class="scn-link" d="${toD([[3.5, 7.0], [3.5, 8.0], [25.5, 8.0], [25.5, 7.0]])}" fill="none" stroke="${PAL.ochre}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 9"/>`;
  [[3.5, 7.0], [14.5, 7.0], [25.5, 7.0]].forEach(([x, y]) => { const [X, Y] = iso.p(x, y, 0.06); ground += `<ellipse cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" rx="13" ry="6.5" fill="${PAL.ochre}" opacity=".35"/><ellipse cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" rx="6" ry="3" fill="${PAL.ochre}"/>`; });

  const a = office1(iso, ...R1), b = flat(iso, ...R2), c = office2(iso, ...R3);

  // Bäume am Gehweg und das Einsatzfahrzeug vor der Wohnung
  const front = [tree(iso, -0.9, 8, 1.05), lamp(iso, 8.6, 8.15, 1), lamp(iso, 21.2, 8.15, 1), tree(iso, 29.6, 8, 1)].join('') + car(iso, 12.1, 8.5);

  const at = (x, y, z) => iso.peek(x, y, z);
  const pops = [
    { i: 1, at: at(R1[0] + 3.4, 3.4, 4.9), to: a.board, svg: popTour },
    { i: 2, at: at(R2[0] + 3.4, 3.4, 4.9), to: b.tab, svg: popVisit },
    { i: 3, at: at(R3[0] + 3.4, 3.4, 4.9), to: c.screen, svg: popBill },
  ];
  return assemble(iso, { R: [R1, R2, R3], pops, shadow, slab, ground, front, extra: { 1: [[12, 8.5, 0], [15.7, 10, 0], [12, 10, 0]] } });
}
