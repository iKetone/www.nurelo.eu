// Szene "Hausnotruf": vom Alarm bis zur Abrechnung. Wohnung der Teilnehmerin (Alarm und Einsatz), Hausnotrufzentrale (Weiterleitung, Fehl- und Probealarme),
// Verwaltung (Teilnehmer, Geräte, Monatspauschale), davor die Straße mit dem Einsatzfahrzeug. Zeichnung als SVG-Text, die Kamera fährt per scene.js.
import { Iso, person, mix } from './iso.mjs';
import { PAL, room, floorPlanks, plant, tree, lamp, car, panel, binderShelf, workstation, assemble } from './kit.mjs';

// ---------- Raum 1: Wohnung der Teilnehmerin ----------
function home(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#e3d3b0', accent: PAL.ochre });
  const L = 'room';
  let deco = floorPlanks(iso, x0, y0, '#c8b58c');
  deco += iso.planeZ(0.16, x0 + 0.5, x0 + 5.4, y0 + 1.8, y0 + 5.8, '#e2c5ae') + iso.planeZ(0.17, x0 + 0.75, x0 + 5.15, y0 + 2.05, y0 + 5.55, '#ecd3bf');
  iso.add(L, { depth: x0 + y0 + 2, svg: deco });
  // Fenster auf der Rückwand entlang x, Bild an der Wand x = x0
  let win = iso.planeY(y0 + 0.01, x0 + 3.9, x0 + 6.4, 0.95, 2.95, '#fffaf0') + iso.planeY(y0 + 0.02, x0 + 4.05, x0 + 6.25, 1.1, 2.8, 'url(#scn-glow)');
  win += iso.line([x0 + 5.15, y0 + 0.03, 1.1], [x0 + 5.15, y0 + 0.03, 2.8], '#fffaf0', 2) + iso.line([x0 + 4.05, y0 + 0.03, 1.95], [x0 + 6.25, y0 + 0.03, 1.95], '#fffaf0', 2);
  win += iso.polyN([[x0 + 4.1, y0 + 0.1, 0.19], [x0 + 6.2, y0 + 0.1, 0.19], [x0 + 6.9, y0 + 3.2, 0.19], [x0 + 4.8, y0 + 3.2, 0.19]], '#fff3d1', 'opacity=".2"');
  iso.add(L, { depth: x0 + y0 + 2.1, svg: win });
  iso.add(L, { depth: x0 + y0 + 2.1, svg: iso.planeX(x0 + 0.01, y0 + 3.4, y0 + 5.4, 1.7, 2.8, '#fffaf0') + iso.planeX(x0 + 0.02, y0 + 3.55, y0 + 5.25, 1.85, 2.65, PAL.oliveL) + iso.polyN([[x0 + 0.03, y0 + 3.55, 1.85], [x0 + 0.03, y0 + 4.5, 1.85], [x0 + 0.03, y0 + 3.55, 2.5]], PAL.olive, 'opacity=".5"') });
  // Sessel mit der Teilnehmerin, Funk-Rufknopf um den Hals; linke Armlehne hinter ihr, rechte davor
  const cx = x0 + 0.9, cy = y0 + 0.4, SEAT = 0.75, ch = mix(PAL.oliveL, '#000000', 0.12);
  iso.add(L, iso.box(cx, cy, 0, 2.0, 0.4, 2.0, PAL.oliveL, { depth: cx + cy + 0.4 }));
  iso.add(L, iso.box(cx, cy + 0.4, 0, 2.0, 1.6, SEAT, PAL.oliveL, { depth: cx + cy + 1.0 }));
  iso.add(L, iso.box(cx, cy + 0.4, SEAT, 0.32, 1.6, 0.32, ch, { depth: cx + cy + 1.2 }));
  iso.add(L, { depth: cx + cy + 1.9, svg: person(iso, cx + 1.0, cy + 0.95, SEAT, { sit: true, seat: SEAT, thigh: 0.85, body: PAL.terraL, skin: '#e3b894', hair: '#d9d2c3', legs: '#6b5a49', shoe: '#4a3a2c', s: 0.88, pendant: PAL.ochre }) });
  iso.add(L, iso.box(cx + 1.68, cy + 0.4, SEAT, 0.32, 1.6, 0.32, ch, { depth: cx + cy + 3.6 }));
  // Beistelltisch mit Hausnotrufgerät (großer Alarmknopf) und Lampe
  const tx = x0 + 3.2, ty = y0 + 0.7;
  iso.add(L, iso.box(tx, ty, 0, 0.9, 0.9, 0.8, PAL.wood, { depth: tx + ty + 2 }));
  iso.add(L, iso.box(tx + 0.12, ty + 0.18, 0.8, 0.62, 0.5, 0.16, PAL.cream, { depth: tx + ty + 2.2 }));
  iso.add(L, { depth: tx + ty + 2.3, svg: iso.planeZ(0.97, tx + 0.28, tx + 0.46, ty + 0.3, ty + 0.48, PAL.terra) + iso.planeZ(0.975, tx + 0.33, tx + 0.41, ty + 0.35, ty + 0.43, '#fffaf0') });
  iso.add(L, iso.box(tx + 0.6, ty + 0.12, 0.8, 0.2, 0.2, 0.5, '#fff3d1', { depth: tx + ty + 2.4 }));
  // Anrichte mit Rahmen an der Wand x = x0
  iso.add(L, iso.box(x0 + 0.1, y0 + 3.5, 0, 0.9, 2.2, 0.95, PAL.wood, { depth: x0 + y0 + 5 }));
  iso.add(L, iso.box(x0 + 0.3, y0 + 3.8, 0.95, 0.12, 0.55, 0.5, '#fffaf0', { depth: x0 + y0 + 5.1 }));
  iso.add(L, iso.box(x0 + 0.3, y0 + 4.6, 0.95, 0.12, 0.6, 0.4, '#fffaf0', { depth: x0 + y0 + 5.2 }));
  // Einsatzkraft mit Tablet dokumentiert den Einsatz
  iso.add(L, { depth: x0 + y0 + 9, svg: person(iso, x0 + 3.5, y0 + 5.0, 0.14, { body: PAL.olive, accent: PAL.ochre, tablet: true, skin: '#c8956d', hair: '#2b1d14' }) });
  iso.add(L, { depth: x0 + y0 + 20, svg: plant(iso, x0 + 6.3, y0 + 5.9, 0.14, 1.1) });
  const tq = iso.peek(x0 + 3.5, y0 + 5.0, 0.14);
  return { device: iso.peek(tx + 0.37, ty + 0.4, 1.0), tab: [tq[0] + 22, tq[1] - 66] };
}

// ---------- Raum 2: Hausnotrufzentrale ----------
function center(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#d3cdb9', accent: PAL.oliveD });
  const L = 'room';
  let deco = floorPlanks(iso, x0, y0, '#b6b098');
  deco += iso.planeZ(0.16, x0 + 2.4, x0 + 6.6, y0 + 3.6, y0 + 6.6, '#c4bf9f');
  iso.add(L, { depth: x0 + y0 + 2, svg: deco });
  // Videowand an der Rückwand entlang x: sechs Felder, eines meldet den Alarm
  const Y = y0 + 0.03;
  let wall = iso.planeY(y0 + 0.01, x0 + 1.3, x0 + 6.5, 2.15, 3.3, PAL.ink);
  const tiles = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) tiles.push([c, r]);
  tiles.forEach(([c, r], i) => {
    const xa = x0 + 1.4 + c * 1.7, xb = xa + 1.6, za = 2.22 + (1 - r) * 0.55, zb = za + 0.5;
    wall += iso.planeY(Y, xa, xb, za, zb, i === 1 ? mix(PAL.terraD, '#000000', 0.2) : '#2e251c');
    if (i === 1) { wall += iso.planeY(Y + 0.01, xa + 0.12, xb - 0.12, za + 0.1, za + 0.17, PAL.terra) + iso.planeY(Y + 0.01, xa + 0.12, xa + 0.9, za + 0.27, za + 0.33, '#f2c3b0') + iso.planeY(Y + 0.01, xa + 0.12, xa + 1.2, za + 0.38, za + 0.43, '#f2c3b0'); }
    else if (i === 3) { for (let k = 0; k < 5; k++) wall += iso.planeY(Y + 0.01, xa + 0.12 + k * 0.28, xa + 0.3 + k * 0.28, za + 0.08, za + 0.12 + [0.18, 0.3, 0.12, 0.26, 0.2][k], PAL.oliveL); }
    else { for (let k = 0; k < 3; k++) wall += iso.planeY(Y + 0.01, xa + 0.12, xa + 0.7 + (k % 2) * 0.5, za + 0.1 + k * 0.12, za + 0.17 + k * 0.12, i === 2 ? PAL.ochre : PAL.olive); }
  });
  iso.add(L, { depth: x0 + y0 + 2.1, svg: wall });
  binderShelf(iso, x0, y0, L);
  // Zwei Arbeitsplätze: einer an der linken Wand, einer an der Rückwand
  const alarmRows = (sc, face, T, mv) => {
    let s = sc(face, mv + 0.16, mv + 1.54, T + 0.94, T + 1.04, PAL.terra);
    for (let r = 0; r < 4; r++) {
      const z = T + 0.84 - r * 0.14;
      s += sc(face, mv + 0.16, mv + 0.3, z - 0.09, z, r === 0 ? PAL.terra : PAL.olive) + sc(face, mv + 0.4, mv + 0.4 + [0.9, 0.7, 0.8, 0.6][r], z - 0.09, z, '#ddd1bf');
    }
    return s;
  };
  const w1 = workstation(iso, L, x0, y0, { axis: 'x', off: 3.0, len: 3.2, content: alarmRows, person: { body: PAL.terraD, skin: '#8d5a3c', hair: '#3a2418', legs: '#3a2e22' } });
  const w2 = workstation(iso, L, x0, y0, { axis: 'y', off: 1.7, len: 3.3, content: alarmRows, person: { body: PAL.olive, skin: '#e8c3a0', hair: '#7a4a2a', legs: '#4a3a2c' } });
  iso.add(L, { depth: x0 + y0 + 20, svg: plant(iso, x0 + 6.4, y0 + 0.8, 0.14, 1) });
  return { wall: iso.peek(x0 + 4.0, y0 + 0.03, 2.7), w1, w2 };
}

// ---------- Raum 3: Verwaltung ----------
function admin(iso, x0, y0) {
  room(iso, x0, y0, { floor: '#dcd5c0', accent: PAL.terra });
  const L = 'room';
  let deco = floorPlanks(iso, x0, y0, '#bfb89c');
  deco += iso.planeZ(0.16, x0 + 1.6, x0 + 6.2, y0 + 2.2, y0 + 6.0, '#cfc7a8');
  iso.add(L, { depth: x0 + y0 + 2, svg: deco });
  // Monatskalender an der Rückwand entlang x
  const Y = y0 + 0.03;
  let cal = iso.planeY(y0 + 0.01, x0 + 2.4, x0 + 5.8, 1.9, 3.15, '#fffaf0') + iso.planeY(y0 + 0.02, x0 + 2.5, x0 + 5.7, 2.0, 3.05, '#fbf7f0') + iso.planeY(Y, x0 + 2.5, x0 + 5.7, 2.8, 3.05, PAL.terra);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) cal += iso.planeY(Y, x0 + 2.58 + c * 0.51, x0 + 2.58 + c * 0.51 + 0.43, 2.07 + r * 0.17, 2.07 + r * 0.17 + 0.12, (r === 3 && c === 5) ? PAL.terra : ((r * 6 + c) % 7 === 3 ? PAL.oliveL : '#ece3d1'));
  iso.add(L, { depth: x0 + y0 + 2.1, svg: cal });
  // Geräteregal an der Wand x = x0: Funk-Rufknöpfe und Basisgeräte in kleinen Schachteln
  let sh = iso.planeX(x0 + 0.01, y0 + 1.0, y0 + 5.8, 1.9, 2.0, PAL.wood) + iso.planeX(x0 + 0.01, y0 + 1.0, y0 + 5.8, 1.1, 1.2, PAL.wood);
  for (let i = 0; i < 7; i++) for (const [z0, hgt] of [[2.0, 0.6], [1.2, 0.62]]) {
    const ya = y0 + 1.15 + i * 0.64 + (z0 > 1.5 ? 0.05 : 0);
    sh += iso.planeX(x0 + 0.02, ya, ya + 0.5, z0, z0 + hgt - (i % 3) * 0.06, i % 2 ? '#fffaf0' : PAL.cream);
    sh += iso.planeX(x0 + 0.03, ya + 0.17, ya + 0.33, z0 + 0.18, z0 + 0.3, PAL.terra);
  }
  iso.add(L, { depth: x0 + y0 + 2.2, svg: sh });
  // Schreibtisch an der Rückwand: Abrechnung auf dem Bildschirm
  const ws = workstation(iso, L, x0, y0, {
    axis: 'y', off: 2.4, len: 3.2, person: { body: PAL.oliveD, skin: '#c8956d', hair: '#2b1d14', legs: '#4a3a2c' },
    content: (sc, face, T, mv) => {
      let s = sc(face, mv + 0.16, mv + 1.54, T + 0.94, T + 1.04, PAL.ochre);
      for (let r = 0; r < 5; r++) {
        const z = T + 0.84 - r * 0.115;
        s += sc(face, mv + 0.16, mv + 0.16 + [0.9, 0.7, 0.8, 0.6, 0.85][r], z - 0.07, z, '#ddd1bf') + sc(face, mv + 1.3, mv + 1.5, z - 0.07, z, r === 4 ? PAL.ochre : PAL.olive);
      }
      return s;
    },
  });
  // Ablagewagen mit Drucker
  iso.add(L, iso.box(x0 + 0.7, y0 + 0.5, 0, 1.5, 1.1, 0.85, PAL.woodD, { depth: x0 + y0 + 4 }));
  iso.add(L, iso.box(x0 + 0.85, y0 + 0.65, 0.85, 1.2, 0.8, 0.4, PAL.cream, { depth: x0 + y0 + 4.2 }));
  iso.add(L, iso.box(x0 + 0.95, y0 + 0.85, 1.25, 1.0, 0.45, 0.05, '#fffaf0', { depth: x0 + y0 + 4.3 }));
  iso.add(L, { depth: x0 + y0 + 20, svg: plant(iso, x0 + 6.4, y0 + 0.9, 0.14, 1.0) });
  return { screen: ws.screenAt(1.5) };
}

// ---------- schwebende Oberflächen ----------
const popAlarm = panel(`
  <g fill="none" stroke="${PAL.terra}" stroke-width="3.2" stroke-linecap="round"><path d="M44 20 a14 14 0 0 1 10 10 M49 12 a24 24 0 0 1 17 17"/></g>
  <circle cx="30" cy="42" r="18" fill="${PAL.terra}"/><circle cx="30" cy="42" r="7" fill="${PAL.paper}"/>
  <path d="M54 52 h14 m-5 -5 l5 5 l-5 5" stroke="${PAL.oliveD}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="88" cy="42" r="18" fill="${PAL.oliveL}"/><circle cx="88" cy="37" r="6" fill="${PAL.paper}"/><path d="M76 56 q12 -13 24 0z" fill="${PAL.paper}"/>
  <circle cx="102" cy="28" r="7.5" fill="${PAL.olive}"/><path d="M98.5 28 l2.5 3 l5 -6" stroke="${PAL.paper}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M112 52 h14 m-5 -5 l5 5 l-5 5" stroke="${PAL.oliveD}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="134" y="26" width="30" height="38" rx="6" fill="#fffaf0" stroke="#ddd1bf" stroke-width="1.5"/>
  ${[0, 1, 2].map((i) => `<rect x="140" y="${34 + i * 8}" width="${[18, 14, 16][i]}" height="4.5" rx="2.2" fill="#ddd1bf"/>`).join('')}
  <circle cx="158" cy="62" r="9" fill="${PAL.olive}"/><path d="M153.5 62 l3 3.5 l6 -7" stroke="${PAL.paper}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="16" y="86" width="136" height="9" rx="4.5" fill="#ece3d1"/><rect x="16" y="86" width="104" height="9" rx="4.5" fill="${PAL.olive}"/>
  <rect x="16" y="102" width="96" height="5" rx="2.5" fill="#ddd1bf"/><rect x="16" y="112" width="70" height="5" rx="2.5" fill="#ece3d1"/>`);

const popCenter = panel(`
  <rect x="14" y="16" width="86" height="26" rx="8" fill="#f6efe2"/><circle cx="28" cy="29" r="6" fill="${PAL.terra}"/><rect x="42" y="25" width="46" height="8" rx="4" fill="#ddd1bf"/>
  <rect x="14" y="48" width="86" height="26" rx="8" fill="#f6efe2"/><circle cx="28" cy="61" r="9" fill="${PAL.olive}"/><path d="M23.5 61 l3.5 4 l7 -8" stroke="${PAL.paper}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="44" y="57" width="40" height="8" rx="4" fill="#ddd1bf"/>
  <g transform="translate(138 46) rotate(-90)" fill="none" stroke-width="13">
    <circle r="22" stroke="#ece3d1"/><circle r="22" stroke="${PAL.olive}" stroke-dasharray="96 138"/>
    <circle r="22" stroke="${PAL.ochre}" stroke-dasharray="26 138" stroke-dashoffset="-98"/><circle r="22" stroke="${PAL.terra}" stroke-dasharray="14 138" stroke-dashoffset="-126"/>
  </g>
  <rect x="16" y="86" width="136" height="9" rx="4.5" fill="#ece3d1"/><rect x="16" y="86" width="88" height="9" rx="4.5" fill="${PAL.olive}"/>
  <circle cx="26" cy="108" r="5" fill="${PAL.olive}"/><rect x="36" y="105" width="30" height="5" rx="2.5" fill="#ddd1bf"/>
  <circle cx="82" cy="108" r="5" fill="${PAL.ochre}"/><rect x="92" y="105" width="26" height="5" rx="2.5" fill="#ddd1bf"/>
  <circle cx="132" cy="108" r="5" fill="${PAL.terra}"/><rect x="142" y="105" width="18" height="5" rx="2.5" fill="#ddd1bf"/>`);

const popBill = panel(`
  <rect x="14" y="14" width="72" height="62" rx="8" fill="${PAL.paper}" stroke="#ddd1bf" stroke-width="1.5"/>
  <rect x="14" y="14" width="72" height="14" rx="8" fill="${PAL.terra}"/><rect x="14" y="22" width="72" height="6" fill="${PAL.terra}"/>
  ${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${21 + c * 12.5}" y="${35 + r * 10}" width="9" height="7" rx="2" fill="${(r === 3 && c === 4) ? PAL.terra : ((r * 5 + c) % 6 === 2 ? PAL.oliveL : '#ece3d1')}"/>`).join('')).join('')}
  <g transform="translate(124 46)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-20 -6 a21 21 0 0 1 36 -10" stroke="${PAL.oliveD}" stroke-width="3.4"/><path d="M16 -16 l1 -9 l-8 4" stroke="${PAL.oliveD}" stroke-width="3.4"/>
    <path d="M20 8 a21 21 0 0 1 -36 10" stroke="${PAL.oliveD}" stroke-width="3.4"/><path d="M-16 18 l-1 9 l8 -4" stroke="${PAL.oliveD}" stroke-width="3.4"/>
    <circle r="11" fill="${PAL.olive}" stroke="none"/><path d="M-5 0 l3.5 4 l7 -8" stroke="${PAL.paper}" stroke-width="2.6"/>
  </g>
  <rect x="16" y="92" width="38" height="13" rx="6.5" fill="${PAL.ochre}"/><rect x="60" y="92" width="26" height="13" rx="6.5" fill="${PAL.terraL}"/>
  <rect x="16" y="112" width="128" height="5" rx="2.5" fill="#ddd1bf"/>`);

// ---------- Gesamtszene ----------
export function buildHausnotruf() {
  const iso = new Iso();
  const R1 = [0, 0], R2 = [11, 0], R3 = [22, 0];

  const slab = iso.box(-2, -2, -0.9, 33, 12, 0.9, '#e9dfcc', { shade: { top: '#efe6d3', left: '#cbbfa6', right: '#b3a78e' }, depth: -100 });
  const shadow = iso.polyN([[-3.2, -3, -0.9], [32.4, -3, -0.9], [32.4, 11.6, -0.9], [-3.2, 11.6, -0.9]], '#000000', 'opacity=".16"');
  let ground = '';
  ground += iso.planeZ(0.01, -2, 31, 7.6, 8.4, '#f6eedf') + iso.planeZ(0.01, -2, 31, 8.4, 10, '#dcd4c2');
  ground += iso.line([-2, 8.4, 0.02], [31, 8.4, 0.02], '#cfc6b0', 2) + iso.line([-2, 7.6, 0.02], [31, 7.6, 0.02], '#e2d7c1', 1.4);
  for (let x = -1.5; x < 30; x += 2.4) ground += iso.line([x, 9.4, 0.02], [x + 1.2, 9.4, 0.02], '#f6eedf', 2.4);
  const toD = (pp) => pp.map((q, i) => { const [X, Y] = iso.p(q[0], q[1], 0.05); return (i ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1); }).join(' ');
  ground += `<path class="scn-link" d="${toD([[3.5, 7.0], [3.5, 8.0], [25.5, 8.0], [25.5, 7.0]])}" fill="none" stroke="${PAL.ochre}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 9"/>`;
  [[3.5, 7.0], [14.5, 7.0], [25.5, 7.0]].forEach(([x, y]) => { const [X, Y] = iso.p(x, y, 0.06); ground += `<ellipse cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" rx="13" ry="6.5" fill="${PAL.ochre}" opacity=".35"/><ellipse cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" rx="6" ry="3" fill="${PAL.ochre}"/>`; });

  const a = home(iso, ...R1), b = center(iso, ...R2), c = admin(iso, ...R3);

  // Einsatzfahrzeug vor der Wohnung, Bäume und Laternen am Gehweg
  const front = [tree(iso, -0.9, 8, 1.05), lamp(iso, 8.8, 8.15, 1), lamp(iso, 19.8, 8.15, 1), tree(iso, 29.6, 8, 1)].join('') + car(iso, 1.6, 8.5, { body: PAL.olive, sign: PAL.ochre });

  const at = (x, y, z) => iso.peek(x, y, z);
  const pops = [
    { i: 1, at: at(R1[0] + 3.0, 3.4, 4.9), to: a.tab, svg: popAlarm },
    { i: 2, at: at(R2[0] + 3.4, 3.4, 4.9), to: b.wall, svg: popCenter },
    { i: 3, at: at(R3[0] + 3.4, 3.4, 4.9), to: c.screen, svg: popBill },
  ];
  return assemble(iso, { R: [R1, R2, R3], pops, shadow, slab, ground, front, extra: { 0: [[1.4, 8.5, 0], [5.2, 10, 0], [1.4, 10, 0]] } });
}
