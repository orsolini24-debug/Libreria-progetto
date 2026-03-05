import { prisma } from "@/app/lib/prisma";
import type { ThematicAxis, ReadingPrefs } from "./types";

export async function getOrCreateUserProfile(userId: string) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, thematicAxes: [], readingPrefs: {} },
    update: {},
  });
}

export async function updateThematicAxes(
  userId: string,
  axes: ThematicAxis[],
) {
  const json = axes as unknown as Parameters<typeof prisma.userProfile.upsert>[0]["create"]["thematicAxes"];
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, thematicAxes: json, readingPrefs: {} },
    update: { thematicAxes: json },
  });
}

export async function updateEmotionalSummary(
  userId: string,
  emotionalSummary: string,
) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, emotionalSummary, thematicAxes: [], readingPrefs: {} },
    update: { emotionalSummary },
  });
}

export async function updateLastSynthesis(
  userId: string,
  lastSynthesis: string,
) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      lastSynthesis,
      lastSynthesisAt: new Date(),
      thematicAxes: [],
      readingPrefs: {},
    },
    update: { lastSynthesis, lastSynthesisAt: new Date() },
  });
}

export async function updateReadingPrefs(
  userId: string,
  readingPrefs: ReadingPrefs,
) {
  const json = readingPrefs as unknown as Parameters<typeof prisma.userProfile.upsert>[0]["create"]["readingPrefs"];
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, readingPrefs: json, thematicAxes: [] },
    update: { readingPrefs: json },
  });
}

// Salva una sintesi di conversazione, mantiene max 10 per utente
export async function saveConversationSummary(
  userId: string,
  summary: string,
  intent: string,
  bookIds?: string,
) {
  await prisma.conversationSummary.create({
    data: { userId, summary, intent, bookIds },
  });

  // Pulizia: tieni solo le ultime 10
  const old = await prisma.conversationSummary.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 10,
    select: { id: true },
  });

  if (old.length > 0) {
    await prisma.conversationSummary.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }
}
