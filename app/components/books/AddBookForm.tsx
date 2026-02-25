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
import { FormField, Input, Select, Textarea } from "@/app/components/ui/FormField";
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
  
  const [selection, setSelection] = useState<GoogleBookResult[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [status, setStatus]   = useState("TO_READ");
  const [formats, setFormats] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
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

  const selected = selection[0];
  const key = selected?.googleId ?? "manual";
  const autoTags = selected?.categories?.slice(0, 5).join(", ") ?? "";

  return (
    <>
    {showScanner && <BarcodeScanner onDetected={(i) => { setQuery(i); handleQueryChange(i); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
    
    <div className="flex flex-col gap-6 pb-8">
      {/* Ricerca */}
      <div ref={containerRef} className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-60">Cerca Libro o Serie</label>
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
          placeholder="Titolo, autore o serie..."
          autoComplete="off"
        />
        
        {showResults && (
          <ul className="absolute z-50 w-full mt-2 rounded-2xl shadow-2xl overflow-hidden border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-input)" }}>
            {results.map((book) => (
              <li key={book.googleId} onClick={() => addToSelection(book)}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5 transition-all border-b last:border-0 border-white/5">
                {book.coverUrl ? (
                  <Image src={book.coverUrl} alt="" width={32} height={44} unoptimized className="rounded" />
                ) : (
                  <div className="w-8 h-11 bg-white/5 rounded" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate leading-tight">{book.title}</p>
                  <p className="text-xs opacity-50 truncate">{book.author}</p>
                </div>
                {book.language === "it" && <span className="text-[9px] font-black bg-emerald-500 text-black px-1 rounded-sm">IT</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lista Selezione (per bulk) */}
      {selection.length > 1 && (
        <div className="space-y-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-[10px] font-bold uppercase text-blue-400 tracking-widest text-center">Modalità Serie ({selection.length} libri)</p>
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto scrollbar-hide">
            {selection.map((book) => (
              <div key={book.googleId} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                <p className="text-xs font-bold truncate flex-1 pr-2">{book.title}</p>
                <button onClick={() => removeFromSelection(book.googleId)} className="text-red-400 text-xs">✕</button>
              </div>
            ))}
          </div>
          <button
            onClick={handleBulkAdd}
            disabled={bulkLoading}
            className="w-full py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-20"
          >
            {bulkLoading ? "Aggiunta in corso..." : "Conferma Aggiunta Serie"}
          </button>
        </div>
      )}

      {/* Form Integrale (Singolo Libro o Primo della serie) */}
      {selection.length > 0 && (
        <form action={formAction} className="flex flex-col gap-5">
          {/* Hidden Fields per Google Metadata */}
          <input type="hidden" name="googleId"      value={selected.googleId} />
          <input type="hidden" name="coverUrl"      value={selected.coverUrl} />
          <input type="hidden" name="isbn"          value={selected.isbn} />
          <input type="hidden" name="publisher"     value={selected.publisher} />
          <input type="hidden" name="publishedDate" value={selected.publishedDate} />
          <input type="hidden" name="language"      value={selected.language} />
          <input type="hidden" name="pageCount"     value={selected.pageCount} />
          <input type="hidden" name="description"   value={selected.description} />
          <input type="hidden" name="formats"       value={formats.join(",")} />

          <div className="flex gap-4 items-center p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            {selected.coverUrl && <Image src={selected.coverUrl} alt="" width={40} height={56} unoptimized className="rounded shadow-md" />}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase opacity-40">Selezionato</p>
              <p className="text-sm font-bold text-amber-500 truncate">{selected.title}</p>
            </div>
            {selection.length === 1 && (
              <button type="button" onClick={() => setSelection([])} className="p-2 opacity-40 hover:opacity-100 transition-opacity">✕</button>
            )}
          </div>

          <FormField label="Titolo *" error={state?.fieldErrors?.title}>
            <Input name="title" key={key + "-t"} defaultValue={selected.title} error={state?.fieldErrors?.title} />
          </FormField>

          <FormField label="Autore *" error={state?.fieldErrors?.author}>
            <Input name="author" key={key + "-a"} defaultValue={selected.author} error={state?.fieldErrors?.author} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stato" error={state?.fieldErrors?.status}>
              <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Voto" error={state?.fieldErrors?.rating}>
              <div className="pt-1"><StarRating name="rating" defaultValue={0} size="md" /></div>
            </FormField>
          </div>

          <FormField label="Tag" error={state?.fieldErrors?.tags}>
            <Input name="tags" key={key + "-tags"} defaultValue={autoTags} placeholder="Generi, temi..." />
          </FormField>

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

          <FormField label="Note" error={state?.fieldErrors?.comment}>
            <Textarea name="comment" placeholder="Impressioni iniziali..." error={state?.fieldErrors?.comment} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data acquisto" error={state?.fieldErrors?.purchasedAt}>
              <Input name="purchasedAt" type="date" error={state?.fieldErrors?.purchasedAt} />
            </FormField>
            {status === "READ" && (
              <FormField label="Data fine" error={state?.fieldErrors?.finishedAt}>
                <Input name="finishedAt" type="date" error={state?.fieldErrors?.finishedAt} />
              </FormField>
            )}
          </div>

          {state?.error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake">
              {state.error}
            </div>
          )}
          
          <SubmitButton label="Aggiungi Libro" />
        </form>
      )}

      {selection.length === 0 && (
        <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-30">
          <p className="text-sm font-reading italic">Cerca un titolo per iniziare</p>
        </div>
      )}
    </div>
    </>
  );
}
