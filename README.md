# Leuphana-Chatbot

Ein RAG-basierter Chatbot für Erstsemester-Studierende der Leuphana Universität Lüneburg.

## Architektur

```
raw_input_data/ → IngestionPipeline → EmbeddingService → ChromaDB
                                                              ↓
React Frontend (Vite) ↔ FastAPI Backend ↔ Chatbot (Orchestrator)
                           ↓
                       RetrievalService ← ChromaDB
                           ↓
                 LlmService (Mistral via AcademicCloud)
```

## Setup

### 1. Venv erstellen & aktivieren
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 2. Abhängigkeiten installieren
```bash
pip install -r requirements.txt
```

### 2b. Frontend-Abhängigkeiten installieren
```bash
cd frontend
npm install
cd ..
```

### 3. API-Key setzen
Kopiere `.env` und trage deinen API-Key ein:
```
OPENAI_API_KEY=dein-key-hier
```

### 4. Wissensbasis aufbauen (einmalig)
```bash
python run_ingestion.py
# Bei Neuaufbau:
python run_ingestion.py --reset
```

### 5. Backend starten (FastAPI)
```bash
uvicorn api.server:app --reload --host 127.0.0.1 --port 8000
```

### 6. Frontend starten (Vite)
```bash
cd frontend
npm run dev
```

### 7. One-Click Dev Start in VS Code

Im VS-Code Command Palette:

1. `Tasks: Run Task`
2. `Dev: Frontend + Backend`

Alternativ als ein Befehl im Projektroot:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Optional kann die Streamlit-Oberfläche weiterhin als Fallback genutzt werden:
```bash
streamlit run app/app.py
```

## Frontend-Backend-Verbindung

Das Frontend ruft standardmäßig `http://127.0.0.1:8000` auf.

Optional kann die API-URL per Environment-Variable gesetzt werden:
```bash
# im frontend/.env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## API-Contract-Tests

Die API-Contract-Tests laufen ohne externe LLM-Aufrufe (mit Mocks):

```bash
python -m unittest tests/test_api_contract.py
```

## Projektstruktur

```
Leuphana-Chatbot/
├── api/server.py                     # FastAPI-Endpunkte für das Frontend
├── app/app.py                        # Streamlit UI (Fallback)
├── frontend/                         # React/Vite Frontend
├── chatbot/Chatbot.py                # RAG-Orchestrator
├── data_ingestion/ingestion_pipeline.py  # Parser & Chunker
├── knowledge_base/vectordatabase_manager.py  # ChromaDB
├── services/
│   ├── EmbeddingService.py
│   ├── LlmService.py
│   └── RetrievalService.py
├── raw_input_data/                   # Rohdaten (gitignored)
├── chroma_db/                        # Vektordatenbank (generiert)
├── config.py                         # Modell-Konfiguration
├── run_ingestion.py                  # Ingestion-Skript
└── .env                              # API-Key (gitignored)
```