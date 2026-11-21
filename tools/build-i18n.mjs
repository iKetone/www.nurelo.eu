// Erzeugt alle Seiten aus den Vorlagen in src/ und den Texten in i18n/.
// Aufruf im Projektordner:  node tools/build-i18n.mjs
//
// Startseite:     src/index.template.html   + i18n/<code>.json            (24 Sprachen)
// Produktseiten:  src/product.template.html + i18n/produkte.<code>.json   (siehe PRODUCT_LANGS)
// Außerdem: sitemap.xml und robots.txt
// Landschaft:     tools/landscape/*.mjs zeichnen die Ebenen für Hero und Kapitelübergänge (landscape/*.svg, src/partials/land-hero.html, seam-*.html)
// Szenen:         tools/scenes/*.mjs zeichnen die isometrischen Szenen der Produktseiten und schreiben src/partials/scene-<produkt>.html
// Flaggen:        tools/flags.mjs zeichnet die Flaggen des Sprachwählers (als SVG-Symbole in jeder Seite)
// Bausteine:      src/partials/<name>.html, eingebunden mit {{include:name}} (auf Produktseiten auch {{include-P:name}} für <name>-st, -am, -hn)
//
// Platzhalter in den Vorlagen:
//   {{key}}   Text (darf HTML enthalten)      {{a:key}}  für Attribute (ohne Tags, maskiert)
//   {{u:key}} für URLs (kodiert)              {{j:key}}  für JSON (maskiert)
//   {{P:key}} Text des Produkts (Schlüssel st_key, am_key oder hn_key), auch als {{aP:key}} und {{jP:key}}
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScenes, SCENE_IDS } from './scenes/build.mjs';
import { buildLandscape } from './landscape/build.mjs';
import { flagSprite, flagIcon } from './flags.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.nurelo.eu';

// code, Eigenname der Sprache, og:locale
const LANGS = [
  ['de', 'Deutsch', 'de_DE'], ['bg', 'Български', 'bg_BG'], ['bs', 'Bosanski', 'bs_BA'],
  ['cs', 'Čeština', 'cs_CZ'],
  ['da', 'Dansk', 'da_DK'], ['el', 'Ελληνικά', 'el_GR'], ['en', 'English', 'en_GB'],
  ['es', 'Español', 'es_ES'], ['et', 'Eesti', 'et_EE'], ['fi', 'Suomi', 'fi_FI'],
  ['fr', 'Français', 'fr_FR'], ['ga', 'Gaeilge', 'ga_IE'], ['hr', 'Hrvatski', 'hr_HR'],
  ['hu', 'Magyar', 'hu_HU'], ['it', 'Italiano', 'it_IT'], ['lt', 'Lietuvių', 'lt_LT'],
  ['lv', 'Latviešu', 'lv_LV'], ['mt', 'Malti', 'mt_MT'], ['nl', 'Nederlands', 'nl_NL'],
  ['pl', 'Polski', 'pl_PL'], ['pt', 'Português', 'pt_PT'], ['ro', 'Română', 'ro_RO'],
  ['sk', 'Slovenčina', 'sk_SK'], ['sl', 'Slovenščina', 'sl_SI'], ['sq', 'Shqip', 'sq_AL'],
  ['sr', 'Српски', 'sr_RS'], ['sv', 'Svenska', 'sv_SE'], ['tr', 'Türkçe', 'tr_TR'],
  ['uk', 'Українська', 'uk_UA'], ['vi', 'Tiếng Việt', 'vi_VN'],
];
const LOCALE = Object.fromEntries(LANGS.map(([c, , l]) => [c, l]));
const LANGNAME = Object.fromEntries(LANGS.map(([c, n]) => [c, n]));

// Sprachen, in denen es die Produktseiten gibt. Alle anderen verlinken auf Englisch.
const PRODUCT_LANGS = ['de', 'en'];
const FALLBACK_LANG = 'en';

// Produkte: Adressen je Sprache (Deutsch liegt ohne Sprachordner)
const PRODUCTS = [
  { id: 'st', slugs: { de: 'stationaer', en: 'residential' }, glyph: 'g-st', cls: 'c-st', num: '01', depth: '1' },
  { id: 'am', slugs: { de: 'ambulant', en: 'home-care' }, glyph: 'g-am', cls: 'c-am', num: '02', depth: '1.3' },
  { id: 'hn', slugs: { de: 'hausnotruf', en: 'emergency-call' }, glyph: 'g-hn', cls: 'c-hn', num: '03', depth: '0.9' },
];

const homePath = (c) => (c === 'de' ? '/' : `/${c}/`);
const productPath = (p, c) => (c === 'de' ? `/${p.slugs.de}/` : `/${c}/${p.slugs[c]}/`);
// Ziel eines Produktlinks: eigene Sprache, sonst Englisch
const productTarget = (p, c) => {
  const lang = PRODUCT_LANGS.includes(c) ? c : FALLBACK_LANG;
  return { href: productPath(p, lang), lang };
};

const escAttr = (s) => s.replace(/&(?!(?:amp|nbsp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/&nbsp;/g, ' ').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripTags = (s) => s.replace(/<[^>]*>/g, '');
const read = (f) => readFileSync(join(root, f), 'utf8');
const readJson = (f) => JSON.parse(read(f));

let problems = 0;
const fail = (msg) => { console.error(msg); problems++; };

// ---------- Texte laden und prüfen ----------
const main = {};
for (const [code] of LANGS) {
  const f = `i18n/${code}.json`;
  if (!existsSync(join(root, f))) { fail(`FEHLT: ${f}`); continue; }
  main[code] = readJson(f);
}
const mainKeys = Object.keys(main.de);
for (const [code] of LANGS) {
  if (!main[code]) continue;
  for (const k of mainKeys) if (!(k in main[code]) || !String(main[code][k]).trim()) fail(`${code}: Schlüssel fehlt oder leer: ${k}`);
  for (const k of Object.keys(main[code])) if (!(k in main.de)) fail(`${code}: unbekannter Schlüssel: ${k}`);
}

const prod = {};
for (const code of PRODUCT_LANGS) {
  const f = `i18n/produkte.${code}.json`;
  if (!existsSync(join(root, f))) { fail(`FEHLT: ${f}`); continue; }
  prod[code] = readJson(f);
}
const prodKeys = Object.keys(prod.de || {});
for (const code of PRODUCT_LANGS) {
  if (!prod[code]) continue;
  for (const k of prodKeys) if (!(k in prod[code]) || !String(prod[code][k]).trim()) fail(`produkte.${code}: Schlüssel fehlt oder leer: ${k}`);
  for (const k of Object.keys(prod[code])) if (!(k in prod.de)) fail(`produkte.${code}: unbekannter Schlüssel: ${k}`);
}
for (const [name, dict] of [...Object.entries(main).map(([c, d]) => [c, d]), ...Object.entries(prod).map(([c, d]) => ['produkte.' + c, d])]) {
  for (const [k, v] of Object.entries(dict)) if (/—/.test(v)) fail(`${name}: Gedankenstrich in ${k}`);
}

// ---------- Bausteine und Umschalter ----------
buildScenes(root);
buildLandscape(root);
const partial = (name) => read(`src/partials/${name}.html`);
const partialOpt = (name) => (existsSync(join(root, `src/partials/${name}.html`)) ? partial(name) : '');

// Sichtbar sind Flagge und Sprachcode (ISO 639-1), der ausgeschriebene Name steht im Tooltip und im Namen für Screenreader
function langItems(code, langs, pathFor, indent) {
  return langs.map((c) =>
    `${indent}<li><a href="${pathFor(c)}" hreflang="${c}" lang="${c}" title="${escAttr(LANGNAME[c])}" aria-label="${escAttr(LANGNAME[c])} (${c.toUpperCase()})"${c === code ? ' aria-current="true"' : ''}>${flagIcon(c)}<span class="lang-code" aria-hidden="true">${c.toUpperCase()}</span></a></li>`).join('\n');
}

// Sprach-Knopf mit Liste (in der Leiste und im Menü am Handy), ind = Einrückung des details-Elements
function langDetails(code, langs, pathFor, ariaText, cls, ind) {
  return `${ind}<details class="${cls}">
${ind}  <summary aria-label="${code.toUpperCase()}: ${escAttr(stripTags(ariaText))}">${flagIcon(code)}<span aria-hidden="true">${code.toUpperCase()}</span></summary>
${ind}  <ul class="lang-list">
${langItems(code, langs, pathFor, ind + '    ')}
${ind}  </ul>
${ind}</details>`;
}

function switcherHtml(code, langs, pathFor, ariaText) {
  return `      ${flagSprite(langs)}\n${langDetails(code, langs, pathFor, ariaText, 'lang', '      ')}`;
}

function hreflangHtml(langs, pathFor) {
  return [
    ...langs.map((c) => `  <link rel="alternate" hreflang="${c}" href="${SITE}${pathFor(c)}" />`),
    `  <link rel="alternate" hreflang="x-default" href="${SITE}${pathFor('de')}" />`,
  ].join('\n');
}

// ---------- Ersetzen ----------
function render(template, ctx) {
  const { dict, specials, used } = ctx;
  // Bausteine zuerst einbinden
  let out = template
    .replace(/\{\{include-P:([a-z0-9-]+)\}\}/g, (_, n) => partial(`${n}-${ctx.product.id}`))
    .replace(/\{\{include-P-opt:([a-z0-9-]+)\}\}/g, (_, n) => partialOpt(`${n}-${ctx.product.id}`))
    .replace(/\{\{include:([a-z0-9-]+)\}\}/g, (_, n) => partial(n));
  return out.replace(/\{\{(a:|u:|j:|aP:|jP:|P:)?([a-z0-9_]+)\}\}/g, (m, mode, name) => {
    mode = mode || '';
    const isP = mode.endsWith('P:') && mode !== '';
    if (!isP && name in specials) return specials[name];
    const key = isP ? `${ctx.product.id}_${name}` : name;
    if (!(key in dict)) { fail(`Vorlage nutzt unbekannten Schlüssel: ${key}`); return m; }
    used.add(key);
    const v = dict[key];
    if (mode === 'a:' || mode === 'aP:') return escAttr(stripTags(v));
    if (mode === 'u:') return encodeURIComponent(stripTags(v));
    if (mode === 'j:' || mode === 'jP:') return JSON.stringify(stripTags(v)).slice(1, -1);
    return v;
  });
}

const usedMain = new Set();
const usedProd = new Set();

// Wörter mit Bindestrich in <span class="nb"> setzen, damit sie nicht am Bindestrich umbrechen.
// Nur Text im <body>, nicht in Tags, Attributen, Skripten oder Stilen.
function keepHyphenated(html) {
  const bodyAt = html.indexOf('<body');
  if (bodyAt < 0) return html;
  const re = /(?<![\p{L}\p{N}-])([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+)(?![\p{L}\p{N}-])/gu;
  let skip = 0; // Tiefe in <script>, <style>, <svg>
  const parts = html.slice(bodyAt).split(/(<[^>]+>)/);
  const out = parts.map((p) => {
    if (p.startsWith('<')) {
      const m = /^<(\/?)(script|style|svg)\b/i.exec(p);
      if (m) skip += m[1] ? -1 : (p.endsWith('/>') ? 0 : 1);
      return p;
    }
    return skip > 0 ? p : p.replace(re, '<span class="nb">$1</span>');
  });
  return html.slice(0, bodyAt) + out.join('');
}

// Versionsangabe an CSS und JS (?v=<Prüfsumme>): Nach einem Deploy holt der Browser die neuen Dateien sofort, statt eine
// neue Seite mit alten, noch zwischengespeicherten Stilen zu zeigen (GitHub Pages speichert 10 Minuten zwischen).
const ASSET_RE = /((?:href|src)=")(\/?)([a-z0-9][a-z0-9\/._-]*\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g;
const assetHash = {};
function versionAssets(html) {
  return html.replace(ASSET_RE, (m, pre, slash, file) => {
    if (!existsSync(join(root, file))) return m;
    assetHash[file] ??= createHash('sha1').update(readFileSync(join(root, file))).digest('hex').slice(0, 8);
    return `${pre}${slash}${file}?v=${assetHash[file]}"`;
  });
}

function write(relPath, html) {
  html = keepHyphenated(html);
  if (relPath.endsWith('.html')) html = versionAssets(html);
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
}

// ---------- Startseiten ----------
const homeTemplate = read('src/index.template.html');

// Nur auf der deutschen Startseite (Einstieg und x-default): Besucher, deren Gerät eine andere unserer Sprachen bevorzugt, landen
// beim ersten Aufruf direkt in dieser Sprache. Kein Weiterleiten bei Suchmaschinen und Vorschau-Robotern, bei Besuchern, die aus der
// eigenen Seite kommen (Sprachmenü, Logo), und bei Sprachen, die wir nicht haben. Es wird nichts gespeichert.
const autoLangScript = `
  <script>
  (function () {
    try {
      if (/bot\\b|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent)) return;
      if (document.referrer && new URL(document.referrer).origin === location.origin) return;
      var ok = ${JSON.stringify(LANGS.map((l) => l[0]))};
      var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
      for (var i = 0; i < list.length; i++) {
        var c = String(list[i]).toLowerCase().split('-')[0];
        if (ok.indexOf(c) < 0) continue;
        if (c !== 'de') location.replace('/' + c + '/' + location.search + location.hash);
        return;
      }
    } catch (e) { /* ohne Weiterleitung weiter */ }
  })();
  </script>`;
for (const [code] of LANGS) {
  if (!main[code]) continue;
  const t = main[code];
  const pathFor = homePath;
  const specials = {
    lang: code, locale: LOCALE[code], url: SITE + homePath(code), home: homePath(code),
    hreflang: hreflangHtml(LANGS.map((l) => l[0]), pathFor),
    autolang: code === 'de' ? autoLangScript : '',
    switcher: switcherHtml(code, LANGS.map((l) => l[0]), pathFor, t.lang_aria),
    mnav_lang: langDetails(code, LANGS.map((l) => l[0]), pathFor, t.lang_aria, 'lang mnav-item', '        '),
    // Beispiel im Abschnitt „Mehrsprachig“: Sprachnotiz in der Sprache der Seite (auf Deutsch: Türkisch) und ihre deutsche Übersetzung
    ml_lang: code === 'de' ? 'tr' : code, ml_code: (code === 'de' ? 'tr' : code).toUpperCase(),
    ml_flag: flagIcon(code === 'de' ? 'tr' : code), ml_flag_de: flagIcon('de'),
    nav_links: [
      ['#stationaer', 'nav_st'], ['#ambulant', 'nav_am'], ['#hausnotruf', 'nav_hn'], ['#plattform', 'nav_pf'], ['#preise', 'nav_pr'],
    ].map(([h, k]) => `          <li><a href="${h}">${t[k]}</a></li>`).join('\n'),
  };
  usedMain.add('lang_aria');
  for (const p of PRODUCTS) {
    const tg = productTarget(p, code);
    specials['href_' + p.id] = tg.href;
    specials['hl_' + p.id] = tg.lang === code ? '' : ` hreflang="${tg.lang}"`;
  }
  const html = render(homeTemplate, { dict: t, specials, used: usedMain });
  write(code === 'de' ? 'index.html' : `${code}/index.html`, html);
}

// ---------- Produktseiten ----------
const productTemplate = read('src/product.template.html');
for (const code of PRODUCT_LANGS) {
  if (!main[code] || !prod[code]) continue;
  const dict = { ...main[code], ...prod[code] };
  for (const p of PRODUCTS) {
    const pathFor = (c) => productPath(p, c);
    const t = main[code];
    const others = PRODUCTS.filter((o) => o.id !== p.id).map((o) => {
      const href = productPath(o, code);
      return `          <li class="reveal"><a href="${href}"><span>Nurelo ${t['nav_' + o.id]}</span><span class="more-text">${t.more}</span></a></li>`;
    }).join('\n');
    const navLinks = PRODUCTS.map((o) =>
      `          <li><a href="${productPath(o, code)}"${o.id === p.id ? ' aria-current="page"' : ''}>${t['nav_' + o.id]}</a></li>`).join('\n')
      + `\n          <li><a href="${homePath(code)}#plattform">${t.nav_pf}</a></li>\n          <li><a href="${homePath(code)}#preise">${t.nav_pr}</a></li>`;
    const specials = {
      lang: code, locale: LOCALE[code], url: SITE + productPath(p, code), home: homePath(code),
      hreflang: hreflangHtml(PRODUCT_LANGS, pathFor),
      switcher: switcherHtml(code, PRODUCT_LANGS, pathFor, t.lang_aria),
      mnav_lang: langDetails(code, PRODUCT_LANGS, pathFor, t.lang_aria, 'lang mnav-item', '        '),
      nav_links: navLinks, others,
      scene_css: SCENE_IDS.includes(p.id) ? '<link rel="stylesheet" href="/scene.css" />' : '',
      scene_js: SCENE_IDS.includes(p.id) ? '<script src="/scene.js" defer></script>' : '',
      pid: p.id, pcls: p.cls, pnum: p.num, pglyph: p.glyph, pdepth: p.depth, pnav: t['nav_' + p.id],
    };
    usedMain.add('lang_aria'); usedMain.add('more'); usedMain.add('nav_' + p.id);
    for (const o of PRODUCTS) {
      const tg = { href: productPath(o, code), lang: code };
      specials['href_' + o.id] = tg.href;
      specials['hl_' + o.id] = '';
    }
    const used = new Set();
    const html = render(productTemplate, { dict, specials, used, product: p });
    used.forEach((k) => { if (k in prod[code]) usedProd.add(k); else usedMain.add(k); });
    write(code === 'de' ? `${p.slugs.de}/index.html` : `${code}/${p.slugs[code]}/index.html`, html);
  }
}

// ---------- Sitemap und robots.txt ----------
// Jede Seite nennt alle ihre Sprachfassungen, Produktseiten nur die vorhandenen.
const sitemapEntry = (path, langs, pathFor) => {
  const alts = [
    ...langs.map((c) => `    <xhtml:link rel="alternate" hreflang="${c}" href="${SITE}${pathFor(c)}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pathFor('de')}"/>`,
  ].join('\n');
  return `  <url>\n    <loc>${SITE}${path}</loc>\n${alts}\n  </url>`;
};
const entries = [
  ...LANGS.map(([c]) => sitemapEntry(homePath(c), LANGS.map((l) => l[0]), homePath)),
  ...PRODUCTS.flatMap((p) => PRODUCT_LANGS.map((c) => sitemapEntry(productPath(p, c), PRODUCT_LANGS, (l) => productPath(p, l)))),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`);
// Bewusst ohne Disallow: Solange noindex gesetzt ist, müssen Suchmaschinen die Seiten lesen dürfen, um es zu sehen.
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// Statische Seiten (nicht aus Vorlagen gebaut) bekommen dieselben Versionsangaben
for (const f of ['404.html', 'impressum.html', 'datenschutz.html', 'agb.html', 'maskottchen/index.html']) {
  const full = join(root, f);
  if (!existsSync(full)) continue;
  const before = readFileSync(full, 'utf8');
  const after = versionAssets(before);
  if (after !== before) writeFileSync(full, after);
}

// ---------- Ungenutzte Schlüssel melden ----------
for (const k of mainKeys) if (!usedMain.has(k)) fail(`Schlüssel ungenutzt: ${k}`);
for (const k of prodKeys) if (!usedProd.has(k)) fail(`Schlüssel (Produkte) ungenutzt: ${k}`);

console.log(problems ? `${problems} Problem(e)` : `OK: ${LANGS.length} Startseiten, ${PRODUCT_LANGS.length * PRODUCTS.length} Produktseiten gebaut`);
process.exit(problems ? 1 : 0);
