// Erzeugt die Sprachversionen aus src/index.template.html und i18n/<code>.json.
// Aufruf im Projektordner:  node tools/build-i18n.mjs
// Deutsch (Ausgangssprache) landet in /index.html, alle anderen in /<code>/index.html.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.nurelo.eu';

// code, Eigenname der Sprache, og:locale
const LANGS = [
  ['de', 'Deutsch', 'de_DE'], ['bg', 'Български', 'bg_BG'], ['cs', 'Čeština', 'cs_CZ'],
  ['da', 'Dansk', 'da_DK'], ['el', 'Ελληνικά', 'el_GR'], ['en', 'English', 'en_GB'],
  ['es', 'Español', 'es_ES'], ['et', 'Eesti', 'et_EE'], ['fi', 'Suomi', 'fi_FI'],
  ['fr', 'Français', 'fr_FR'], ['ga', 'Gaeilge', 'ga_IE'], ['hr', 'Hrvatski', 'hr_HR'],
  ['hu', 'Magyar', 'hu_HU'], ['it', 'Italiano', 'it_IT'], ['lt', 'Lietuvių', 'lt_LT'],
  ['lv', 'Latviešu', 'lv_LV'], ['mt', 'Malti', 'mt_MT'], ['nl', 'Nederlands', 'nl_NL'],
  ['pl', 'Polski', 'pl_PL'], ['pt', 'Português', 'pt_PT'], ['ro', 'Română', 'ro_RO'],
  ['sk', 'Slovenčina', 'sk_SK'], ['sl', 'Slovenščina', 'sl_SI'], ['sv', 'Svenska', 'sv_SE'],
];

const path = (code) => (code === 'de' ? '/' : `/${code}/`);
const escAttr = (s) => s.replace(/&(?!(?:amp|nbsp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/&nbsp;/g, ' ').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripTags = (s) => s.replace(/<[^>]*>/g, '');

const template = readFileSync(join(root, 'src/index.template.html'), 'utf8');
const de = JSON.parse(readFileSync(join(root, 'i18n/de.json'), 'utf8'));
const keys = Object.keys(de);

const hreflang = [
  ...LANGS.map(([c]) => `  <link rel="alternate" hreflang="${c}" href="${SITE}${path(c)}" />`),
  `  <link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
].join('\n');

let problems = 0;
const usedKeys = new Set();

for (const [code, name, locale] of LANGS) {
  const file = join(root, 'i18n', `${code}.json`);
  if (!existsSync(file)) { console.error(`FEHLT: i18n/${code}.json`); problems++; continue; }
  const t = JSON.parse(readFileSync(file, 'utf8'));

  for (const k of keys) if (!(k in t) || !String(t[k]).trim()) { console.error(`${code}: Schlüssel fehlt oder leer: ${k}`); problems++; }
  for (const k of Object.keys(t)) if (!(k in de)) { console.error(`${code}: unbekannter Schlüssel: ${k}`); problems++; }
  for (const k of keys) if (/[—]/.test(t[k] || '')) { console.error(`${code}: Gedankenstrich in ${k}`); problems++; }

  const items = LANGS.map(([c, n]) =>
    `          <li><a href="${path(c)}" hreflang="${c}" lang="${c}"${c === code ? ' aria-current="true"' : ''}>${n}</a></li>`).join('\n');
  usedKeys.add('lang_aria');
  const switcher = `      <details class="lang">
        <summary aria-label="${escAttr(stripTags(t.lang_aria))}"><span aria-hidden="true">${code.toUpperCase()}</span></summary>
        <ul class="lang-list">
${items}
        </ul>
      </details>`;

  const val = (k) => { usedKeys.add(k); return t[k]; };
  let out = template
    .replace(/\{\{a:([a-z0-9_]+)\}\}/g, (_, k) => escAttr(stripTags(val(k))))
    .replace(/\{\{u:([a-z0-9_]+)\}\}/g, (_, k) => encodeURIComponent(stripTags(val(k))))
    .replace(/\{\{j:([a-z0-9_]+)\}\}/g, (_, k) => JSON.stringify(stripTags(val(k))).slice(1, -1))
    .replace(/\{\{([a-z0-9_]+)\}\}/g, (m, k) => {
      const special = { lang: code, locale, url: SITE + path(code), hreflang, switcher };
      if (k in special) return special[k];
      if (!(k in de)) { console.error(`Vorlage nutzt unbekannten Schlüssel: ${k}`); problems++; return m; }
      return val(k);
    });

  const dir = code === 'de' ? root : join(root, code);
  if (code !== 'de') mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), out);
}

for (const k of keys) if (!usedKeys.has(k)) { console.error(`Schlüssel ungenutzt: ${k}`); problems++; }
console.log(problems ? `${problems} Problem(e)` : `OK: ${LANGS.length} Sprachen gebaut`);
process.exit(problems ? 1 : 0);
