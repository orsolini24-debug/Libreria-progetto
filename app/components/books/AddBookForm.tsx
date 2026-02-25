"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createBook } from "@/app/lib/book-actions";
import type { GoogleBookResult } from "@/app/lib/api/google-books";
import { STATUS_OPTIONS, FORMAT_OPTIONS } from "@/app/lib/constants";
import { FormField, Input, Select, Textarea } from "@/app/components/ui/FormField";
import { StarRating } from "./StarRating";

const BarcodeScanner = dynamic(
  () => import("./BarcodeScanner").then((m) => ({ default: m.BarcodeScanner })),
  { ssr: false }
);

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest
        disabled:opacity-50 transition-all shadow-lg active:scale-95 mt-2"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Salvataggio…" : "Aggiungi alla libreria"}
    </button>
  );
}

export default function AddBookForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createBook, null);
  const [selected, setSelected] = useState<GoogleBookResult | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [status, setStatus]   = useState("TO_READ");
  const [formats, setFormats] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
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
      setSelected(null); setQuery(""); setResults([]);
      router.refresh();
      onSuccess?.();
    }
  }, [state?.success, router, onSuccess]);

  function handleSelect(book: GoogleBookResult) {
    setSelected(book);
    setQuery(book.title);
    setShowResults(false);
  }

  const key = selected?.googleId ?? "manual";
  const showRating = status === "READ";
  const autoTags = selected?.categories?.slice(0, 5).join(", ") ?? "";

  return (
    <>
    {showScanner && <BarcodeScanner onDetected={(i) => { setQuery(i); handleQueryChange(i); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}
    
    <form action={formAction} className="flex flex-col gap-5 pb-8">
      {/* Search Header */}
      <div ref={containerRef} className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-60">Ricerca Digitale</label>
          <button type="button" onClick={() => setShowScanner(true)} className="text-[10px] font-bold text-amber-500 uppercase">Scan Barcode</button>
        </div>
        <Input 
          value={query} 
          onChange={(e) => handleQueryChange(e.target.value)} 
          placeholder="Titolo, autore o ISBN..."
          autoComplete="off"
        />
        {searching && <div className="absolute right-4 top-[38px] animate-pulse text-xs opacity-50 font-bold">...</div>}
        
        {showResults && (
          <ul className="absolute z-50 w-full mt-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 bg-[#1a1a1a]">
            {results.map((book) => (
              <li key={book.googleId} onClick={() => handleSelect(book)}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5 transition-all border-b border-white/5 last:border-0">
                {book.coverUrl ? (
                  <Image src={book.coverUrl} alt="" width={36} height={50} unoptimized className="rounded shadow-md" />
                ) : (
                  <div className="w-9 h-12 bg-white/5 rounded flex items-center justify-center text-[8px] opacity-30">NO IMG</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate leading-tight">{book.title}</p>
                    {book.language === "it" && (
                      <span className="text-[9px] font-black bg-emerald-500 text-black px-1 rounded-sm flex-shrink-0">IT</span>
                    )}
                  </div>
                  <p className="text-xs opacity-60 truncate mt-0.5">{book.author}</p>
                  <p className="text-[10px] opacity-40 mt-1 font-medium italic">
                    {[book.publisher, book.publishedDate?.slice(0, 4)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Preview */}
      {selected && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4 animate-fade-in relative group">
          {selected.coverUrl && <Image src={selected.coverUrl} alt="" width={50} height={70} unoptimized className="rounded shadow-lg" />}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase opacity-40 mb-1">Selezionato</p>
            <p className="text-sm font-bold text-amber-500 leading-tight">{selected.title}</p>
            <p className="text-xs opacity-70 mt-0.5">{selected.author}</p>
          </div>
          <button type="button" onClick={() => { setSelected(null); setQuery(""); }} className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        <input type="hidden" name="googleId" value={selected?.googleId ?? ""} />
        <input type="hidden" name="coverUrl" value={selected?.coverUrl ?? ""} />
        <input type="hidden" name="isbn" value={selected?.isbn ?? ""} />
        <input type="hidden" name="formats" value={formats.join(",")} />

        <FormField label="Titolo *" error={state?.fieldErrors?.title}>
          <Input name="title" key={key + "-t"} defaultValue={selected?.title ?? ""} error={state?.fieldErrors?.title} />
        </FormField>

        <FormField label="Autore *" error={state?.fieldErrors?.author}>
          <Input name="author" key={key + "-a"} defaultValue={selected?.author ?? ""} error={state?.fieldErrors?.author} />
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

        <FormField label="Tag (Categorie)" error={state?.fieldErrors?.tags}>
          <Input name="tags" key={key + "-tags"} defaultValue={autoTags} placeholder="Generi..." />
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
          <Textarea name="comment" placeholder="..." error={state?.fieldErrors?.comment} />
        </FormField>
      </div>

      {state?.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold animate-shake">
          {state.error}
        </div>
      )}
      
      <SubmitButton />
    </form>
    </>
  );
}
