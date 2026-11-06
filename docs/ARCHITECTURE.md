# Architektur

Das Projekt verwendet die [native Shopify-Theme-Struktur](https://shopify.dev/docs/storefronts/themes/architecture). Shopify unterstützt innerhalb der Theme-Verzeichnisse keine beliebigen Unterordner. Deshalb bleiben Assets und Snippets flach organisiert; ihr Präfix kennzeichnet die Zuständigkeit.

| Verzeichnis | Zuständigkeit |
| --- | --- |
| `assets/` | CSS, JavaScript, SVGs und Bilder; `component-*` für Komponenten, `section-*` für Sections |
| `config/` | Globale Einstellungsdefinitionen und bestehende Händlerkonfiguration |
| `layout/` | Rahmen für Storefront und Passwortseite |
| `locales/` | Deutsch und Englisch, jeweils Storefront und Editor-Schema |
| `sections/` | Im Editor verwaltete Sections, Gruppen und deren Schemas |
| `snippets/` | Wiederverwendbare Liquid-Komponenten |
| `templates/` | Seitenzusammensetzung; `customers/` bleibt für bestehende Kunden-Templates erhalten |
| `scripts/` | Lokale Strukturprüfung und Vergleich mit dem Stand vor dem Refactoring |
| `tests/` | Komponentenverträge und lokale Liquid-Testumgebung |
| `docs/` | Architektur, Änderungen und Prüfbericht |

Die vorhandenen Section-Blöcke werden beibehalten. Eine Umstellung auf Theme Blocks würde die Editor-Schnittstelle und gespeicherte Einstellungen betreffen und gehört deshalb nicht zu diesem Refactoring.

## Gemeinsame Komponenten

| Snippet | Verwendung und Vertrag |
| --- | --- |
| `section-padding` | Erhält `section` explizit. Erzeugt dieselben Section-Selektoren, dieselbe mobile Skalierung von 0,75 und denselben Breakpoint von 750px. Wird in 28 Sections verwendet. |
| `theme-font-faces` | Gemeinsame Font-Faces für Storefront, Passwortseite und Geschenkkarte. Innerhalb eines `style`-Tags rendern; verwendet globale `settings`. |
| `theme-css-variables` | CSS-Variablen für Storefront und Passwortseite. Innerhalb eines `style`-Tags rendern. `storefront: true` erhält die nur dort vorhandenen Bold-, Popup- und Drawer-Variablen. |
| `theme-font-preloads` | Schrift-Preloads für drei Layouts/Templates; Systemschriften werden weiterhin ausgenommen. Verwendet Shopifys `preload_tag`. |
| `facet-price-range` | Gemeinsame Preisfelder für Desktop und Mobile. `filter`, `filter_type`, `uses_comma_decimals`, `id_prefix` und `mobile` explizit übergeben. IDs, Labels, Zahlenformat und das mobile `inputmode` bleiben erhalten. |
| `facet-active-filters` | Gemeinsame aktive Filter und Preisbereich-Chips an vier Stellen; erhält `filters`. Entfernen-Links, Klassen und Accessibility-Texte bleiben erhalten. |
| `header-structured-data` | Organization- und WebSite-JSON-LD des Headers mit unveränderter Seitenbedingung. Verwendet globale Shopify-Objekte. |
| `image-marquee` | Bereits vorhandene Bildlauf-Komponente. Benötigt weiterhin `component-image-marquee.css` und `image-marquee.js` im aufrufenden Section-Kontext. Bilder werden über Präfix, Index und Dateiendung referenziert. |

## Regeln für weitere Änderungen

- Daten für Komponenten über benannte `render`-Parameter weitergeben; globale Shopify-Objekte wie `settings` und `cart` können direkt verwendet werden.
- Wichtige Komponenten mit englischen LiquidDoc-Headern (`doc`, `@param`, `@example`) dokumentieren. Kommentare sollen Gründe, Grenzen und Lebenszyklen erklären.
- Bestehende Section-Typen, Settings-IDs und Template-IDs bei einem Refactoring erhalten. Sie sind Teil der gespeicherten Shop-Konfiguration.
- Sections mit Presets und vom JavaScript angeforderte Sections auch dann behalten, wenn sie gerade in keinem JSON-Template vorkommen.
- Assets erst nach Prüfung statischer und dynamischer Referenzen entfernen. Die fünf Bannerbilder sind ein Beispiel für dynamische Referenzen.
- Bestehende Übersetzungswerte, CSS und sichtbares Markup bei Strukturänderungen erhalten und lokale Checks ausführen.
- Neue Shop-Inhalte, Sprachveröffentlichungen und Markets werden in Shopify verwaltet. Das Entfernen lokaler Locale-Dateien ändert diese Shop-Konfiguration nicht.

Grundlagen: [Locale-Dateien](https://shopify.dev/docs/storefronts/themes/architecture/locales), [Schema-Verfügbarkeit](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema#enabled_on), [Font-Preloads](https://shopify.dev/docs/storefronts/themes/best-practices/performance/self-host-web-fonts).
