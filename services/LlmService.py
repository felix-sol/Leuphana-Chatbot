from openai import OpenAI
from dotenv import load_dotenv
import os
from config import LLM, ENDPOINT

class LlmService:
    def __init__(self):

        load_dotenv()

        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = LLM
        self.base_url = ENDPOINT

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    def send_sample_request(self, user_message: str, system_message: str):
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ]
            )
            return completion.choices[0].message.content


if __name__ == "__main__":
    llm_service = LlmService()
    
    response = llm_service.send_sample_request(
        user_message="What is the Capital of Scotland?",
        system_message="You are a geography expert."
    )
    
    print(response)