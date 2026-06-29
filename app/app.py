import sys
from pathlib import Path
import streamlit as st

# Projektroot zum Suchpfad hinzufügen
sys.path.insert(0, str(Path(__file__).parent.parent))

from chatbot.Chatbot import Chatbot

# ── Seitenkonfiguration ───────────────────────────────────────────────────────

st.set_page_config(
    page_title="Leuphana Ersti-Chatbot",
    page_icon="🎓",
    layout="centered",
)

st.title("🎓 Leuphana Ersti-Chatbot")
st.caption("Dein persönlicher Assistent für das erste Semester an der Leuphana Universität Lüneburg")

# ── Session-State initialisieren ──────────────────────────────────────────────

if "chatbot" not in st.session_state:
    with st.spinner("Chatbot wird geladen ..."):
        st.session_state.chatbot = Chatbot()

if "messages" not in st.session_state:
    st.session_state.messages = []  # [{"role": "user"|"assistant", "content": ..., "sources": [...]}]

# ── Seitenleiste ─────────────────────────────────────────────────────────────

with st.sidebar:
    st.header("ℹ️ Über diesen Bot")
    st.markdown(
        "Ich beantworte Fragen rund ums Studium an der Leuphana – "
        "z.B. zu Campus, Prüfungen, digitalen Tools und mehr."
    )

    st.subheader("📚 Wissensgebiete")
    for topic in [
        "🏫 Campusleben & Orientierung",
        "📅 Studium organisieren",
        "💻 Technik & Digitales",
        "💰 Finanzen & Jobs",
        "🤝 Soziales & Community",
        "🎓 Tutoriumsmaterialien",
        "📋 Helpdesk & Prüfungen",
        "🌍 Internationals",
    ]:
        st.markdown(f"- {topic}")

    st.divider()
    if st.button("🗑️ Gespräch zurücksetzen"):
        st.session_state.messages = []
        st.session_state.chatbot.reset_history()
        st.rerun()

# ── Bisherige Nachrichten anzeigen ────────────────────────────────────────────

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if msg.get("sources"):
            with st.expander("📎 Quellen"):
                for src in msg["sources"]:
                    st.markdown(
                        f"- **{src['source']}** *(Kategorie: {src['category']}, "
                        f"Relevanz: {src['score']:.0%})*"
                    )

# ── Eingabe & Antwort ─────────────────────────────────────────────────────────

if user_input := st.chat_input("Stell mir eine Frage ..."):
    # Nutzernachricht anzeigen
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    # Antwort generieren
    with st.chat_message("assistant"):
        with st.spinner("Denke nach ..."):
            answer, chunks = st.session_state.chatbot.chat_with_history(user_input)

        st.markdown(answer)

        if chunks:
            with st.expander("📎 Quellen"):
                for src in chunks:
                    st.markdown(
                        f"- **{src['source']}** *(Kategorie: {src['category']}, "
                        f"Relevanz: {src['score']:.0%})*"
                    )

    st.session_state.messages.append({
        "role": "assistant",
        "content": answer,
        "sources": chunks,
    })