# Space Factory 🚀

Ein browserbasiertes 2D-Weltraum-Aufbauspiel mit Phaser 3, TypeScript und Vite. Sammle Ressourcen, erweitere dein Schiff und automatisiere die Produktion – ganz ohne Backend oder externe Grafiken.

## Voraussetzungen
- Node.js 20 oder neuer
- npm 10 oder neuer
- Git (optional für lokale Versionsverwaltung)

## Installation und Start
```bash
npm install
npm run dev
```
Vite zeigt die lokale Entwicklungsadresse im Terminal an.

## Tests und Veröffentlichung
```bash
npm test
npm run typecheck
npm run build
npm run preview
```
Der veröffentlichbare Build liegt in `dist/`. Das Projekt nutzt relative Asset-Pfade und eignet sich für GitHub Pages, Netlify oder statisches Hosting. Kein Server ist zur Laufzeit nötig.

## Steuerung
| Taste | Aktion |
|---|---|
| W / ↑ | Beschleunigen |
| S / ↓ | Abbremsen |
| A / D oder ← / → | Kurs ändern |
| Leertaste | kurzer Boost |
| E | nächstes Fragment in Reichweite einsammeln |
| B | Baumodus ein-/ausschalten |
| Maus-Klick | Modul im angrenzenden Raster platzieren |
| Escape | Pause |
| Hilfe | Steuerungsübersicht |

## Funktionen
- Phaser-Canvas mit prozedural erzeugtem Sternenhintergrund und Asteroiden ohne externe Assets
- Geschwindigkeitsabhängiges Fragment-Spawn-System, Materialtypen, seltene Kristalle und Objektlimit
- Manuelles Sammeln und energieverbrauchender automatischer Sammler
- Frachtraum mit Kapazitätslimit und Ressourceninventar
- Rasterbasierter modularer Schiffsausbau: Kern, Frachtraum, Antrieb, Generator, Sammler, Fabrik und Lager
- Energieerzeugung und -verbrauch sowie zeitbasierte Produktion von Schiffskomponenten
- Sektorreise mit Voraussetzungen (Eis und Komponenten)
- Lokales Speichern/Laden via localStorage; ungültige Speicherstände werden abgefangen
- Responsive HUD, Start-/Pause-/Hilfe-Menüs

## Projektstruktur
- `src/main.ts` — Phaser-Szene, Steuerung, Rendering und DOM-HUD
- `src/data.ts` — Ressourcen-, Modul- und Sektordefinitionen
- `src/systems.ts` — Inventar, Bausystem, Energie/Produktion, Speicher und Spawnformel
- `src/systems.test.ts` — Unit-Tests der zentralen Systeme
- `src/styles.css` — Oberfläche und responsive Layouts
- `index.html` — Spieloberfläche und Menüs

## Aktuelle Grenzen / nächste Schritte
Dies ist ein spielbarer Prototyp. Sektorereignisse, Wrack-/Kapsel-Interaktionen, Kampf, Audio, Touch-Steuerung und ein dedizierter visueller Modul-Entfernungsmodus sind noch nicht implementiert. Die Module werden derzeit als logische Rasterdaten verwaltet; die Spielszene ist bewusst auf eine einzige aktive Umgebung begrenzt. Der automatische Sammler funktioniert in unmittelbarer Schiffsnähe. Speichern erfolgt lokal in diesem Browserprofil.
