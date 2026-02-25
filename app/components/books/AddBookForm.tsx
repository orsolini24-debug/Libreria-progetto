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
import { FormField, Input, Select } from "@/app/components/ui/FormField";
import { StarRating } from "./StarRating";

const BarcodeScanner = dynamic(
  () => import("./BarcodeScanner").then((m) => ({ default: m.BarcodeScanner })),
  { ssr: false }
);

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest
        disabled:opacity-50 transition-all shadow-lg active:scale-95 mt-2"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Salvataggio…" : label}
    </button>
  );
}

export default function AddBookForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createBook, null);
  
  // Gestione selezione multipla
  const [selection, setSelection] = useState<GoogleBookResult[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [status, setStatus]   = useState("TO_READ");
  const [formats, setFormats] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{success: number, skipped: number} | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleQueryChange = useCallback(async (value: string) => {
    setQuery(value);
    if (value.length < 2) { setResults([]); setShowResults(false); return; }
    
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data);
      setShowResults(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
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
      router.refresh();
      onSuccess?.();
    }
  }, [state?.success, router, onSuccess]);

  function addToSelection(book: GoogleBookResult) {
    if (selection.find(s => s.googleId === book.googleId)) return;
    setSelection(prev => [...prev, book]);
    setShowResults(false);
    setQuery("");
  }

  function removeFromSelection(id: string) {
    setSelection(prev => prev.filter(s => s.googleId !== id));
  }

  async function handleBulkAdd() {
    setBulkLoading(true);
    try {
      const res = await createBooksBulk(selection.map(s => ({
        ...s,
        status: status as BookStatus,
        formats: formats.join(",")
      })));
      setBulkResult(res);
      if (res.success > 0) {
        setTimeout(() => {
          onSuccess?.();
          router.refresh();
        }, 2000);
      }
    } finally {
      setBulkLoading(false);
    }
  }

  // Cerca serie basandosi sul primo autore o sul titolo del primo libro selezionato
  async function expandSeries() {
    if (selection.length === 0) return;
    const base = selection[0];
    const seriesQuery = base.title.split(":")[0].trim();
    setQuery(seriesQuery);
    handleQueryChange(seriesQuery);
  }

  return (
    <>
    {showScanner && <BarcodeScanner onDetected={(i) => { setQuery(i); handleQueryChange(i); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
    
    <div className="flex flex-col gap-6 pb-8">
      {/* Search & Selector */}
      <div ref={containerRef} className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-60">Ricerca Digitale</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowScanner(true)} className="text-[10px] font-bold text-amber-500 uppercase">Barcode</button>
            {selection.length > 0 && (
              <button type="button" onClick={expandSeries} className="text-[10px] font-bold text-blue-400 uppercase">Espandi Serie</button>
            )}
          </div>
        </div>
        <Input 
          value={query} 
          onChange={(e) => handleQueryChange(e.target.value)} 
          placeholder="Cerca un libro o una serie..."
          autoComplete="off"
        />
        
        {showResults && (
          <ul className="absolute z-50 w-full mt-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border"
            style={{ 
              background: "var(--bg-elevated)", 
              borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)" 
            }}>
            {results.map((book) => (
              <li key={book.googleId} onClick={() => addToSelection(book)}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5 transition-all border-b last:border-0"
                style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 10%, transparent)" }}>
                {book.coverUrl ? (
                  <Image src={book.coverUrl} alt="" width={32} height={44} unoptimized className="rounded shadow-md" />
                ) : (
                  <div className="w-8 h-11 rounded flex items-center justify-center text-[8px] opacity-30" style={{ background: "var(--bg-input)" }}>NO IMG</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate leading-tight" style={{ color: "var(--fg-primary)" }}>{book.title}</p>
                    {book.language === "it" && <span className="text-[9px] font-black bg-emerald-500 text-black px-1 rounded-sm">IT</span>}
                  </div>
                  <p className="text-xs opacity-50 truncate" style={{ color: "var(--fg-muted)" }}>{book.author}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selection List */}
      {selection.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Libri da aggiungere ({selection.length})</p>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-hide">
            {selection.map((book) => (
              <div key={book.googleId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group">
                {book.coverUrl && <Image src={book.coverUrl} alt="" width={24} height={34} unoptimized className="rounded" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{book.title}</p>
                  <p className="text-[10px] opacity-40 truncate">{book.author}</p>
                </div>
                <button onClick={() => removeFromSelection(book.googleId)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Feedback */}
      {bulkResult && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 animate-fade-in">
          Operazione completata: {bulkResult.success} aggiunti, {bulkResult.skipped} saltati.
        </div>
      )}

      {/* Main Action or Bulk Action */}
      {selection.length > 1 ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stato Serie">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Formato">
              <div className="flex flex-wrap gap-1">
                {FORMAT_OPTIONS.map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setFormats(prev => prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value])}
                    className={`text-[8px] px-2 py-1 rounded-full border font-black uppercase transition-all
                      ${formats.includes(value) ? 'bg-amber-500 text-black border-amber-500' : 'opacity-40 border-white/10'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </FormField>
          </div>
          <button
            onClick={handleBulkAdd}
            disabled={bulkLoading}
            className="w-full py-3 rounded-xl bg-white text-black text-sm font-bold uppercase tracking-widest shadow-xl active:scale-[0.98] disabled:opacity-20"
          >
            {bulkLoading ? "Caricamento Serie..." : `Aggiungi Serie (${selection.length} libri)`}
          </button>
        </div>
      ) : selection.length === 1 ? (
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="googleId" value={selection[0].googleId} />
          <input type="hidden" name="coverUrl" value={selection[0].coverUrl} />
          <input type="hidden" name="isbn" value={selection[0].isbn} />
          <input type="hidden" name="title" value={selection[0].title} />
          <input type="hidden" name="author" value={selection[0].author} />
          <input type="hidden" name="publisher" value={selection[0].publisher} />
          <input type="hidden" name="publishedDate" value={selection[0].publishedDate} />
          <input type="hidden" name="language" value={selection[0].language} />
          <input type="hidden" name="pageCount" value={selection[0].pageCount} />
          <input type="hidden" name="description" value={selection[0].description} />
          <input type="hidden" name="formats" value={formats.join(",")} />

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stato">
              <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Voto">
              <div className="pt-1"><StarRating name="rating" defaultValue={0} size="md" /></div>
            </FormField>
          </div>

          <FormField label="Formato">
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setFormats(prev => prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value])}
                  className={`text-[10px] px-3 py-1.5 rounded-full border font-black uppercase transition-all
                    ${formats.includes(value) ? 'bg-amber-500 text-black border-amber-500' : 'opacity-40 border-white/10'}`}>
                  {label}
                </button>
              ))}
            </div>
          </FormField>

          {state?.error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake">
              {state.error}
            </div>
          )}
          
          <SubmitButton label="Aggiungi Libro" />
        </form>
      ) : (
        <p className="text-xs text-center opacity-30 italic py-8 border-2 border-dashed border-white/5 rounded-2xl font-reading">
          Cerca un libro per iniziare
        </p>
      )}
    </div>
    </>
  );
}
