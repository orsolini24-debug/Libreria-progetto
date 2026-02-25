"use client";
import { useChat, type Message } from "ai/react";
import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";

export function SanctuaryChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({ api: '/api/chat' });

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-500 transition-all hover:scale-105"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full md:w-96 bg-[#0a0a0a] border-r border-white/10 shadow-2xl flex flex-col animate-slide-in-left">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#121212]">
            <h2 className="font-display font-bold text-lg">Sanctuary Chat</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 && (
              <p className="text-center text-white/40 text-sm italic mt-10">Sono qui per ascoltarti. Parlami del tuo momento o dei tuoi pensieri.</p>
            )}
            {messages.map((m: Message) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/10 text-white/90 rounded-bl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-white/40 text-xs italic">Sta riflettendo...</div>}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-[#121212]">
            <div className="relative">
              <input 
                value={input} onChange={handleInputChange} placeholder="Scrivi un pensiero..."
                className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-1.5 p-2 bg-indigo-500 rounded-full text-white disabled:opacity-50 hover:bg-indigo-400 transition-all">
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}