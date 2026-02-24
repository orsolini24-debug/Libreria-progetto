import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import { SuggestionForm } from "@/app/components/suggestions/SuggestionForm";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:      { label: "In attesa",      color: "#a0a0a0", bg: "rgba(160,160,160,0.10)", border: "rgba(160,160,160,0.20)" },
  UNDER_REVIEW: { label: "In valutazione", color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.20)"  },
  ACCEPTED:     { label: "Accettato",      color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.20)"  },
  REJECTED:     { label: "Rifiutato",      color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.20)" },
  IMPLEMENTED:  { label: "Implementato",   color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.20)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  FEATURE: "Funzionalità", UI_UX: "Interfaccia", BUG: "Bug",
  PERFORMANCE: "Performance", OTHER: "Altro",
};

export default async function SuggestionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [allSuggestions, user] = await Promise.all([
    prisma.suggestion.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ]);

  const isAdmin    = user?.role === "ADMIN";
  const mySuggestions = allSuggestions.filter((s) => s.userId === session.user!.id);
  const otherSuggestions = allSuggestions.filter((s) => s.userId !== session.user!.id);

  const implemented = allSuggestions.filter((s) => s.status === "IMPLEMENTED").length;
  const accepted    = allSuggestions.filter((s) => s.status === "ACCEPTED").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: "var(--fg-primary)" }}>
            Idee & Suggerimenti
          </h1>
          <p className="font-reading text-sm mt-1 italic" style={{ color: "var(--fg-muted)" }}>
            Proponi miglioramenti, nuove funzionalità o segnala problemi
          </p>
        </div>
        {isAdmin && (
          <a
            href="/admin/suggestions"
            className="text-xs px-4 py-2 rounded-xl border font-semibold transition-colors"
            style={{
              background:  "color-mix(in srgb, var(--accent) 10%, var(--bg-elevated))",
              color:       "var(--accent)",
              borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
          >
            Pannello Admin →
          </a>
        )}
      </div>

      {/* Stats globali */}
      {(implemented > 0 || accepted > 0) && (
        <div className="flex gap-3 mb-8 flex-wrap">
          {implemented > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
              style={{ background: "rgba(192,132,252,0.08)", borderColor: "rgba(192,132,252,0.20)" }}>
              <span className="font-display font-bold text-xl" style={{ color: "#c084fc" }}>{implemented}</span>
              <span className="text-xs" style={{ color: "#c084fc" }}>già implementati</span>
            </div>
          )}
          {accepted > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
              style={{ background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.20)" }}>
              <span className="font-display font-bold text-xl" style={{ color: "#34d399" }}>{accepted}</span>
              <span className="text-xs" style={{ color: "#34d399" }}>in arrivo</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">

        {/* Colonna sinistra — lista suggerimenti */}
        <div className="flex flex-col gap-8">

          {/* I tuoi suggerimenti */}
          <section>
            <h2 className="font-display text-base font-semibold mb-4" style={{ color: "var(--fg-primary)" }}>
              I tuoi suggerimenti
              <span className="ml-2 font-sans text-xs font-normal" style={{ color: "var(--fg-subtle)" }}>
                ({mySuggestions.length})
              </span>
            </h2>
            {mySuggestions.length === 0 ? (
              <p className="text-sm italic py-6 text-center rounded-xl border"
                style={{ color: "var(--fg-subtle)", borderColor: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
                Non hai ancora inviato suggerimenti. Usa il form →
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {mySuggestions.map((s) => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <div key={s.id} className="rounded-xl border p-4 flex flex-col gap-2"
                      style={{ background: "var(--bg-card)", borderColor: cfg.border, borderLeftWidth: "3px" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                              style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                              {cfg.label}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full border"
                              style={{ color: "var(--fg-subtle)", borderColor: "color-mix(in srgb, var(--fg-subtle) 18%, transparent)" }}>
                              {CATEGORY_LABELS[s.category] ?? s.category}
                            </span>
                          </div>
                          <p className="text-sm font-semibold" style={{ color: "var(--fg-primary)" }}>{s.title}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                            {new Date(s.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <p className="font-reading text-xs leading-relaxed italic" style={{ color: "var(--fg-muted)" }}>
                        {s.description}
                      </p>
                      {s.adminNote && (
                        <div className="text-xs px-3 py-2 rounded-lg border mt-1"
                          style={{ background: "color-mix(in srgb, var(--accent) 6%, var(--bg-elevated))", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--fg-muted)" }}>
                          <span className="font-semibold" style={{ color: "var(--accent)" }}>Nota: </span>
                          {s.adminNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Suggerimenti della community */}
          {otherSuggestions.length > 0 && (
            <section>
              <h2 className="font-display text-base font-semibold mb-4" style={{ color: "var(--fg-primary)" }}>
                Dalla community
                <span className="ml-2 font-sans text-xs font-normal" style={{ color: "var(--fg-subtle)" }}>
                  ({otherSuggestions.length})
                </span>
              </h2>
              <div className="flex flex-col gap-2">
                {otherSuggestions.map((s) => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <div key={s.id} className="rounded-xl border px-4 py-3 flex items-center gap-3"
                      style={{ background: "var(--bg-card)", borderColor: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0"
                        style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                        {cfg.label}
                      </span>
                      <span className="text-xs font-medium truncate" style={{ color: "var(--fg-primary)" }}>{s.title}</span>
                      <span className="text-[10px] ml-auto shrink-0" style={{ color: "var(--fg-subtle)" }}>
                        {CATEGORY_LABELS[s.category] ?? s.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Colonna destra — form */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="rounded-2xl border p-5"
            style={{
              background:  "var(--bg-card)",
              borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
            }}>
            <div className="mb-5">
              <h2 className="font-display font-semibold text-base" style={{ color: "var(--fg-primary)" }}>
                Invia un suggerimento
              </h2>
              <p className="font-reading text-xs mt-1 italic" style={{ color: "var(--fg-muted)" }}>
                Ogni idea viene valutata singolarmente
              </p>
            </div>
            <SuggestionForm />
          </div>
        </aside>

      </div>
    </div>
  );
}
