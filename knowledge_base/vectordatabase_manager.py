import chromadb
from chromadb.config import Settings


COLLECTION_NAME = "leuphana_knowledge"


class VectorDatabaseManager:
    def __init__(self, persist_dir: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        print(f"[INFO] ChromaDB geladen. Dokumente in Collection: {self.collection.count()}")

    # ── Write ─────────────────────────────────────────────────────────────────

    def add_documents(self, chunks: list[dict], embeddings: list[list[float]]) -> None:
        """
        Fügt Chunks mit ihren Embeddings und Metadaten in die Collection ein.
        chunks: Liste von {'text', 'source', 'category', 'chunk_index'}
        embeddings: korrespondierende Embeddings
        """
        ids = [f"{c['source']}_chunk_{c['chunk_index']}" for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {"source": c["source"], "category": c["category"], "chunk_index": c["chunk_index"]}
            for c in chunks
        ]

        # In Batches einfügen (ChromaDB-Limit beachten)
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            self.collection.add(
                ids=ids[i:i + batch_size],
                embeddings=embeddings[i:i + batch_size],
                documents=documents[i:i + batch_size],
                metadatas=metadatas[i:i + batch_size],
            )
        print(f"[INFO] {len(ids)} Chunks gespeichert.")

    def clear(self) -> None:
        """Löscht alle Einträge in der Collection (für Re-Ingestion)."""
        self.client.delete_collection(COLLECTION_NAME)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        print("[INFO] Collection geleert.")

    # ── Read ──────────────────────────────────────────────────────────────────

    def query(self, query_embedding: list[float], n_results: int = 5) -> list[dict]:
        """
        Sucht die n ähnlichsten Chunks zur Query-Embedding.
        Gibt Liste von {'text', 'source', 'category', 'score'} zurück.
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results, self.collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        chunks = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            chunks.append({
                "text": doc,
                "source": meta.get("source", ""),
                "category": meta.get("category", ""),
                "score": round(1 - dist, 4),  # Cosine-Distance → Similarity
            })
        return chunks

    def count(self) -> int:
        return self.collection.count()


if __name__ == "__main__":
    db = VectorDatabaseManager()
    print(f"Anzahl Einträge: {db.count()}")