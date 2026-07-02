from pathlib import Path

ENDPOINT = "https://chat-ai.academiccloud.de/v1"
LLM = "mistral-large-3-675b-instruct-2512"
EMBEDDING_MODEL = "multilingual-e5-large-instruct"


# adjust the input directory as needed for your local environment
INPUT_DIR = Path("C:/Projekte/Python/chatbot-design/Leuphana-Chatbot/raw_input_data")

CHUNK_SIZE = 800
CHUNK_OVERLAP = 150