"use client";

import { useState, useActionState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { createQuote, deleteQuote } from "@/app/lib/quote-actions";

type NoteType = "QUOTE" | "NOTE";

type QuoteItem = {
  id: string;
  type: NoteType;
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

function AddButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2 rounded-xl text-sm font-semibold transition-all duration-150
        active:scale-95 disabled:opacity-50"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Salvataggio…" : label}
    </button>
  );
}

export function QuoteSection({ bookId }: { bookId: string }) {
  const [open,    setOpen]    = useState(true);
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
    await deleteQuote(id);
    setItems((prev) => prev.filter((q) => q.id !== id));
  }

  const quotes = items.filter((i) => i.type === "QUOTE");
  const notes  = items.filter((i) => i.type === "NOTE");
  const visible = tab === "QUOTE" ? quotes : notes;

  const labelStyle    = { color: "var(--fg-subtle)", letterSpacing: "0.08em" };
  const sectionBorder = { borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" };

  return (
    <div className="border-t pt-4" style={sectionBorder}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-subtle)" }}>
          Citazioni & Appunti
          {items.length > 0 && !loading && (
            <span style={{ color: "var(--accent)" }}> ({items.length})</span>
          )}
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
          {/* Tab selector */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
            {(["QUOTE", "NOTE"] as NoteType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-all duration-150"
                style={tab === t
                  ? { background: "var(--accent)", color: "var(--accent-on)" }
                  : { color: "var(--fg-muted)" }
                }
              >
                {t === "QUOTE" ? `📝 Citazioni (${quotes.length})` : `✏️ Appunti (${notes.length})`}
              </button>
            ))}
          </div>

          {loading && (
            <p className="text-xs text-center py-2" style={{ color: "var(--fg-subtle)" }}>Caricamento…</p>
          )}

          {/* Lista */}
          {!loading && visible.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {visible.map((q) => (
                <div
                  key={q.id}
                  className="relative group/item rounded-xl p-3 border"
                  style={{
                    background:  tab === "QUOTE"
                      ? "color-mix(in srgb, var(--accent) 5%, var(--bg-elevated))"
                      : "color-mix(in srgb, #f59e0b 5%, var(--bg-elevated))",
                    borderColor: tab === "QUOTE"
                      ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                      : "color-mix(in srgb, #f59e0b 20%, transparent)",
                  }}
                >
                  <p
                    className={`text-sm leading-relaxed pr-5 ${tab === "QUOTE" ? "italic" : ""}`}
                    style={{ color: "var(--fg-primary)" }}
                  >
                    {tab === "QUOTE" ? `"${q.text}"` : q.text}
                  </p>
                  {(q.page || q.chapter) && (
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--fg-subtle)" }}>
                      {q.chapter ?? ""}{q.page && q.chapter ? " · " : ""}{q.page ? `p. ${q.page}` : ""}
                    </p>
                  )}
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100
                      text-xs px-1 transition-opacity"
                    style={{ color: "#f87171" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && visible.length === 0 && (
            <p className="text-xs text-center italic py-1" style={{ color: "var(--fg-subtle)" }}>
              {tab === "QUOTE" ? "Nessuna citazione ancora." : "Nessun appunto ancora."}
            </p>
          )}

          {/* Form */}
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="bookId" value={bookId} />
            <input type="hidden" name="type" value={tab} />
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
                {tab === "QUOTE" ? "Testo citazione *" : "Appunto *"}
              </label>
              <textarea
                name="text"
                rows={3}
                required
                placeholder={tab === "QUOTE"
                  ? "Inserisci la citazione dell'autore…"
                  : "Scrivi il tuo appunto, riflessione o commento…"}
                className={`${fieldClass} resize-none`}
                style={fieldStyle}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Capitolo</label>
                <input name="chapter" type="text" placeholder="Es. Cap. III" className={fieldClass} style={fieldStyle} />
              </div>
              <div className="w-20">
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Pagina</label>
                <input name="page" type="number" min={1} placeholder="42" className={fieldClass} style={fieldStyle} />
              </div>
            </div>
            {state?.error && (
              <p className="text-xs px-3 py-1.5 rounded-lg border"
                style={{ color: "#f87171", background: "color-mix(in srgb,#ef4444 8%,var(--bg-elevated))", borderColor: "color-mix(in srgb,#ef4444 30%,transparent)" }}>
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
