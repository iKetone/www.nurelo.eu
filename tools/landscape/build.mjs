// Erzeugt die Landschaftsebenen als SVG-Dateien (landscape/*.svg) und die Bausteine src/partials/land-hero.html und seam-<id>.html.
// Wird von tools/build-i18n.mjs aufgerufen. Die Ebenen sind reine Bilder ohne Text und gelten für alle Sprachen.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERO, SEAMS, SEAM_SPEEDS, heroLayers, heroSky, seamLayers } from './art.mjs';

const img = (cls, speed, src, w, h, lazy) =>
  `<img class="${cls}" style="--s:${speed}" src="${src}" alt="" width="${w}" height="${h}" decoding="async"${lazy ? ' loading="lazy"' : ''}>`;

// Eine Ebene, ggf. in zwei Fassungen: Standard und Entwurf mit den neuen Motiven (Vorschau ?motive, siehe motive.mjs und land.css .v-std/.v-mot).
// Unterscheiden sich beide nicht, gibt es nur ein Bild. Die Entwurfsfassung lädt immer verzögert und nur, wenn sie angezeigt wird.
function layerImgs(dir, name, std, mot, cls, speed, w, h, lazy) {
  writeFileSync(join(dir, `${name}.svg`), std);
  if (mot === std) return img(cls, speed, `/landscape/${name}.svg`, w, h, lazy);
  writeFileSync(join(dir, `${name}-m.svg`), mot);
  return img(`${cls} v-std`, speed, `/landscape/${name}.svg`, w, h, lazy) + img(`${cls} v-mot`, speed, `/landscape/${name}-m.svg`, w, h, true);
}

export function buildLandscape(root) {
  const dir = join(root, 'landscape');
  mkdirSync(dir, { recursive: true });

  // Hero: Himmel, Sonne (CSS), sieben Ebenen, Dunst.  Die Hero-Bilder laden sofort (sie sind das erste Bild), die Nähte erst beim Heranscrollen.
  writeFileSync(join(dir, 'hero-sky.svg'), heroSky());
  const layers = heroLayers(), layersM = heroLayers(true);
  const heroHtml = `<!-- Landschaft (erzeugt von tools/landscape/build.mjs, nicht von Hand ändern) -->
        <div class="ls-sky" aria-hidden="true"></div>
        <div class="ls" aria-hidden="true">
          ${img('ls-l ls-cl', 0.02, '/landscape/hero-sky.svg', HERO.W, HERO.H, false)}
          <div class="ls-sun"></div>
          ${layers.map((svg, i) => (i === layers.length - 1 ? '<div class="ls-fill" style="--s:' + HERO.speeds[i] + '"></div>\n          ' : '') + layerImgs(dir, `hero-${i + 1}`, svg, layersM[i], 'ls-l', HERO.speeds[i], HERO.W, HERO.H, false)).join('\n          ')}
          <div class="ls-haze"></div>
        </div>`;
  writeFileSync(join(root, 'src/partials/land-hero.html'), heroHtml);

  // Nähte
  for (const id of Object.keys(SEAMS)) {
    const ls = seamLayers(id), lm = seamLayers(id, true);
    const html = `<div class="seam" aria-hidden="true" style="--seam-from:${SEAMS[id].from}">${ls.map((svg, i) => layerImgs(dir, `seam-${id}-${i + 1}`, svg, lm[i], i === ls.length - 1 ? 'seam-l seam-edge' : 'seam-l', SEAM_SPEEDS[i], 1600, 300, true)).join('')}</div>`;
    writeFileSync(join(root, `src/partials/seam-${id}.html`), html);
  }
}
