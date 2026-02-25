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
      className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-[0.2em]
        disabled:opacity-50 transition-all shadow-xl active:scale-[0.98] mt-4"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Salvataggio..." : label}
    </button>
  );
}

export default function AddBookForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createBook, null);
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [status, setStatus]   = useState("TO_READ");
  const [formats, setFormats] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<GoogleBookResult[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [currentBook, setCurrentBook] = useState<Partial<GoogleBookResult>>({
    title: "", author: "", googleId: "", isbn: "", publisher: "", publishedDate: "", language: "", pageCount: 0, coverUrl: "", description: "", categories: []
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setShowResults(false); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(data);
        setShowResults(data.length > 0);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const selectBook = (book: GoogleBookResult) => {
    setCurrentBook(book);
    setQuery(book.title);
    setShowResults(false);
  };

  const handleBulkAdd = async () => {
    setBulkLoading(true);
    try {
      const res = await createBooksBulk(bulkSelection.map(s => ({ ...s, status: status as BookStatus, formats: formats.join(",") })));
      if (res.success > 0) { onSuccess?.(); router.refresh(); }
    } finally { setBulkLoading(false); }
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onSuccess?.();
    }
  }, [state?.success, router, onSuccess]);

  const toggleFormat = (f: string) => setFormats(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  return (
    <>
    {showScanner && <BarcodeScanner onDetected={(i) => { handleSearch(i); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
    
    <div className="flex flex-col gap-8 pb-12 animate-fade-in">
      
      {/* 1. Ricerca */}
      <div ref={containerRef} className="relative p-6 rounded-[2rem] bg-white/5 border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Inserimento Rapido</p>
          <button type="button" onClick={() => setShowScanner(true)} className="text-[10px] font-bold text-amber-500 uppercase border-b border-amber-500/20">Usa Scanner Barcode</button>
        </div>
        <div className="relative">
          <Input value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Cerca titolo o incolla ISBN..." className="!rounded-2xl" />
          {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 animate-pulse uppercase">Ricerca...</div>}
        </div>

        {showResults && (
          <ul className="absolute z-50 w-[calc(100%-3rem)] mt-2 rounded-2xl shadow-2xl border overflow-hidden"
            style={{ background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 15%, transparent)" }}>
            {results.map((b) => (
              <li key={b.googleId} onClick={() => selectBook(b)} className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5 border-b last:border-0 border-white/5 transition-all">
                {b.coverUrl ? <Image src={b.coverUrl} alt="" width={32} height={44} unoptimized className="rounded shadow-sm" /> : <div className="w-8 h-11 bg-white/10 rounded" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate leading-tight" style={{ color: "var(--fg-primary)" }}>{b.title}</p>
                    {b.language === "it" && <span className="text-[9px] font-black bg-emerald-500 text-black px-1 rounded-sm flex-shrink-0">IT</span>}
                  </div>
                  <p className="text-xs opacity-50 truncate">{b.author}</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setBulkSelection(p => [...p, b]); setShowResults(false); }} className="text-[10px] font-black text-blue-400 uppercase p-2">+</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2. Selezione Serie */}
      {bulkSelection.length > 0 && (
        <div className="p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/20 shadow-xl space-y-4">
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest text-center">Selezione Multipla ({bulkSelection.length})</p>
          <div className="flex flex-wrap gap-2">
            {bulkSelection.map(s => (
              <div key={s.googleId} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold">
                <span className="truncate max-w-[100px]">{s.title}</span>
                <button onClick={() => setBulkSelection(p => p.filter(x => x.googleId !== s.googleId))} className="text-red-400">✕</button>
              </div>
            ))}
          </div>
          {bulkSelection.length > 1 && (
            <button onClick={handleBulkAdd} disabled={bulkLoading} className="w-full py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-xl">
              {bulkLoading ? "Caricamento..." : "Aggiungi tutti come serie"}
            </button>
          )}
        </div>
      )}

      {/* 3. Form Integrale */}
      <form action={formAction} className="flex flex-col gap-8">
        <input type="hidden" name="googleId"      value={currentBook.googleId ?? ""} />
        <input type="hidden" name="coverUrl"      value={currentBook.coverUrl ?? ""} />
        <input type="hidden" name="isbn"          value={currentBook.isbn ?? ""} />
        <input type="hidden" name="publisher"     value={currentBook.publisher ?? ""} />
        <input type="hidden" name="publishedDate" value={currentBook.publishedDate ?? ""} />
        <input type="hidden" name="language"      value={currentBook.language ?? ""} />
        <input type="hidden" name="pageCount"     value={currentBook.pageCount ?? ""} />
        <input type="hidden" name="description"   value={currentBook.description ?? ""} />
        <input type="hidden" name="formats"       value={formats.join(",")} />

        <div className="flex gap-6 items-center p-6 rounded-[2rem] border border-amber-500/10 shadow-inner bg-white/[0.02]">
          {currentBook.coverUrl ? (
            <Image src={currentBook.coverUrl} alt="" width={50} height={70} unoptimized className="rounded-lg shadow-2xl" />
          ) : (
            <div className="w-12 h-16 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[8px] opacity-20">COPERTINA</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase opacity-20 tracking-[0.2em] mb-1">Dettagli libro</p>
            <p className="text-base font-bold text-amber-500 truncate leading-tight">{currentBook.title || "Inserisci Titolo..."}</p>
            <p className="text-xs opacity-50 truncate mt-1">{currentBook.author || "Autore sconosciuto"}</p>
          </div>
        </div>

        <div className="space-y-6">
          <FormField label="Titolo del libro *" error={state?.fieldErrors?.title}>
            <Input name="title" defaultValue={currentBook.title} placeholder="..." error={state?.fieldErrors?.title} />
          </FormField>
          <FormField label="Autore *" error={state?.fieldErrors?.author}>
            <Input name="author" defaultValue={currentBook.author} placeholder="..." error={state?.fieldErrors?.author} />
          </FormField>

          {/* RIGA STATO */}
          <FormField label="Stato della lettura" error={state?.fieldErrors?.status}>
            <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </FormField>

          {/* RIGA VALUTAZIONE (SOTTO STATO) */}
          <FormField label="Valutazione Personale (Stelle)" error={state?.fieldErrors?.rating}>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <StarRating name="rating" defaultValue={0} size="md" />
            </div>
          </FormField>

          <FormField label="Tag / Categorie" error={state?.fieldErrors?.tags}>
            <Input name="tags" defaultValue={currentBook.categories?.join(", ")} placeholder="Es. narrativa, storico..." />
          </FormField>

          <FormField label="Formato Disponibile">
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => toggleFormat(value)}
                  className={`text-[10px] px-4 py-2 rounded-full border font-black uppercase transition-all duration-300
                    ${formats.includes(value) ? 'bg-amber-500 text-black border-amber-500 shadow-lg' : 'opacity-30 border-white/10 hover:opacity-100'}`}>
                  {label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Note e Impressioni">
            <Textarea name="comment" placeholder="Perché vuoi leggerlo?" className="!min-h-[100px]" />
          </FormField>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-20 mb-6 text-center">Informazioni Cronologiche</p>
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Data Acquisto">
                <Input name="purchasedAt" type="date" />
              </FormField>
              {status === "READ" && (
                <FormField label="Data Fine">
                  <Input name="finishedAt" type="date" />
                </FormField>
              )}
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center animate-shake">
            {state.error}
          </div>
        )}
        
        <SubmitButton label="Aggiungi alla Libreria" />
      </form>
    </div>
    </>
  );
}
