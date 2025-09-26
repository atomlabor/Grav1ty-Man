# Gravity-Man
Webgame-Projekt: Remake von Gravity Boy für Rabbit R1 als JavaScript-Web-App.

## Über das Projekt
Gravity-Man ist ein JavaScript-Remake des ursprünglichen [Gravity Boy](https://github.com/ebux/Gravity-boy) Spiels, das für die Homelab-3 Mikrocomputer entwickelt wurde. Dieses Projekt adaptiert das klassische Puzzle-Platformspiel für moderne Webbrowser und speziell für das Rabbit R1 Gerät.

## Spielprinzip
Das Spiel ist ein kleines Logikspiel, bei dem der Spieler die Schwerkraft manipulieren kann, um durch verschiedene Level zu navigieren:
- Ziel: Alle 14 Level durch Meisterung der Schwerkraftmanipulation abschließen
- Steuerung: Pfeiltasten zum Ändern der Schwerkraftrichtung
- Modi:
  - Normal Mode (Leertaste zum Starten)
  - Hard Mode (H-Taste für zusätzliche Herausforderung)

### Spielmechanik
- Schwerkraftänderung: Verwende die Pfeiltasten, um die Schwerkraftrichtung zu ändern
- Gravitation: Der Spieler wird in die gewählte Richtung gezogen
- Hindernisse: Vermeide Gefahren und Feinde
- Ziel: Erreiche das Zielfeld am Ende jedes Levels

## Mehrere Level & Fortschrittssystem
- Ab sofort sind mehrere echte Level (mind. 4) implementiert (Level 1–4)
- Jedes Level hat:
  - einen Startpunkt, unterschiedliche Hindernisse/Plattformen und Gefahren
  - einen klar erkennbaren Ausgang (weisses Portal mit schwarzem Rand), häufig am Rand/als Wand- oder Deckenportal
- Beim Betreten des Ausgangs lädt das Spiel automatisch das nächste Level
- Weitere Levels (5–14) sind als Platzhalter angelegt und können leicht erweitert werden

## Technische Umsetzung
### Geplante Technologien
- Frontend: Vanilla JavaScript, HTML5 Canvas
- Zielplattform: Webbrowser (optimiert für Rabbit R1)
- Rendering: 2D-Grafiken mit Tile-basiertem Level-Design
- Audio: Web Audio API für Soundeffekte

### Projektstruktur (geplant)
```
src/
├── js/
│   ├── game.js          # Hauptspiel-Loop
│   ├── player.js        # Spieler-Logik
│   ├── gravity.js       # Schwerkraft-System
│   ├── levels.js        # Level-Daten und -Management
│   ├── enemies.js       # Feind-KI
│   └── audio.js         # Sound-Management
├── assets/
│   ├── sprites/         # Spieler-, Feind- und Tile-Grafiken
│   ├── levels/          # Level-Layouts (14 Level)
│   └── sounds/          # Soundeffekte
├── css/
│   └── style.css        # Styling
index.html               # Haupt-HTML-Datei
```

## Installation & Entwicklung
```
# Repository klonen
git clone https://github.com/atomlabor/Gravity-Man.git
cd Gravity-Man

# Lokalen Webserver starten (z.B. mit Python)
python -m http.server 8000
# oder mit Node.js
npx serve .

# Im Browser öffnen
open http://localhost:8000
```

## Roadmap
1. Phase 1: Grundlegende Spielmechanik
   - Spieler-Bewegung und Schwerkraft
   - Einfaches Level-System
   - Kollisionserkennung
2. Phase 2: Level-Design
   - Alle 14 Level implementieren (Level 1–4 vorhanden, 5–14 placeholder)
   - Feind-KI
   - Audio-Integration
3. Phase 3: Optimierung
   - Performance-Optimierung
   - Rabbit R1 spezifische Anpassungen
   - UI/UX Verbesserungen

## Lizenz
MIT License - siehe [LICENSE](./LICENSE) Datei für Details.

## Credits
- Original Gravity Boy von Gergely Eberhardt (ebux)
- Remake-Entwicklung für Rabbit R1 Web-Platform
- Inspiriert vom Homelab September 2024 Game Challenge
