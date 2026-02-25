"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export type SessionActionState = { error?: string; success?: string } | null;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return session.user.id;
}

function parseIntOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseInt(v as string, 10);
  return isNaN(n) ? null : n;
}

export async function createReadingSession(
  _prevState: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  let userId: string;
  try { userId = await requireUserId(); }
  catch { return { error: "Sessione scaduta." }; }

  const bookId = (formData.get("bookId") as string)?.trim();
  if (!bookId) return { error: "Libro mancante." };

  const book = await prisma.book.findFirst({ where: { id: bookId, userId } });
  if (!book) return { error: "Libro non trovato." };

  const startPage = parseIntOrNull(formData.get("startPage"));
  const endPage   = parseIntOrNull(formData.get("endPage"));
  const duration  = parseIntOrNull(formData.get("duration"));
  const pagesRead = (startPage != null && endPage != null && endPage > startPage)
    ? endPage - startPage
    : parseIntOrNull(formData.get("pagesRead"));

  const dateRaw = formData.get("date") as string;
  const date    = dateRaw ? new Date(dateRaw) : new Date();

  try {
    await prisma.readingSession.create({
      data: {
        bookId,
        userId,
        date,
        startPage,
        endPage,
        pagesRead,
        duration,
        note: (formData.get("note") as string)?.trim() || null,
      },
    });

    // Aggiorna currentPage se endPage è fornito
    if (endPage != null) {
      await prisma.book.update({
        where: { id: bookId },
        data:  { currentPage: endPage },
      });
    }

    revalidatePath("/dashboard");
    return { success: "Sessione registrata!" };
  } catch {
    return { error: "Errore durante il salvataggio." };
  }
}

export async function deleteReadingSession(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.readingSession.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}
