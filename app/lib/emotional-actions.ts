"use server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveDailyCheckIn(content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await prisma.dailyCheckIn.create({
    data: { userId: session.user.id, content }
  });
  revalidatePath("/");
  return { success: true };
}

export async function getUserEmotionalContext(userId: string) {
  const [checkIns, quotes, readingBooks, readBooks] = await Promise.all([
    prisma.dailyCheckIn.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.quote.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, include: { book: true } }),
    prisma.book.findMany({ where: { userId, status: "READING" }, take: 3 }),
    prisma.book.findMany({ where: { userId, status: "READ" }, orderBy: { updatedAt: "desc" }, take: 5 })
  ]);
  
  return `
    Stato emotivo recente: ${checkIns.map(c => c.content).join(" | ")}
    Citazioni preferite di recente: ${quotes.map(q => `"${q.text}" da ${q.book.title}`).join(" | ")}
    Libri in lettura ora: ${readingBooks.map(b => b.title).join(", ")}
    Ultimi libri letti (storico): ${readBooks.map(b => `${b.title} di ${b.author}`).join(", ")}
  `;
}