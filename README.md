# Shopify-Test-Theme

Shopify-Theme mit deutscher und englischer Storefront- und Theme-Editor-Übersetzung. Die native Shopify-Struktur bleibt erhalten; gemeinsame Liquid-Komponenten liegen in `snippets/`.

## Entwicklung

Voraussetzungen: Node.js mit npm, Git und eine kompatible Shopify CLI. Die geprüfte CLI-Version ist 5.0.1.

1. Repository öffnen und `npm ci` ausführen. LiquidJS wird ausschließlich für lokale Tests installiert; das Theme benötigt keinen Build-Schritt.
2. `shopify theme dev` startet die Entwicklungsvorschau. Die Shop-Konfiguration steht in `shopify.theme.toml`; die CLI führt bei Bedarf durch die Anmeldung.
3. Vor Änderungen am Shop die lokalen Prüfungen ausführen.

Unter Windows können bei gesperrten PowerShell-Skripten `npm.cmd` und `shopify.cmd` anstelle von `npm` und `shopify` verwendet werden.

## Prüfungen

| Kommando | Zweck |
| --- | --- |
| `npm run check:local` | JSON, JavaScript-Syntax, Section-/Snippet-/Asset-Referenzen, DE-/EN-Dateien und Komponententests |
| `npm test` | Liquid-Komponenten mit verschiedenen Einstellungen rendern und prüfen |
| `shopify theme check` | Offizieller Shopify-Check für Liquid, Schema und Übersetzungen |
| `npm run check` | Lokale Prüfungen und anschließend Shopify Theme Check |
| `node scripts/verify-refactor.mjs a2038c2c95b53b7a2fba051c9799a5004df66c12` | Ausgabe des Refactorings mit dem ursprünglichen Git-Stand vergleichen |

Der fehlende deutsche Übersetzungsschlüssel für den einmaligen Kauf wurde ergänzt. `npm run check` prüft die lokalen Komponenten und das Theme mit Shopify Theme Check. Der [Prüfbericht](docs/REFACTORING.md) dokumentiert den früheren Stand des Refactorings.

## Dental-Shop für Privatkunden

Die gespeicherten Theme-Inhalte sind auf Zahnpflege für zu Hause ausgerichtet. Startseite und Kategorieübersicht führen über die Produktsuche zu Zahnbürsten, Zahnpasta und Zahnzwischenraumpflege; dafür müssen keine neuen Kollektionen mit bestimmten Handles angelegt werden. Die bisherige Demo-Produktauswahl auf der Startseite ist deaktiviert und ihre Kollektionsverknüpfung entfernt. Sie kann im Theme-Editor nach Auswahl einer echten Dental-Kollektion wieder aktiviert werden.

Produkte, Produktbeschreibungen, Kollektionen, Menüeinträge und Seiteninhalte werden in Shopify verwaltet. Vorhandene Snowboard-Testdaten müssen dort separat durch das dentale Sortiment ersetzt werden. Die lokalen Theme-Änderungen wurden nicht in den Shop hochgeladen.

## Projektaufbau

- [Architektur und Komponenten](docs/ARCHITECTURE.md)
- [Änderungen und Prüfergebnisse vom 06.11.2026](docs/REFACTORING.md)

`docs/`, `scripts/`, `tests/` und npm-Abhängigkeiten werden über `.shopifyignore` vom Theme-Upload ausgeschlossen.
