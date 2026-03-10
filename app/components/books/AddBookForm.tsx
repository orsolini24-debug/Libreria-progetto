"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createBook, createBooksBulk } from "@/app/lib/book-actions";
import { suggestBookTags } from "@/app/lib/ai/tag-actions";
import { Sparkles, Loader2 } from "lucide-react";
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
  const formRef = useRef<HTMLFormElement>(null);
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
  const [noResults, setNoResults] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const [showEditions, setShowEditions] = useState(false);
  const [editions, setEditions] = useState<GoogleBookResult[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(false);

  const [currentBook, setCurrentBook] = useState<Partial<GoogleBookResult>>({
    title: "", author: "", googleId: "", isbn: "", publisher: "", publishedDate: "", language: "", pageCount: 0, coverUrl: "", description: "", categories: []
  });

  const [manualTags, setManualTags] = useState("");

  const handleSuggestTags = async () => {
    if (!currentBook.description) return;
    setSuggestingTags(true);
    const existing = manualTags.split(",").map(t => t.trim()).filter(Boolean);
    const suggested = await suggestBookTags(currentBook.description, existing);
    if (suggested.length > 0) {
      const combined = Array.from(new Set([...existing, ...suggested]));
      setManualTags(combined.join(", "));
    }
    setSuggestingTags(false);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    setNoResults(false);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setShowResults(false); return; }

    debounceRef.current = setTimeout(async () => {
      // #16: Abort previous request
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setSearching(true);
      try {
        // #60: maxResults=10 per performance
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}&maxResults=20`, { signal: controller.signal });
        const data = await res.json();
        setResults(data);
        setShowResults(data.length > 0);
        // #72: Nessun risultato
        if (data.length === 0) setNoResults(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500); // #107: Debounce più lungo per rate limiting client
  }, []);

  const selectBook = (book: GoogleBookResult) => {
    setCurrentBook(book);
    setQuery(book.title);
    setManualTags(book.categories?.join(", ") || "");
    setShowResults(false);
    setNoResults(false);
    setShowEditions(false);
    setEditions([]);
  };

  const loadEditions = async () => {
    if (!currentBook.title) return;
    setLoadingEditions(true);
    setShowEditions(true);
    try {
      const q = `intitle:"${currentBook.title}"${currentBook.author ? ` inauthor:"${currentBook.author}"` : ""}`;
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&maxResults=15`);
      const data = await res.json();
      setEditions(Array.isArray(data) ? data : []);
    } finally {
      setLoadingEditions(false);
    }
  };

  const handleBulkAdd = async () => {
    setBulkLoading(true);
    try {
      // #155: Convertiamo null in undefined per compatibilità con il tipo della Action
      const booksToCreate = bulkSelection.map(s => ({
        ...s,
        status: status as BookStatus,
        formats: formats.join(","),
        googleId: s.googleId ?? undefined,
        publisher: s.publisher ?? undefined,
        publishedDate: s.publishedDate ?? undefined,
        language: s.language ?? undefined,
        coverUrl: s.coverUrl ?? undefined,
        description: s.description ?? undefined,
      }));
      
      const res = await createBooksBulk(booksToCreate);
      if (res.success > 0) { 
        setBulkSelection([]);
        onSuccess?.(); 
        router.refresh(); 
      }
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
      // #13: Reset form e stato locale
      formRef.current?.reset();
      setCurrentBook({ title: "", author: "" });
      setQuery("");
      setFormats([]);
      setStatus("TO_READ");
      
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
          <button type="button" onClick={() => setShowScanner(true)} className="text-[10px] font-bold uppercase border-b" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>Usa Scanner Barcode</button>
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
                    {b.language === "it" && <span className="text-[9px] font-black px-1 rounded-sm flex-shrink-0" style={{ background: "var(--accent)", color: "var(--accent-on)" }}>IT</span>}
                  </div>
                  <p className="text-xs opacity-50 truncate">{b.author}</p>
                  {(b.publisher || b.publishedDate) && (
                    <p className="text-[10px] opacity-30 truncate">{[b.publisher, b.publishedDate?.slice(0, 4)].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setBulkSelection(p => [...p, b]); setShowResults(false); }} className="text-[10px] font-black uppercase p-2" style={{ color: "var(--accent)" }}>+</button>
              </li>
            ))}
          </ul>
        )}

        {noResults && !searching && query.length > 2 && (
          <div className="mt-2 p-3 text-center text-[10px] font-bold opacity-40 uppercase">
            Nessun risultato trovato per &quot;{query}&quot;
          </div>
        )}
      </div>

      {/* 2. Selezione Bulk */}
      {bulkSelection.length > 0 && (
        <div className="p-6 rounded-[2rem] shadow-xl space-y-4" style={{ background: "color-mix(in srgb, var(--accent) 5%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: "var(--accent)" }}>Selezione Multipla ({bulkSelection.length})</p>
          <div className="flex flex-wrap gap-2">
            {bulkSelection.map(s => (
              <div key={s.googleId} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold">
                <span className="truncate max-w-[100px]">{s.title}</span>
                <button onClick={() => setBulkSelection(p => p.filter(x => x.googleId !== s.googleId))} className="text-red-400">✕</button>
              </div>
            ))}
          </div>
          <button onClick={handleBulkAdd} disabled={bulkLoading} className="w-full py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-xl">
            {bulkLoading ? "Caricamento..." : `Aggiungi ${bulkSelection.length} libri`}
          </button>
        </div>
      )}

      {/* 3. Form Integrale */}
      <form ref={formRef} action={formAction} className="flex flex-col gap-8">
        <input type="hidden" name="googleId"      value={currentBook.googleId ?? ""} />
        <input type="hidden" name="coverUrl"      value={currentBook.coverUrl ?? ""} />
        <input type="hidden" name="isbn"          value={currentBook.isbn ?? ""} />
        <input type="hidden" name="publisher"     value={currentBook.publisher ?? ""} />
        <input type="hidden" name="publishedDate" value={currentBook.publishedDate ?? ""} />
        <input type="hidden" name="language"      value={currentBook.language ?? ""} />
        <input type="hidden" name="pageCount"     value={currentBook.pageCount ?? ""} />
        <input type="hidden" name="description"   value={currentBook.description ?? ""} />
        <input type="hidden" name="formats"       value={formats.join(",")} />

        <div className="flex flex-col gap-3 p-5 rounded-[2rem] shadow-inner bg-white/[0.02]" style={{ border: "1px solid color-mix(in srgb, var(--accent) 10%, transparent)" }}>
          <div className="flex gap-4 items-center">
            {currentBook.coverUrl ? (
              <Image src={currentBook.coverUrl} alt="" width={50} height={70} unoptimized className="rounded-lg shadow-2xl shrink-0" />
            ) : (
              <div className="w-12 h-16 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[8px] opacity-20 shrink-0">COPERTINA</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase opacity-20 tracking-[0.2em] mb-1">Edizione selezionata</p>
              <p className="text-base font-bold truncate leading-tight" style={{ color: "var(--accent)" }}>{currentBook.title || "Inserisci Titolo..."}</p>
              <p className="text-xs opacity-50 truncate mt-0.5">{currentBook.author || "Autore sconosciuto"}</p>
              {(currentBook.publisher || currentBook.publishedDate) && (
                <p className="text-[10px] opacity-40 mt-0.5">{[currentBook.publisher, currentBook.publishedDate?.slice(0, 4)].filter(Boolean).join(" · ")}</p>
              )}
              {currentBook.language && (
                <span className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
                  {currentBook.language.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Cerca altre edizioni */}
          {currentBook.title && (
            <div>
              <button
                type="button"
                onClick={() => showEditions ? setShowEditions(false) : loadEditions()}
                className="text-[10px] font-bold uppercase tracking-widest transition-all opacity-50 hover:opacity-100 flex items-center gap-1"
                style={{ color: "var(--fg-muted)" }}
              >
                {loadingEditions ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {showEditions ? "▲ Nascondi edizioni" : "▾ Cerca altre edizioni / casa editrice"}
              </button>

              {showEditions && (
                <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-white/5 divide-y divide-white/5" style={{ background: "var(--bg-elevated)" }}>
                  {loadingEditions ? (
                    <p className="text-xs text-center py-4 opacity-40">Ricerca edizioni…</p>
                  ) : editions.length === 0 ? (
                    <p className="text-xs text-center py-4 opacity-40">Nessuna edizione trovata.</p>
                  ) : editions.map((ed) => (
                    <button
                      key={ed.googleId}
                      type="button"
                      onClick={() => selectBook(ed)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-all text-left"
                    >
                      {ed.coverUrl
                        ? <Image src={ed.coverUrl} alt="" width={28} height={40} unoptimized className="rounded shadow-sm shrink-0" />
                        : <div className="w-7 h-10 bg-white/10 rounded shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate leading-tight" style={{ color: "var(--fg-primary)" }}>{ed.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {ed.publisher && <span className="text-[10px] opacity-50 truncate">{ed.publisher}</span>}
                          {ed.publishedDate && <span className="text-[10px] opacity-40">{ed.publishedDate.slice(0, 4)}</span>}
                          {ed.pageCount && <span className="text-[10px] opacity-30">{ed.pageCount}p</span>}
                          {ed.language && (
                            <span className="text-[9px] font-black px-1 rounded" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
                              {ed.language.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      {ed.googleId === currentBook.googleId && (
                        <span className="text-[10px] opacity-50 shrink-0">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <FormField label="Titolo del libro *" error={state?.fieldErrors?.title}>
            <Input name="title" defaultValue={currentBook.title} key={currentBook.title} placeholder="..." error={state?.fieldErrors?.title} />
          </FormField>
          <FormField label="Autore *" error={state?.fieldErrors?.author}>
            <Input name="author" defaultValue={currentBook.author} key={currentBook.author} placeholder="..." error={state?.fieldErrors?.author} />
          </FormField>

          {/* RIGA STATO */}
          <FormField label="Stato della lettura" error={state?.fieldErrors?.status}>
            <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </FormField>

          {/* RIGA VALUTAZIONE (#66: Mostrata solo per READ o READING) */}
          {(status === "READ" || status === "READING") && (
            <FormField label="Valutazione Personale (Stelle)" error={state?.fieldErrors?.rating}>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <StarRating name="rating" defaultValue={0} size="md" />
              </div>
            </FormField>
          )}

          <FormField label="Tag / Categorie" error={state?.fieldErrors?.tags}>
            <Textarea
              name="tags"
              value={manualTags}
              onChange={(e) => setManualTags(e.target.value)}
              placeholder="Es. narrativa, storico, fantasy..."
              className="!min-h-[60px]"
            />
            {currentBook.description && (
              <button
                type="button"
                onClick={handleSuggestTags}
                disabled={suggestingTags}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all disabled:opacity-50 active:scale-95"
                style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
              >
                {suggestingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Suggerisci tag AI
              </button>
            )}
          </FormField>


          <FormField label="Formato Disponibile">
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => toggleFormat(value)}
                  className={`text-[10px] px-4 py-2 rounded-full border font-black uppercase transition-all duration-300
                    ${formats.includes(value) ? 'shadow-lg' : 'opacity-30 border-white/10 hover:opacity-100'}`}
                  style={formats.includes(value) ? { background: "var(--accent)", color: "var(--accent-on)", borderColor: "var(--accent)" } : undefined}>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="Data Acquisto">
                <Input name="purchasedAt" type="date" />
              </FormField>
              
              {(status === "READING" || status === "READ") && (
                <FormField label="Inizio Lettura">
                  <Input name="startedAt" type="date" />
                </FormField>
              )}

              {status === "READ" && (
                <FormField label="Fine Lettura">
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
