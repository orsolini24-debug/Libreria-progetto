"use client";

import { useState, useActionState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { createQuote, deleteQuote } from "@/app/lib/quote-actions";

type Quote = {
  id: string;
  text: string;
  page: number | null;
  chapter: string | null;
  createdAt: string;
};

const fieldClass = `w-full border rounded-xl px-3 py-2.5 text-sm
  focus:outline-none focus:ring-2 transition-colors`;
const fieldStyle = {
  background:  "var(--bg-input)",
  borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
  color:       "var(--fg-primary)",
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2 rounded-xl text-sm font-semibold transition-all duration-150
        active:scale-95 disabled:opacity-50"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Salvataggio…" : "Aggiungi citazione"}
    </button>
  );
}

export function QuoteSection({ bookId }: { bookId: string }) {
  const [open,    setOpen]    = useState(true);
  const [quotes,  setQuotes]  = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  const [state, formAction, isPending] = useActionState(createQuote, null);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/books/${bookId}/quotes`);
      const data = await res.json();
      if (Array.isArray(data)) setQuotes(data);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  // Carica quando si apre la sezione
  useEffect(() => {
    if (open) loadQuotes();
  }, [open, loadQuotes]);

  // Ricarica dopo aggiunta con successo
  useEffect(() => {
    if (state?.success && open) loadQuotes();
  }, [state?.success, open, loadQuotes]);

  async function handleDelete(id: string) {
    await deleteQuote(id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  const labelStyle   = { color: "var(--fg-subtle)", letterSpacing: "0.08em" };
  const sectionBorder = { borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" };

  return (
    <div className="border-t pt-4" style={sectionBorder}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-subtle)" }}>
          Citazioni{quotes.length > 0 && !loading
            ? <span style={{ color: "var(--accent)" }}> ({quotes.length})</span>
            : null}
        </p>
        <span
          className="text-xs transition-transform duration-200"
          style={{ color: "var(--fg-subtle)", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4">
          {loading && (
            <p className="text-xs text-center py-2" style={{ color: "var(--fg-subtle)" }}>Caricamento…</p>
          )}

          {/* Lista citazioni */}
          {!loading && quotes.length > 0 && (
            <div className="flex flex-col gap-3">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="relative group/quote rounded-xl p-3 border"
                  style={{
                    background:  "color-mix(in srgb, var(--accent) 5%, var(--bg-elevated))",
                    borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                  }}
                >
                  <p className="font-reading text-sm italic leading-relaxed pr-5" style={{ color: "var(--fg-primary)" }}>
                    &ldquo;{q.text}&rdquo;
                  </p>
                  {(q.page || q.chapter) && (
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--fg-subtle)" }}>
                      {q.chapter ?? ""}{q.page && q.chapter ? " · " : ""}{q.page ? `p. ${q.page}` : ""}
                    </p>
                  )}
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover/quote:opacity-100
                      text-xs px-1.5 py-0.5 rounded transition-opacity"
                    style={{ color: "#f87171" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && quotes.length === 0 && (
            <p className="text-xs text-center italic py-1" style={{ color: "var(--fg-subtle)" }}>
              Nessuna citazione ancora.
            </p>
          )}

          {/* Form nuova citazione */}
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="bookId" value={bookId} />
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Testo *</label>
              <textarea
                name="text"
                rows={3}
                required
                placeholder="Inserisci la citazione…"
                className={`${fieldClass} resize-none`}
                style={fieldStyle}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Capitolo</label>
                <input
                  name="chapter"
                  type="text"
                  placeholder="Es. Capitolo III"
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Pagina</label>
                <input
                  name="page"
                  type="number"
                  min={1}
                  placeholder="42"
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
            </div>
            {state?.error && (
              <p className="text-xs px-3 py-1.5 rounded-lg border"
                style={{ color: "#f87171", background: "color-mix(in srgb,#ef4444 8%,var(--bg-elevated))", borderColor: "color-mix(in srgb,#ef4444 30%,transparent)" }}>
                {state.error}
              </p>
            )}
            {state?.success && (
              <p className="text-xs" style={{ color: "#4ade80" }}>{state.success}</p>
            )}
            <AddButton />
          </form>
        </div>
      )}
    </div>
  );
}
