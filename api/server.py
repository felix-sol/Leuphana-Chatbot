import os
import uuid
import logging
from threading import Lock
from time import perf_counter

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import APIConnectionError, APITimeoutError, InternalServerError
from pydantic import BaseModel, Field

from chatbot.Chatbot import Chatbot


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: str | None = None


class Source(BaseModel):
    source: str
    category: str
    score: float


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sources: list[Source]


class ResetRequest(BaseModel):
    session_id: str


app = FastAPI(title="Leuphana Chatbot API", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_sessions: dict[str, Chatbot] = {}
_sessions_lock = Lock()
logger = logging.getLogger("uvicorn.error")


def _get_or_create_chatbot(session_id: str) -> Chatbot:
    with _sessions_lock:
        chatbot = _sessions.get(session_id)
        if chatbot is None:
            chatbot = Chatbot()
            _sessions[session_id] = chatbot
        return chatbot


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    request_start = perf_counter()
    question = request.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Message must not be empty.")

    session_id = request.session_id or str(uuid.uuid4())
    chatbot = _get_or_create_chatbot(session_id)

    try:
        answer, chunks = chatbot.chat_with_history(question)
    except (APITimeoutError, TimeoutError) as exc:
        total_ms = (perf_counter() - request_start) * 1000
        logger.warning(
            "chat_request_timeout session_id=%s total_ms=%.2f message_len=%d error=%s",
            session_id,
            total_ms,
            len(question),
            str(exc),
        )
        raise HTTPException(
            status_code=504,
            detail="Die Anfrage an den KI-Dienst hat das Zeitlimit ueberschritten. Bitte erneut versuchen.",
        ) from exc
    except InternalServerError as exc:
        total_ms = (perf_counter() - request_start) * 1000
        logger.warning(
            "chat_request_upstream_500 session_id=%s total_ms=%.2f message_len=%d error=%s",
            session_id,
            total_ms,
            len(question),
            str(exc),
        )
        raise HTTPException(
            status_code=502,
            detail="Der KI-Dienst hat einen internen Fehler gemeldet. Bitte in einigen Sekunden erneut versuchen.",
        ) from exc
    except APIConnectionError as exc:
        total_ms = (perf_counter() - request_start) * 1000
        logger.warning(
            "chat_request_upstream_connection_error session_id=%s total_ms=%.2f message_len=%d error=%s",
            session_id,
            total_ms,
            len(question),
            str(exc),
        )
        raise HTTPException(
            status_code=503,
            detail="Der KI-Dienst ist aktuell nicht erreichbar. Bitte spaeter erneut versuchen.",
        ) from exc
    except Exception:
        total_ms = (perf_counter() - request_start) * 1000
        logger.exception(
            "chat_request_failed session_id=%s total_ms=%.2f message_len=%d",
            session_id,
            total_ms,
            len(question),
        )
        raise

    sources = [
        Source(
            source=chunk.get("source", "Unbekannt"),
            category=chunk.get("category", "Unbekannt"),
            score=float(chunk.get("score", 0.0)),
        )
        for chunk in chunks
    ]

    total_ms = (perf_counter() - request_start) * 1000
    logger.info(
        "chat_request_ok session_id=%s total_ms=%.2f message_len=%d sources=%d",
        session_id,
        total_ms,
        len(question),
        len(sources),
    )

    return ChatResponse(session_id=session_id, answer=answer, sources=sources)


@app.post("/chat/reset")
def reset_chat(request: ResetRequest) -> dict[str, bool]:
    with _sessions_lock:
        chatbot = _sessions.get(request.session_id)

    if chatbot is None:
        return {"ok": True}

    chatbot.reset_history()
    return {"ok": True}
