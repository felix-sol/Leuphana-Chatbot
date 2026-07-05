import logging
from time import perf_counter

from services.LlmService import LlmService
from services.RetrievalService import RetrievalService
from config import SYSTEM_PROMPT


logger = logging.getLogger("uvicorn.error")

class Chatbot:
    def __init__(self, n_results: int = 5):
        self.llm = LlmService()
        self.retrieval = RetrievalService()
        self.n_results = n_results
        self.history: list[dict] = []

    # ── Prompt-Aufbau ─────────────────────────────────────────────────────────

    def _build_context_block(self, chunks: list[dict]) -> str:
        if not chunks:
            return "Kein relevanter Kontext gefunden."
        parts = []
        for c in chunks:
            parts.append(f"[Quelle: {c['source']} | Kategorie: {c['category']}]\n{c['text']}")
        return "\n\n---\n\n".join(parts)

    def _build_user_message(self, query: str, context: str) -> str:
        return (
            f"Kontext aus der Leuphana-Wissensbasis:\n\n{context}\n\n"
            f"---\n\nFrage: {query}"
        )

    # ── Chat-Methoden ─────────────────────────────────────────────────────────

    def chat(self, user_message: str) -> tuple[str, list[dict]]:
        """
        Einzel-Turn: Beantwortet eine Frage ohne History.
        Gibt (Antwort, genutzte_chunks) zurück.
        """
        total_start = perf_counter()

        retrieval_start = perf_counter()
        chunks = self.retrieval.retrieve(user_message, n_results=self.n_results)
        retrieval_ms = (perf_counter() - retrieval_start) * 1000

        context = self._build_context_block(chunks)
        user_msg = self._build_user_message(user_message, context)

        llm_start = perf_counter()
        answer = self.llm.send_llm_request(
            user_message=user_msg,
            system_message=SYSTEM_PROMPT,
        )
        llm_ms = (perf_counter() - llm_start) * 1000
        total_ms = (perf_counter() - total_start) * 1000

        logger.info(
            "chat_timing retrieval_ms=%.2f llm_ms=%.2f total_ms=%.2f chunks=%d",
            retrieval_ms,
            llm_ms,
            total_ms,
            len(chunks),
        )

        return answer, chunks

    def chat_with_history(self, user_message: str) -> tuple[str, list[dict]]:
        total_start = perf_counter()

        retrieval_start = perf_counter()
        chunks = self.retrieval.retrieve(
            user_message,
            n_results=self.n_results
        )
        retrieval_ms = (perf_counter() - retrieval_start) * 1000

        context = self._build_context_block(chunks)

        user_msg = self._build_user_message(
            user_message,
            context
        )

        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            }
        ]

        messages.extend(self.history)

        messages.append({
            "role": "user",
            "content": user_msg
        })

        llm_start = perf_counter()
        answer = self.llm.send_messages(messages)
        llm_ms = (perf_counter() - llm_start) * 1000
        total_ms = (perf_counter() - total_start) * 1000

        logger.info(
            "chat_with_history_timing retrieval_ms=%.2f llm_ms=%.2f total_ms=%.2f history_messages=%d chunks=%d",
            retrieval_ms,
            llm_ms,
            total_ms,
            len(self.history),
            len(chunks),
        )

        self.history.append({
            "role": "user",
            "content": user_message
        })

        self.history.append({
            "role": "assistant",
            "content": answer
        })

        return answer, chunks

    def reset_history(self) -> None:
        self.history = []


if __name__ == "__main__":
    bot = Chatbot()
    while True:
        question = input("\nDeine Frage (oder 'exit'): ").strip()
        if question.lower() == "exit":
            break
        answer, chunks = bot.chat_with_history(question)
        print(f"\nAntwort:\n{answer}")
        print(f"\nQuellen: {[c['source'] for c in chunks]}")
