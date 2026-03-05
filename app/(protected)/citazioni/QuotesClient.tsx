"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createQuote, deleteQuote } from "@/app/lib/quote-actions";
import { ShareableQuote } from "@/app/components/books/ShareableQuote";
import {
  Plus, X, Copy, Check, Share2, ExternalLink,
  Shuffle, Search, Quote as QuoteIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NoteType = "QUOTE" | "NOTE";

interface QuoteBook {
  id: string;
  title: string;
  author: string | null;
  coverUrl?: string | null;
}

interface QuoteWithBook {
  id: string;
  text: string;
  page: number | null;
  chapter: string | null;
  type: string;
  createdAt: Date;
  book: QuoteBook;
}

interface UserBook {
  id: string;
  title: string;
  author: string | null;
  status: string;
}

interface Props {
  quotes: QuoteWithBook[];
  booksWithQuotes: QuoteBook[];
  userBooks: UserBook[];
}

// ─── Submit button ────────────────────────────────────────────────────────────

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Salvataggio…" : label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuotesClient({ quotes: initialQuotes, booksWithQuotes, userBooks }: Props) {
  const router = useRouter();

  // Quote state
  const [quotes, setQuotes] = useState(initialQuotes);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharingQuote, setSharingQuote] = useState<QuoteWithBook | null>(null);
  const [randomHighlightId, setRandomHighlightId] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<NoteType>("QUOTE");
  const [previewText, setPreviewText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Filter/sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recenti" | "pagina">("recenti");

  const [addState, addFormAction] = useActionState(createQuote, null);

  // Sync local quotes with server data after refresh
  useEffect(() => {
    setQuotes(initialQuotes);
  }, [initialQuotes]);

  // Handle successful quote creation
  useEffect(() => {
    if (addState?.success) {
      formRef.current?.reset();
      setPreviewText("");
      setShowAddForm(false);
      router.refresh();
    }
  }, [addState?.success, router]);

  // Scroll to random highlighted quote
  useEffect(() => {
    if (!randomHighlightId) return;
    const el = document.querySelector(`[data-quote-id="${randomHighlightId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setRandomHighlightId(null), 3000);
    return () => clearTimeout(t);
  }, [randomHighlightId]);

  // ─── Filtering + sorting ────────────────────────────────────────────────────

  const filtered = quotes
    .filter((q) => !selectedBookId || q.book.id === selectedBookId)
    .filter(
      (q) =>
        !searchQuery ||
        q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.book.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "pagina") return (a.page ?? 9999) - (b.page ?? 9999);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Count per book for filter chips
  const bookCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.book.id] = (acc[q.book.id] ?? 0) + 1;
    return acc;
  }, {});

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    await deleteQuote(id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  }

  function handleCopy(quote: QuoteWithBook) {
    let text = `"${quote.text}" — ${quote.book.title}`;
    if (quote.book.author) text += `, ${quote.book.author}`;
    if (quote.page) text += ` (p. ${quote.page})`;
    navigator.clipboard.writeText(text);
    setCopiedId(quote.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleRandom() {
    if (filtered.length === 0) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    setRandomHighlightId(pick.id);
    setExpandedId(pick.id);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Top actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleRandom}
          disabled={filtered.length === 0}
          title="Citazione casuale"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80 disabled:opacity-30"
          style={{
            borderColor: "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
            color: "var(--fg-muted)",
          }}
        >
          <Shuffle className="w-3.5 h-3.5" /> Casuale
        </button>

        <button
          onClick={() => setShowAddForm((p) => !p)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ml-auto"
          style={
            showAddForm
              ? {
                  background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                }
              : { background: "var(--accent)", color: "var(--accent-on)" }
          }
        >
          {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAddForm ? "Chiudi" : "Nuova citazione"}
        </button>
      </div>

      {/* ─── Add form panel ──────────────────────────────────────────────────── */}
      {showAddForm && (
        <div
          className="rounded-2xl border p-5 flex flex-col gap-5"
          style={{
            background: "var(--bg-card)",
            borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Nuova citazione
          </p>

          <form ref={formRef} action={addFormAction} className="flex flex-col gap-4">
            {/* Book selector */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--fg-muted)" }}
              >
                Libro *
              </label>
              <select
                name="bookId"
                required
                className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                style={{
                  background: "color-mix(in srgb, var(--fg-primary) 5%, transparent)",
                  color: "var(--fg-primary)",
                  borderColor: "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
                }}
              >
                <option value="">Seleziona un libro…</option>
                {userBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                    {b.author ? ` — ${b.author}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Type toggle */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "color-mix(in srgb, var(--fg-primary) 5%, transparent)" }}>
              {(["QUOTE", "NOTE"] as NoteType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormType(t)}
                  className="flex-1 text-xs font-bold py-2 rounded-lg transition-all"
                  style={{
                    background: formType === t ? "var(--accent)" : "transparent",
                    color: formType === t ? "var(--accent-on)" : "var(--fg-muted)",
                  }}
                >
                  {t === "QUOTE" ? "Citazione" : "Appunto"}
                </button>
              ))}
            </div>
            <input type="hidden" name="type" value={formType} />

            {/* Textarea + live preview */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
                {formType === "QUOTE" ? "Citazione *" : "Appunto *"}
              </label>
              <textarea
                name="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder={
                  formType === "QUOTE"
                    ? "Scrivi o incolla la citazione…"
                    : "Scrivi l'appunto…"
                }
                rows={4}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none border resize-none"
                style={{
                  background: "color-mix(in srgb, var(--fg-primary) 5%, transparent)",
                  color: "var(--fg-primary)",
                  borderColor: "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
                }}
              />
              {/* Live italic preview */}
              {previewText && formType === "QUOTE" && (
                <p
                  className="text-sm italic px-3 py-2 rounded-xl"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                    color: "var(--fg-primary)",
                    borderLeft: "2px solid var(--accent)",
                  }}
                >
                  &ldquo;{previewText}&rdquo;
                </p>
              )}
            </div>

            {/* Page + chapter */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 w-24">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
                  Pagina
                </label>
                <input
                  type="number"
                  name="page"
                  placeholder="42"
                  min={0}
                  className="px-3 py-2 rounded-xl text-sm outline-none border"
                  style={{
                    background: "color-mix(in srgb, var(--fg-primary) 5%, transparent)",
                    color: "var(--fg-primary)",
                    borderColor: "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>
                  Capitolo
                </label>
                <input
                  type="text"
                  name="chapter"
                  placeholder="Cap. III"
                  className="px-3 py-2 rounded-xl text-sm outline-none border"
                  style={{
                    background: "color-mix(in srgb, var(--fg-primary) 5%, transparent)",
                    color: "var(--fg-primary)",
                    borderColor: "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
                  }}
                />
              </div>
            </div>

            {addState?.error && (
              <p className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                {addState.error}
              </p>
            )}

            <SubmitButton
              label={formType === "QUOTE" ? "Salva citazione" : "Salva appunto"}
            />
          </form>
        </div>
      )}

      {/* ─── Search + sort ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--fg-subtle)" }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca nelle citazioni…"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border"
            style={{
              background: "var(--bg-card)",
              color: "var(--fg-primary)",
              borderColor: "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
            }}
          />
        </div>
        <div
          className="flex gap-0.5 p-0.5 rounded-xl border shrink-0"
          style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)" }}
        >
          {(["recenti", "pagina"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: sortBy === s ? "var(--accent)" : "transparent",
                color: sortBy === s ? "var(--accent-on)" : "var(--fg-muted)",
              }}
            >
              {s === "recenti" ? "Recenti" : "Pagina"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Book filter chips ────────────────────────────────────────────────── */}
      {booksWithQuotes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedBookId(null)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
            style={{
              background: selectedBookId === null ? "var(--accent)" : "transparent",
              color: selectedBookId === null ? "var(--accent-on)" : "var(--fg-muted)",
              borderColor:
                selectedBookId === null
                  ? "var(--accent)"
                  : "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
            }}
          >
            Tutti ({quotes.length})
          </button>
          {booksWithQuotes.map((book) => (
            <button
              key={book.id}
              onClick={() =>
                setSelectedBookId(book.id === selectedBookId ? null : book.id)
              }
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
              style={{
                background: selectedBookId === book.id ? "var(--accent)" : "transparent",
                color:
                  selectedBookId === book.id ? "var(--accent-on)" : "var(--fg-muted)",
                borderColor:
                  selectedBookId === book.id
                    ? "var(--accent)"
                    : "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
              }}
            >
              {book.title.length > 22 ? book.title.slice(0, 22) + "…" : book.title}
              <span style={{ opacity: 0.65 }}> ({bookCounts[book.id] ?? 0})</span>
            </button>
          ))}
        </div>
      )}

      {/* ─── Cards grid ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--fg-subtle)" }}>
          <QuoteIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {searchQuery
              ? "Nessuna citazione trovata per questa ricerca."
              : "Nessuna citazione salvata."}
          </p>
          {!searchQuery && (
            <p className="text-xs mt-1 opacity-60">
              Usa il pulsante &ldquo;Nuova citazione&rdquo; oppure aggiungile dalla scheda libro.
            </p>
          )}
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {filtered.map((quote) => {
            const isExpanded = expandedId === quote.id;
            const isHighlighted = randomHighlightId === quote.id;
            const isDeleteConfirm = deleteConfirmId === quote.id;
            const isCopied = copiedId === quote.id;
            const isNote = quote.type === "NOTE";

            return (
              <div
                key={quote.id}
                data-quote-id={quote.id}
                className="break-inside-avoid rounded-2xl border transition-all duration-300"
                style={{
                  background: "var(--bg-card)",
                  borderColor: isHighlighted
                    ? "var(--accent)"
                    : "color-mix(in srgb, var(--accent) 15%, transparent)",
                  boxShadow: isHighlighted
                    ? "0 0 0 2px var(--accent), 0 8px 32px color-mix(in srgb, var(--accent) 20%, transparent)"
                    : undefined,
                }}
              >
                {/* Badge + expand toggle */}
                <div className="px-5 pt-4 pb-0 flex items-center justify-between">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{
                      background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                      color: "var(--accent)",
                    }}
                  >
                    {isNote ? "Appunto" : "Citazione"}
                  </span>
                  <button
                    onClick={() => toggleExpand(quote.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-60"
                    style={{ color: "var(--fg-subtle)" }}
                    aria-label={isExpanded ? "Comprimi" : "Espandi"}
                  >
                    <span
                      className="text-xs inline-block transition-transform duration-300"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      ▾
                    </span>
                  </button>
                </div>

                {/* Text — click to toggle */}
                <button
                  onClick={() => toggleExpand(quote.id)}
                  className="w-full text-left px-5 py-3"
                >
                  <blockquote
                    className={`font-reading leading-relaxed ${
                      isExpanded ? "text-base" : "text-sm line-clamp-3"
                    } ${!isNote ? "italic" : ""}`}
                    style={{ color: "var(--fg-primary)" }}
                  >
                    {!isNote && <>&ldquo;</>}
                    {quote.text}
                    {!isNote && <>&rdquo;</>}
                  </blockquote>
                </button>

                {/* Footer */}
                <div
                  className="px-5 pb-4 pt-2 border-t flex flex-col gap-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--fg-subtle) 10%, transparent)",
                  }}
                >
                  {/* Book info */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      {quote.book.title}
                    </p>
                    {isExpanded && quote.book.author && (
                      <p
                        className="text-[11px] italic"
                        style={{ color: "var(--fg-muted)" }}
                      >
                        {quote.book.author}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {quote.page && (
                        <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>
                          p. {quote.page}
                        </span>
                      )}
                      {quote.chapter && (
                        <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>
                          {quote.chapter}
                        </span>
                      )}
                      <span
                        className="text-[10px] ml-auto"
                        style={{ color: "var(--fg-subtle)" }}
                      >
                        {new Date(quote.createdAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {/* Copy */}
                    <button
                      onClick={() => handleCopy(quote)}
                      title="Copia"
                      className="p-1.5 rounded-lg transition-all hover:opacity-70"
                      style={{ color: isCopied ? "#22c55e" : "var(--fg-subtle)" }}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Share (citazioni only) */}
                    {!isNote && (
                      <button
                        onClick={() => setSharingQuote(quote)}
                        title="Condividi"
                        className="p-1.5 rounded-lg transition-all hover:opacity-70"
                        style={{ color: "var(--fg-subtle)" }}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Link to book */}
                    <Link
                      href={`/dashboard?book=${quote.book.id}`}
                      title="Vai al libro"
                      className="p-1.5 rounded-lg transition-all hover:opacity-70"
                      style={{ color: "var(--fg-subtle)" }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {/* Delete — inline confirm */}
                    <div className="ml-auto flex items-center gap-1">
                      {isDeleteConfirm ? (
                        <>
                          <button
                            onClick={() => handleDelete(quote.id)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                            style={{
                              background: "color-mix(in srgb, #ef4444 15%, transparent)",
                              border: "1px solid color-mix(in srgb, #ef4444 40%, transparent)",
                              color: "#f87171",
                            }}
                          >
                            Elimina
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:opacity-70"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            Annulla
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(quote.id)}
                          title="Elimina"
                          className="p-1.5 rounded-lg transition-all hover:opacity-70 hover:text-red-400"
                          style={{ color: "var(--fg-subtle)" }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share modal */}
      {sharingQuote && (
        <ShareableQuote
          text={sharingQuote.text}
          bookTitle={sharingQuote.book.title}
          author={sharingQuote.book.author ?? undefined}
          bookCover={sharingQuote.book.coverUrl ?? undefined}
          onClose={() => setSharingQuote(null)}
        />
      )}
    </div>
  );
}
