"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBook } from "@/app/lib/book-actions";
import { searchGoogleBooks, type GoogleBookResult } from "@/app/lib/api/google-books";
import { StarRating } from "./StarRating";

const STATUS_OPTIONS = [
  { value: "TO_READ",  label: "📚 Da leggere" },
  { value: "READING",  label: "📖 In lettura"  },
  { value: "READ",     label: "✅ Letto"        },
  { value: "WISHLIST", label: "🔖 Wishlist"     },
];

const FORMAT_OPTIONS = [
  { value: "cartaceo", label: "📖 Cartaceo" },
  { value: "kindle",   label: "📱 E-book / Kindle" },
  { value: "audible",  label: "🎧 Audiolibro / Audible" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium
        hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
      {pending ? "Salvataggio…" : "Aggiungi alla libreria"}
    </button>
  );
}

export default function AddBookForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [state, formAction] = useFormState(createBook, null);
  const [selected, setSelected] = useState<GoogleBookResult | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [status, setStatus] = useState("TO_READ");
  const [formats, setFormats] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce ricerca
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setShowResults(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchGoogleBooks(value);
        setResults(res);
        setShowResults(res.length > 0);
      } finally { setSearching(false); }
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
  // Rating: visibile solo per READ, con reminder per READING
  const showRating  = status === "READ";
  const showReminder = status === "READING";
  // Auto-tag: dai genres del libro selezionato (2-5)
  const autoTags = selected?.categories?.slice(0, 5).join(", ") ?? "";

  return (
    <form action={formAction} className="flex flex-col gap-4">

      {/* Anteprima selezione */}
      {selected && (
        <div className="flex gap-3 items-start p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          {selected.coverUrl && (
            <Image src={selected.coverUrl} alt={selected.title}
              width={44} height={62} className="rounded object-cover shrink-0" unoptimized />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-indigo-900 truncate">{selected.title}</p>
            <p className="text-xs text-indigo-600 truncate">{selected.author}</p>
            {selected.publisher && (
              <p className="text-[10px] text-indigo-400 mt-0.5">
                {selected.publisher}{selected.publishedDate ? `, ${selected.publishedDate.slice(0, 4)}` : ""}
                {selected.language && ` · ${selected.language.toUpperCase()}`}
              </p>
            )}
          </div>
          <button type="button" onClick={() => { setSelected(null); setQuery(""); }}
            className="text-indigo-400 hover:text-indigo-700 text-lg leading-none shrink-0">×</button>
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
      <input type="hidden" name="formats"       value={formats.join(",")} readOnly />

      {/* Ricerca */}
      <div ref={containerRef} className="relative">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Cerca su Google Books
        </label>
        <input type="text" value={query} onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Titolo, autore, ISBN…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {searching && <span className="absolute right-3 top-9 text-xs text-gray-400">Cerco…</span>}

        {showResults && (
          <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
            {results.map((book) => (
              <li key={book.googleId} onClick={() => handleSelect(book)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0">
                {book.coverUrl ? (
                  <Image src={book.coverUrl} alt={book.title}
                    width={32} height={44} className="rounded object-cover shrink-0" unoptimized />
                ) : (
                  <div className="w-8 h-11 rounded bg-gray-100 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                  {/* Dettagli edizione nel dropdown */}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {[book.publisher, book.publishedDate?.slice(0, 4), book.language?.toUpperCase()]
                      .filter(Boolean).join(" · ")}
                  </p>
                </div>
                {book.language === "it" && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">IT</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Titolo */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Titolo <span className="text-red-400 normal-case font-normal">*</span>
        </label>
        <input name="title" type="text" required key={key} defaultValue={selected?.title ?? ""}
          placeholder="Titolo del libro"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Autore */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Autore</label>
        <input name="author" type="text" key={key + "-a"} defaultValue={selected?.author ?? ""}
          placeholder="Nome autore"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Stato */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Stato</label>
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
            focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Valutazione — solo per READ, reminder per READING */}
      {showRating && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Valutazione
          </label>
          <StarRating name="rating" size="md" />
        </div>
      )}
      {showReminder && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
          <span className="text-base">💡</span>
          <span>Potrai aggiungere la valutazione una volta completata la lettura.</span>
        </div>
      )}
      {/* Nasconde il campo rating per TO_READ e WISHLIST */}
      {!showRating && !showReminder && <input type="hidden" name="rating" value="" />}

      {/* Tag — auto-compilati da Google Books, editabili */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Tag{" "}
          <span className="font-normal normal-case text-gray-400 tracking-normal">
            {autoTags ? "(pre-compilati dal genere, modificabili)" : "(separati da virgola)"}
          </span>
        </label>
        <input name="tags" type="text" key={key + "-tags"} defaultValue={autoTags}
          placeholder="fantasy, storico, classici…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Formati posseduti */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Formato posseduto
        </label>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => toggleFormat(value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all
                ${formats.includes(value)
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Nota */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Nota iniziale
        </label>
        <textarea name="comment" rows={2} placeholder="Impressioni, perché vuoi leggerlo…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-300" />
      </div>

      {state?.error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
