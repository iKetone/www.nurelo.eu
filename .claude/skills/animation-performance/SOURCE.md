Quelle: https://github.com/emilkowalski/skills (Ordner skills/animation-performance, MIT-Lizenz von Emil Kowalski, siehe LICENSE)
Stand: Commit a81dbca ("add remove-animations skill"). SKILL.md unverändert übernommen.
Vor der Installation gelesen: reines Markdown, keine Skripte, keine Netzwerkzugriffe.

Hinweise für dieses Projekt (Nurelo-Webseite):
- Die Regeln (transform und opacity, kein "transition: all", will-change erst nach Messung) passen zur Seite. Die Hero-Sequenz läuft über requestAnimationFrame auf dem Hauptthread, die 3D-Kacheln in einem Web Worker; Ruckler dort am besten mit der Leistungsaufzeichnung der Browser-Entwicklertools auf einem echten Handy prüfen.
- Viele Beispiele nennen React und Framer Motion. Die Seite nutzt beides nicht, die Grundregeln gelten trotzdem.
- Der Skill antwortet beim ersten Aufruf ohne Frage nur mit einem festen Satz ("I'm ready to find out ...").

Aktualisieren: Repo neu klonen und skills/animation-performance/SKILL.md hierher kopieren.
