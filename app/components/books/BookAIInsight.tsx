"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { getBookInsights } from "@/app/lib/ai-actions";

export function BookAIInsight({ bookId }: { bookId: string }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsight() {
      const res = await getBookInsights(bookId);
      setInsight(res);
      setLoading(false);
    }
    fetchInsight();
  }, [bookId]);

  if (loading || !insight) return null;

  return (
    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3 animate-fade-in">
      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 mb-1">Gemini Thought</p>
        <p className="text-xs italic leading-relaxed opacity-80">{insight}</p>
      </div>
    </div>
  );
}
