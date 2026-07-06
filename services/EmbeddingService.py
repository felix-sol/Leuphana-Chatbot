import logging
import random
import time

from openai import OpenAI
from openai import InternalServerError
from dotenv import load_dotenv
import os
from config import (
    EMBEDDING_500_BACKOFF_MAX_MS,
    EMBEDDING_500_BACKOFF_MIN_MS,
    EMBEDDING_500_RETRIES,
    EMBEDDING_MODEL,
    ENDPOINT,
    EMBEDDING_TIMEOUT_SECONDS,
    OPENAI_MAX_RETRIES,
)


logger = logging.getLogger("uvicorn.error")


class EmbeddingService:
    def __init__(self):
        load_dotenv()
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = EMBEDDING_MODEL
        self.base_url = ENDPOINT
        self.timeout_seconds = EMBEDDING_TIMEOUT_SECONDS
        self.max_retries = OPENAI_MAX_RETRIES
        self.embedding_500_retries = EMBEDDING_500_RETRIES
        self.backoff_min_ms = EMBEDDING_500_BACKOFF_MIN_MS
        self.backoff_max_ms = EMBEDDING_500_BACKOFF_MAX_MS

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=self.timeout_seconds,
            max_retries=self.max_retries,
        )

    def create_embedding(self, text: str):
        total_attempts = self.embedding_500_retries + 1

        for attempt in range(1, total_attempts + 1):
            try:
                embedding = self.client.embeddings.create(
                    model=self.model,
                    input=text,
                    timeout=self.timeout_seconds,
                )
                return embedding.data[0].embedding
            except InternalServerError as exc:
                if attempt >= total_attempts:
                    raise

                wait_ms = random.randint(self.backoff_min_ms, self.backoff_max_ms)
                logger.warning(
                    "embedding_upstream_500 retry=%d/%d backoff_ms=%d error=%s",
                    attempt,
                    self.embedding_500_retries,
                    wait_ms,
                    str(exc),
                )
                time.sleep(wait_ms / 1000.0)

    

        