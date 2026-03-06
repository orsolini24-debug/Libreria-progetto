"use server";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth-utils";

export async function saveDailyCheckIn(content: string) {
  let userId: string;
  try { userId = await requireAuth(); }
  catch { throw new Error("Unauthorized"); }
  
  await prisma.dailyCheckIn.create({
    data: { userId, content }
  });
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * #11, #106: Verifica sempre che l'utente richiedente sia lo stesso del parametro.
 */
export async function getUserEmotionalContext(userIdParam: string) {
  const currentUserId = await requireAuth();
  
  // Se un utente cerca di accedere al contesto di un altro, forziamo il proprio
  if (userIdParam !== currentUserId) {
    console.warn(`[SECURITY] User ${currentUserId} attempted to access emotional context of ${userIdParam}`);
    throw new Error("ACCESS_DENIED");
  }

  const [checkIns, quotes, readingBooks, readBooks] = await Promise.all([
    prisma.dailyCheckIn.findMany({ where: { userId: currentUserId }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.quote.findMany({ where: { userId: currentUserId }, orderBy: { createdAt: "desc" }, take: 5, include: { book: true } }),
    prisma.book.findMany({ where: { userId: currentUserId, status: "READING" }, take: 3 }),
    prisma.book.findMany({ where: { userId: currentUserId, status: "READ" }, orderBy: { updatedAt: "desc" }, take: 5 })
  ]);
  
  // #40: Struttura JSON (qui ritorniamo una stringa per il prompt AI, ma i dati sono fetchati in modo sicuro)
  return JSON.stringify({
    checkIns: checkIns.map(c => ({ content: c.content, date: c.createdAt })),
    quotes: quotes.map(q => ({ text: q.text, book: q.book.title })),
    readingNow: readingBooks.map(b => b.title),
    recentlyRead: readBooks.map(b => b.title)
  });
}