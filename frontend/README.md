
  # Frontend - Leuphana Chatbot

  Dieses Verzeichnis enthält das React/Vite-Frontend für den Leuphana-Chatbot.

  ## Voraussetzungen

  - Node.js 18+
  - Laufendes Backend unter http://127.0.0.1:8000

  ## Lokaler Start

  1. Abhängigkeiten installieren:

    npm install

  2. Entwicklungsserver starten:

    npm run dev

  3. Frontend im Browser öffnen:

    http://127.0.0.1:5173

  ## API-Konfiguration

  Standardmäßig wird das Backend unter http://127.0.0.1:8000 angesprochen.

  Optional kannst du die URL per Environment-Variable überschreiben:

  VITE_API_BASE_URL=http://127.0.0.1:8000
  