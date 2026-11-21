// Erzeugt die Landschaftsebenen als SVG-Dateien (landscape/*.svg) und die Bausteine src/partials/land-hero.html und seam-<id>.html.
// Wird von tools/build-i18n.mjs aufgerufen. Die Ebenen sind reine Bilder ohne Text und gelten für alle Sprachen.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERO, SEAMS, SEAM_SPEEDS, heroLayers, heroSky, seamLayers } from './art.mjs';

const img = (cls, speed, src, w, h, lazy) =>
  `<img class="${cls}" style="--s:${speed}" src="${src}" alt="" width="${w}" height="${h}" decoding="async"${lazy ? ' loading="lazy"' : ''}>`;

export function buildLandscape(root) {
  const dir = join(root, 'landscape');
  mkdirSync(dir, { recursive: true });

  // Hero: Himmel, Sonne (CSS), sieben Ebenen, Dunst. TODO beim Freischalten: Hero-Bilder nicht mehr lazy laden (sie sind das erste Bild).
  writeFileSync(join(dir, 'hero-sky.svg'), heroSky());
  const layers = heroLayers();
  layers.forEach((svg, i) => writeFileSync(join(dir, `hero-${i + 1}.svg`), svg));
  const heroHtml = `<!-- Landschaft (erzeugt von tools/landscape/build.mjs, nicht von Hand ändern) -->
        <div class="ls-sky" aria-hidden="true"></div>
        <div class="ls" aria-hidden="true">
          ${img('ls-l ls-cl', 0.02, '/landscape/hero-sky.svg', HERO.W, HERO.H, true)}
          <div class="ls-sun"></div>
          ${layers.map((_, i) => (i === layers.length - 1 ? '<div class="ls-fill" style="--s:' + HERO.speeds[i] + '"></div>\n          ' : '') + img('ls-l', HERO.speeds[i], `/landscape/hero-${i + 1}.svg`, HERO.W, HERO.H, true)).join('\n          ')}
          <div class="ls-haze"></div>
        </div>`;
  writeFileSync(join(root, 'src/partials/land-hero.html'), heroHtml);

  // Nähte
  for (const id of Object.keys(SEAMS)) {
    const ls = seamLayers(id);
    ls.forEach((svg, i) => writeFileSync(join(dir, `seam-${id}-${i + 1}.svg`), svg));
    const html = `<div class="seam" aria-hidden="true" style="--seam-from:${SEAMS[id].from}">${ls.map((_, i) => img(i === ls.length - 1 ? 'seam-l seam-edge' : 'seam-l', SEAM_SPEEDS[i], `/landscape/seam-${id}-${i + 1}.svg`, 1600, 300, true)).join('')}</div>`;
    writeFileSync(join(root, `src/partials/seam-${id}.html`), html);
  }
}
