from openai import OpenAI
from dotenv import load_dotenv
import os
from config import EMBEDDING_MODEL, ENDPOINT


class EmbeddingService:
    def __init__(self):
        load_dotenv()
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = EMBEDDING_MODEL
        self.base_url = ENDPOINT

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    def create_sample_embedding(self, text: str):
        embedding = self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return embedding.data[0].embedding    

    
if __name__ == "__main__":
    embedding_service = EmbeddingService()

    embedding = embedding_service.create_sample_embedding(
        text="This is a sample text for embedding."
    )
    print(embedding)
        
        