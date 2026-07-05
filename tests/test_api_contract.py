import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from api.server import app


class _FakeChatbot:
    def __init__(self):
        self.reset_called = False

    def chat_with_history(self, user_message: str):
        answer = f"Antwort auf: {user_message}"
        chunks = [
            {
                "source": "faq.md",
                "category": "Wiki",
                "score": 0.91,
            }
        ]
        return answer, chunks

    def reset_history(self):
        self.reset_called = True


class ApiContractTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_contract(self):
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    @patch("api.server._get_or_create_chatbot")
    def test_chat_contract(self, get_or_create_chatbot_mock):
        fake_bot = _FakeChatbot()
        get_or_create_chatbot_mock.return_value = fake_bot

        response = self.client.post(
            "/chat",
            json={"message": "Wo ist die Mensa?"},
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("session_id", data)
        self.assertIsInstance(data["session_id"], str)
        self.assertIn("answer", data)
        self.assertIn("sources", data)
        self.assertIsInstance(data["sources"], list)
        self.assertEqual(data["sources"][0]["source"], "faq.md")

    def test_chat_rejects_empty_message(self):
        response = self.client.post(
            "/chat",
            json={"message": "   "},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Message must not be empty.")

    def test_reset_contract(self):
        fake_bot = _FakeChatbot()

        with patch("api.server._sessions", {"session-1": fake_bot}):
            response = self.client.post(
                "/chat/reset",
                json={"session_id": "session-1"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True})
        self.assertTrue(fake_bot.reset_called)


if __name__ == "__main__":
    unittest.main()
