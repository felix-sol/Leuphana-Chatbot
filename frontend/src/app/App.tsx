import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, BookOpen, Calendar, MapPin, GraduationCap, CreditCard, Users, HelpCircle, X } from "lucide-react";
import leuphanaLogo from "@/imports/image.png";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type Role = "user" | "bot";

interface Message {
  id: number;
  role: Role;
  text: string;
  timestamp: Date;
  sources?: Source[];
}

interface Source {
  source: string;
  category: string;
  score: number;
}

interface QuickQuestion {
  icon: React.ReactNode;
  label: string;
  question: string;
}

const quickQuestions: QuickQuestion[] = [
  {
    icon: <GraduationCap size={16} />,
    label: "Immatrikulation",
    question: "Was muss ich zur Immatrikulation mitbringen und wann ist der Termin?",
  },
  {
    icon: <BookOpen size={16} />,
    label: "Lehrveranstaltungen",
    question: "Wie finde ich meine Lehrveranstaltungen im Stundenplan?",
  },
  {
    icon: <CreditCard size={16} />,
    label: "Semesterticket",
    question: "Wie funktioniert das Semesterticket und welche Züge kann ich nutzen?",
  },
  {
    icon: <MapPin size={16} />,
    label: "Campus",
    question: "Wo finde ich wichtige Orte auf dem Campus, wie Mensa, Bibliothek und Prüfungsamt?",
  },
  {
    icon: <Calendar size={16} />,
    label: "Prüfungen",
    question: "Wie melde ich mich für Prüfungen an und wann sind die Fristen?",
  },
  {
    icon: <Users size={16} />,
    label: "Beratung",
    question: "Welche Beratungsangebote gibt es für Erstsemester?",
  },
];

function autoLinkRawUrls(text: string): string {
  const preservedLinks: string[] = [];

  // Preserve existing markdown links first to avoid double-linking their URLs.
  const withPlaceholders = text.replace(/\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/g, (match) => {
    const marker = `__MD_LINK_${preservedLinks.length}__`;
    preservedLinks.push(match);
    return marker;
  });

  const linked = withPlaceholders.replace(
    /(^|[\s(>])((https?:\/\/)[^\s<)\]]+)/g,
    (full, prefix: string, url: string) => `${prefix}[${url}](${url})`,
  );

  return linked.replace(/__MD_LINK_(\d+)__/g, (_, idx: string) => {
    const item = preservedLinks[Number(idx)];
    return item ?? "";
  });
}

function LeuphanaHexagon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="30,2 56,16 56,44 30,58 4,44 4,16"
        stroke="currentColor"
        strokeWidth="3.5"
        fill="none"
      />
      <line x1="30" y1="2" x2="30" y2="58" stroke="currentColor" strokeWidth="2.5" />
      <line x1="4" y1="16" x2="56" y2="44" stroke="currentColor" strokeWidth="2.5" />
      <line x1="56" y1="16" x2="4" y2="44" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "bot",
      text: "Willkommen an der Leuphana Universität Lüneburg! 🎓\n\nIch bin dein digitaler Studienassistent und begleite dich durch dein erstes Semester. Stelle mir gerne Fragen rund um Immatrikulation, Stundenplan, Prüfungen, Campus und vieles mehr.\n\nWie kann ich dir heute helfen?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickHelp, setShowQuickHelp] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    setErrorMessage(null);

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowQuickHelp(false);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Der Server hat die Anfrage nicht verarbeitet.");
      }

      const data = (await response.json()) as {
        session_id: string;
        answer: string;
        sources: Source[];
      };

      setSessionId(data.session_id);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: data.answer,
          timestamp: new Date(),
          sources: data.sources,
        },
      ]);
    } catch (error) {
      const fallbackText = "Ich konnte den Backend-Service gerade nicht erreichen. Bitte versuche es gleich noch einmal.";
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler.");
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: fallbackText, timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="size-full flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif", background: "var(--background)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-3 border-b border-border"
        style={{ background: "#7D1D2E" }}
      >
        <div className="flex items-center gap-3">
          <div className="text-white opacity-90">
            <LeuphanaHexagon size={30} />
          </div>
          <div>
            <div
              className="text-white text-sm font-semibold tracking-wide uppercase"
              style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.08em" }}
            >
              Studienassistent
            </div>
            <div className="text-white/70 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
              Leuphana Universität Lüneburg
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <span className="text-white/70 text-xs">Online</span>
          </div>
          <button
            onClick={() => setInfoOpen((v) => !v)}
            className="text-white/70 hover:text-white transition-colors p-1 rounded"
            aria-label="Info"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* Info banner */}
      {infoOpen && (
        <div
          className="flex items-start gap-3 px-5 py-3 text-sm border-b border-border"
          style={{ background: "#FDF8F4", color: "#6B6158" }}
        >
          <div className="mt-0.5 shrink-0" style={{ color: "#7D1D2E" }}>
            <HelpCircle size={16} />
          </div>
          <div className="flex-1" style={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
            <strong style={{ color: "#1C1410" }}>Transparenz & Datenschutz:</strong> Dieser Chatbot
            beantwortet häufige Fragen von Erstsemesterstudierenden auf Basis offizieller
            Leuphana-Informationen. Für verbindliche Auskünfte wende dich bitte direkt an das
            Studierendensekretariat oder die jeweiligen Fachstellen.
          </div>
          <button
            onClick={() => setInfoOpen(false)}
            className="shrink-0 hover:opacity-70 transition-opacity"
            style={{ color: "#6B6158" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            {msg.role === "bot" ? (
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "#7D1D2E", color: "white" }}
              >
                <LeuphanaHexagon size={16} />
              </div>
            ) : (
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 text-xs font-semibold"
                style={{ background: "#E8E2DA", color: "#7D1D2E" }}
              >
                Du
              </div>
            )}

            <div className={`flex flex-col gap-1 max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className="px-4 py-3 text-sm leading-relaxed"
                style={{
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? "#7D1D2E" : "#FFFFFF",
                  color: msg.role === "user" ? "#FFFFFF" : "#1C1410",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {msg.role === "user" ? (
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      p: ({ children }) => <p style={{ margin: "0 0 0.75rem" }}>{children}</p>,
                      h1: ({ children }) => <h1 style={{ margin: "0.5rem 0", fontSize: "1.1rem", fontWeight: 700 }}>{children}</h1>,
                      h2: ({ children }) => <h2 style={{ margin: "0.5rem 0", fontSize: "1.05rem", fontWeight: 700 }}>{children}</h2>,
                      h3: ({ children }) => <h3 style={{ margin: "0.4rem 0", fontSize: "1rem", fontWeight: 700 }}>{children}</h3>,
                      ul: ({ children }) => <ul style={{ margin: "0.35rem 0 0.75rem", paddingLeft: "1.2rem", listStyleType: "disc" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "0.35rem 0 0.75rem", paddingLeft: "1.2rem", listStyleType: "decimal" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ margin: "0.2rem 0" }}>{children}</li>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#7D1D2E", textDecoration: "underline", fontWeight: 600 }}
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                      em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
                      code: ({ children }) => (
                        <code
                          style={{
                            background: "#F5EEE8",
                            borderRadius: "6px",
                            padding: "0.1rem 0.35rem",
                            fontSize: "0.86em",
                          }}
                        >
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {autoLinkRawUrls(msg.text)}
                  </ReactMarkdown>
                )}
              </div>
              {msg.role === "bot" && msg.sources && msg.sources.length > 0 && (
                <div className="text-[11px] px-1 pt-1" style={{ color: "#6B6158", fontFamily: "'Inter', sans-serif" }}>
                  <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>Quellen</div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((source, idx) => (
                      <span
                        key={`${msg.id}-source-${idx}`}
                        className="px-2 py-1 rounded-full"
                        style={{
                          background: "#F5EEE8",
                          color: "#5A4A3E",
                          border: "1px solid #E8D9CC",
                          maxWidth: "100%",
                          overflowWrap: "anywhere",
                        }}
                        title={`${source.category} • Relevanz ${(source.score * 100).toFixed(0)}%`}
                      >
                        {source.source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <span className="text-xs px-1" style={{ color: "#6B6158" }}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#7D1D2E", color: "white" }}
            >
              <LeuphanaHexagon size={16} />
            </div>
            <div
              className="px-4 py-3 flex items-center gap-1"
              style={{
                borderRadius: "18px 18px 18px 4px",
                background: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "#7D1D2E",
                    opacity: 0.4,
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      {showQuickHelp && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium" style={{ color: "#6B6158", fontFamily: "'Inter', sans-serif" }}>
              Häufige Fragen
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.question)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:shadow-sm active:scale-95"
                style={{
                  borderColor: "rgba(125, 29, 46, 0.25)",
                  color: "#7D1D2E",
                  background: "white",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#7D1D2E";
                  (e.currentTarget as HTMLButtonElement).style.color = "white";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#7D1D2E";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "white";
                  (e.currentTarget as HTMLButtonElement).style.color = "#7D1D2E";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(125, 29, 46, 0.25)";
                }}
              >
                <span style={{ opacity: 0.8 }}>{q.icon}</span>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        {errorMessage && (
          <div
            className="mb-2 text-xs px-3 py-2 rounded-lg"
            style={{ background: "#FDF0F1", color: "#7D1D2E", fontFamily: "'Inter', sans-serif" }}
          >
            {errorMessage}
          </div>
        )}
        <div
          className="flex items-end gap-2 rounded-2xl border px-4 py-3"
          style={{
            borderColor: "rgba(125, 29, 46, 0.2)",
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Stelle deine Frage…"
            className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
            style={{
              color: "#1C1410",
              fontFamily: "'Inter', sans-serif",
              maxHeight: "120px",
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: input.trim() && !isTyping ? "#7D1D2E" : "#E8E2DA",
              color: input.trim() && !isTyping ? "white" : "#6B6158",
              cursor: input.trim() && !isTyping ? "pointer" : "default",
            }}
            aria-label="Senden"
          >
            <Send size={14} />
          </button>
        </div>
        <p
          className="text-center mt-2 text-xs"
          style={{ color: "#6B6158", fontFamily: "'Inter', sans-serif" }}
        >
          Dieser Assistent gibt allgemeine Hinweise — keine verbindliche Rechtsberatung.
        </p>
      </div>

      {/* Logo footer */}
      <div className="flex items-center justify-center pb-3 gap-2">
        <ImageWithFallback
          src={leuphanaLogo}
          alt="Leuphana Universität Lüneburg"
          className="h-6 object-contain opacity-50"
        />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        textarea::-webkit-scrollbar { display: none; }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
