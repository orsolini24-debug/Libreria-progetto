"use client";
import { useChat, type Message } from "ai/react";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { getChatHistory, clearChatHistory } from "@/app/lib/chat-actions";

interface SanctuaryChatProps {
  currentBookId?: string;
}

export function SanctuaryChat({ currentBookId }: SanctuaryChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Carica la cronologia solo al primo apertura del pannello (lazy)
  useEffect(() => {
    if (!isOpen || historyLoaded) return;
    setLoadingHistory(true);
    async function loadHistory() {
      const history = await getChatHistory();
      setInitialMessages(history as Message[]);
      setLoadingHistory(false);
      setHistoryLoaded(true);
    }
    loadHistory();
  }, [isOpen, historyLoaded]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: "/api/chat",
    body: { currentBookId },
    initialMessages,
    fetch: async (url, options) => {
      const res = await fetch(url, options);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return res;
    },
    onError: (e) => console.error("Chat Error:", e),
  });

  // Sincronizza messaggi caricati asincronamente
  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleClear() {
    await clearChatHistory();
    setMessages([]);
    setShowClearConfirm(false);
  }

  function handleClose() {
    setIsOpen(false);
    setShowClearConfirm(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 p-4 rounded-full shadow-lg transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "var(--accent)",
          color: "var(--accent-on)",
          boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)",
        }}
        title="Sanctuary Chat"
        aria-label="Apri Sanctuary Chat"
        aria-expanded={isOpen}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-y-0 left-0 z-50 w-full md:w-96 flex flex-col shadow-2xl animate-slide-in-left"
          style={{
            background: "var(--bg-card)",
            borderRight: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Sanctuary Chat"
        >
          {/* Header */}
          <div
            className="p-4 border-b flex justify-between items-center shrink-0"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-display font-bold text-lg" style={{ color: "var(--fg-primary)" }}>
                Sanctuary Chat
              </h2>
            </div>

            <div className="flex items-center gap-1">
              {showClearConfirm ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: "var(--fg-subtle)" }}
                  >
                    Cancellare?
                  </span>
                  <button
                    onClick={handleClear}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                    style={{
                      background: "color-mix(in srgb, #ef4444 15%, transparent)",
                      border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)",
                      color: "#f87171",
                    }}
                  >
                    Sì
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:opacity-60"
                    style={{ color: "var(--fg-subtle)" }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 rounded-full transition-all hover:opacity-60"
                  style={{ color: "var(--fg-subtle)" }}
                  title="Pulisci cronologia"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 rounded-full transition-all hover:opacity-60"
                style={{ color: "var(--fg-subtle)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messaggi */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth"
            style={{ background: "var(--bg-page)" }}
          >
            {loadingHistory && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--fg-subtle)" }} />
              </div>
            )}
            {!loadingHistory && messages.length === 0 && (
              <p
                className="text-center text-xs uppercase font-black tracking-widest mt-10 opacity-50"
                style={{ color: "var(--fg-subtle)" }}
              >
                Inizia una conversazione
              </p>
            )}
            {messages.map((m: Message) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm"
                  style={
                    m.role === "user"
                      ? {
                          background: "var(--accent)",
                          color: "var(--accent-on)",
                          borderBottomRightRadius: "4px",
                        }
                      : {
                          background: "var(--bg-elevated)",
                          color: "var(--fg-primary)",
                          border: "1px solid color-mix(in srgb, var(--accent) 12%, transparent)",
                          borderBottomLeftRadius: "4px",
                        }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 animate-fade-in" style={{ color: "var(--fg-subtle)" }}>
                <div className="flex gap-1">
                  <span
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: "var(--accent)", animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: "var(--accent)", animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: "var(--accent)", animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-xs italic">L&apos;AI sta scrivendo...</span>
              </div>
            )}

            {error && (
              <div
                className="text-xs flex flex-col gap-2 p-3 rounded-xl border"
                style={{
                  background: "color-mix(in srgb, #ef4444 8%, var(--bg-elevated))",
                  borderColor: "color-mix(in srgb, #ef4444 25%, transparent)",
                  color: "#f87171",
                }}
              >
                <div className="flex items-center gap-1 font-bold">
                  <AlertCircle className="w-4 h-4" /> Errore
                </div>
                <span className="opacity-80">Si è verificato un problema con la connessione AI.</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t shrink-0"
            style={{
              background: "var(--bg-card)",
              borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
            }}
          >
            <div className="relative">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Parlami di un libro o di te..."
                aria-label="Messaggio per Sanctuary"
                className="w-full rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none transition-colors"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--fg-primary)",
                  border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1.5 p-2 rounded-full transition-all active:scale-90 disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--accent-on)" }}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
