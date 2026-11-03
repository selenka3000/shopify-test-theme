# REQUIREMENTS:
- Code-Editor: VSCode
- Node.js (npm - Packagemanager)
- Shopify CLI



# INSTALLATION:
1. Öffne VSCode & installiere folgende Erweiterungen:
    - Shopify Liquid
    - Gitlab (für Anbindung des Repository)
    - ggf. Prettier & ESLint für Formating und Code-Checking
2. Klone das Repository und öffne es über den Code Editor
3. Öffne Terminal in VSCode und gebe `shopify auth login` -> Weiterleitung zur Anmeldung von Shopify über Browser



# WICHTIGE SHOPIFY COMMANDS: 
`shopify version`       CLI-Version anzeigen

`shopify auth login`    Bei Shopify anmelden

`shopify theme list`    Themes anzeigen

`shopify theme pull`    Theme herunterladen

`shopify theme dev`     Lokalen Entwicklungsserver starten

`shopify theme check`   Theme-Code überprüfen

`shopify theme push`    Theme hochladen

`shopify theme push --theme 1234567890`     spezifisches Theme mit ID hochladen 

`shopify theme publish --theme 1234567890`  spezifisches Theme mit ID auf Live veröffentlichen

`shopify theme push --theme 1234567890 --only assets/base.css --allow-live`     spezifische Datei hochladen (falls Theme Live, entfällt publish)

`shopify theme open`    Theme-Vorschau öffnen

`shopify theme info`    Aktuelle Shop-/Theme-Konfiguration anzeigen