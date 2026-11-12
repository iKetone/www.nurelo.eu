// Erzeugt die Bausteine der Szenen (src/partials/scene-<produkt>.html) aus den Zeichnungen in tools/scenes/.
// Wird von tools/build-i18n.mjs aufgerufen. Die Texte stehen in i18n/produkte.<code>.json (Schlüssel <produkt>_sc_*).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildStationaer } from './scene-st.mjs';
import { buildAmbulant } from './scene-am.mjs';
import { buildHausnotruf } from './scene-hn.mjs';

const SCENES = {
  st: buildStationaer,
  am: buildAmbulant,
  hn: buildHausnotruf,
};

// Welche Produkte eine Szene haben (für die Vorlage)
export const SCENE_IDS = Object.keys(SCENES);

export function buildScenes(root) {
  for (const [id, fn] of Object.entries(SCENES)) {
    const { svg, vbw, vbh, focus } = fn();
    const steps = [1, 2, 3, 4].map((i) =>
      `        <li class="scn-card" data-i="${i}"><p class="scn-tag">{{P:sc_${i}_tag}}</p><h3>{{P:sc_${i}_h}}</h3><p>{{P:sc_${i}_p}}</p></li>`).join('\n');
    const html = `<!-- Szene (erzeugt von tools/scenes/build.mjs, nicht von Hand ändern) -->
    <section class="scn" id="szene" aria-labelledby="scn-h" data-vb="${vbw} ${vbh}" data-focus="${JSON.stringify(focus).replace(/"/g, '&quot;')}">
      <div class="scn-track">
        <div class="scn-stage">
          <div class="scn-intro scn-card" data-i="0">
            <p class="kicker dark">{{P:sc_kicker}}</p>
            <h2 id="scn-h">{{P:sc_h2}}</h2>
            <p>{{P:sc_lead}}</p>
          </div>
          <div class="scn-view">
            ${svg}
          </div>
          <ol class="scn-steps">
${steps}
          </ol>
          <ol class="scn-dots" aria-hidden="true"><li></li><li></li><li></li><li></li><li></li></ol>
        </div>
      </div>
    </section>

    `;
    writeFileSync(join(root, `src/partials/scene-${id}.html`), html);
  }
}
