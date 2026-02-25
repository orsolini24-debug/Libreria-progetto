"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReadingSessionSchema } from "./validation/schemas";
import { mapZodError } from "./validation/errors";

export type SessionActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> } | null;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export async function createReadingSession(
  _prevState: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "Sessione scaduta." };
  }

  const raw = Object.fromEntries(formData.entries());
  const validated = ReadingSessionSchema.safeParse(raw);

  if (!validated.success) {
    const mapped = mapZodError(validated.error);
    return {
      error: !mapped.ok ? mapped.error.message : "Errore di validazione",
      fieldErrors: !mapped.ok ? mapped.error.fieldErrors : undefined,
    };
  }

  const { bookId, date, startPage, endPage, pagesRead: pagesReadManual, duration, note } = validated.data;

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  });
  if (!book) return { error: "Libro non trovato o non autorizzato." };

  const pagesRead = (startPage != null && endPage != null && endPage > startPage)
    ? endPage - startPage
    : pagesReadManual;

  try {
    await prisma.readingSession.create({
      data: {
        bookId,
        userId,
        date: date ?? new Date(),
        startPage,
        endPage,
        pagesRead,
        duration,
        note,
      },
    });

    if (endPage != null) {
      await prisma.book.update({
        where: { id: bookId, userId }, // [GEMINI-ARCH] - Aggiunto userId per sicurezza atomica
        data:  { currentPage: endPage },
      });
    }

    revalidatePath("/dashboard");
    return { success: "Sessione registrata!" };
  } catch (e) {
    console.error("[createReadingSession]", e);
    return { error: "Errore durante il salvataggio." };
  }
}

export async function deleteReadingSession(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.readingSession.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}
