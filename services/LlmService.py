from openai import OpenAI
from dotenv import load_dotenv
import os
from config import LLM, ENDPOINT, LLM_TIMEOUT_SECONDS, OPENAI_MAX_RETRIES, TEMPERATURE, TOP_P

class LlmService:
    def __init__(self):

        load_dotenv()

        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = LLM
        self.base_url = ENDPOINT
        self.timeout_seconds = LLM_TIMEOUT_SECONDS
        self.max_retries = OPENAI_MAX_RETRIES
        self.temperature = TEMPERATURE
        self.top_p = TOP_P

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            timeout=self.timeout_seconds,
            max_retries=self.max_retries,
        )

    def send_llm_request(self, user_message: str, system_message: str):
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                temperature=self.temperature,
                top_p=self.top_p,
                timeout=self.timeout_seconds,
            )
            return completion.choices[0].message.content
    
    def send_messages(self, messages: list[dict]):
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            top_p=self.top_p,
            timeout=self.timeout_seconds,
        )
        return completion.choices[0].message.content



    