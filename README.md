# Leuphana-Chatbot

Ein RAG-basierter Chatbot für Erstsemester-Studierende der Leuphana Universität Lüneburg.

## Architektur

```
raw_input_data/ → IngestionPipeline → EmbeddingService → ChromaDB
                                                              ↓
Streamlit UI ← Chatbot (Orchestrator) ← RetrievalService ← ChromaDB
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
pip install -r requirements-new.txt
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

### 5. App starten
```bash
streamlit run app/app.py
```

## Projektstruktur

```
Leuphana-Chatbot/
├── app/app.py                        # Streamlit UI
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