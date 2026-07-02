from services.LlmService import LlmService
from services.RetrievalService import RetrievalService

SYSTEM_PROMPT = """Du bist ein hilfreicher Assistent für Erstsemester-Studierende der Leuphana Universität Lüneburg.
Du beantwortest Fragen rund ums Studium – von Campusleben über Prüfungen bis hin zu digitalen Tools.

Halte dich an folgende Regeln:
- Beantworte Fragen ausschließlich auf Basis des bereitgestellten Kontexts.
- Wenn der Kontext keine ausreichende Antwort liefert, sage ehrlich: "Dazu habe ich leider keine Informationen."
- Antworte auf Deutsch, es sei denn, die Frage wird auf Englisch gestellt.
- Sei freundlich, klar und präzise.
- Nenne am Ende deiner Antwort die genutzten Quellen in eckigen Klammern, z.B. [WLAN.docx].
"""


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
        chunks = self.retrieval.retrieve(user_message, n_results=self.n_results)
        context = self._build_context_block(chunks)
        user_msg = self._build_user_message(user_message, context)

        answer = self.llm.send_llm_request(
            user_message=user_msg,
            system_message=SYSTEM_PROMPT,
        )
        return answer, chunks

    def chat_with_history(self, user_message: str) -> tuple[str, list[dict]]:
        chunks = self.retrieval.retrieve(
            user_message,
            n_results=self.n_results
        )

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

        answer = self.llm.send_messages(messages)

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
