"use client";

import { useState, useActionState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { createLoan, returnLoan, deleteLoan } from "@/app/lib/loan-actions";

type Loan = {
  id: string;
  borrower: string;
  loanedAt: string;
  returnedAt: string | null;
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
      {pending ? "Registrando…" : "Registra prestito"}
    </button>
  );
}

export function LoanSection({ bookId }: { bookId: string }) {
  const [open,    setOpen]    = useState(false);
  const [loans,   setLoans]   = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  const [state, formAction] = useActionState(createLoan, null);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/books/${bookId}/loans`);
      const data = await res.json();
      if (Array.isArray(data)) setLoans(data);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (open) loadLoans();
  }, [open, loadLoans]);

  useEffect(() => {
    if (state?.success && open) loadLoans();
  }, [state?.success, open, loadLoans]);

  async function handleReturn(id: string) {
    await returnLoan(id);
    setLoans((prev) =>
      prev.map((l) => l.id === id ? { ...l, returnedAt: new Date().toISOString() } : l)
    );
  }

  async function handleDelete(id: string) {
    await deleteLoan(id);
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }

  const active   = loans.filter((l) => !l.returnedAt);
  const returned = loans.filter((l) => l.returnedAt);

  const labelStyle    = { color: "var(--fg-subtle)", letterSpacing: "0.08em" };
  const sectionBorder = { borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" };

  return (
    <div className="border-t pt-4" style={sectionBorder}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-subtle)" }}>
          Prestiti
          {active.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
              style={{ background: "color-mix(in srgb,#f59e0b 20%,transparent)", color: "#f59e0b" }}>
              {active.length} attivi
            </span>
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

          {/* Prestiti attivi */}
          {!loading && active.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-subtle)" }}>
                In prestito
              </p>
              {active.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{
                    background:  "color-mix(in srgb, #f59e0b 6%, var(--bg-elevated))",
                    borderColor: "color-mix(in srgb, #f59e0b 25%, transparent)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--fg-primary)" }}>{loan.borrower}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                      dal {new Date(loan.loanedAt).toLocaleDateString("it-IT")}
                    </p>
                    {loan.note && (
                      <p className="text-xs mt-1 italic" style={{ color: "var(--fg-muted)" }}>{loan.note}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleReturn(loan.id)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                      style={{ background: "color-mix(in srgb,#22c55e 20%,transparent)", color: "#4ade80" }}
                    >
                      Restituito
                    </button>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="text-[10px] text-center transition-colors"
                      style={{ color: "var(--fg-subtle)" }}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prestiti restituiti */}
          {!loading && returned.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-subtle)" }}>
                Restituiti
              </p>
              {returned.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg border"
                  style={{
                    background:  "var(--bg-elevated)",
                    borderColor: "color-mix(in srgb, var(--fg-subtle) 15%, transparent)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      <span className="line-through">{loan.borrower}</span>
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>
                      {new Date(loan.loanedAt).toLocaleDateString("it-IT")} →{" "}
                      {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString("it-IT") : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(loan.id)}
                    className="text-[10px] shrink-0"
                    style={{ color: "var(--fg-subtle)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && loans.length === 0 && (
            <p className="text-xs text-center italic py-1" style={{ color: "var(--fg-subtle)" }}>
              Nessun prestito registrato.
            </p>
          )}

          {/* Form nuovo prestito */}
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="bookId" value={bookId} />
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Prestato a *</label>
              <input
                name="borrower"
                type="text"
                required
                placeholder="Nome o cognome"
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Data prestito</label>
                <input
                  name="loanedAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className={fieldClass}
                  style={fieldStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>Nota</label>
              <input
                name="note"
                type="text"
                placeholder="Es. da restituire entro aprile"
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
            {state?.error && (
              <p className="text-xs px-3 py-1.5 rounded-lg border"
                style={{ color: "#f87171", background: "color-mix(in srgb,#ef4444 8%,var(--bg-elevated))", borderColor: "color-mix(in srgb,#ef4444 30%,transparent)" }}>
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
