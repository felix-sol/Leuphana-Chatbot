import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  Globe,
  GraduationCap,
  HelpCircle,
  History,
  MessageCircleMore,
  Mic,
  Menu,
  MoreVertical,
  Paperclip,
  Send,
  Settings,
  Star,
  University,
  UserRound,
  X,
  Megaphone,
} from "lucide-react";
import avatarImage from "@/assets/avatar.png";
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

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const quickQuestions: QuickQuestion[] = [
  {
    icon: <GraduationCap size={24} />,
    label: "Studium & Bewerbung",
    question: "Wie bewerbe ich mich für ein Studium an der Leuphana?",
  },
  {
    icon: <CalendarDays size={24} />,
    label: "Lehrveranstaltungen & Stundenplan",
    question: "Wie finde ich meine Lehrveranstaltungen im Stundenplan?",
  },
  {
    icon: <University size={24} />,
    label: "Campusleben & Services",
    question: "Welche Services und Orte sind auf dem Campus besonders wichtig?",
  },
  {
    icon: <HelpCircle size={24} />,
    label: "Fragen zu Leuphana",
    question: "Welche allgemeinen Fragen sollte ich als Erstsemester kennen?",
  },
];

const sidebarItems: SidebarItem[] = [
  { icon: <MessageCircleMore size={18} />, label: "Neuer Chat", active: true },
  { icon: <History size={18} />, label: "Verlauf" },
  { icon: <Star size={18} />, label: "Gespeichert" },
  { icon: <BookOpenText size={18} />, label: "FAQ" },
  { icon: <Megaphone size={18} />, label: "News & Infos" },
  { icon: <UserRound size={18} />, label: "Mein Bereich" },
];

function BrandGlyph({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="30,2 56,16 56,44 30,58 4,44 4,16" stroke="white" strokeWidth="3.2" fill="none" />
      <line x1="30" y1="2" x2="30" y2="58" stroke="white" strokeWidth="2.4" />
      <line x1="4" y1="16" x2="56" y2="44" stroke="white" strokeWidth="2.4" />
      <line x1="56" y1="16" x2="4" y2="44" stroke="white" strokeWidth="2.4" />
    </svg>
  );
}

function MascotHero() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[250px] items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-[#f6f1ec] to-[#efe5de] shadow-[0_24px_80px_rgba(125,29,46,0.12)]" />
      <ImageWithFallback src={avatarImage} alt="LU Avatar" className="relative h-full w-full rounded-full object-cover p-2" />
    </div>
  );
}

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

function SidebarButton({ icon, label, active = false }: SidebarItem) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all ${
        active
          ? "bg-white/12 text-white shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
          : "text-white/78 hover:bg-white/8 hover:text-white"
      }`}
    >
      <span className={`grid size-8 place-items-center rounded-full ${active ? "bg-white/12" : "bg-white/8"}`}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function QuickCard({ icon, label, question, onClick }: QuickQuestion & { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex min-h-[110px] flex-col justify-between rounded-2xl border border-[#eadfda] bg-white px-4 py-3 text-left shadow-[0_8px_18px_rgba(61,32,23,0.05)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(61,32,23,0.08)]"
    >
      <div>
        <div className="mb-3.5 flex size-9 items-center justify-center rounded-xl border border-[#e4d1c7] text-[#8e3143]">
          {icon}
        </div>
        <div className="max-w-[12rem] text-[0.92rem] font-medium leading-snug text-[#251916]">{label}</div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-[0.8rem] leading-5 text-[#6f615a]">{question}</span>
        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#eadfda] text-[#8e3143] transition-transform group-hover:translate-x-0.5">
          <ArrowRight size={16} />
        </span>
      </div>
    </button>
  );
}

function BotBubble({ msg, formatTime }: { msg: Message; formatTime: (d: Date) => string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#eaded6] bg-white shadow-sm">
        <ImageWithFallback src={avatarImage} alt="LU Avatar" className="h-full w-full object-cover" />
      </div>
      <div className="max-w-[78%]">
        <div className="rounded-[24px] rounded-bl-[8px] border border-[#eadfda] bg-white px-5 py-4 text-[0.95rem] leading-7 text-[#271b17] shadow-[0_8px_24px_rgba(50,28,18,0.06)]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              p: ({ children }) => <p style={{ margin: "0 0 0.8rem" }}>{children}</p>,
              h1: ({ children }) => <h1 style={{ margin: "0.5rem 0", fontSize: "1.15rem", fontWeight: 700 }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ margin: "0.5rem 0", fontSize: "1.05rem", fontWeight: 700 }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ margin: "0.4rem 0", fontSize: "1rem", fontWeight: 700 }}>{children}</h3>,
              ul: ({ children }) => <ul style={{ margin: "0.35rem 0 0.75rem", paddingLeft: "1.2rem", listStyleType: "disc" }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: "0.35rem 0 0.75rem", paddingLeft: "1.2rem", listStyleType: "decimal" }}>{children}</ol>,
              li: ({ children }) => <li style={{ margin: "0.2rem 0" }}>{children}</li>,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#7D1D2E", textDecoration: "underline", fontWeight: 600 }}>
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
              em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
              code: ({ children }) => (
                <code style={{ background: "#f6efeb", borderRadius: "6px", padding: "0.1rem 0.35rem", fontSize: "0.86em" }}>
                  {children}
                </code>
              ),
            }}
          >
            {autoLinkRawUrls(msg.text)}
          </ReactMarkdown>
        </div>

        {msg.sources && msg.sources.length > 0 && (
          <div className="px-1 pt-2 text-[11px] text-[#7d736c]">
            <div className="mb-1.5 font-semibold">Quellen</div>
            <div className="flex flex-wrap gap-1.5">
              {msg.sources.map((source, idx) => (
                <span
                  key={`${msg.id}-source-${idx}`}
                  className="max-w-full rounded-full border border-[#ead8ce] bg-[#faf6f3] px-2 py-1"
                  title={`${source.category} • Relevanz ${(source.score * 100).toFixed(0)}%`}
                  style={{ overflowWrap: "anywhere" }}
                >
                  {source.source}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 px-1 text-xs text-[#84756f]">
          <span>{formatTime(msg.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "bot",
      text: "Hallo! Ich bin LU, dein digitaler Studienassistent der Leuphana Universität Lüneburg. Ich unterstütze dich freundlich und klar bei Fragen rund um Studium, Campusleben, Prüfungen und digitale Dienste.\n\nStell mir einfach deine Frage - ich helfe dir so gut ich kann weiter.",
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
        let detail = "Der Server hat die Anfrage nicht verarbeitet.";
        try {
          const errorPayload = (await response.json()) as { detail?: string };
          if (errorPayload?.detail) {
            detail = errorPayload.detail;
          }
        } catch {
          // Fallback to status-based message when no JSON body is available.
          if (response.status === 502) {
            detail = "Der KI-Dienst hat aktuell einen internen Fehler. Bitte versuche es gleich erneut.";
          } else if (response.status === 503) {
            detail = "Der KI-Dienst ist momentan nicht erreichbar. Bitte versuche es spaeter erneut.";
          } else if (response.status === 504) {
            detail = "Die Anfrage an den KI-Dienst hat zu lange gedauert. Bitte versuche es erneut.";
          }
        }
        throw new Error(detail);
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
      const fallbackText =
        error instanceof TypeError
          ? "Ich kann den Backend-Service gerade nicht erreichen. Bitte pruefe, ob der Server laeuft, und versuche es erneut."
          : error instanceof Error
            ? error.message
            : "Es ist ein unbekannter Fehler aufgetreten. Bitte versuche es erneut.";
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
    <div className="relative h-[100dvh] overflow-hidden bg-[linear-gradient(135deg,#f6f0eb_0%,#f8f3ee_35%,#f3ede8_100%)] text-[#231815]">
      <div className="h-full w-full overflow-hidden p-0">
        <aside className="absolute inset-y-0 left-0 z-20 hidden w-[260px] flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#8a2234_0%,#7d1d2e_35%,#681426_100%)] px-5 py-5 text-white shadow-[12px_0_35px_rgba(83,12,23,0.12)] md:flex">
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-7 flex items-center gap-3 pl-1">
              <div className="text-white">
                <BrandGlyph size={38} />
              </div>
              <div className="leading-tight">
                <div className="text-[1.52rem] font-semibold tracking-[0.28em] text-white">LEUPHANA</div>
                <div className="text-[0.54rem] font-medium uppercase tracking-[0.36em] text-white/75">Universität Lüneburg</div>
              </div>
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <SidebarButton key={item.label} {...item} />
              ))}
            </nav>

            <div className="mt-auto space-y-5">
              <div className="h-px bg-white/22" />
              <div className="space-y-2">
                <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/78 transition hover:bg-white/8 hover:text-white">
                  <Settings size={18} />
                  <span className="font-medium">Einstellungen</span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-white/78 transition hover:bg-white/8 hover:text-white">
                  <MessageCircleMore size={18} />
                  <span className="font-medium">Feedback geben</span>
                </button>
              </div>

              <div className="min-h-[120px]" />
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden rounded-none bg-[#f8f3ee] shadow-[0_28px_80px_rgba(56,24,18,0.12)] md:ml-[260px] md:w-[calc(100%-260px)] md:my-1 md:mr-1 md:rounded-[18px] md:border md:border-white/60">
          {infoOpen && (
            <div className="flex items-start gap-3 border-b border-[#efe1da] bg-[#fcf8f5] px-5 py-3 text-sm text-[#6f625b] md:px-6">
              <div className="mt-0.5 shrink-0 text-[#7d1d2e]">
                <HelpCircle size={16} />
              </div>
              <div className="flex-1 leading-6">
                <strong className="text-[#271b17]">Transparenz & Datenschutz:</strong> Dieser Chatbot beantwortet häufige Fragen auf Basis offizieller Leuphana-Informationen.
              </div>
              <button onClick={() => setInfoOpen(false)} className="shrink-0 text-[#7b6f68] transition hover:text-[#7d1d2e]">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4 md:py-4">
            <section className="rounded-[26px] border border-[#efe0d9] bg-[linear-gradient(180deg,#fffdfb_0%,#fff8f4_100%)] px-5 py-5 shadow-[0_14px_36px_rgba(71,36,24,0.07)] md:px-6 md:py-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)] xl:items-center">
                <div className="max-w-[42rem] space-y-3.5">
                  <h1 className="max-w-[30rem] text-[1.78rem] font-semibold leading-[1.18] tracking-[-0.03em] text-[#8a2a39] md:text-[2rem]">
                    Hallo! Ich bin LU, dein KI-Assistent der Leuphana Universität Lüneburg.
                  </h1>
                  <p className="text-[0.96rem] leading-6.5 text-[#6d615a] md:text-[1rem]">
                    Wie kann ich dir weiterhelfen?
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2.5 xl:pr-2">
                  <MascotHero />
                  <div className="flex items-center gap-2 text-sm text-[#6c5f59]">
                    <span className="size-2.5 rounded-full bg-[#6aba61] shadow-[0_0_0_3px_rgba(106,186,97,0.12)]" />
                    <span>Online</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-[#efe1da] pt-4">
                <div className="mb-3 text-[0.95rem] font-medium text-[#73635b]">Vorschläge für dich</div>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                  {quickQuestions.map((q) => (
                    <QuickCard key={q.label} {...q} onClick={() => sendMessage(q.question)} />
                  ))}
                </div>
              </div>
            </section>

            <div className="h-6" />

            <section className="space-y-5 px-1 pb-5 md:px-2">
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end gap-3">
                    <div className="max-w-[72%]">
                      <div className="rounded-[24px] rounded-br-[8px] bg-gradient-to-br from-[#8a2335] to-[#6f182b] px-5 py-4 text-[0.98rem] leading-7 text-white shadow-[0_14px_28px_rgba(90,16,28,0.22)]">
                        <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                      </div>
                      <div className="mt-1 text-right text-xs text-[#7b6d66]">{formatTime(msg.timestamp)}</div>
                    </div>
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#eaded6] bg-white shadow-sm">
                      <div className="text-sm font-semibold text-[#7d1d2e]">DU</div>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="space-y-2">
                    <BotBubble msg={msg} formatTime={formatTime} />
                  </div>
                ),
              )}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#eaded6] bg-white shadow-sm">
                    <ImageWithFallback src={avatarImage} alt="LU Avatar" className="h-full w-full object-cover" />
                  </div>
                  <div className="rounded-[24px] rounded-bl-[8px] border border-[#eadfda] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(50,28,18,0.06)]">
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((dot) => (
                        <span key={dot} className="size-2 rounded-full bg-[#8a2335] opacity-50" style={{ animation: `bounce 1.2s ease-in-out ${dot * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </section>
          </div>

            <div className="border-t border-[#efe1da] bg-white/85 px-3 pb-4 pt-3 backdrop-blur-sm md:px-4 md:pb-5">
            {errorMessage && (
              <div className="mb-3 rounded-2xl border border-[#f0cfd4] bg-[#fff4f5] px-4 py-3 text-sm text-[#8a2234]">
                {errorMessage}
              </div>
            )}

            <div className="rounded-[24px] border border-[#eaded6] bg-white px-4 py-3 shadow-[0_14px_32px_rgba(48,22,15,0.05)]">
              <div className="flex items-end gap-2.5">
                <button className="grid size-9 shrink-0 place-items-center rounded-full border border-[#eaded6] text-[#7d1d2e] transition hover:bg-[#f8f2ef]">
                  <Paperclip size={18} />
                </button>
                <button className="grid size-9 shrink-0 place-items-center rounded-full border border-[#eaded6] text-[#6e625b] transition hover:bg-[#f8f2ef]">
                  <Globe size={18} />
                </button>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Stelle deine Frage..."
                  className="min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2.5 text-[0.96rem] outline-none placeholder:text-[#94857f]"
                  style={{
                    color: "#231815",
                    maxHeight: "140px",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                  }}
                />

                <button className="grid size-9 shrink-0 place-items-center rounded-full border border-[#eaded6] text-[#6e625b] transition hover:bg-[#f8f2ef]">
                  <Mic size={18} />
                </button>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="grid size-10 shrink-0 place-items-center rounded-full transition-all active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    background: input.trim() && !isTyping ? "linear-gradient(135deg,#8a2335,#7d1d2e)" : "#eaded6",
                    color: input.trim() && !isTyping ? "white" : "#8b7e77",
                    boxShadow: input.trim() && !isTyping ? "0 12px 28px rgba(125,29,46,0.28)" : "none",
                  }}
                  aria-label="Senden"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            <p className="mt-2 text-center text-[11px] text-[#7d6f68]">
              LU kann Fehler machen. Überprüfe wichtige Informationen.
            </p>
            <div className="mt-1 flex justify-center gap-3 text-[11px] text-[#7d6f68]">
              <button className="hover:text-[#7d1d2e]">Datenschutz</button>
              <span>|</span>
              <button className="hover:text-[#7d1d2e]">Nutzungsbedingungen</button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        textarea::-webkit-scrollbar { display: none; }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
