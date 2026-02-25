"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { NoteType } from "@/app/generated/prisma/client";

export type QuoteActionState = { error?: string; success?: string } | null;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return session.user.id;
}

export async function createQuote(
  _prevState: QuoteActionState,
  formData: FormData
): Promise<QuoteActionState> {
  let userId: string;
  try { userId = await requireUserId(); }
  catch { return { error: "Sessione scaduta." }; }

  const bookId = (formData.get("bookId") as string)?.trim();
  const text   = (formData.get("text")   as string)?.trim();
  if (!bookId) return { error: "Libro mancante." };
  if (!text)   return { error: "Il testo della citazione è obbligatorio." };

  // Verifica ownership del libro
  const book = await prisma.book.findFirst({ where: { id: bookId, userId } });
  if (!book) return { error: "Libro non trovato." };

  const pageRaw = formData.get("page") as string;
  const page    = pageRaw ? parseInt(pageRaw, 10) : null;

  const typeRaw = formData.get("type") as string;
  const type    = typeRaw === "NOTE" ? NoteType.NOTE : NoteType.QUOTE;

  try {
    await prisma.quote.create({
      data: {
        bookId,
        userId,
        type,
        text,
        page:    page && !isNaN(page) ? page : null,
        chapter: (formData.get("chapter") as string)?.trim() || null,
      },
    });
    revalidatePath("/dashboard");
    return { success: "Citazione salvata!" };
  } catch {
    return { error: "Errore durante il salvataggio." };
  }
}

export async function deleteQuote(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.quote.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}

export async function getQuotesForBook(bookId: string) {
  const userId = await requireUserId();
  return prisma.quote.findMany({
    where: { bookId, userId },
    orderBy: { createdAt: "asc" },
  });
}
