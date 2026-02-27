"use client";

import { useState, useActionState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { createLoan, returnLoan, deleteLoan } from "@/app/lib/loan-actions";
import { FormField, Input } from "@/app/components/ui/FormField";

type Loan = {
  id: string;
  borrower: string;
  loanedAt: string;
  returnedAt: string | null;
  note: string | null;
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Registrando…" : "Registra prestito"}
    </button>
  );
}

export function LoanSection({ bookId }: { bookId: string }) {
  const [open,            setOpen]           = useState(false);
  const [loans,           setLoans]          = useState<Loan[]>([]);
  const [loading,         setLoading]        = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    setDeleteConfirmId(null);
  }

  const active   = loans.filter((l) => !l.returnedAt);
  const returned = loans.filter((l) => l.returnedAt);

  return (
    <div className="border-t pt-6" style={{ borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
      <button onClick={() => setOpen((p) => !p)} className="flex items-center justify-between w-full mb-4 group">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100 transition-opacity">
          Gestione Prestiti
          {active.length > 0 && <span className="ml-2 text-amber-500">({active.length} attivi)</span>}
        </p>
        <span className={`text-xs transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {active.length > 0 && (
            <div className="space-y-3">
              <p className="text-[9px] font-bold uppercase opacity-40 tracking-widest">Attivi</p>
              {active.map((loan) => (
                <div key={loan.id} className="flex items-start gap-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-500">{loan.borrower}</p>
                    <p className="text-[10px] opacity-50 mt-0.5">dal {new Date(loan.loanedAt).toLocaleDateString("it-IT")}</p>
                    {loan.note && <p className="text-xs mt-2 italic opacity-70 border-l-2 border-amber-500/20 pl-2">{loan.note}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleReturn(loan.id)} className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all">Restituito</button>
                    {deleteConfirmId === loan.id ? (
                      <div className="flex flex-col gap-1 items-end">
                        <button onClick={() => handleDelete(loan.id)} className="text-[10px] font-bold text-red-400 whitespace-nowrap">Conferma</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] opacity-50 whitespace-nowrap">Annulla</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(loan.id)} className="text-[10px] font-bold uppercase opacity-40 hover:opacity-100 transition-all">Elimina</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {returned.length > 0 && (
            <div className="space-y-3">
              <p className="text-[9px] font-bold uppercase opacity-40 tracking-widest">Storico</p>
              <div className="flex flex-col gap-2">
                {returned.map((loan) => (
                  <div key={loan.id} className="group/hist flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold opacity-60 line-through">{loan.borrower}</p>
                      <p className="text-[10px] opacity-40">Reso il {new Date(loan.returnedAt!).toLocaleDateString("it-IT")}</p>
                    </div>
                    {deleteConfirmId === loan.id ? (
                      <div className="flex flex-col gap-1 items-end">
                        <button onClick={() => handleDelete(loan.id)} className="text-[10px] font-bold text-red-400 whitespace-nowrap">Conferma</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] opacity-50 whitespace-nowrap">Annulla</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(loan.id)} className="p-1 opacity-0 group-hover/hist:opacity-100 hover:text-red-400 text-xs">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && loans.length === 0 && (
            <p className="text-xs text-center py-4 opacity-40 italic">Nessun prestito registrato.</p>
          )}

          <form action={formAction} className="p-4 rounded-2xl bg-black/20 border border-white/5 flex flex-col gap-4">
            <input type="hidden" name="bookId" value={bookId} />
            
            <FormField label="Prestato a *" error={state?.fieldErrors?.borrower}>
              <Input name="borrower" placeholder="Nome" error={state?.fieldErrors?.borrower} />
            </FormField>

            <FormField label="Data prestito" error={state?.fieldErrors?.loanedAt}>
              <Input name="loanedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} error={state?.fieldErrors?.loanedAt} />
            </FormField>

            <FormField label="Nota" error={state?.fieldErrors?.note}>
              <Input name="note" placeholder="Note aggiuntive..." error={state?.fieldErrors?.note} />
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
