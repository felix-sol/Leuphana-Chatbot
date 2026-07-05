from openai import OpenAI
from dotenv import load_dotenv
import os
from config import EMBEDDING_MODEL, ENDPOINT, EMBEDDING_TIMEOUT_SECONDS, OPENAI_MAX_RETRIES


class EmbeddingService:
    def __init__(self):
        load_dotenv()
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = EMBEDDING_MODEL
        self.base_url = ENDPOINT
        self.timeout_seconds = EMBEDDING_TIMEOUT_SECONDS
        self.max_retries = OPENAI_MAX_RETRIES

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=self.timeout_seconds,
            max_retries=self.max_retries,
        )

    def create_embedding(self, text: str):
        embedding = self.client.embeddings.create(
            model=self.model,
            input=text,
            timeout=self.timeout_seconds,
        )
        return embedding.data[0].embedding    

    

        