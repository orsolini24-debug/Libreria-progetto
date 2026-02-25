"use client";
import { useChat } from "ai/react";
import { useState } from "react";
import { MessageSquare, Send, X, AlertCircle } from "lucide-react";

export function SanctuaryChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    onError: (e) => console.error("Chat Error:", e)
  });

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-500 transition-all hover:scale-105"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full md:w-96 bg-white border-r border-slate-200 shadow-2xl flex flex-col animate-slide-in-left">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-display font-bold text-lg text-slate-800">Sanctuary Chat</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50">
            {messages.length === 0 && (
              <p className="text-center text-slate-400 text-sm italic mt-10">Sono qui per ascoltarti. Parlami del tuo momento o dei tuoi pensieri.</p>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-slate-400 text-xs italic flex items-center gap-2"><span className="animate-pulse">●</span> L&apos;AI sta riflettendo...</div>}
            {error && (
              <div className="text-red-500 text-xs flex items-center gap-1 bg-red-50 p-2 rounded">
                <AlertCircle className="w-3 h-3" /> Errore di connessione. Riprova.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white">
            <div className="relative">
              <input 
                value={input} onChange={handleInputChange} placeholder="Scrivi un pensiero..."
                className="w-full bg-slate-100 border border-slate-200 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-1.5 p-2 bg-indigo-600 rounded-full text-white disabled:opacity-50 hover:bg-indigo-500 transition-all">
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}