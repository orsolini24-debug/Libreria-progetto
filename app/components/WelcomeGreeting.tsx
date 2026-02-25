"use client";

import { useState, useActionState, useEffect, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { setDisplayName } from "@/app/lib/actions";
import type { Book } from "@/app/generated/prisma/client";

// Citazioni e messaggi di benvenuto
const MESSAGES = [
  (name: string) => `Ciao ${name}! Come diceva Socrate: «Una vita senza ricerca non vale la pena di essere vissuta.» Qual è il prossimo libro?`,
  (name: string) => `Bentornato, ${name}! Borges diceva che un uomo che non legge è come uno che non sa leggere. Tu sei già avanti.`,
  (name: string) => `${name}, è un ottimo momento per leggere. Non credi? Riprendi da dove ti eri fermato.`,
  (name: string) => `Ciao ${name}! Come stai? «I libri sono specchi: ci vediamo solo ciò che già portiamo dentro.» — Carlos Ruiz Zafón`,
  (name: string) => `Bentornato ${name}! Oggi è il giorno giusto per una buona storia.`,
  (name: string) => `${name}, «Un lettore vive mille vite prima di morire. Chi non legge ne vive una sola.» — George R.R. Martin`,
  (name: string) => `Ciao ${name}! «Non esiste un amico più leale di un libro.» — Ernest Hemingway`,
  (name: string) => `Bentornato ${name}! Ogni pagina è un passo in un mondo nuovo.`,
  (name: string) => `${name}, «Leggere è sognare con gli occhi aperti.» Cosa sognamo oggi?`,
  (name: string) => `Ciao ${name}! Mark Twain diceva: «Chi non legge non ha alcun vantaggio su chi non sa leggere.» Tu hai tutti i vantaggi.`,
];

// Messaggi contestuali basati sui libri in lettura
function getContextMessage(name: string, books: Book[]): string {
  const reading = books.filter((b) => b.status === "READING");
  const withPage = reading.filter((b) => b.currentPage && b.pageCount);

  if (withPage.length > 0) {
    const b = withPage[0];
    const pct = Math.round(((b.currentPage ?? 0) / (b.pageCount ?? 1)) * 100);
    return `Ciao ${name}! Sei al ${pct}% di «${b.title}» — ancora un po' e ce la fai!`;
  }

  if (reading.length > 0) {
    return `${name}, stai leggendo «${reading[0].title}». Come procede?`;
  }

  const toRead = books.filter((b) => b.status === "TO_READ");
  if (toRead.length > 0) {
    const rand = toRead[Math.floor(Math.random() * toRead.length)];
    return `${name}, hai ${toRead.length} libri da leggere. Che ne dici di iniziare «${rand.title}»?`;
  }

  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)](name);
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Salvataggio…" : "Conferma"}
    </button>
  );
}

interface Props {
  displayName: string | null;
  books: Book[];
}

export function WelcomeGreeting({ displayName, books }: Props) {
  const [state, formAction] = useActionState(setDisplayName, null);
  const [dismissed, setDismissed] = useState(false);

  // Genera messaggio una volta sola al mount
  const message = useMemo(() => {
    if (!displayName) return null;
    // 30% probabilità messaggio contestuale, 70% citazione
    return Math.random() < 0.3
      ? getContextMessage(displayName, books)
      : MESSAGES[Math.floor(Math.random() * MESSAGES.length)](displayName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName]);

  useEffect(() => {
    if (state === null && displayName) setDismissed(false);
  }, [state, displayName]);

  // --- Primo accesso: chiedi il nome ---
  if (!displayName) {
    return (
      <div
        className="mb-8 rounded-2xl border p-5 flex flex-col gap-3"
        style={{
          background:  "color-mix(in srgb, var(--accent) 8%, var(--bg-card))",
          borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
        }}
      >
        <div>
          <p className="font-display text-lg font-bold" style={{ color: "var(--fg-primary)" }}>
            Benvenuto in LibrerIA!
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
            Come vuoi essere chiamato?
          </p>
        </div>
        <form action={formAction} className="flex gap-2 items-start flex-wrap">
          <input
            name="displayName"
            type="text"
            required
            minLength={2}
            maxLength={40}
            placeholder="Il tuo nome…"
            autoFocus
            className="flex-1 min-w-[160px] border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{
              background:  "var(--bg-input)",
              borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
              color:       "var(--fg-primary)",
            }}
          />
          <SaveButton />
        </form>
        {state?.error && (
          <p className="text-xs" style={{ color: "#f87171" }}>{state.error}</p>
        )}
      </div>
    );
  }

  // --- Accessi successivi: saluto con messaggio ---
  if (dismissed) return null;

  return (
    <div
      className="mb-8 rounded-2xl border p-4 flex items-start gap-3 relative"
      style={{
        background:  "color-mix(in srgb, var(--accent) 6%, var(--bg-card))",
        borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
      }}
    >
      <span className="text-2xl leading-none shrink-0 mt-0.5">📖</span>
      <p className="font-reading text-sm leading-relaxed italic flex-1" style={{ color: "var(--fg-muted)" }}>
        {message}
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-lg leading-none transition-opacity opacity-40 hover:opacity-80"
        style={{ color: "var(--fg-subtle)" }}
        title="Chiudi"
      >
        ×
      </button>
    </div>
  );
}
