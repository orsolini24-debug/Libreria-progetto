import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import { AdminSuggestionClient } from "@/app/components/suggestions/AdminSuggestionClient";

export default async function AdminSuggestionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") redirect("/suggestions");

  const suggestions = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: "var(--fg-primary)" }}>
            Pannello Suggerimenti
          </h1>
          <p className="font-reading text-sm mt-1 italic" style={{ color: "var(--fg-muted)" }}>
            Valuta e gestisci i suggerimenti degli utenti
          </p>
        </div>
        <a
          href="/suggestions"
          className="text-xs px-4 py-2 rounded-xl border transition-colors"
          style={{
            color:       "var(--fg-muted)",
            borderColor: "color-mix(in srgb, var(--fg-subtle) 25%, transparent)",
          }}
        >
          ← Vista utente
        </a>
      </div>

      <AdminSuggestionClient suggestions={suggestions} />
    </div>
  );
}
