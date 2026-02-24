"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createSuggestion } from "@/app/lib/suggestion-actions";

const CATEGORY_OPTIONS = [
  { value: "FEATURE",     label: "Nuova funzionalità" },
  { value: "UI_UX",       label: "Interfaccia / Design" },
  { value: "BUG",         label: "Segnalazione bug" },
  { value: "PERFORMANCE", label: "Performance" },
  { value: "OTHER",       label: "Altro" },
];

const fieldClass = `w-full border rounded-xl px-3 py-2.5 text-sm
  focus:outline-none focus:ring-2 transition-colors`;

const fieldStyle = {
  background:  "var(--bg-input)",
  borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
  color:       "var(--fg-primary)",
};

const labelStyle = { color: "var(--fg-subtle)", letterSpacing: "0.08em" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {pending ? "Invio…" : "Invia suggerimento"}
    </button>
  );
}

export function SuggestionForm() {
  const [state, formAction] = useActionState(createSuggestion, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">

      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
          Titolo <span className="text-red-400 font-normal normal-case">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="In breve, cosa vorresti migliorare o aggiungere?"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
          Categoria
        </label>
        <select name="category" className={fieldClass} style={fieldStyle}>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase mb-1.5" style={labelStyle}>
          Descrizione <span className="text-red-400 font-normal normal-case">*</span>
        </label>
        <textarea
          name="description"
          rows={5}
          required
          placeholder="Descrivi nel dettaglio il suggerimento, come lo useresti e perché sarebbe utile…"
          className={`${fieldClass} resize-none leading-relaxed`}
          style={fieldStyle}
        />
      </div>

      {state?.error && (
        <p className="text-xs px-3 py-2 rounded-xl border"
          style={{
            color: "#f87171",
            background: "color-mix(in srgb, #ef4444 8%, var(--bg-elevated))",
            borderColor: "color-mix(in srgb, #ef4444 30%, transparent)",
          }}>
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-xs px-3 py-2 rounded-xl border"
          style={{
            color: "#34d399",
            background: "color-mix(in srgb, #10b981 8%, var(--bg-elevated))",
            borderColor: "color-mix(in srgb, #10b981 30%, transparent)",
          }}>
          {state.success}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
