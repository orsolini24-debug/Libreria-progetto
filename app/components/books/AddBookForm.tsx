"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBook } from "@/app/lib/book-actions";
import type { GoogleBookResult } from "@/app/lib/api/google-books";
import { STATUS_OPTIONS, FORMAT_OPTIONS } from "@/app/lib/constants";

import { StarRating } from "./StarRating";

const fieldClass = `w-full border rounded-xl px-3 py-2.5 text-sm
  focus:outline-none focus:ring-2 transition-colors`;

const fieldStyle = {
  background: "var(--bg-input)",
  borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
  color: "var(--fg-primary)",
};

const labelStyle = {
  color: "var(--fg-subtle)",
  letterSpacing: "0.08em",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
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
  const [status, setStatus] = useState("TO_READ");
  const [formats, setFormats] = useState<string[]>([]);
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
    <form action={formAction} className="flex flex-col gap-4">

      {/* Anteprima libro selezionato */}
      {selected && (
        <div
          className="flex gap-3 items-start p-3 rounded-xl border"
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
            {selected.publisher && (
              <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                {selected.publisher}{selected.publishedDate ? `, ${selected.publishedDate.slice(0, 4)}` : ""}
                {selected.language && ` · ${selected.language.toUpperCase()}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setSelected(null); setQuery(""); }}
            className="text-lg leading-none shrink-0 transition-colors"
            style={{ color: "var(--fg-subtle)" }}
          >×</button>
        </div>
      )}

      {/* Campi hidden */}
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
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
          Cerca su Google Books
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Titolo, autore, ISBN…"
          className={fieldClass}
          style={fieldStyle}
        />
        {searching && (
          <span className="absolute right-3 top-9 text-xs" style={{ color: "var(--fg-subtle)" }}>
            Cerco…
          </span>
        )}

        {!searching && searchError === "noresults" && query.trim() && (
          <p className="mt-1.5 text-xs px-1" style={{ color: "var(--fg-subtle)" }}>
            Nessun libro trovato per &quot;{query}&quot;.
          </p>
        )}
        {!searching && searchError && searchError !== "noresults" && (
          <p className="mt-1.5 text-xs px-1" style={{ color: "#f87171" }}>{searchError}</p>
        )}

        {showResults && (
          <ul
            className="absolute z-30 w-full mt-1 rounded-xl shadow-2xl shadow-black/60 max-h-80 overflow-y-auto"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid color-mix(in srgb, var(--fg-subtle) 25%, transparent)",
            }}
          >
            {results.map((book) => (
              <li
                key={book.googleId}
                onClick={() => handleSelect(book)}
                className="search-result-item flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b last:border-0 transition-colors"
                style={{
                  borderColor: "color-mix(in srgb, var(--fg-subtle) 15%, transparent)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                {book.coverUrl ? (
                  <Image src={book.coverUrl} alt={book.title}
                    width={32} height={44} className="rounded object-cover shrink-0" unoptimized />
                ) : (
                  <div className="w-8 h-11 rounded shrink-0" style={{ background: "var(--bg-card)" }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--fg-primary)" }}>{book.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{book.author}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                    {[book.publisher, book.publishedDate?.slice(0, 4), book.language?.toUpperCase()]
                      .filter(Boolean).join(" · ")}
                  </p>
                </div>
                {book.language === "it" && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-900/30 border border-emerald-800/50 px-1.5 py-0.5 rounded shrink-0">IT</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Titolo */}
      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
          Titolo <span className="text-red-500 normal-case font-normal">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          key={key}
          defaultValue={selected?.title ?? ""}
          placeholder="Titolo del libro"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      {/* Autore */}
      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Autore</label>
        <input
          name="author"
          type="text"
          key={key + "-a"}
          defaultValue={selected?.author ?? ""}
          placeholder="Nome autore"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      {/* Stato */}
      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Stato</label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={fieldClass}
          style={fieldStyle}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Valutazione — solo per READ */}
      {showRating && (
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
            Valutazione
          </label>
          <StarRating name="rating" size="md" />
        </div>
      )}
      {showReminder && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl border text-xs"
          style={{
            background: "color-mix(in srgb, #3b82f6 8%, var(--bg-elevated))",
            borderColor: "color-mix(in srgb, #3b82f6 30%, transparent)",
            color: "#93c5fd",
          }}
        >
          <span className="text-base">💡</span>
          <span>Potrai aggiungere la valutazione una volta completata la lettura.</span>
        </div>
      )}
      {!showRating && !showReminder && <input type="hidden" name="rating" value="" />}

      {/* Tag */}
      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
          Tag{" "}
          <span className="font-normal normal-case tracking-normal" style={{ color: "var(--fg-subtle)" }}>
            {autoTags ? "(pre-compilati, modificabili)" : "(separati da virgola)"}
          </span>
        </label>
        <input
          name="tags"
          type="text"
          key={key + "-tags"}
          defaultValue={autoTags}
          placeholder="fantasy, storico, classici…"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      {/* Formati */}
      <div>
        <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>
          Formato posseduto
        </label>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleFormat(value)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={formats.includes(value)
                ? { background: "var(--accent)", color: "var(--accent-on)", borderColor: "var(--accent)" }
                : { background: "transparent", color: "var(--fg-muted)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Nota */}
      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
          Nota iniziale
        </label>
        <textarea
          name="comment"
          rows={2}
          placeholder="Impressioni, perché vuoi leggerlo…"
          className={`${fieldClass} resize-none leading-relaxed`}
          style={fieldStyle}
        />
      </div>

      {state?.error && (
        <p
          className="text-xs px-3 py-2 rounded-xl border"
          style={{
            color: "#f87171",
            background: "color-mix(in srgb, #ef4444 8%, var(--bg-elevated))",
            borderColor: "color-mix(in srgb, #ef4444 30%, transparent)",
          }}
        >
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
