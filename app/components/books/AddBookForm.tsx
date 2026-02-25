"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createBook, createBooksBulk } from "@/app/lib/book-actions";
import type { GoogleBookResult } from "@/app/lib/api/google-books";
import { STATUS_OPTIONS, FORMAT_OPTIONS } from "@/app/lib/constants";
import { BookStatus } from "@/app/generated/prisma/client";
import { StarRating } from "./StarRating";

const BarcodeScanner = dynamic(
  () => import("./BarcodeScanner").then((m) => ({ default: m.BarcodeScanner })),
  { ssr: false }
);

/* ── STILI PREMIUM ORIGINALI ─────────────────────────────────────────── */
const fieldClass = `w-full border rounded-xl px-3 py-2.5 text-sm
  focus:outline-none focus:ring-2 transition-all duration-200`;

const fieldStyle = {
  background: "var(--bg-input)",
  borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
  color: "var(--fg-primary)",
};

const labelStyle = {
  color: "var(--fg-subtle)",
  letterSpacing: "0.08em",
};

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-widest
        disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 mt-4"
      style={{
        background: "var(--accent)",
        color: "var(--accent-on)",
      }}
    >
      {pending ? "Salvataggio in corso…" : label}
    </button>
  );
}

export default function AddBookForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createBook, null);
  
  const [selection, setSelection] = useState<GoogleBookResult[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [status, setStatus]   = useState("TO_READ");
  const [formats, setFormats] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setShowResults(false);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data: GoogleBookResult[] = res.ok ? await res.json() : [];
        setResults(data);
        setShowResults(data.length > 0);
        if (data.length === 0) setSearchError("noresults");
      } catch {
        setSearchError("Errore di connessione.");
      } finally {
        setSearching(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setShowResults(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (state?.success) {
      setSelection([]); setQuery(""); setResults([]);
      setStatus("TO_READ"); setFormats([]);
      router.refresh();
      onSuccess?.();
    }
  }, [state?.success, router, onSuccess]);

  function addToSelection(book: GoogleBookResult) {
    if (selection.find(s => s.googleId === book.googleId)) return;
    setSelection([book, ...selection.slice(0, 9)]); // Limita a 10 per UI
    setShowResults(false);
    setQuery("");
  }

  function removeFromSelection(id: string) {
    setSelection(prev => prev.filter(s => s.googleId !== id));
  }

  async function handleIsbnDetected(isbn: string) {
    setShowScanner(false);
    setSearching(true);
    setQuery(isbn);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(`isbn:${isbn}`)}`);
      const data: GoogleBookResult[] = res.ok ? await res.json() : [];
      if (data.length >= 1) addToSelection(data[0]);
      else setSearchError("ISBN non trovato.");
    } finally {
      setSearching(false);
    }
  }

  async function handleBulkAdd() {
    setBulkLoading(true);
    try {
      const res = await createBooksBulk(selection.map(s => ({
        ...s,
        status: status as BookStatus,
        formats: formats.join(",")
      })));
      if (res.success > 0) {
        onSuccess?.();
        router.refresh();
      }
    } finally {
      setBulkLoading(false);
    }
  }

  async function expandSeries() {
    if (selection.length === 0) return;
    const base = selection[0];
    const seriesQuery = base.title.split(":")[0].trim();
    setQuery(seriesQuery);
    handleQueryChange(seriesQuery);
  }

  const toggleFormat = (fmt: string) => {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
  };

  const selected = selection[0];
  const key = selected?.googleId ?? "manual";
  const showRating = status === "READ";
  const showReminder = status === "READING";
  const autoTags = selected?.categories?.slice(0, 5).join(", ") ?? "";

  return (
    <>
    {showScanner && <BarcodeScanner onDetected={handleIsbnDetected} onClose={() => setShowScanner(false)} />}
    
    <div className="flex flex-col gap-6 pb-12">
      
      {/* ── RICERCA E SCANNER ─────────────────────────────────────────── */}
      <div ref={containerRef} className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.12em]" style={labelStyle}>
            Cerca Libro o Serie
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowScanner(true)} 
              className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter border-b border-amber-500/30">
              Barcode Scan
            </button>
            {selection.length > 0 && (
              <button type="button" onClick={expandSeries} 
                className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter border-b border-blue-400/30">
                Espandi Serie
              </button>
            )}
          </div>
        </div>
        <input 
          type="text"
          value={query} 
          onChange={(e) => handleQueryChange(e.target.value)} 
          placeholder="Titolo, autore o ISBN..."
          className={fieldClass}
          style={fieldStyle}
          autoComplete="off"
        />
        {searching && <div className="absolute right-4 top-[38px] animate-pulse text-[10px] font-bold opacity-40 uppercase">Ricerca...</div>}
        
        {showResults && (
          <ul className="absolute z-50 w-full mt-2 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10"
            style={{ background: "var(--bg-elevated)" }}>
            {results.map((book) => (
              <li key={book.googleId} onClick={() => addToSelection(book)}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5 transition-all border-b last:border-0"
                style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 10%, transparent)" }}>
                {book.coverUrl ? (
                  <Image src={book.coverUrl} alt="" width={32} height={44} unoptimized className="rounded shadow-sm" />
                ) : (
                  <div className="w-8 h-11 rounded opacity-20" style={{ background: "var(--fg-subtle)" }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--fg-primary)" }}>{book.title}</p>
                    {book.language === "it" && <span className="text-[9px] font-black bg-emerald-500 text-black px-1 rounded-sm flex-shrink-0">IT</span>}
                  </div>
                  <p className="text-xs opacity-50 truncate">{book.author}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── MODALITÀ SERIE (BULK) ─────────────────────────────────────── */}
      {selection.length > 1 && (
        <div className="space-y-3 p-5 rounded-2xl border border-blue-500/20 shadow-2xl animate-fade-in"
          style={{ background: "color-mix(in srgb, #3b82f6 5%, var(--bg-elevated))" }}>
          <p className="text-[9px] font-black uppercase text-blue-400 tracking-[0.2em] text-center mb-4">Modalità Collezione ({selection.length} volumi)</p>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
            {selection.map((book) => (
              <div key={book.googleId} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                <p className="text-xs font-bold truncate flex-1 pr-4">{book.title}</p>
                <button onClick={() => removeFromSelection(book.googleId)} className="text-red-400 text-xs hover:scale-110 transition-transform">✕</button>
              </div>
            ))}
          </div>
          <button
            onClick={handleBulkAdd}
            disabled={bulkLoading}
            className="w-full py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-20 shadow-xl"
          >
            {bulkLoading ? "Elaborazione..." : "Aggiungi Collezione"}
          </button>
        </div>
      )}

      {/* ── FORM DETTAGLIATO ─────────────────────────────────────────── */}
      {selection.length > 0 && (
        <form action={formAction} className="flex flex-col gap-6 animate-fade-up">
          {/* Metadata Hidden */}
          <input type="hidden" name="googleId"      value={selected.googleId} />
          <input type="hidden" name="coverUrl"      value={selected.coverUrl} />
          <input type="hidden" name="isbn"          value={selected.isbn} />
          <input type="hidden" name="publisher"     value={selected.publisher} />
          <input type="hidden" name="publishedDate" value={selected.publishedDate} />
          <input type="hidden" name="language"      value={selected.language} />
          <input type="hidden" name="pageCount"     value={selected.pageCount} />
          <input type="hidden" name="description"   value={selected.description} />
          <input type="hidden" name="formats"       value={formats.join(",")} />

          {/* Anteprima Selezionato */}
          <div className="flex gap-5 items-center p-4 rounded-2xl border border-amber-500/20 shadow-inner"
            style={{ background: "color-mix(in srgb, var(--accent) 5%, var(--bg-elevated))" }}>
            {selected.coverUrl && <Image src={selected.coverUrl} alt="" width={44} height={62} unoptimized className="rounded-md shadow-xl" />}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Dati recuperati</p>
              <p className="text-sm font-bold text-amber-500 truncate leading-tight">{selected.title}</p>
              <p className="text-[11px] opacity-60 truncate mt-0.5 font-medium">{selected.author}</p>
            </div>
            {selection.length === 1 && (
              <button type="button" onClick={() => setSelection([])} className="text-xs opacity-20 hover:opacity-100 transition-opacity">✕</button>
            )}
          </div>

          <div className="space-y-5">
            {/* Titolo e Autore */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Titolo del libro *</label>
                <input name="title" key={key + "-t"} defaultValue={selected.title} required className={fieldClass} style={fieldStyle} />
                {state?.fieldErrors?.title && <p className="text-[10px] text-red-400 mt-1 font-bold">{state.fieldErrors.title[0]}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Autore *</label>
                <input name="author" key={key + "-a"} defaultValue={selected.author} required className={fieldClass} style={fieldStyle} />
                {state?.fieldErrors?.author && <p className="text-[10px] text-red-400 mt-1 font-bold">{state.fieldErrors.author[0]}</p>}
              </div>
            </div>

            {/* Stato e Voto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Stato</label>
                <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass} style={fieldStyle}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Valutazione</label>
                <div className="pt-1"><StarRating name="rating" defaultValue={0} size="md" /></div>
              </div>
            </div>

            {/* Suggerimento Reading */}
            {showReminder && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-500/20 text-[11px] font-medium"
                style={{ background: "color-mix(in srgb, #3b82f6 10%, var(--bg-elevated))", color: "#93c5fd" }}>
                <span className="text-lg">💡</span>
                <span>Potrai registrare il tuo progresso pagina per pagina dopo l&apos;aggiunta.</span>
              </div>
            )}

            {/* Tag e Formati */}
            <div>
              <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Tag e Categorie</label>
              <input name="tags" key={key + "-tags"} defaultValue={autoTags} placeholder="Es. narrativa, thriller, classici..." className={fieldClass} style={fieldStyle} />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Formato posseduto</label>
              <div className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => toggleFormat(value)}
                    className={`text-[10px] px-3.5 py-2 rounded-full border font-black uppercase transition-all duration-200
                      ${formats.includes(value) ? 'bg-amber-500 text-black border-amber-500' : 'opacity-40 border-white/10 hover:opacity-100'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Note iniziali</label>
              <textarea name="comment" rows={2} placeholder="Perché vuoi leggerlo? Impressioni..." className={`${fieldClass} resize-none`} style={fieldStyle}></textarea>
            </div>

            {/* Date */}
            <div className="pt-2 border-t border-white/5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-20">Cronologia</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Acquistato il</label>
                  <input name="purchasedAt" type="date" className={fieldClass} style={fieldStyle} />
                </div>
                {status === "READ" && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-2" style={labelStyle}>Finito il</label>
                    <input name="finishedAt" type="date" className={fieldClass} style={fieldStyle} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {state?.error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake text-center">
              {state.error}
            </div>
          )}
          
          <SubmitButton label="Aggiungi alla Libreria" />
        </form>
      )}

      {selection.length === 0 && (
        <div className="py-24 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center opacity-20 select-none">
          <span className="text-4xl mb-4">📖</span>
          <p className="text-sm font-reading italic tracking-wide">Cerca un titolo per iniziare la magia</p>
        </div>
      )}
    </div>
    </>
  );
}
