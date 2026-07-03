"""
run_ingestion.py – Einmaliges Skript zum Befüllen der Vektordatenbank.

Ausführen (aus dem Leuphana-Chatbot-Ordner):
    python run_ingestion.py

Optionen:
    --reset   Löscht die bestehende Collection vor der Ingestion
"""

import argparse
import sys
import time
from pathlib import Path
from typing import Optional

from tqdm import tqdm

from data_ingestion.ingestion_pipeline import IngestionPipeline
from knowledge_base.vectordatabase_manager import VectorDatabaseManager
from services.EmbeddingService import EmbeddingService


def _embed_with_retry(service: EmbeddingService, text: str, retries: int = 3) -> Optional[list[float]]:
    """Versucht ein Embedding zu erstellen, überspringt den Chunk nach mehreren Fehlern."""
    for attempt in range(retries):
        try:
            return service.create_embedding(text)
        except Exception as e:
            error_msg = str(e)

            # Rate Limit erreicht
            if "429" in error_msg:
                print("\n[INFO] Rate Limit erreicht. Warte 60 Sekunden...")
                time.sleep(60)
                continue


            if attempt < retries - 1:
                time.sleep(1)
            else:
                print(f"\n[SKIP] Chunk übersprungen nach {retries} Versuchen: {e}")
    return None


def run(reset: bool = False) -> None:
    print("=== Leuphana-Chatbot: Ingestion Pipeline ===\n")

    data_dir = Path("./raw_input_data")
    if not data_dir.exists():
        print(f"[ERROR] Ordner '{data_dir}' nicht gefunden. Bitte raw_input_data bereitstellen.")
        sys.exit(1)

    # 1. Dokumente laden und chunken
    pipeline = IngestionPipeline(data_dir=str(data_dir))
    documents = pipeline.load_all_documents()
    if not documents:
        print("[ERROR] Keine Dokumente gefunden.")
        sys.exit(1)
    chunks = pipeline.chunk_documents(documents)

    # 2. Vektordatenbank vorbereiten
    db = VectorDatabaseManager()
    if reset:
        print("[INFO] Collection wird zurückgesetzt ...")
        db.clear()

    if db.count() > 0 and not reset:
        print(f"[INFO] Collection enthält bereits {db.count()} Einträge.")
        answer = input("Trotzdem neu einlesen? (j/N) ").strip().lower()
        if answer != "j":
            print("Abgebrochen.")
            return

    # 3. Embeddings generieren
    embedding_service = EmbeddingService()
    print(f"\n[INFO] Generiere Embeddings für {len(chunks)} Chunks ...")

    embeddings = []
    valid_chunks = []
    skipped = 0
    for chunk in tqdm(chunks, desc="Embeddings"):
        emb = _embed_with_retry(embedding_service, chunk["text"])
        time.sleep(0.2)
        if emb is not None:
            embeddings.append(emb)
            valid_chunks.append(chunk)
        else:
            skipped += 1

    if skipped:
        print(f"[WARNING] {skipped} Chunks übersprungen (API-Fehler).")

    # 4. In ChromaDB speichern
    print("\n[INFO] Speichere Chunks in ChromaDB ...")
    db.add_documents(valid_chunks, embeddings)

    print(f"\n✅ Fertig! {db.count()} Chunks in der Datenbank.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Leuphana-Chatbot Ingestion Pipeline")
    parser.add_argument("--reset", action="store_true", help="Collection vor Ingestion leeren")
    args = parser.parse_args()
    run(reset=args.reset)
