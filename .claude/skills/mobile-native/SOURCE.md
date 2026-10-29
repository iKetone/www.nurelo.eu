Quelle: https://github.com/emilkowalski/skills (Ordner skills/mobile-native, MIT-Lizenz von Emil Kowalski, siehe LICENSE)
Stand: Commit a81dbca ("add remove-animations skill"). SKILL.md unverändert übernommen.
Vor der Installation gelesen: reines Markdown, keine Skripte, keine Netzwerkzugriffe.

Hinweise für dieses Projekt (Nurelo-Webseite):
- Schon umgesetzt: Hero und erste Bildschirmhöhe nutzen svh statt vh.
- Im Code gefunden und im Skill beschrieben (Stand der Prüfung: styles.css und Startseite): 12 :hover-Regeln ohne die Abfrage (hover: hover) and (pointer: fine), kein touch-action: manipulation, kein -webkit-tap-highlight-color, kein viewport-fit=cover mit Safe-Area-Abständen (die Navigation sitzt fest oben). Die Seite hat keine Eingabefelder, die Regel zur 16-px-Schrift in Feldern greift erst, wenn es welche gibt.
- theme-color gibt es nur einmal (#241B14), die Seite hat keinen Dunkelmodus; der Skill-Vorschlag mit zwei Werten gilt hier nicht.
- Der Skill verlangt Tests auf echten Geräten, die Prüfung im emulierten Browser reicht nicht.
- Der Skill antwortet beim ersten Aufruf ohne Frage nur mit einem festen Satz ("I'm ready to make ...").

Aktualisieren: Repo neu klonen und skills/mobile-native/SKILL.md hierher kopieren.
