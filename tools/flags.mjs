// Flaggen für den Sprachwähler, als SVG-Symbole im Format 24 x 16 (3:2).
// Die Farben sind auf die Seite abgestimmt: Weiß ist das Papier, Schwarz die Tinte, Rot ein warmes Ziegelrot,
// Blau ein gedämpftes Tintenblau, Grün und Gold sind ins Oliv und Ocker der Landschaft gezogen.
// Zusätzlich legt styles.css einen warmen Schleier und eine feine Kante darüber (.flag::after).
//
// Aufruf aus build-i18n.mjs:  flagSprite(['de', 'en', ...])  und  flagIcon('de')

const C = {
  paper: '#fbf7f0',
  ink: '#2a2018',
  red: '#c0462f',
  carmine: '#98303a',
  blue: '#2f5384',
  sky: '#3f78ad',
  gold: '#d9a53b',
  green: '#5f8350',
  orange: '#dd8a45',
  silver: '#a9a59b',
};

// Streifen ohne Lücken: jede Fläche reicht bis zum Rand, die nächste liegt darüber
const h3 = (a, b, c) => `<rect width="24" height="16" fill="${a}"/><rect y="5.33" width="24" height="10.67" fill="${b}"/><rect y="10.67" width="24" height="5.33" fill="${c}"/>`;
const v3 = (a, b, c) => `<rect width="24" height="16" fill="${a}"/><rect x="8" width="16" height="16" fill="${b}"/><rect x="16" width="8" height="16" fill="${c}"/>`;
const nordic = (bg, cross, x = 6) => `<rect width="24" height="16" fill="${bg}"/><rect x="${x}" width="3" height="16" fill="${cross}"/><rect y="6.5" width="24" height="3" fill="${cross}"/>`;
const shield = (x, y, w, h, fill, stroke) => `<path d="M${x} ${y}h${w}v${h * 0.6}q0 ${h * 0.32} -${w / 2} ${h * 0.4}q-${w / 2} -${h * 0.08} -${w / 2} -${h * 0.4}z" fill="${fill}" stroke="${stroke}" stroke-width=".5"/>`;

const FLAGS = {
  de: h3(C.ink, C.red, C.gold),
  bg: h3(C.paper, C.green, C.red),
  cz: `<rect width="24" height="16" fill="${C.paper}"/><rect y="8" width="24" height="8" fill="${C.red}"/><path d="M0 0L12 8L0 16z" fill="${C.blue}"/>`,
  dk: nordic(C.red, C.paper, 7),
  gr: `<rect width="24" height="16" fill="${C.sky}"/>${[1, 3, 5, 7].map((i) => `<rect y="${(i * 16 / 9).toFixed(2)}" width="24" height="1.78" fill="${C.paper}"/>`).join('')}<rect width="8.89" height="8.89" fill="${C.sky}"/><rect x="3.56" width="1.78" height="8.89" fill="${C.paper}"/><rect y="3.56" width="8.89" height="1.78" fill="${C.paper}"/>`,
  gb: `<rect width="24" height="16" fill="${C.blue}"/><path d="M0 0L24 16M24 0L0 16" stroke="${C.paper}" stroke-width="3.2"/><path d="M0 0L24 16M24 0L0 16" stroke="${C.red}" stroke-width="1.1"/><rect x="9.6" width="4.8" height="16" fill="${C.paper}"/><rect y="5.6" width="24" height="4.8" fill="${C.paper}"/><rect x="10.8" width="2.4" height="16" fill="${C.red}"/><rect y="6.8" width="24" height="2.4" fill="${C.red}"/>`,
  es: `<rect width="24" height="16" fill="${C.red}"/><rect y="4" width="24" height="8" fill="${C.gold}"/>`,
  ee: h3(C.sky, C.ink, C.paper),
  fi: nordic(C.paper, C.blue, 6.5),
  fr: v3(C.blue, C.paper, C.red),
  ie: v3(C.green, C.paper, C.orange),
  hr: `${h3(C.red, C.paper, C.blue)}<path d="M10.2 5.4h3.6v3.2q0 1.5 -1.8 2.2q-1.8 -.7 -1.8 -2.2z" fill="${C.paper}" stroke="${C.ink}" stroke-width=".35"/><path d="M10.5 5.7h1.2v1.2h-1.2zM12.3 5.7h1.2v1.2h-1.2zM11.4 6.9h1.2v1.2h-1.2zM10.5 8.1h1.2v.8q0 .3 .1 .5h-1.3zM12.3 8.1h1.2v.8q0 .3 -.1 .5h-1.1z" fill="${C.red}"/>`,
  hu: h3(C.red, C.paper, C.green),
  it: v3(C.green, C.paper, C.red),
  lt: h3(C.gold, C.green, C.red),
  lv: `<rect width="24" height="16" fill="${C.carmine}"/><rect y="6.4" width="24" height="3.2" fill="${C.paper}"/>`,
  mt: `<rect width="24" height="16" fill="${C.paper}"/><rect x="12" width="12" height="16" fill="${C.red}"/><path d="M2.6 1.3h1.3v1.5h1.5v1.3h-1.5v1.5h-1.3v-1.5h-1.5v-1.3h1.5z" fill="${C.silver}"/>`,
  nl: h3(C.red, C.paper, C.blue),
  pl: `<rect width="24" height="16" fill="${C.paper}"/><rect y="8" width="24" height="8" fill="${C.red}"/>`,
  pt: `<rect width="24" height="16" fill="${C.red}"/><rect width="9.6" height="16" fill="${C.green}"/><circle cx="9.6" cy="8" r="3.4" fill="${C.gold}"/><path d="M8.3 6.3h2.6v2.3q0 1.1 -1.3 1.6q-1.3 -.5 -1.3 -1.6z" fill="${C.red}" stroke="${C.paper}" stroke-width=".5"/>`,
  ro: v3(C.blue, C.gold, C.red),
  sk: `${h3(C.paper, C.blue, C.red)}${shield(3.6, 3.4, 5.6, 9.2, C.red, C.paper)}<rect x="6.15" y="4.8" width=".5" height="5.2" fill="${C.paper}"/><rect x="5.3" y="6" width="2.2" height=".5" fill="${C.paper}"/><rect x="5.5" y="7.4" width="1.8" height=".5" fill="${C.paper}"/><path d="M4.6 11.2l1.4 -1.6l.6 .6l.7 -.9l1 1.9q-.8 .7 -1.4 .9q-1.4 -.5 -2.3 -.9z" fill="${C.blue}"/>`,
  si: `${h3(C.paper, C.blue, C.red)}${shield(3.4, 2.8, 5.2, 8.4, C.blue, C.paper)}<path d="M4.4 8.4l1.6 -2.6l.7 1.1l.5 -.8l1 2.3z" fill="${C.paper}"/>`,
  se: nordic(C.sky, C.gold, 6),
};

// Sprachcode (ISO 639-1) -> Flagge (ISO 3166)
const COUNTRY = { de: 'de', bg: 'bg', cs: 'cz', da: 'dk', el: 'gr', en: 'gb', es: 'es', et: 'ee', fi: 'fi', fr: 'fr', ga: 'ie', hr: 'hr', hu: 'hu', it: 'it', lt: 'lt', lv: 'lv', mt: 'mt', nl: 'nl', pl: 'pl', pt: 'pt', ro: 'ro', sk: 'sk', sl: 'si', sv: 'se' };

export function flagSprite(langs) {
  const symbols = langs.map((l) => {
    const f = FLAGS[COUNTRY[l]];
    if (!f) throw new Error(`Keine Flagge für Sprache ${l}`);
    return `<symbol id="fl-${l}" viewBox="0 0 24 16">${f}</symbol>`;
  }).join('');
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${symbols}</svg>`;
}

export const flagIcon = (l) => `<span class="flag" aria-hidden="true"><svg viewBox="0 0 24 16" width="24" height="16" focusable="false"><use href="#fl-${l}"/></svg></span>`;
