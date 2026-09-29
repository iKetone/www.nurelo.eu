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
3. Bauen und prüfen. Für Schriften ohne lateinische Zeichen die Schriften in `styles.css` ergänzen.

## Hinweise
- Keine Gedankenstriche in den Texten (das Skript prüft das).
- In `*_h`-Schlüsseln steht `&amp;` für ein Und-Zeichen, in Attributen wie `meta_desc` steht Klartext.
- Impressum, Datenschutz und AGB gibt es nur auf Deutsch (`/impressum.html` usw.).
- Die Übersetzungen sind Entwürfe und sollten vor dem Live-Gang von Muttersprachlern geprüft werden.

## Produktseiten

Die Produktseiten (`/stationaer/`, `/ambulant/`, `/hausnotruf/` und `/en/residential/`, `/en/home-care/`, `/en/emergency-call/`) entstehen aus `src/product.template.html`.

- Texte je Produkt stehen in `i18n/produkte.<code>.json` (Schlüssel mit Präfix `st_`, `am_`, `hn_`). Bisher gibt es nur `de` und `en`.
- Alle anderen Texte (Ablauf, Kontakt, Fußzeile) kommen aus der normalen Sprachdatei `i18n/<code>.json`.
- Eine neue Sprache für die Produktseiten: `produkte.<code>.json` anlegen und den Code in `PRODUCT_LANGS` und die Slugs in `PRODUCTS` (`tools/build-i18n.mjs`) ergänzen. Bis dahin verlinken die anderen Sprachen auf die englischen Produktseiten.
- Danach `node tools/build-i18n.mjs` ausführen.
