"use client";

import { useState, useEffect, useMemo } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateBook } from "@/app/lib/book-actions";
import { FORMAT_OPTIONS } from "@/app/lib/constants";
import type { Book } from "@/app/generated/prisma/client";
import { SeriesPanel } from "./SeriesPanel";
import { FormField, Input, Textarea } from "@/app/components/ui/FormField";
import { DeleteBookButton } from "./DeleteBookButton";
import { StarRating } from "./StarRating";
import { BookInfoOverlay } from "./BookInfoOverlay";
import { generateBookAnalysis } from "@/app/lib/ai/analysis-action";
import { Sparkles, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Sezioni dinamiche
const ReadingSessionSection = dynamic(() => import("./ReadingSessionSection").then(m => m.ReadingSessionSection));
const LoanSection = dynamic(() => import("./LoanSection").then(m => m.LoanSection));
const QuoteSection = dynamic(() => import("./QuoteSection").then(m => m.QuoteSection));

type Tab = "scheda" | "lettura" | "dettagli";

const STATUS_VISUAL = [
  { value: "TO_READ",   label: "Da leggere", icon: "📚" },
  { value: "READING",   label: "In lettura", icon: "📖" },
  { value: "READ",      label: "Letto",      icon: "✅" },
  { value: "WISHLIST",  label: "Wishlist",   icon: "🔖" },
  { value: "ABANDONED", label: "Abbandonato",icon: "🚫" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoDate(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl text-sm font-semibold shadow-xl transition-all active:scale-95
        disabled:opacity-50 mt-2"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Aggiornamento…" : "Salva modifiche"}
    </button>
  );
}

export function EditBookForm({
  book,
  onClose,
  onCelebrate,
  onNavigateToBook,
}: {
  book: Book;
  onClose: () => void;
  onCelebrate?: () => void;
  onNavigateToBook?: (id: string) => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateBook.bind(null, book.id), null);

  const [activeTab,   setActiveTab]   = useState<Tab>("scheda");
  const [status,      setStatus]      = useState(book.status);
  const [formats,     setFormats]     = useState<string[]>(book.formats?.split(",").filter(Boolean) ?? []);
  const [tags,        setTags]        = useState<string[]>(book.tags?.split(",").filter(Boolean) ?? []);
  const [tagInput,    setTagInput]    = useState("");
  const [series,      setSeries]      = useState(book.series ?? "");
  const [currentPage, setCurrentPage] = useState(book.currentPage?.toString() ?? "");
  const [pageCount,   setPageCount]   = useState(book.pageCount?.toString() ?? "");
  const [startedAt,   setStartedAt]   = useState(book.startedAt  ? isoDate(book.startedAt)  : "");
  const [finishedAt,  setFinishedAt]  = useState(book.finishedAt ? isoDate(book.finishedAt) : "");
  const [showOverlay,  setShowOverlay]  = useState(false);
  const [ratingPrompt, setRatingPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localAiAnalysis, setLocalAiAnalysis] = useState(book.aiAnalysis ?? "");

  useEffect(() => {
    if (state?.success) {
      if (book.status !== "READ" && status === "READ") onCelebrate?.();
      router.refresh();
      onClose();
    }
  }, [state?.success, status, book.status, onCelebrate, router, onClose]);

  // Dismiss rating prompt after 4 seconds
  useEffect(() => {
    if (!ratingPrompt) return;
    const t = setTimeout(() => setRatingPrompt(false), 4000);
    return () => clearTimeout(t);
  }, [ratingPrompt]);

  function handleStatusChange(newStatus: typeof book.status) {
    setStatus(newStatus);
    if (newStatus === "READING" && !startedAt) setStartedAt(todayISO());
    if (newStatus === "READ") {
      if (!finishedAt) setFinishedAt(todayISO());
      if (!book.rating) {
        setRatingPrompt(true);
      }
    }
  }

  function toggleFormat(fmt: string) {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,+$/, "");
      if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput) setTags(prev => prev.slice(0, -1));
  }

  // Progress
  const progress = useMemo(() => {
    const cp = parseInt(currentPage), pc = parseInt(pageCount);
    if (!cp || !pc || cp <= 0 || pc <= 0) return null;
    return Math.min(100, Math.round((cp / pc) * 100));
  }, [currentPage, pageCount]);

  // Velocity
  const velocity = useMemo(() => {
    const cp = parseInt(currentPage), pc = parseInt(pageCount);
    if (!startedAt || !cp || !pc || cp <= 0 || pc <= 0) return null;
    const days = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 86_400_000));
    const pagesPerDay = cp / days;
    if (pagesPerDay < 0.1) return null;
    const daysLeft = Math.round((pc - cp) / pagesPerDay);
    return { pagesPerDay: Math.round(pagesPerDay * 10) / 10, daysLeft };
  }, [startedAt, currentPage, pageCount]);

  const TAB_LABELS: Record<Tab, string> = { scheda: "Scheda", lettura: "Lettura", dettagli: "Dettagli" };

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <div className="flex gap-4 items-start p-4 rounded-2xl mb-4"
        style={{ background: "var(--bg-elevated)", border: "1px solid color-mix(in srgb, var(--fg-subtle) 10%, transparent)" }}>
        {book.coverUrl && (
          <Image src={book.coverUrl} alt="" width={60} height={84} unoptimized
            className="rounded-lg shadow-lg shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-lg leading-tight" style={{ color: "var(--fg-primary)" }}>{book.title}</h3>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>{book.author}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {book.googleId && (
              <a
                href={`https://books.google.com/books?id=${book.googleId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border transition-opacity hover:opacity-80 flex items-center gap-1"
                style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)", background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
              >
                Google Books ↗
              </a>
            )}
            {(book.description || book.aiAnalysis) && (
              <button
                type="button"
                onClick={() => setShowOverlay(true)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/10 bg-white/5 transition-all hover:bg-white/10 flex items-center gap-1"
                style={{ color: "var(--fg-muted)" }}
              >
                Info & Analisi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overlay Immersivo per Trama e Analisi */}
      <BookInfoOverlay 
        isOpen={showOverlay}
        onClose={() => setShowOverlay(false)}
        title={book.title}
        author={book.author}
        description={book.description}
        aiAnalysis={book.aiAnalysis}
      />

      {/* Tab Nav */}
      <div className="flex mb-5 border-b" style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 15%, transparent)" }}>
        {(["scheda", "lettura", "dettagli"] as Tab[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="flex-1 text-xs font-bold uppercase py-2.5 border-b-2 transition-all -mb-px"
            style={{
              borderColor: activeTab === tab ? "var(--accent)" : "transparent",
              color: activeTab === tab ? "var(--accent)" : "var(--fg-subtle)",
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Form — wraps all 3 tab panels; hidden inputs track controlled state */}
      <form action={formAction}>
        {/* Controlled hidden inputs */}
        <input type="hidden" name="status"      value={status} />
        <input type="hidden" name="tags"        value={tags.join(",")} />
        <input type="hidden" name="formats"     value={formats.join(",")} />
        <input type="hidden" name="series"      value={series} />
        <input type="hidden" name="currentPage" value={currentPage} />
        <input type="hidden" name="pageCount"   value={pageCount} />
        <input type="hidden" name="startedAt"   value={startedAt} />
        <input type="hidden" name="finishedAt"  value={finishedAt} />

        {/* ── TAB: SCHEDA ── */}
        <div style={{ display: activeTab === "scheda" ? undefined : "none" }} className="flex flex-col gap-5">

          {/* Status visual buttons */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--fg-subtle)" }}>Stato</p>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_VISUAL.map(({ value, label, icon }) => {
                const active = status === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleStatusChange(value as typeof book.status)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold uppercase transition-all
                      ${active ? "border-transparent shadow-lg scale-[1.02]" : "opacity-50 hover:opacity-80"}`}
                    style={active
                      ? { background: "var(--accent)", color: "var(--accent-on)", boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent)" }
                      : { background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)", color: "var(--fg-primary)" }
                    }
                  >
                    <span className="text-base leading-none">{icon}</span>
                    <span className="leading-tight text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voto */}
          <div className={`transition-all rounded-xl ${ratingPrompt ? "ring-2 ring-amber-500/60 p-2 -m-2" : ""}`}>
            {ratingPrompt && (
              <p className="text-[10px] font-bold text-amber-500 mb-1.5">Il libro è finito — dagli un voto! ⭐</p>
            )}
            <FormField label="Voto" error={state?.fieldErrors?.rating}>
              <div className="pt-1">
                <StarRating name="rating" defaultValue={book.rating ?? 0} size="md" />
              </div>
            </FormField>
          </div>

          {/* Formati */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--fg-subtle)" }}>Formati</p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => toggleFormat(value)}
                  className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase transition-all
                    ${formats.includes(value)
                      ? "border-transparent"
                      : "opacity-40"}`}
                  style={formats.includes(value)
                    ? { background: "var(--accent)", color: "var(--accent-on)", borderColor: "transparent" }
                    : { borderColor: "color-mix(in srgb, var(--fg-subtle) 25%, transparent)", color: "var(--fg-primary)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Serie */}
          <div className="flex gap-4">
            <FormField label="Serie" error={state?.fieldErrors?.series} className="flex-[3]">
              <Input
                name="_series_display"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="Saga..."
              />
            </FormField>
            <FormField label="N°" error={state?.fieldErrors?.seriesOrder} className="flex-1">
              <Input name="seriesOrder" type="number" defaultValue={book.seriesOrder ?? ""} />
            </FormField>
          </div>

          {series && onNavigateToBook && (
            <SeriesPanel seriesName={series} currentBookId={book.id} onNavigate={onNavigateToBook} />
          )}

          {/* Tag chips */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--fg-subtle)" }}>Tag</p>
            <div
              className="flex flex-wrap gap-1.5 min-h-[38px] rounded-xl px-3 py-2 border cursor-text"
              style={{
                background: "var(--bg-input)",
                borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
              }}
              onClick={() => document.getElementById("tag-input")?.focus()}
            >
              {tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setTags(prev => prev.filter(t => t !== tag)); }}
                    className="opacity-60 hover:opacity-100 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) {
                    const t = tagInput.trim().replace(/,+$/, "");
                    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
                    setTagInput("");
                  }
                }}
                placeholder={tags.length === 0 ? "fantasy, storico… (Enter per aggiungere)" : ""}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-xs"
                style={{ color: "var(--fg-primary)" }}
              />
            </div>
          </div>

          {/* Nota */}
          <FormField label="Nota" error={state?.fieldErrors?.comment}>
            <Textarea name="comment" defaultValue={book.comment ?? ""} error={state?.fieldErrors?.comment} />
          </FormField>

          {state?.error && (
            <p className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{state.error}</p>
          )}
          <SubmitButton />
        </div>

        {/* ── TAB: LETTURA ── */}
        <div style={{ display: activeTab === "lettura" ? undefined : "none" }} className="flex flex-col gap-5">

          {/* Progress bar */}
          {progress !== null ? (
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--fg-subtle)" }}>Progresso</p>
                <p className="text-xs font-bold" style={{ color: "var(--accent)" }}>{progress}%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "var(--accent)" }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: "var(--fg-subtle)" }}>
                {currentPage || "?"} / {pageCount || "?"} pagine
              </p>
            </div>
          ) : (
            <div className="h-2 rounded-full" style={{ background: "color-mix(in srgb, var(--fg-subtle) 8%, transparent)" }} />
          )}

          {/* currentPage + pageCount */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Pagina corrente" error={state?.fieldErrors?.currentPage}>
              <input
                type="number"
                min={0}
                value={currentPage}
                onChange={e => setCurrentPage(e.target.value)}
                placeholder="es. 120"
                className="w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--fg-primary)",
                  borderColor: state?.fieldErrors?.currentPage
                    ? "rgb(239 68 68)"
                    : "color-mix(in srgb, var(--accent) 18%, transparent)",
                }}
              />
            </FormField>
            <FormField label="Pagine totali" error={state?.fieldErrors?.pageCount}>
              <input
                type="number"
                min={0}
                value={pageCount}
                onChange={e => setPageCount(e.target.value)}
                placeholder="es. 320"
                className="w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--fg-primary)",
                  borderColor: state?.fieldErrors?.pageCount
                    ? "rgb(239 68 68)"
                    : "color-mix(in srgb, var(--accent) 18%, transparent)",
                }}
              />
            </FormField>
          </div>

          {/* Velocity */}
          {velocity && (
            <div
              className="flex gap-3 p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)", color: "var(--fg-muted)" }}
            >
              <span>⚡ {velocity.pagesPerDay} pag/giorno</span>
              <span style={{ color: "var(--fg-subtle)" }}>·</span>
              <span>~ {velocity.daysLeft} giorni alla fine</span>
            </div>
          )}

          {/* Date */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Inizio lettura" error={state?.fieldErrors?.startedAt}>
              <input
                type="date"
                value={startedAt}
                onChange={e => setStartedAt(e.target.value)}
                className="w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--fg-primary)",
                  borderColor: state?.fieldErrors?.startedAt
                    ? "rgb(239 68 68)"
                    : "color-mix(in srgb, var(--accent) 18%, transparent)",
                }}
              />
            </FormField>
            <FormField label="Fine lettura" error={state?.fieldErrors?.finishedAt}>
              <input
                type="date"
                value={finishedAt}
                onChange={e => setFinishedAt(e.target.value)}
                className="w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--fg-primary)",
                  borderColor: state?.fieldErrors?.finishedAt
                    ? "rgb(239 68 68)"
                    : "color-mix(in srgb, var(--accent) 18%, transparent)",
                }}
              />
            </FormField>
          </div>

          {state?.error && (
            <p className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{state.error}</p>
          )}
          <SubmitButton />
        </div>

        {/* ── TAB: DETTAGLI ── */}
        <div style={{ display: activeTab === "dettagli" ? undefined : "none" }} className="flex flex-col gap-5">

          <FormField label="Titolo *" error={state?.fieldErrors?.title}>
            <Input name="title" defaultValue={book.title} error={state?.fieldErrors?.title} />
          </FormField>

          <FormField label="Autore *" error={state?.fieldErrors?.author}>
            <Input name="author" defaultValue={book.author ?? ""} error={state?.fieldErrors?.author} />
          </FormField>

          <FormField label="Descrizione" error={state?.fieldErrors?.description}>
            <Textarea name="description" defaultValue={book.description ?? ""} placeholder="Trama del libro..." className="h-32" />
          </FormField>

          <FormField label="Analisi AI" error={state?.fieldErrors?.aiAnalysis}>
            <div className="relative group/ai">
              <Textarea 
                name="aiAnalysis" 
                value={localAiAnalysis}
                onChange={(e) => setLocalAiAnalysis(e.target.value)}
                placeholder="Analisi tematica e stilistica generata dall'AI..." 
                className="h-48 font-reading text-sm italic pr-10" 
              />
              <button
                type="button"
                disabled={isGenerating}
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const res = await generateBookAnalysis(book.id);
                    if (res.success) setLocalAiAnalysis(res.analysis);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className="absolute top-2 right-2 p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
                title="Genera analisi con Sanctuary AI"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
            {!localAiAnalysis && !isGenerating && (
              <p className="text-[10px] mt-1.5 text-indigo-400/60 font-medium">
                ✨ Chiedi all&apos;AI di analizzare questo libro in base al tuo profilo.
              </p>
            )}
          </FormField>

          {/* Metadati read-only */}
          <div className="grid grid-cols-2 gap-3">
            {book.isbn && (
              <div className="rounded-xl p-3 border" style={{ background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
                <p className="text-[9px] font-bold uppercase opacity-50 mb-0.5">ISBN</p>
                <p className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>{book.isbn}</p>
              </div>
            )}
            {book.pageCount && !pageCount && (
              <div className="rounded-xl p-3 border" style={{ background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
                <p className="text-[9px] font-bold uppercase opacity-50 mb-0.5">Pagine</p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{book.pageCount}</p>
              </div>
            )}
          </div>

          {state?.error && (
            <p className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{state.error}</p>
          )}
          <SubmitButton />

          <div className="pt-4 border-t flex flex-col items-center" style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 10%, transparent)" }}>
            <DeleteBookButton bookId={book.id} bookTitle={book.title} onDeleted={onClose} />
          </div>
        </div>
      </form>

      {/* Sezioni lazy — fuori dal form, mostrate per tab */}
      {activeTab === "lettura" && (
        <div className="mt-8 space-y-8">
          <QuoteSection bookId={book.id} bookTitle={book.title} author={book.author ?? ""} coverUrl={book.coverUrl ?? ""} />
          <ReadingSessionSection bookId={book.id} pageCount={parseInt(pageCount) || book.pageCount || null} />
        </div>
      )}
      {activeTab === "dettagli" && (
        <div className="mt-8">
          <LoanSection bookId={book.id} />
        </div>
      )}
    </div>
  );
}
