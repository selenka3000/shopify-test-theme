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

Theme Check meldet keine Warnungen mehr. Ein bereits vorhandener fehlender deutscher Übersetzungsschlüssel bleibt unverändert, um bestehende Storefront-Texte zu erhalten. Deshalb beendet sich `npm run check` aktuell mit Fehlerstatus, obwohl die lokalen Prüfungen bestehen. Details stehen im [Prüfbericht](docs/REFACTORING.md).

## Projektaufbau

- [Architektur und Komponenten](docs/ARCHITECTURE.md)
- [Änderungen und Prüfergebnisse vom 06.11.2026](docs/REFACTORING.md)

`docs/`, `scripts/`, `tests/` und npm-Abhängigkeiten werden über `.shopifyignore` vom Theme-Upload ausgeschlossen.
