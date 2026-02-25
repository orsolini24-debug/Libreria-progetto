"use client";
import { useState } from "react";
import { saveDailyCheckIn } from "@/app/lib/emotional-actions";
import { Sparkles, X } from "lucide-react";

export function GentleCheckIn() {
  const [isOpen, setIsOpen] = useState(true);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;
  if (saved) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await saveDailyCheckIn(content);
    setSaved(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4 animate-fade-in-up">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Check-in</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <p className="text-sm text-white/80 mb-3 font-medium">Come ti senti oggi? A cosa stai pensando?</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea 
          value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Scrivi liberamente..."
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-20"
        />
        <button type="submit" className="self-end bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-white/80 transition-all">
          Condividi
        </button>
      </form>
    </div>
  );
}