"use client";

import { FormField, Input, Textarea } from "@/app/components/ui/FormField";
import { Sparkles, Loader2 } from "lucide-react";
import { DeleteBookButton } from "../DeleteBookButton";

interface BookDettagliProps {
  title: string;
  author: string;
  description: string;
  aiAnalysis: string;
  setAiAnalysis: (v: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  bookId: string;
  bookTitle: string;
  onClose: () => void;
  isbn?: string | null;
  pageCount?: number | null;
  fieldErrors?: Record<string, string[]>;
}

export function BookDettagli({
  title, author, description, aiAnalysis, setAiAnalysis, isGenerating, onGenerate,
  bookId, bookTitle, onClose, isbn, pageCount, fieldErrors
}: BookDettagliProps) {
  return (
    <div className="flex flex-col gap-5">
      <FormField label="Titolo *" error={fieldErrors?.title}>
        <Input name="title" defaultValue={title} error={fieldErrors?.title} />
      </FormField>

      <FormField label="Autore *" error={fieldErrors?.author}>
        <Input name="author" defaultValue={author} error={fieldErrors?.author} />
      </FormField>

      <FormField label="Descrizione" error={fieldErrors?.description}>
        <Textarea name="description" defaultValue={description} placeholder="Trama del libro..." className="h-32" />
      </FormField>

      <FormField label="Analisi AI" error={fieldErrors?.aiAnalysis}>
        <div className="relative group/ai">
          <Textarea 
            name="aiAnalysis" value={aiAnalysis} onChange={(e) => setAiAnalysis(e.target.value)}
            placeholder="Analisi tematica e stilistica generata dall'AI..." className="h-48 font-reading text-sm italic pr-10" 
          />
          <button
            type="button" disabled={isGenerating} onClick={onGenerate}
            className="absolute top-2 right-2 p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
            title="Genera analisi"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        {isbn && (
          <div className="rounded-xl p-3 border" style={{ background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
            <p className="text-[9px] font-bold uppercase opacity-50 mb-0.5">ISBN</p>
            <p className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>{isbn}</p>
          </div>
        )}
        {pageCount && (
          <div className="rounded-xl p-3 border" style={{ background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
            <p className="text-[9px] font-bold uppercase opacity-50 mb-0.5">Pagine Google</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{pageCount}</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t flex flex-col items-center" style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 10%, transparent)" }}>
        <DeleteBookButton bookId={bookId} bookTitle={bookTitle} onDeleted={onClose} />
      </div>
    </div>
  );
}
