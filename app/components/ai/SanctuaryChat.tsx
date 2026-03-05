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
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // #58, #163: Caricamento cronologia iniziale
  useEffect(() => {
    async function loadHistory() {
      const history = await getChatHistory();
      setInitialMessages(history as Message[]);
      setLoadingHistory(false);
    }
    loadHistory();
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: '/api/chat',
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
    onError: (e) => console.error("Chat Error:", e)
  });

  // #163: Sincronizza messaggi caricati asincronamente
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

  const handleClear = async () => {
    if (confirm("Vuoi davvero cancellare tutta la cronologia della chat?")) {
      await clearChatHistory();
      setMessages([]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95"
        title="Sanctuary Chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full md:w-96 bg-white border-r border-slate-200 shadow-2xl flex flex-col animate-slide-in-left">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-display font-bold text-lg text-slate-800">Sanctuary Chat</h2>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClear} 
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Pulisci cronologia"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50 scroll-smooth">
            {loadingHistory && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            )}
            {!loadingHistory && messages.length === 0 && (
              <p className="text-center text-slate-400 text-xs uppercase font-black tracking-widest mt-10 opacity-50">
                Inizia una conversazione
              </p>
            )}
            {messages.map((m: Message) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all
                  ${m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {/* #69: Typing indicator */}
            {isLoading && (
              <div className="text-slate-400 text-xs italic flex items-center gap-2 animate-fade-in">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                L&apos;AI sta scrivendo...
              </div>
            )}
            {error && (
              <div className="text-red-500 text-xs flex flex-col gap-2 bg-red-50 p-3 rounded-xl border border-red-200">
                <div className="flex items-center gap-1 font-bold">
                  <AlertCircle className="w-4 h-4" /> Errore
                </div>
                {/* #12: Nascondiamo errori troppo tecnici qui */}
                <span className="opacity-80">Si è verificato un problema con la connessione AI.</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white">
            <div className="relative">
              <input 
                value={input} onChange={handleInputChange} placeholder="Parlami di un libro o di te..."
                className="w-full bg-slate-100 border border-slate-200 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-1.5 p-2 bg-indigo-600 rounded-full text-white disabled:opacity-50 hover:bg-indigo-500 transition-all active:scale-90">
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
