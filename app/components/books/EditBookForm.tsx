"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateBook } from "@/app/lib/book-actions";
import { STATUS_OPTIONS, FORMAT_OPTIONS } from "@/app/lib/constants";
import type { Book } from "@/app/generated/prisma/client";
import { SeriesPanel } from "./SeriesPanel";
import { FormField, Input, Select, Textarea } from "@/app/components/ui/FormField";
import { DeleteBookButton } from "./DeleteBookButton";
import { StarRating } from "./StarRating";
import dynamic from "next/dynamic";

// Sezioni dinamiche
const ReadingSessionSection = dynamic(() => import("./ReadingSessionSection").then(m => m.ReadingSessionSection));
const LoanSection = dynamic(() => import("./LoanSection").then(m => m.LoanSection));
const QuoteSection = dynamic(() => import("./QuoteSection").then(m => m.QuoteSection));

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl text-sm font-semibold shadow-xl transition-all active:scale-95
        disabled:opacity-50"
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
  const [status, setStatus] = useState<string>(book.status);
  const [series, setSeries] = useState<string>(book.series ?? "");
  const [formats, setFormats] = useState<string[]>(book.formats?.split(",").filter(Boolean) ?? []);

  useEffect(() => {
    if (state?.success) {
      if (book.status !== "READ" && status === "READ") onCelebrate?.();
      router.refresh();
      onClose();
    }
  }, [state?.success, status, book.status, onCelebrate, router, onClose]);

  const toggleFormat = (fmt: string) => {
    setFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]);
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header Info */}
      <div className="flex gap-4 items-start p-4 rounded-2xl bg-white/5 border border-white/5">
        {book.coverUrl && (
          <Image src={book.coverUrl} alt="" width={60} height={84} unoptimized className="rounded-lg shadow-lg" />
        )}
        <div className="min-w-0">
          <h3 className="font-display font-bold text-lg leading-tight truncate">{book.title}</h3>
          <p className="opacity-60 text-sm truncate">{book.author}</p>
          <div className="mt-2 flex gap-2">
             <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/20 uppercase">
               {book.isbn || "NO ISBN"}
             </span>
          </div>
        </div>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="formats" value={formats.join(",")} />

        <FormField label="Titolo *" error={state?.fieldErrors?.title}>
          <Input name="title" defaultValue={book.title} error={state?.fieldErrors?.title} />
        </FormField>

        <FormField label="Autore *" error={state?.fieldErrors?.author}>
          <Input name="author" defaultValue={book.author ?? ""} error={state?.fieldErrors?.author} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Stato" error={state?.fieldErrors?.status}>
            <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </FormField>

          <FormField label="Voto" error={state?.fieldErrors?.rating}>
            <div className="pt-1">
              <StarRating name="rating" defaultValue={book.rating ?? 0} size="md" />
            </div>
          </FormField>
        </div>

        <div className="flex gap-4">
          <FormField label="Serie" error={state?.fieldErrors?.series} className="flex-[3]">
            <Input name="series" value={series} onChange={(e) => setSeries(e.target.value)} placeholder="Saga..." />
          </FormField>
          <FormField label="N°" error={state?.fieldErrors?.seriesOrder} className="flex-1">
            <Input name="seriesOrder" type="number" defaultValue={book.seriesOrder ?? ""} />
          </FormField>
        </div>

        {series && onNavigateToBook && (
          <SeriesPanel seriesName={series} currentBookId={book.id} onNavigate={onNavigateToBook} />
        )}

        <FormField label="Tag" error={state?.fieldErrors?.tags}>
          <Input name="tags" defaultValue={book.tags ?? ""} placeholder="separati da virgola..." />
        </FormField>

        <FormField label="Formati">
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => toggleFormat(value)}
                className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase transition-all
                  ${formats.includes(value) ? 'bg-amber-500 text-black border-amber-500' : 'opacity-40 border-white/10'}`}>
                {label}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Nota" error={state?.fieldErrors?.comment}>
          <Textarea name="comment" defaultValue={book.comment ?? ""} error={state?.fieldErrors?.comment} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Inizio Lettura" error={state?.fieldErrors?.startedAt}>
            <Input name="startedAt" type="date" defaultValue={book.startedAt ? new Date(book.startedAt).toISOString().slice(0, 10) : ""} />
          </FormField>
          <FormField label="Fine Lettura" error={state?.fieldErrors?.finishedAt}>
            <Input name="finishedAt" type="date" defaultValue={book.finishedAt ? new Date(book.finishedAt).toISOString().slice(0, 10) : ""} />
          </FormField>
        </div>

        {state?.error && (
          <p className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {state.error}
          </p>
        )}

        <SubmitButton />
        
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center">
          <DeleteBookButton bookId={book.id} bookTitle={book.title} onDeleted={onClose} />
        </div>
      </form>

      {/* Sezioni di Tracking */}
      <div className="space-y-12">
        <QuoteSection bookId={book.id} bookTitle={book.title} author={book.author ?? ""} coverUrl={book.coverUrl ?? ""} />
        <ReadingSessionSection bookId={book.id} pageCount={book.pageCount} />
        <LoanSection bookId={book.id} />
      </div>
    </div>
  );
}
