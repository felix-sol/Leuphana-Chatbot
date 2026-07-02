from services.EmbeddingService import EmbeddingService
from knowledge_base.vectordatabase_manager import VectorDatabaseManager


class RetrievalService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.db = VectorDatabaseManager()

    def retrieve(self, query: str, n_results: int = 5) -> list[dict]:
        """
        Sucht die n relevantesten Chunks zur Anfrage.
        Gibt Liste von {'text', 'source', 'category', 'score'} zurück.
        """
        if self.db.count() == 0:
            print("[WARNING] Vektordatenbank ist leer. Bitte run_ingestion.py ausführen.")
            return []

        query_embedding = self.embedding_service.create_embedding(query)
        results = self.db.query(query_embedding, n_results=n_results)
        return results


if __name__ == "__main__":
    service = RetrievalService()
    results = service.retrieve("Wie melde ich mich für Prüfungen an?")
    for r in results:
        print(f"[{r['score']:.2f}] {r['source']}: {r['text'][:100]}")
 