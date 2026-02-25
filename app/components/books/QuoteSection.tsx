"use client";

import { useState, useActionState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { createQuote, deleteQuote } from "@/app/lib/quote-actions";
import { FormField, Input, Textarea } from "@/app/components/ui/FormField";

type NoteType = "QUOTE" | "NOTE";

type QuoteItem = {
  id: string;
  type: NoteType;
  text: string;
  page: number | null;
  chapter: string | null;
  createdAt: string;
};

function AddButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Salvataggio…" : label}
    </button>
  );
}

export function QuoteSection({ bookId }: { bookId: string }) {
  const [open,    setOpen]    = useState(false);
  const [tab,     setTab]     = useState<NoteType>("QUOTE");
  const [items,   setItems]   = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [state, formAction] = useActionState(createQuote, null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/books/${bookId}/quotes`);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (open) loadItems();
  }, [open, loadItems]);

  useEffect(() => {
    if (state?.success && open) loadItems();
  }, [state?.success, open, loadItems]);

  async function handleDelete(id: string) {
    if (!confirm("Eliminare?")) return;
    await deleteQuote(id);
    setItems((prev) => prev.filter((q) => q.id !== id));
  }

  const quotes = items.filter((i) => i.type === "QUOTE");
  const notes  = items.filter((i) => i.type === "NOTE");
  const visible = tab === "QUOTE" ? quotes : notes;

  return (
    <div className="border-t pt-6" style={{ borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
      <button onClick={() => setOpen((p) => !p)} className="flex items-center justify-between w-full mb-4 group">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100 transition-opacity">
          Citazioni & Appunti
          {items.length > 0 && <span className="ml-2 text-amber-500">({items.length})</span>}
        </p>
        <span className={`text-xs transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
            {(["QUOTE", "NOTE"] as NoteType[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 text-[10px] font-bold uppercase py-2 rounded-lg transition-all
                  ${tab === t ? 'bg-amber-500 text-black' : 'opacity-40 hover:opacity-100'}`}>
                {t === "QUOTE" ? `Citazioni (${quotes.length})` : `Appunti (${notes.length})`}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto scrollbar-hide">
            {visible.map((q) => (
              <div key={q.id} className="group/item relative rounded-xl p-4 border border-white/5 bg-white/5">
                <p className={`text-sm leading-relaxed pr-6 ${tab === "QUOTE" ? "italic font-serif" : ""}`}>
                  {tab === "QUOTE" ? `"${q.text}"` : q.text}
                </p>
                {(q.page || q.chapter) && (
                  <p className="text-[10px] mt-2 opacity-40 font-bold uppercase tracking-wider">
                    {q.chapter ?? ""}{q.page && q.chapter ? " · " : ""}{q.page ? `p. ${q.page}` : ""}
                  </p>
                )}
                <button onClick={() => handleDelete(q.id)} className="absolute top-3 right-3 opacity-0 group-hover/item:opacity-100 text-xs hover:text-red-400 transition-all">✕</button>
              </div>
            ))}
            {!loading && visible.length === 0 && (
              <p className="text-xs text-center py-4 opacity-40 italic">Nessun elemento presente.</p>
            )}
          </div>

          <form action={formAction} className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col gap-4">
            <input type="hidden" name="bookId" value={bookId} />
            <input type="hidden" name="type" value={tab} />
            
            <FormField label={tab === "QUOTE" ? "Citazione *" : "Appunto *"} error={state?.fieldErrors?.text}>
              <Textarea name="text" placeholder="..." error={state?.fieldErrors?.text} />
            </FormField>

            <div className="flex gap-4">
              <FormField label="Capitolo" error={state?.fieldErrors?.chapter} className="flex-[2]">
                <Input name="chapter" placeholder="Cap. I" error={state?.fieldErrors?.chapter} />
              </FormField>
              <FormField label="Pagina" error={state?.fieldErrors?.page} className="flex-1">
                <Input name="page" type="number" placeholder="42" error={state?.fieldErrors?.page} />
              </FormField>
            </div>

            {state?.error && (
              <p className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                {state.error}
              </p>
            )}
            
            <AddButton label={tab === "QUOTE" ? "Aggiungi citazione" : "Salva appunto"} />
          </form>
        </div>
      )}
    </div>
  );
}
