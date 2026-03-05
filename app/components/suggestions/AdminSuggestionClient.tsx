"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSuggestionStatus, deleteSuggestion } from "@/app/lib/suggestion-actions";
import type { Suggestion, User } from "@/app/generated/prisma/client";

type SuggestionWithUser = Suggestion & { user: Pick<User, "email"> };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:      { label: "In attesa",      color: "#a0a0a0", bg: "rgba(160,160,160,0.10)", border: "rgba(160,160,160,0.25)" },
  UNDER_REVIEW: { label: "In valutazione", color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)"  },
  ACCEPTED:     { label: "Accettato",      color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)"  },
  REJECTED:     { label: "Rifiutato",      color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  IMPLEMENTED:  { label: "Implementato",   color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.25)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  FEATURE:     "Funzionalità",
  UI_UX:       "Interfaccia",
  BUG:         "Bug",
  PERFORMANCE: "Performance",
  OTHER:       "Altro",
};

const STATUS_TABS = [
  { key: "",             label: "Tutti" },
  { key: "PENDING",      label: "In attesa" },
  { key: "UNDER_REVIEW", label: "In valutazione" },
  { key: "ACCEPTED",     label: "Accettati" },
  { key: "IMPLEMENTED",  label: "Implementati" },
  { key: "REJECTED",     label: "Rifiutati" },
];

function SuggestionCard({ s, onUpdated }: { s: SuggestionWithUser; onUpdated: () => void }) {
  const [status,    setStatus]    = useState(s.status as string);
  const [adminNote, setAdminNote] = useState(s.adminNote ?? "");
  const [error,     setError]     = useState("");
  const [isPending, startTransition] = useTransition();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  function save() {
    startTransition(async () => {
      const res = await updateSuggestionStatus(s.id, status, adminNote);
      if (res.error) setError(res.error);
      else { setError(""); onUpdated(); }
    });
  }

  function handleDelete() {
    if (!confirm(`Eliminare il suggerimento "${s.title}"?`)) return;
    startTransition(async () => {
      await deleteSuggestion(s.id);
      onUpdated();
    });
  }

  const changed = status !== (s.status as string) || adminNote !== (s.adminNote ?? "");

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4 transition-all"
      style={{
        background:   "var(--bg-card)",
        borderColor:  cfg.border,
        borderLeftWidth: "3px",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
              style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
            >
              {cfg.label}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{ color: "var(--fg-subtle)", borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)" }}
            >
              {CATEGORY_LABELS[s.category] ?? s.category}
            </span>
          </div>
          <h3 className="font-display font-semibold text-sm leading-snug" style={{ color: "var(--fg-primary)" }}>
            {s.title}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
            {s.user.email} · {new Date(s.createdAt).toLocaleDateString("it-IT")}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded-lg border shrink-0 transition-colors"
          style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.25)" }}
        >
          Elimina
        </button>
      </div>

      {/* Description */}
      <p className="font-reading text-xs leading-relaxed italic" style={{ color: "var(--fg-muted)" }}>
        {s.description}
      </p>

      {/* Admin controls */}
      <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 text-xs rounded-lg px-2 py-1.5 border focus:outline-none"
            style={{
              background:  "var(--bg-input)",
              borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
              color:       "var(--fg-primary)",
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button
            onClick={save}
            disabled={isPending || !changed}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--accent-on)" }}
          >
            {isPending ? "…" : "Salva"}
          </button>
        </div>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Nota interna (visibile all'utente dopo accettazione/rifiuto)…"
          rows={2}
          className="w-full text-xs rounded-lg px-2.5 py-2 border resize-none focus:outline-none leading-relaxed"
          style={{
            background:  "var(--bg-input)",
            borderColor: "color-mix(in srgb, var(--fg-subtle) 15%, transparent)",
            color:       "var(--fg-muted)",
          }}
        />
        {error && <p className="text-[11px]" style={{ color: "#f87171" }}>{error}</p>}
      </div>
    </div>
  );
}

export function AdminSuggestionClient({ suggestions }: { suggestions: SuggestionWithUser[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("");

  function onUpdated() {
    router.refresh();
  }

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = suggestions.filter((s) => s.status === k).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = tab ? suggestions.filter((s) => s.status === tab) : suggestions;

  return (
    <div className="flex flex-col gap-6">

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ background: v.bg, borderColor: v.border }}
          >
            <span className="font-display font-bold text-lg" style={{ color: v.color }}>
              {counts[k] ?? 0}
            </span>
            <span className="text-[11px]" style={{ color: v.color }}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Tab filtri */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={active ? {
                background: "var(--accent)",
                color:      "var(--accent-on)",
                borderColor:"var(--accent)",
              } : {
                color:       "var(--fg-muted)",
                borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)",
              }}
            >
              {label}
              {key && counts[key] > 0 && (
                <span className="ml-1.5 opacity-70">{counts[key]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm py-12 text-center" style={{ color: "var(--fg-subtle)" }}>
          Nessun suggerimento in questa categoria.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((s) => (
            <SuggestionCard key={s.id} s={s} onUpdated={onUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
