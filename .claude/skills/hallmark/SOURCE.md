Quelle: https://github.com/Nutlope/hallmark (Ordner skills/hallmark, MIT-Lizenz, siehe LICENSE). Laut README "Made by Together AI", das Repository liegt aber im persönlichen Konto Nutlope, nicht in der Organisation togethercomputer.
Stand: Commit de4999e (4. November 2026), Version 2.0.0 laut SKILL.md.

Übernommen: SKILL.md, LICENSE, references/ (Regeln, 50 Themes mit Vorschaubildern, Branchenbeispiele) und scripts/ mit der Fotoliste photos.json. Nicht übernommen: die Tests (*.test.mjs) mit ihren Testdateien und agents/openai.yaml (nur für Codex).

Vor der Installation gelesen: SKILL.md vollständig, alle kleinen Skripte (install.mjs, install-hook.mjs, lint-hook.mjs, imagegen.mjs) vollständig, die großen (sloplint.mjs, sloplint-render.mjs, theme.mjs, picture.mjs, capture.mjs, refcheck.mjs) per Suche nach Netz-, Prozess- und Umgebungszugriffen, dazu die Anweisungsdateien auf Aufforderungen zum Umgehen von Regeln oder zum Versenden von Daten. Nichts Auffälliges gefunden. Die Skripte wurden hier nicht ausgeführt.

Was die Skripte tun, wenn man sie startet:
- theme.mjs (Themes austeilen, Gerüst schreiben, Protokoll .hallmark/log.json) und sloplint.mjs (prüft Seiten auf Merkmale von KI-Entwürfen) arbeiten lokal. Mit --render brauchen sie puppeteer-core und Chrome (npm i -g puppeteer-core).
- capture.mjs und picture.mjs öffnen eine URL oder einen Entwicklungsserver im lokalen Chrome und machen Bildschirmfotos.
- theme.mjs photos --save lädt die ausgewählten Fotos von upload.wikimedia.org herunter (nur auf ausdrücklichen Aufruf).
- imagegen.mjs sendet nur dann einen Auftrag an https://api.together.xyz, wenn TOGETHER_API_KEY gesetzt ist, sonst bricht es ab.
- install.mjs kopiert in das Home-Verzeichnis (~/.claude/skills usw.), install-hook.mjs trägt einen Hook in .claude/settings.json ein. Beides wird hier nicht gebraucht und wurde nicht ausgeführt. Der Skill liegt bereits im Projekt unter .claude/skills/hallmark.

Hinweise für dieses Projekt (Nurelo-Webseite):
- Der Skill greift laut SKILL.md nur bei neuen Seiten oder wenn man ihn nennt (/hallmark <Auftrag>, /hallmark redesign <Pfad>, /hallmark audit <Pfad>). An der bestehenden Seite ändert er von sich aus nichts.
- Die Regeln des Skills passen nicht zur vorhandenen Seite. Nach SKILL.md verstößt die Startseite (Stand der Prüfung per Suche im Code, der Skill selbst wurde nicht ausgeführt) unter anderem gegen: Überschriften in Großbuchstaben mit Sperrung (.kicker, .scroll-hint, Fußzeilen-Überschriften; Regel 9), ein farbig abgesetztes Wort in Überschriften (z. B. "Klar. Verbunden. <em>Nurelo.</em>"), Farbwerte direkt in Regeln statt über Variablen (in styles.css 15 Hex-Werte und 41 rgba()-Werte außerhalb von :root; Regel 1), kein overflow-x: clip auf html und body und einmal 100vw (Regel 4). Ein Redesign würde Aufbau und Gestaltung ersetzen, auch die feste Palette (Terrakotta, Oliv, Ocker). Für die Seite also nur als Audit oder für neue, eigenständige Seiten nutzen.
- Der Skill erfindet keine Zahlen, Zitate oder Logos und fragt vor dem Bauen nach Material, Zielgruppe, Zweck und Ton.
- Verlangt Node 18 oder neuer.

Aktualisieren: Repository neu klonen und skills/hallmark hierher kopieren, SOURCE.md anpassen.
