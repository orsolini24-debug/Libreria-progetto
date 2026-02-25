// Rotta temporanea one-shot — da eliminare dopo l'esecuzione
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

const UPDATES = [
  {
    keywords: ["export", "esport"],
    status:   "IMPLEMENTED" as const,
    adminNote: "Implementato: export CSV e JSON dalla dashboard (pulsante ↓ Esporta).",
  },
  {
    keywords: ["statistic", "stat"],
    status:   "IMPLEMENTED" as const,
    adminNote: "Implementato: statistiche cliccabili in dashboard, modal dettaglio libri per anno/stato con ranking e voti.",
  },
  {
    keywords: ["appunt", "nota", "note"],
    status:   "ACCEPTED" as const,
    adminNote: "Accettato: implementeremo note per pagina nell'area citazioni del pannello libro.",
  },
  {
    keywords: ["connession", "ia", "ai", "integraz"],
    status:   "UNDER_REVIEW" as const,
    adminNote: "In valutazione: integrazione AI richiede API esterna (OpenAI/Anthropic) — da pianificare.",
  },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  // Solo admin
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const all = await prisma.suggestion.findMany();
  const results: string[] = [];

  for (const s of all) {
    const titleLow = s.title.toLowerCase();
    const descLow  = (s.description ?? "").toLowerCase();
    const match    = UPDATES.find((u) =>
      u.keywords.some((k) => titleLow.includes(k) || descLow.includes(k))
    );
    if (match) {
      await prisma.suggestion.update({
        where: { id: s.id },
        data:  { status: match.status, adminNote: match.adminNote },
      });
      results.push(`"${s.title}" → ${match.status}`);
    } else {
      results.push(`"${s.title}" → non modificato`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
