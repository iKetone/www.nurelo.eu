# Sprachversionen pflegen

Die Seite gibt es in den 24 Amtssprachen der EU. Deutsch ist die Ausgangssprache.

## So ändert man einen Text
1. Deutschen Text in `i18n/de.json` ändern (der Schlüssel bleibt gleich).
2. Denselben Schlüssel in allen anderen `i18n/<code>.json` anpassen.
3. Seiten neu erzeugen: `node tools/build-i18n.mjs`
4. Erzeugte Dateien mit committen (`index.html` und `<code>/index.html`).

Das Skript meldet fehlende oder unbekannte Schlüssel und bricht dann ab.

## Wo was liegt
- `src/index.template.html`: Vorlage mit Platzhaltern wie `{{st_h2}}`
- `i18n/<code>.json`: Texte je Sprache
- `tools/build-i18n.mjs`: erzeugt aus beidem die Seiten
- Deutsch liegt unter `/`, alle anderen unter `/<code>/`, zum Beispiel `/en/`

## Neue Sprache hinzufügen
1. `i18n/<code>.json` anlegen (Kopie von `en.json` übersetzen).
2. Sprache in `tools/build-i18n.mjs` in der Liste `LANGS` ergänzen (Code, Eigenname, `og:locale`).
   Für den Sprachwähler in `tools/flags.mjs` die Flagge ergänzen (`COUNTRY`: Sprachcode zu Ländercode, `FLAGS`: Zeichnung im Format 24 x 16 mit den Farben aus `C`).
3. Bauen und prüfen. Für Schriften ohne lateinische Zeichen die Schriften in `styles.css` ergänzen.

## Hinweise
- Keine Gedankenstriche in den Texten (das Skript prüft das).
- In `*_h`-Schlüsseln steht `&amp;` für ein Und-Zeichen, in Attributen wie `meta_desc` steht Klartext.
- Der Sprachwähler zeigt Flagge und Sprachcode (ISO 639-1, z. B. „DE“). Der ausgeschriebene Name steht im Tooltip und im Namen für Screenreader (aus `LANGS`).
- Impressum, Datenschutz und AGB gibt es nur auf Deutsch (`/impressum.html` usw.).
- Die Übersetzungen sind Entwürfe und sollten vor dem Live-Gang von Muttersprachlern geprüft werden.

## Festgelegte Begriffe (Stand Übersetzungsaudit)

Diese Begriffe sind entschieden und gelten für alle Sprachen. Weitere Sprachen sollen sich daran orientieren.

| Deutsch | Englisch | Französisch |
|---|---|---|
| Hausnotruf (Produktname) | Emergency call | Téléassistance |
| Hausnotruf (in Beschreibungen) | home emergency call | téléassistance |
| Teilnehmer (Hausnotruf) | service user | abonné |
| Monatspauschale | monthly flat rate | forfait mensuel |
| Betriebsform | care setting | type de structure |
| Träger | operators | gestionnaires |
| Kostenträger | payers | organismes payeurs |
| Tour (Ambulant) | route | tournée |
| Berichteblatt | report sheet | feuille de transmissions |
| Angebot (Preise) | quote | devis |

Anrede: Deutsch „Sie", Französisch „vous". Englisch ist britisch (centre, analyse, licence).
Französisch: Vor `:` `?` `!` `;` steht ein geschütztes Leerzeichen (U+00A0), damit das Zeichen nicht allein am Zeilenanfang landet.

Weitere Festlegungen für alle Sprachen:
- **Unterschrift auf dem Gerät:** Im Deutschen „digitale Unterschrift". Die Rechtsgültigkeit hängt vom Landesrecht ab. In den anderen Sprachen steht der im jeweiligen Sprachgebrauch natürlichere Begriff: meist „elektronisch" (en, fr, es, it, pt, pl, ro, cs, sk, sl, hr, sv, fi, el, bg, lv, lt, mt, ga, hu), „digital" bleibt in nl, da und et (dort üblich).
- **eKV** (elektronischer Kostenvoranschlag) bleibt in jeder Sprache „eKV", solange es dort kein gängiges Gegenstück gibt. Er kommt nur auf den Produktseiten vor, im Englischen mit Erklärung in Klammern.
- **Slowakisch und Slowenisch:** Hausnotruf heißt „tiesňové volanie" bzw. „klic v sili" (nicht „tiesňová starostlivosť", „varovanje z alarmom": liest sich als Angstbewältigung bzw. Alarmanlage).
- **Meta-Texte:** `meta_title` möglichst 60 Zeichen (in den Sprachen mit langen Wörtern bis etwa 65), `meta_desc` höchstens 155 Zeichen. Der Satz zum Hosting entfällt, wo der Platz fehlt (steht auf der Seite).
- **Fußzeile:** `ft_legal` und `ft_imprint` dürfen nicht gleich lauten.
- **Buttons:** pro Sprache eine Anredeform (kein Mix aus Du-Imperativ und Sie-Form).

## Produktseiten

Die Produktseiten (`/stationaer/`, `/ambulant/`, `/hausnotruf/` und `/en/residential/`, `/en/home-care/`, `/en/emergency-call/`) entstehen aus `src/product.template.html`.

- Texte je Produkt stehen in `i18n/produkte.<code>.json` (Schlüssel mit Präfix `st_`, `am_`, `hn_`). Bisher gibt es nur `de` und `en`.
- Alle anderen Texte (Ablauf, Kontakt, Fußzeile) kommen aus der normalen Sprachdatei `i18n/<code>.json`.
- Eine neue Sprache für die Produktseiten: `produkte.<code>.json` anlegen und den Code in `PRODUCT_LANGS` und die Slugs in `PRODUCTS` (`tools/build-i18n.mjs`) ergänzen. Bis dahin verlinken die anderen Sprachen auf die englischen Produktseiten.
- Danach `node tools/build-i18n.mjs` ausführen.
