"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateBook } from "@/app/lib/book-actions";
import type { Book } from "@/app/generated/prisma/client";
import { BookStatus } from "@/app/generated/prisma/client";
import { BookInfoOverlay } from "./BookInfoOverlay";
import { generateBookAnalysis } from "@/app/lib/ai/analysis-action";
import { CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";

// Nuovi Sub-componenti
import { BookScheda } from "./edit/BookScheda";
import { BookLettura } from "./edit/BookLettura";
import { BookDettagli } from "./edit/BookDettagli";

// Sezioni dinamiche
const ReadingSessionSection = dynamic(() => import("./ReadingSessionSection").then(m => m.ReadingSessionSection));
const LoanSection = dynamic(() => import("./LoanSection").then(m => m.LoanSection));
const QuoteSection = dynamic(() => import("./QuoteSection").then(m => m.QuoteSection));

export type Tab = "scheda" | "lettura" | "dettagli";

export const STATUS_VISUAL = [
  { value: "TO_READ",   label: "Da leggere", icon: "📚" },
  { value: "READING",   label: "In lettura", icon: "📖" },
  { value: "READ",      label: "Letto",      icon: "✅" },
  { value: "WISHLIST",  label: "Wishlist",   icon: "🔖" },
  { value: "ABANDONED", label: "Abbandonato",icon: "🚫" },
];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function isoDate(d: Date | string) { return new Date(d).toISOString().slice(0, 10); }

export function EditBookForm({ book, onClose, onCelebrate, onNavigateToBook }: { book: Book; onClose: () => void; onCelebrate?: () => void; onNavigateToBook?: (id: string) => void; }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateBook.bind(null, book.id), null);

  const [activeTab,   setActiveTab]   = useState<Tab>("scheda");
  const [status,      setStatus]      = useState<BookStatus>(book.status);
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
  const [showSuccess, setShowSuccess] = useState(false);

  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      if (book.status !== "READ" && status === "READ") onCelebrate?.();
      router.refresh(); // #21: Forza aggiornamento cache client
      const t = setTimeout(() => { setShowSuccess(false); onClose(); }, 1500);
      return () => clearTimeout(t);
    }
  }, [state?.success, status, book.status, onCelebrate, router, onClose]);

  useEffect(() => {
    if (!ratingPrompt) return;
    const t = setTimeout(() => setRatingPrompt(false), 8000);
    return () => clearTimeout(t);
  }, [ratingPrompt]);

  function handleStatusChange(newStatus: BookStatus) {
    setStatus(newStatus);
    if (newStatus === "READING") { if (!startedAt) setStartedAt(todayISO()); setFinishedAt(""); }
    if (newStatus === "READ") { if (!finishedAt) setFinishedAt(todayISO()); if (!book.rating) setRatingPrompt(true); }
  }

  const progress = useMemo(() => {
    const cp = parseInt(currentPage), pc = parseInt(pageCount);
    if (!cp || !pc || cp <= 0 || pc <= 0) return null;
    return Math.min(100, Math.round((cp / pc) * 100));
  }, [currentPage, pageCount]);

  const velocity = useMemo(() => {
    const cp = parseInt(currentPage), pc = parseInt(pageCount);
    if (!startedAt || !cp || !pc || cp <= 0 || pc <= 0) return null;
    const days = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 86_400_000));
    const pagesPerDay = cp / days;
    if (pagesPerDay < 0.1) return null;
    const daysLeft = Math.round((pc - cp) / pagesPerDay);
    return { pagesPerDay: Math.round(pagesPerDay * 10) / 10, daysLeft };
  }, [startedAt, currentPage, pageCount]);

  const hasErrors = useMemo(() => {
    if (!state?.fieldErrors) return { scheda: false, lettura: false, dettagli: false };
    const errs = state.fieldErrors;
    return {
      scheda: !!(errs.status || errs.rating || errs.series || errs.seriesOrder || errs.tags || errs.comment),
      lettura: !!(errs.currentPage || errs.pageCount || errs.startedAt || errs.finishedAt),
      dettagli: !!(errs.title || errs.author || errs.description || errs.aiAnalysis)
    };
  }, [state?.fieldErrors]);

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
        <h2 className="font-display font-bold text-xl mb-2" style={{ color: "var(--fg-primary)" }}>Modifiche salvate!</h2>
        <p className="text-sm opacity-60" style={{ color: "var(--fg-muted)" }}>La scheda del libro è stata aggiornata.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      <div className="flex gap-4 items-start p-4 rounded-2xl mb-4" style={{ background: "var(--bg-elevated)", border: "1px solid color-mix(in srgb, var(--fg-subtle) 10%, transparent)" }}>
        {book.coverUrl && <Image src={book.coverUrl} alt="" width={60} height={84} unoptimized className="rounded-lg shadow-lg shrink-0" />}
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-lg leading-tight" style={{ color: "var(--fg-primary)" }}>{book.title}</h3>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>{book.author}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {book.googleId && <a href={`https://books.google.com/books?id=${book.googleId}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-2 py-0.5 rounded-md border transition-opacity hover:opacity-80 flex items-center gap-1" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)", background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}>Google Books ↗</a>}
            {(book.description || book.aiAnalysis) && <button type="button" onClick={() => setShowOverlay(true)} className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/10 bg-white/5 transition-all hover:bg-white/10 flex items-center gap-1" style={{ color: "var(--fg-muted)" }}>Info & Analisi</button>}
          </div>
        </div>
      </div>

      <BookInfoOverlay isOpen={showOverlay} onClose={() => setShowOverlay(false)} title={book.title} author={book.author} description={book.description} aiAnalysis={book.aiAnalysis} />

      <div className="flex mb-5 border-b" style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 15%, transparent)" }}>
        {(["scheda", "lettura", "dettagli"] as Tab[]).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className="flex-1 text-xs font-bold uppercase py-2.5 border-b-2 transition-all -mb-px relative" style={{ borderColor: activeTab === tab ? "var(--accent)" : "transparent", color: activeTab === tab ? "var(--accent)" : "var(--fg-subtle)" }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {hasErrors[tab] && <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />}
          </button>
        ))}
      </div>

      <form action={formAction}>
        <input type="hidden" name="status"      value={status} />
        <input type="hidden" name="tags"        value={tags.join(",")} />
        <input type="hidden" name="formats"     value={formats.join(",")} />
        <input type="hidden" name="series"      value={series} />
        <input type="hidden" name="currentPage" value={currentPage} />
        <input type="hidden" name="pageCount"   value={pageCount} />
        <input type="hidden" name="startedAt"   value={startedAt} />
        <input type="hidden" name="finishedAt"  value={finishedAt} />

        {activeTab === "scheda" && (
          <BookScheda 
            status={status} setStatus={setStatus} rating={book.rating ?? 0} formats={formats} 
            toggleFormat={(f) => setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
            series={series} setSeries={setSeries} seriesOrder={book.seriesOrder} tags={tags} setTags={setTags} 
            tagInput={tagInput} setTagInput={setTagInput} comment={book.comment ?? ""} ratingPrompt={ratingPrompt}
            handleStatusChange={handleStatusChange} handleTagKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                e.preventDefault(); const t = tagInput.trim().replace(/,+/g, "").trim();
                if (t && !tags.includes(t)) setTags([...tags, t]); setTagInput("");
              }
            }}
            tagInputRef={tagInputRef} fieldErrors={state?.fieldErrors ?? undefined} bookId={book.id} onNavigateToBook={onNavigateToBook}
          />
        )}

        {activeTab === "lettura" && (
          <BookLettura 
            progress={progress} currentPage={currentPage} setCurrentPage={setCurrentPage} 
            pageCount={pageCount} setPageCount={setPageCount} startedAt={startedAt} setStartedAt={setStartedAt}
            finishedAt={finishedAt} setFinishedAt={setFinishedAt} velocity={velocity} fieldErrors={state?.fieldErrors ?? undefined}
          />
        )}

        {activeTab === "dettagli" && (
          <BookDettagli 
            title={book.title} author={book.author ?? ""} description={book.description ?? ""} aiAnalysis={localAiAnalysis}
            setAiAnalysis={setLocalAiAnalysis} isGenerating={isGenerating} onGenerate={async () => {
              setIsGenerating(true); try { const res = await generateBookAnalysis(book.id); if (res.success) setLocalAiAnalysis(res.analysis); } finally { setIsGenerating(false); }
            }}
            bookId={book.id} bookTitle={book.title} onClose={onClose} isbn={book.isbn} pageCount={book.pageCount} fieldErrors={state?.fieldErrors ?? undefined}
          />
        )}

        <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold shadow-xl transition-all active:scale-95 disabled:opacity-50 mt-6" style={{ background: "var(--accent)", color: "var(--accent-on)" }}>Salva modifiche</button>
      </form>

      {activeTab === "lettura" && (
        <div className="mt-8 space-y-8">
          <QuoteSection bookId={book.id} bookTitle={book.title} author={book.author ?? ""} coverUrl={book.coverUrl ?? ""} />
          <ReadingSessionSection bookId={book.id} pageCount={parseInt(pageCount) || book.pageCount || null} />
        </div>
      )}
      {activeTab === "dettagli" && <div className="mt-8"><LoanSection bookId={book.id} /></div>}
    </div>
  );
}
