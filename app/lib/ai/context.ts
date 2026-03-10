import { prisma } from "@/app/lib/prisma";
import type { ThematicAxis, UserContext } from "./types";

export async function getUserFullContext(userId: string): Promise<UserContext> {
  const [checkIns, quotes, readingBooks, recentReadBooks, toReadBooks, wishlistBooks, profile, recentConversations, readBooksForThemes] =
    await Promise.all([
      prisma.dailyCheckIn.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { content: true },
      }),
      prisma.quote.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { book: { select: { title: true } } },
      }),
      prisma.book.findMany({
        where: { userId, status: "READING" },
        take: 3,
        select: { title: true, author: true },
      }),
      prisma.book.findMany({
        where: { userId, status: "READ" },
        orderBy: [{ finishedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: { title: true, author: true },
      }),
      prisma.book.findMany({
        where: { userId, status: "TO_READ" },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { title: true, author: true },
      }),
      prisma.book.findMany({
        where: { userId, status: "WISHLIST" },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { title: true, author: true },
      }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { emotionalSummary: true },
      }),
      prisma.conversationSummary.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { summary: true },
      }),
      // Tutti i libri letti con i tag — usati per calcolare gli assi tematici
      prisma.book.findMany({
        where: { userId, status: "READ" },
        select: { tags: true, finishedAt: true, createdAt: true },
      }),
    ]);

  // Calcola gli assi tematici dai tag dei libri letti
  const tagTotal: Record<string, number> = {};
  const tagRecent: Record<string, number> = {};
  const recentCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 mesi
  for (const book of readBooksForThemes) {
    if (!book.tags) continue;
    const isRecent = new Date(book.finishedAt ?? book.createdAt) > recentCutoff;
    for (const tag of book.tags.split(",").map((t: string) => t.trim()).filter(Boolean)) {
      tagTotal[tag] = (tagTotal[tag] ?? 0) + 1;
      if (isRecent) tagRecent[tag] = (tagRecent[tag] ?? 0) + 1;
    }
  }
  const totalRead = readBooksForThemes.length || 1;
  const recentRead = readBooksForThemes.filter(b => new Date(b.finishedAt ?? b.createdAt) > recentCutoff).length || 1;
  const computedAxes: ThematicAxis[] = Object.entries(tagTotal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => {
      const globalRate = count / totalRead;
      const recentRate = (tagRecent[name] ?? 0) / recentRead;
      const trend: ThematicAxis["trend"] =
        recentRate > globalRate * 1.3 ? "growing" :
        recentRate < globalRate * 0.5 ? "declining" : "stable";
      return { name, trend, weight: count / totalRead, evidence: [], bookIds: [] };
    });

  return {
    recentCheckIns: checkIns.map((c) => c.content),
    recentQuotes: quotes.map((q) => ({ text: q.text, bookTitle: q.book.title })),
    readingBooks: readingBooks.map((b) =>
      b.author ? `${b.title} di ${b.author}` : b.title,
    ),
    recentReadBooks: recentReadBooks.map((b) =>
      b.author ? `${b.title} di ${b.author}` : b.title,
    ),
    toReadBooks: toReadBooks.map((b) =>
      b.author ? `${b.title} di ${b.author}` : b.title,
    ),
    wishlistBooks: wishlistBooks.map((b) =>
      b.author ? `${b.title} di ${b.author}` : b.title,
    ),
    thematicAxes: computedAxes,
    emotionalSummary: profile?.emotionalSummary ?? null,
    recentConversations: recentConversations.map((c) => c.summary),
  };
}
