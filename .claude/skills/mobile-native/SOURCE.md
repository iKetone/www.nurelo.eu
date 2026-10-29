Quelle: https://github.com/emilkowalski/skills (Ordner skills/mobile-native, MIT-Lizenz von Emil Kowalski, siehe LICENSE)
Stand: Commit a81dbca ("add remove-animations skill"). SKILL.md unverändert übernommen.
Vor der Installation gelesen: reines Markdown, keine Skripte, keine Netzwerkzugriffe.

Hinweise für dieses Projekt (Nurelo-Webseite):
- Schon umgesetzt: Hero und Kapitel nutzen svh, Hover-Effekte gibt es nicht, der Sprachwähler hat 16 px große Ziele und die Seite scrollt ohne Pull-to-Refresh-Eingriff.
- Noch offen und im Skill beschrieben: touch-action: manipulation auf Buttons, -webkit-tap-highlight-color, viewport-fit=cover mit Safe-Area-Abständen (die Navigation sitzt fest oben), user-select: none nur auf Bedienelementen.
- theme-color gibt es nur einmal (#241B14), die Seite hat keinen Dunkelmodus; der Skill-Vorschlag mit zwei Werten gilt hier nicht.
- Der Skill verlangt Tests auf echten Geräten, die Prüfung im emulierten Browser reicht nicht.
- Der Skill antwortet beim ersten Aufruf ohne Frage nur mit einem festen Satz ("I'm ready to make ...").

Aktualisieren: Repo neu klonen und skills/mobile-native/SKILL.md hierher kopieren.
