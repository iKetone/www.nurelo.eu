Quelle: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (Ordner .claude/skills/ui-ux-pro-max, MIT-Lizenz von Next Level Builder, siehe LICENSE)
Stand: Version 2.15.0, Commit 28b3b8d vom 2026-10-26 ("fix: don't read '3d'/'2fa' after a stack name as a framework version (#548)").

Übernommen: SKILL.md, data/ (CSV-Datenbanken, stacks/), references/ (quick-reference.md, pro-rules.md) und die vier Skripte scripts/search.py, core.py, design_system.py, reasoning_contract.py.
Nicht übernommen: scripts/tests/, scripts/validate_data.py, cli/, gallery/, projects/, stack/, die Plugin-Dateien und die übrigen Skills des Repos (design, design-system, brand, banner-design, slides, ui-styling).

Änderungen gegenüber dem Original (beim Aktualisieren erneut anwenden):
- In SKILL.md steht der Aufruf jetzt als .claude/skills/ui-ux-pro-max/scripts/search.py statt ${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py (die Variable gibt es nur als Plugin, nicht als Projekt-Skill).
- Oberhalb der Überschrift "UI/UX Pro Max - Design Intelligence" sitzt der Abschnitt "Nurelo: lokale Regeln". Er legt fest, dass die Palette Terrakotta, Oliv und Ocker unveränderlich ist und dass alles andere als gekennzeichneter Test aus dem Stilkatalog ausprobiert werden darf.

Vor der Installation geprüft: Die vier Skripte enthalten keine Netzwerk- oder Shell-Aufrufe und schreiben nur mit --persist (dann in design-system/ unter --output-dir oder dem aktuellen Ordner). Das Skript braucht Python 3 ohne weitere Pakete.
Testlauf nach der Installation: "touch target hover feedback" --domain ux liefert zwei passende UX-Regeln. "senior care healthcare software b2b landing" --design-system schlägt Blau und Grün (#0369A1, #16A34A), die Schrift Atkinson Hyperlegible und den Stil "Accessible & Ethical" vor. Die Farben passen nicht zu Nurelo, deshalb die Palette-Regel oben.

Hinweise zum Umgang:
- Die Zählungen (79 Stile, 192 Paletten, 74 Schriftpaare, 119 UX-Regeln) stammen aus dem Repo, die inhaltliche Qualität der Treffer ist nicht geprüft. Immer Top-Treffer und Passung ansehen, wie der Skill selbst verlangt.
- Der Skill verweist auf Bild-APIs nur in den nicht übernommenen Skills; hier braucht nichts davon einen Schlüssel.

Aktualisieren: Repo neu klonen und .claude/skills/ui-ux-pro-max/ von dort kopieren (ohne scripts/tests und validate_data.py), dann die beiden Änderungen oben erneut anwenden.
