"use client";

import { useState, useEffect } from "react";
import { togglePublicShelf } from "@/app/lib/user-actions";
import { Globe, Lock, Copy, Check, AlertCircle } from "lucide-react";

interface Props {
  userId: string;
  isPublic: boolean;
}

export function ShelfSharingControl({ userId, isPublic: initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicUrl = `${origin}/scaffale/${userId}`;

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await togglePublicShelf(!isPublic);
      if (res.success) {
        setIsPublic(!isPublic);
      } else {
        setError(res.error || "Errore imprevisto");
      }
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 shadow-xl mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isPublic ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-white/40'}`}>
            {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--fg-primary)" }}>
              Visibilità Libreria
            </h3>
            <p className="text-[10px] opacity-50 uppercase font-bold tracking-widest">
              {isPublic ? "Pubblica — Chiunque abbia il link può vedere i tuoi libri" : "Privata — Solo tu puoi vedere i tuoi libri"}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
            ${isPublic ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
        >
          {loading ? "..." : isPublic ? "Rendi Privata" : "Rendi Pubblica"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-wider animate-shake">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isPublic && (
        <div className="mt-4 flex gap-2 animate-fade-in">
          <div className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/5 text-xs truncate opacity-60 font-mono">
            {publicUrl}
          </div>
          <button
            onClick={copyToClipboard}
            className="px-4 rounded-xl bg-white text-black flex items-center justify-center transition-all active:scale-95 shadow-lg"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
