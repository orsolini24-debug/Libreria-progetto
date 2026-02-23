"use client";

import { useState, useEffect } from "react";
import type { Book } from "@/app/generated/prisma/client";

const YEAR = new Date().getFullYear();

function motivation(pct: number): string {
  if (pct === 0)   return "Inizia la tua avventura letteraria!";
  if (pct < 25)   return "Ottimo inizio — continua così.";
  if (pct < 50)   return "Buon ritmo, sei sulla strada giusta.";
  if (pct < 75)   return "Più della metà completata!";
  if (pct < 100)  return "Quasi arrivato/a — un ultimo sforzo.";
  return "Obiettivo raggiunto! 🎉";
}

export function ReadingChallenge({ books }: { books: Book[] }) {
  const [goal,     setGoal]     = useState(12);
  const [editing,  setEditing]  = useState(false);
  const [inputVal, setInputVal] = useState("12");
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("readingGoal");
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n > 0) { setGoal(n); setInputVal(String(n)); }
    }
  }, []);

  const booksThisYear = books.filter(
    (b) => b.status === "READ" && new Date(b.updatedAt).getFullYear() === YEAR
  ).length;

  const pct = Math.min(100, Math.round((booksThisYear / goal) * 100));

  function saveGoal() {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      localStorage.setItem("readingGoal", String(n));
    }
    setEditing(false);
  }

  // Evita hydration mismatch (localStorage lato client)
  if (!mounted) return null;

  return (
    <div className="mb-6 px-4 py-3.5 rounded-xl border border-amber-900/25 bg-amber-950/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <h3 className="font-display text-sm font-semibold text-amber-200/80">
            Obiettivo {YEAR}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <input
                type="number" min="1" max="365"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  saveGoal();
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                className="w-14 text-center text-sm bg-stone-800 border border-amber-700/60
                  text-amber-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-600/40"
              />
              <button onClick={saveGoal}           className="text-xs text-amber-500 hover:text-amber-300 transition-colors">✓</button>
              <button onClick={() => setEditing(false)} className="text-xs text-stone-600 hover:text-stone-400 transition-colors">✕</button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-stone-600 hover:text-amber-500 transition-colors flex items-center gap-1"
              title="Modifica obiettivo"
            >
              <span>✏️</span> {goal} libri
            </button>
          )}
        </div>
      </div>

      {/* Barra progresso */}
      <div className="relative h-2.5 bg-stone-800/80 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct >= 100
              ? "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)"
              : "linear-gradient(90deg, #92400e, #c8860a, #d97706)",
          }}
        />
        {pct > 5 && pct < 100 && (
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: 0,
              width: `${pct}%`,
              background: "linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.12) 70%, transparent 100%)",
              animation: "shimmer 2.5s infinite",
              backgroundSize: "200% 100%",
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="font-reading text-xs text-stone-500 italic">{motivation(pct)}</p>
        <p className="text-xs font-semibold text-amber-500/70 tabular-nums">
          {booksThisYear}/{goal} — {pct}%
        </p>
      </div>
    </div>
  );
}
