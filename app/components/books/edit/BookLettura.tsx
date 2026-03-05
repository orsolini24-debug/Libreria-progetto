"use client";

import { FormField } from "@/app/components/ui/FormField";

interface BookLetturaProps {
  progress: number | null;
  currentPage: string;
  setCurrentPage: (v: string) => void;
  pageCount: string;
  setPageCount: (v: string) => void;
  startedAt: string;
  setStartedAt: (v: string) => void;
  finishedAt: string;
  setFinishedAt: (v: string) => void;
  velocity: { pagesPerDay: number; daysLeft: number } | null;
  fieldErrors?: Record<string, string[]>;
}

export function BookLettura({
  progress, currentPage, setCurrentPage, pageCount, setPageCount,
  startedAt, setStartedAt, finishedAt, setFinishedAt, velocity,
  fieldErrors
}: BookLetturaProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Progress bar */}
      {progress !== null ? (
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--fg-subtle)" }}>Progresso</p>
            <p className="text-xs font-bold" style={{ color: "var(--accent)" }}>{progress}%</p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--accent)" }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--fg-subtle)" }}>{currentPage || "?"} / {pageCount || "?"} pagine</p>
        </div>
      ) : (
        <div className="h-2 rounded-full" style={{ background: "color-mix(in srgb, var(--fg-subtle) 8%, transparent)" }} />
      )}

      {/* currentPage + pageCount */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Pagina corrente" error={fieldErrors?.currentPage}>
          <input
            type="number" min={0} value={currentPage} onChange={e => setCurrentPage(e.target.value)} placeholder="es. 120"
            className="w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--fg-primary)", borderColor: fieldErrors?.currentPage ? "rgb(239 68 68)" : "color-mix(in srgb, var(--accent) 18%, transparent)" }}
          />
        </FormField>
        <FormField label="Pagine totali" error={fieldErrors?.pageCount}>
          <input
            type="number" min={0} value={pageCount} onChange={e => setPageCount(e.target.value)} placeholder="es. 320"
            className="w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--fg-primary)", borderColor: fieldErrors?.pageCount ? "rgb(239 68 68)" : "color-mix(in srgb, var(--accent) 18%, transparent)" }}
          />
        </FormField>
      </div>

      {/* Velocity */}
      {velocity && (
        <div className="flex gap-3 p-3 rounded-xl text-[10px] font-bold uppercase tracking-wider" style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)", color: "var(--fg-muted)" }}>
          <span>⚡ {velocity.pagesPerDay} pag/giorno</span>
          <span style={{ color: "var(--fg-subtle)" }}>·</span>
          <span>~ {velocity.daysLeft} giorni alla fine</span>
        </div>
      )}

      {/* Date */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Inizio lettura" error={fieldErrors?.startedAt}>
          <input
            type="date" value={startedAt} onChange={e => setStartedAt(e.target.value)}
            className="w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--fg-primary)", borderColor: fieldErrors?.startedAt ? "rgb(239 68 68)" : "color-mix(in srgb, var(--accent) 18%, transparent)" }}
          />
        </FormField>
        <FormField label="Fine lettura" error={fieldErrors?.finishedAt}>
          <input
            type="date" value={finishedAt} onChange={e => setFinishedAt(e.target.value)}
            className="w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--fg-primary)", borderColor: fieldErrors?.finishedAt ? "rgb(239 68 68)" : "color-mix(in srgb, var(--accent) 18%, transparent)" }}
          />
        </FormField>
      </div>
    </div>
  );
}
