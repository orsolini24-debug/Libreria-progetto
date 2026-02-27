import { prisma } from "@/app/lib/prisma";
import type { ThematicAxis, UserContext } from "./types";

export async function getUserFullContext(userId: string): Promise<UserContext> {
  const [checkIns, quotes, readingBooks, recentReadBooks, profile, recentConversations] =
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
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { title: true, author: true },
      }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { thematicAxes: true, emotionalSummary: true },
      }),
      prisma.conversationSummary.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { summary: true },
      }),
    ]);

  return {
    recentCheckIns: checkIns.map((c) => c.content),
    recentQuotes: quotes.map((q) => ({ text: q.text, bookTitle: q.book.title })),
    readingBooks: readingBooks.map((b) =>
      b.author ? `${b.title} di ${b.author}` : b.title,
    ),
    recentReadBooks: recentReadBooks.map((b) =>
      b.author ? `${b.title} di ${b.author}` : b.title,
    ),
    thematicAxes: (profile?.thematicAxes as unknown as ThematicAxis[]) ?? [],
    emotionalSummary: profile?.emotionalSummary ?? null,
    recentConversations: recentConversations.map((c) => c.summary),
  };
}
