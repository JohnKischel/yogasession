# Yoga Session Generator

Eine Webanwendung zur Erstellung und Verwaltung von Yoga-Sessions.

## Über das Projekt

Diese App ermöglicht es, individuelle Yoga-Sessions aus einer Sammlung von Übungen zu erstellen. 

### Funktionen

- **Übungsdatenbank**: JSON-basierte Sammlung von Yoga-Übungen mit Tags und Beschreibungen
- **Session-Generator**: Erstellen von Sessions mit variabler Länge (30 Min, 60 Min, 90 Min)
- **Kategorien**: Übungen sind kategorisiert (z.B. Drehübungen, Stehübungen, Liegeübungen)
- **Story-Modus**: Sessions können mit einer Geschichte/Erzählung hinterlegt werden
- **Kurs-Verwaltung**: Sessions können zu Kursen zusammengefasst werden

## Projektstruktur

```
yogasession/
├── .github/
│   └── workflows/
│       └── static.yml    # GitHub Pages Deployment
├── data/
│   ├── exercises.json    # Yoga-Übungen Datenbank
│   └── sessions.json     # Session-Definitionen
├── public/
│   └── index.html        # Statische Website
└── README.md
```

## Lokale Entwicklung

Die Anwendung wird als statische Website bereitgestellt und kann lokal mit einem einfachen Webserver getestet werden.

## Deployment

Die Website wird automatisch über GitHub Actions auf GitHub Pages deployed.
