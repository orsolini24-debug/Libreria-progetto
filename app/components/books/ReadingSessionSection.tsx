"use client";

import { useState, useActionState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { createReadingSession, deleteReadingSession } from "@/app/lib/session-actions";
import { FormField, Input, Textarea } from "@/app/components/ui/FormField";

type RSession = {
  id: string;
  date: string;
  startPage: number | null;
  endPage: number | null;
  pagesRead: number | null;
  duration: number | null;
  note: string | null;
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all
        active:scale-95 disabled:opacity-50 shadow-md"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Registrando…" : "Registra sessione"}
    </button>
  );
}

export function ReadingSessionSection({
  bookId,
  pageCount,
}: {
  bookId: string;
  pageCount: number | null;
}) {
  const [open,            setOpen]           = useState(false);
  const [sessions,        setSessions]        = useState<RSession[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [state, formAction] = useActionState(createReadingSession, null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/books/${bookId}/sessions`);
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (open) loadSessions();
  }, [open, loadSessions]);

  useEffect(() => {
    if (state?.success && open) {
      loadSessions();
    }
  }, [state?.success, open, loadSessions]);

  async function handleDelete(id: string) {
    await deleteReadingSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirmId(null);
  }

  const totalPagesRead = sessions.reduce((s, r) => s + (r.pagesRead ?? 0), 0);
  const totalMinutes   = sessions.reduce((s, r) => s + (r.duration   ?? 0), 0);

  return (
    <div className="border-t pt-6" style={{ borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full mb-4 group"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100 transition-opacity">
          Sessioni di lettura
          {sessions.length > 0 && <span className="ml-2 text-amber-500">({sessions.length})</span>}
        </p>
        <span className={`text-xs transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {loading && <p className="text-[10px] text-center opacity-50 uppercase">Caricamento…</p>}

          {!loading && sessions.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 text-center border bg-white/5 border-white/5">
                <p className="font-display text-xl font-bold text-amber-500">{totalPagesRead}</p>
                <p className="text-[9px] font-bold uppercase opacity-40">pagine</p>
              </div>
              <div className="rounded-xl p-3 text-center border bg-white/5 border-white/5">
                <p className="font-display text-xl font-bold text-amber-500">
                  {totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`}
                </p>
                <p className="text-[9px] font-bold uppercase opacity-40">tempo totale</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-hide">
            {sessions.map((s) => (
              <div key={s.id} className="group/session flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-bold">{new Date(s.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</p>
                    {s.pagesRead != null && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500">+{s.pagesRead}</span>}
                  </div>
                  <p className="text-[10px] opacity-50 font-medium">
                    {s.startPage ?? "?"} → {s.endPage ?? "?"} · {s.duration ?? "?"} min
                  </p>
                  {s.note && <p className="text-xs mt-2 italic opacity-70 leading-relaxed border-l-2 border-white/10 pl-2">{s.note}</p>}
                </div>
                {deleteConfirmId === s.id ? (
                  <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => handleDelete(s.id)} className="text-[10px] font-bold text-red-400 whitespace-nowrap">Elimina</button>
                    <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] opacity-50 whitespace-nowrap">Annulla</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirmId(s.id)} className="opacity-0 group-hover/session:opacity-100 p-1 hover:text-red-400 transition-all text-xs">✕</button>
                )}
              </div>
            ))}
          </div>

          <form action={formAction} className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col gap-4">
            <input type="hidden" name="bookId" value={bookId} />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Data" error={state?.fieldErrors?.date}>
                <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} error={state?.fieldErrors?.date} />
              </FormField>
              <FormField label="Durata (min)" error={state?.fieldErrors?.duration}>
                <Input name="duration" type="number" placeholder="45" error={state?.fieldErrors?.duration} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Da pag." error={state?.fieldErrors?.startPage}>
                <Input name="startPage" type="number" placeholder="1" error={state?.fieldErrors?.startPage} />
              </FormField>
              <FormField label="A pag." error={state?.fieldErrors?.endPage}>
                <Input name="endPage" type="number" placeholder={pageCount?.toString()} error={state?.fieldErrors?.endPage} />
              </FormField>
            </div>

            <FormField label="Note" error={state?.fieldErrors?.note}>
              <Textarea name="note" placeholder="Riflessioni..." error={state?.fieldErrors?.note} />
            </FormField>

            {state?.error && (
              <p className="text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                {state.error}
              </p>
            )}
            
            <AddButton />
          </form>
        </div>
      )}
    </div>
  );
}
