"use client";
import { useState, useEffect } from "react";
import { saveDailyCheckIn } from "@/app/lib/emotional-actions";
import { Sparkles, X, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "gentle-checkin-last-date";

function getTodayString() {
  return new Date().toISOString().slice(0, 10); // "2026-02-27"
}

export function GentleCheckIn() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    const lastDate = localStorage.getItem(STORAGE_KEY);
    if (lastDate !== getTodayString()) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, getTodayString());
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus('submitting');
    try {
      await saveDailyCheckIn(content);
      setStatus('success');
      localStorage.setItem(STORAGE_KEY, getTodayString());
      setTimeout(() => setIsOpen(false), 4000);
    } catch {
      setStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 lg:w-96 bg-[#0f111a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom-5 fade-in duration-500">
      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-4 gap-3 text-center animate-in fade-in zoom-in duration-300">
          <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-white/90">Pensiero custodito.</p>
          <p className="text-xs text-white/50">L&apos;AI terrà conto del tuo stato d&apos;animo. Apri la chat se vuoi parlarne.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-500/20 p-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Check-in Emotivo</span>
            </div>
            <button onClick={handleDismiss} className="text-white/30 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-white/90 mb-4 font-medium leading-relaxed">Come ti senti oggi? A cosa stai pensando?</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={status === 'submitting'}
              placeholder="Scrivi liberamente qui..."
              className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all resize-none h-24 placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={status === 'submitting' || !content.trim()}
              className="self-end bg-white text-black text-xs font-bold px-5 py-2.5 rounded-full hover:bg-white/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {status === 'submitting' ? 'Salvando...' : 'Condividi'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
