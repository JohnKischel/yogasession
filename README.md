# Yoga Session Generator

Eine Webanwendung zur Erstellung und Verwaltung von Yoga-Sessions mit Next.js.

## Über das Projekt

Diese App ermöglicht es, individuelle Yoga-Sessions aus einer Sammlung von Übungen zu erstellen und in einer interaktiven Timeline darzustellen.

### Funktionen

- **Timeline-Ansicht**: Sessions werden als scrollbare Timeline mit Zeitangaben dargestellt
- **Startzeit-Auswahl**: Wähle die Startzeit deiner Session und alle Übungszeiten werden automatisch berechnet
- **5 Yoga-Übungen**: Vorkonfigurierte Übungen (Sonnengruß, Krieger I, Herabschauender Hund, Kobra, Shavasana)
- **Session-Übersicht**: Dauer, Level und Anzahl der Übungen auf einen Blick
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Statische Generierung**: Next.js Static Export für schnelle Ladezeiten

### Screenshot

![Yoga Session Timeline](https://github.com/user-attachments/assets/e50c7d79-5946-4ecd-a7fe-e211e27f0c08)

## Projektstruktur

```
yogasession/
├── .github/
│   └── workflows/
│       └── static.yml       # GitHub Pages Deployment
├── data/
│   ├── exercises.json       # Yoga-Übungen Datenbank (Legacy)
│   └── sessions.json        # Session-Definitionen (Legacy)
├── src/
│   ├── app/
│   │   ├── globals.css      # Globale Styles
│   │   ├── layout.js        # App Layout
│   │   └── page.js          # Hauptseite mit Timeline
│   └── data/
│       └── yoga-data.js     # Übungen und Session-Daten
├── next.config.js           # Next.js Konfiguration
├── package.json
└── README.md
```

## Lokale Entwicklung

### Voraussetzungen

- Node.js 18 oder höher
- npm

### Installation

```bash
npm install
```

### Entwicklungsserver starten

```bash
npm run dev
```

Die App ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

### Produktions-Build erstellen

```bash
npm run build
```

Der statische Export wird im `out/` Ordner erstellt.

## Deployment

Die Website wird automatisch über GitHub Actions auf GitHub Pages deployed, wenn Änderungen auf den `main` Branch gepusht werden.
