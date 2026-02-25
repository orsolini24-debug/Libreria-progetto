"use client";

import { useState, useEffect } from "react";
import { Sparkles, Trophy, Share2 } from "lucide-react";
import { getProactiveInsights, getReadingStreak } from "@/app/lib/ai-actions";

export function AICompanion() {
  const [insight, setInsight] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [insightRes, streakRes] = await Promise.all([
          getProactiveInsights(),
          getReadingStreak(),
        ]);
        setInsight(insightRes);
        setStreak(streakRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="glass-sm p-5 rounded-2xl mb-8 border border-white/5 animate-pulse">
        <div className="h-4 bg-white/5 w-1/3 rounded-full mb-3" />
        <div className="h-10 bg-white/5 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      {/* Proactive Insight Card */}
      <div className="md:col-span-2 relative group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="glass rounded-[2rem] p-6 border border-white/10 relative z-10 flex flex-col justify-between h-full min-h-[140px]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">Gemini Insight</span>
          </div>
          <p className="font-display text-base font-bold text-white/90 leading-relaxed mb-4">
            {insight || "La tua libreria sta crescendo. Aggiungi nuove citazioni o sessioni di lettura per sbloccare analisi proattive!"}
          </p>
          <div className="flex gap-2">
            <button className="text-[9px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all">
              Segui consiglio ↗
            </button>
            <button className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/40 hover:text-white/80">
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Streak & Gamification Card */}
      <div className="group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="glass rounded-[2rem] p-6 border border-white/10 relative z-10 flex flex-col items-center justify-center text-center h-full">
          <div className="relative mb-3">
            <Trophy className={`w-10 h-10 ${streak > 0 ? "text-amber-500" : "text-white/10"} transition-all`} />
            {streak > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className="font-display text-4xl font-black text-white tracking-tighter mb-1">
            {streak}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">giorni consecutivi</p>
          <p className="text-[9px] mt-2 italic opacity-60">
            {streak === 0 ? "Inizia una sessione!" : streak < 3 ? "Ottimo inizio!" : "Sei inarrestabile!"}
          </p>
        </div>
      </div>
    </div>
  );
}
