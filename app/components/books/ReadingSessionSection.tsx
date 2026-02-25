"use client";

import { useState, useActionState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { createReadingSession, deleteReadingSession } from "@/app/lib/session-actions";

type RSession = {
  id: string;
  date: string;
  startPage: number | null;
  endPage: number | null;
  pagesRead: number | null;
  duration: number | null;
  note: string | null;
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
  const [open,     setOpen]    = useState(false);
  const [sessions, setSessions] = useState<RSession[]>([]);
  const [loading,  setLoading]  = useState(false);

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
    if (state?.success && open) loadSessions();
  }, [state?.success, open, loadSessions]);

  async function handleDelete(id: string) {
    await deleteReadingSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  const totalPagesRead = sessions.reduce((s, r) => s + (r.pagesRead ?? 0), 0);
  const totalMinutes   = sessions.reduce((s, r) => s + (r.duration   ?? 0), 0);

  const labelStyle    = { color: "var(--fg-subtle)", letterSpacing: "0.08em" };
  const sectionBorder = { borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" };

  return (
    <div className="border-t pt-4" style={sectionBorder}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-subtle)" }}>
          Sessioni di lettura
          {sessions.length > 0 && !loading && (
            <span style={{ color: "var(--accent)" }}> ({sessions.length})</span>
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
          {loading && (
            <p className="text-xs text-center py-2" style={{ color: "var(--fg-subtle)" }}>Caricamento…</p>
          )}

          {/* Riepilogo statistiche sessioni */}
          {!loading && sessions.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {totalPagesRead > 0 && (
                <div className="rounded-lg p-2.5 text-center border"
                  style={{ background: "color-mix(in srgb,var(--accent) 8%,var(--bg-elevated))", borderColor: "color-mix(in srgb,var(--accent) 15%,transparent)" }}>
                  <p className="font-display text-lg font-bold" style={{ color: "var(--accent)" }}>{totalPagesRead}</p>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>pagine</p>
                </div>
              )}
              {totalMinutes > 0 && (
                <div className="rounded-lg p-2.5 text-center border"
                  style={{ background: "color-mix(in srgb,var(--accent) 8%,var(--bg-elevated))", borderColor: "color-mix(in srgb,var(--accent) 15%,transparent)" }}>
                  <p className="font-display text-lg font-bold" style={{ color: "var(--accent)" }}>
                    {totalMinutes >= 60
                      ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                      : `${totalMinutes}m`}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>tempo totale</p>
                </div>
              )}
            </div>
          )}

          {/* Lista sessioni */}
          {!loading && sessions.length > 0 && (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="group/session flex items-start gap-2 p-2.5 rounded-lg border"
                  style={{
                    background:  "var(--bg-elevated)",
                    borderColor: "color-mix(in srgb, var(--fg-subtle) 15%, transparent)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium" style={{ color: "var(--fg-primary)" }}>
                        {new Date(s.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                      </p>
                      {s.pagesRead != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "color-mix(in srgb,var(--accent) 15%,transparent)", color: "var(--accent)" }}>
                          +{s.pagesRead} pag.
                        </span>
                      )}
                      {s.duration != null && (
                        <span className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>
                          {s.duration}min
                        </span>
                      )}
                    </div>
                    {(s.startPage || s.endPage) && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                        p. {s.startPage ?? "?"} → {s.endPage ?? "?"}
                      </p>
                    )}
                    {s.note && (
                      <p className="text-xs mt-1 italic line-clamp-2" style={{ color: "var(--fg-muted)" }}>{s.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="opacity-0 group-hover/session:opacity-100 text-xs shrink-0 transition-opacity"
                    style={{ color: "var(--fg-subtle)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <p className="text-xs text-center italic py-1" style={{ color: "var(--fg-subtle)" }}>
              Nessuna sessione registrata.
            </p>
          )}

          {/* Form nuova sessione */}
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="bookId" value={bookId} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Data</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Durata (min)</label>
                <input
                  name="duration"
                  type="number"
                  min={1}
                  placeholder="Es. 45"
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
                  Da pag.
                </label>
                <input
                  name="startPage"
                  type="number"
                  min={1}
                  max={pageCount ?? undefined}
                  placeholder="1"
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
                  A pag.
                </label>
                <input
                  name="endPage"
                  type="number"
                  min={1}
                  max={pageCount ?? undefined}
                  placeholder={pageCount ? String(pageCount) : ""}
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Note sessione</label>
              <textarea
                name="note"
                rows={2}
                placeholder="Commenti, riflessioni, punti salienti…"
                className={`${fieldClass} resize-none`}
                style={fieldStyle}
              />
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
