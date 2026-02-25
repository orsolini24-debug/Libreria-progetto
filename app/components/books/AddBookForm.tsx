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

// Lazy — evita errori SSR con le API webcam del browser
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
      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md mt-2"
      style={{
        background: "var(--accent)",
        color: "var(--accent-on)",
      }}
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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [status, setStatus]   = useState("TO_READ");
  const [formats, setFormats] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        if (!res.ok) { setResults([]); return; }
        const data: GoogleBookResult[] = await res.json();
        setResults(data);
        setShowResults(data.length > 0);
        if (data.length === 0) setSearchError("noresults");
      } catch {
        setResults([]);
        setSearchError("Errore di connessione. Controlla la rete e riprova.");
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
      setSelected(null); setQuery(""); setResults([]);
      setStatus("TO_READ"); setFormats([]);
      router.refresh();
      onSuccess?.();
    }
  }, [state?.success, router, onSuccess]);

  function handleSelect(book: GoogleBookResult) {
    setSelected(book);
    setQuery(book.title);
    setShowResults(false);
  }

  async function handleIsbnDetected(isbn: string) {
    setShowScanner(false);
    setSearching(true);
    setSearchError(null);
    setQuery(isbn);
    setShowResults(false);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(`isbn:${isbn}`)}`);
      const data: GoogleBookResult[] = res.ok ? await res.json() : [];
      if (data.length >= 1) {
        handleSelect(data[0]);
      } else {
        const res2  = await fetch(`/api/search?q=${encodeURIComponent(isbn)}`);
        const data2: GoogleBookResult[] = res2.ok ? await res2.json() : [];
        if (data2.length >= 1) {
          handleSelect(data2[0]);
        } else {
          setResults([]);
          setSearchError("ISBN non trovato. Inserisci titolo manualmente.");
        }
      }
    } catch {
      setSearchError("Errore di rete. Riprova.");
    } finally {
      setSearching(false);
    }
  }

  function toggleFormat(fmt: string) {
    setFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  }

  const key = selected?.googleId ?? "manual";
  const showRating   = status === "READ";
  const showReminder = status === "READING";
  const autoTags     = selected?.categories?.slice(0, 5).join(", ") ?? "";

  return (
    <>
    {showScanner && (
      <BarcodeScanner
        onDetected={handleIsbnDetected}
        onClose={() => setShowScanner(false)}
      />
    )}
    <form action={formAction} className="flex flex-col gap-4 pb-8">

      {/* Anteprima selezionato */}
      {selected && (
        <div
          className="flex gap-3 items-start p-3 rounded-xl border mb-2"
          style={{
            background: "color-mix(in srgb, var(--accent) 8%, var(--bg-elevated))",
            borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
          }}
        >
          {selected.coverUrl && (
            <Image src={selected.coverUrl} alt={selected.title}
              width={44} height={62} className="rounded object-cover shrink-0" unoptimized />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--accent)" }}>{selected.title}</p>
            <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{selected.author}</p>
          </div>
          <button
            type="button"
            onClick={() => { setSelected(null); setQuery(""); }}
            className="text-lg leading-none shrink-0"
            style={{ color: "var(--fg-subtle)" }}
          >×</button>
        </div>
      )}

      {/* Hidden */}
      <input type="hidden" name="googleId"      value={selected?.googleId      ?? ""} />
      <input type="hidden" name="coverUrl"      value={selected?.coverUrl      ?? ""} />
      <input type="hidden" name="isbn"          value={selected?.isbn          ?? ""} />
      <input type="hidden" name="publisher"     value={selected?.publisher     ?? ""} />
      <input type="hidden" name="publishedDate" value={selected?.publishedDate ?? ""} />
      <input type="hidden" name="language"      value={selected?.language      ?? ""} />
      <input type="hidden" name="pageCount"     value={selected?.pageCount != null ? String(selected.pageCount) : ""} />
      <input type="hidden" name="description"   value={selected?.description   ?? ""} />
      <input type="hidden" name="formats"       value={formats.join(",")} />

      {/* Ricerca */}
      <div ref={containerRef} className="relative">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-subtle)" }}>
            Cerca su Google Books
          </label>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="text-[10px] px-2 py-0.5 rounded-lg border uppercase font-bold tracking-tighter"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Barcode
          </button>
        </div>
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Titolo, autore, ISBN…"
        />
        {searching && <span className="absolute right-3 top-9 text-xs opacity-50">Cerco…</span>}
        {showResults && (
          <ul className="absolute z-30 w-full mt-1 rounded-xl shadow-2xl overflow-hidden border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-input)" }}>
            {results.map((book) => (
              <li key={book.googleId} onClick={() => handleSelect(book)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors border-b last:border-0 border-white/5">
                {book.coverUrl ? <Image src={book.coverUrl} alt="" width={24} height={34} unoptimized className="rounded" /> : <div className="w-6 h-8 bg-white/10 rounded" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{book.title}</p>
                  <p className="text-[10px] opacity-60 truncate">{book.author}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormField label="Titolo *" error={state?.fieldErrors?.title}>
        <Input name="title" key={key} defaultValue={selected?.title ?? ""} error={state?.fieldErrors?.title} />
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

        {showRating && (
          <FormField label="Valutazione" error={state?.fieldErrors?.rating}>
            <div className="pt-1"><StarRating name="rating" size="md" /></div>
          </FormField>
        )}
      </div>

      <FormField label="Tag" error={state?.fieldErrors?.tags}>
        <Input name="tags" key={key + "-tags"} defaultValue={autoTags} placeholder="fantasy, storico..." />
      </FormField>

      <FormField label="Formato">
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => toggleFormat(value)}
              className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase transition-all
                ${formats.includes(value) ? 'bg-amber-500 text-black border-amber-500' : 'opacity-60 border-white/20'}`}>
              {label}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Nota" error={state?.fieldErrors?.comment}>
        <Textarea name="comment" placeholder="Perché vuoi leggerlo? Impressioni..." error={state?.fieldErrors?.comment} />
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
        <p className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {state.error}
        </p>
      )}
      
      <SubmitButton />
    </form>
    </>
  );
}
