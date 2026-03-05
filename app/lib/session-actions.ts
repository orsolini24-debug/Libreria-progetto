"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReadingSessionSchema } from "./validation/schemas";
import { mapZodError } from "./validation/errors";
import { requireAuth } from "./auth-utils";
import { logger } from "./logger";

export type SessionActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> } | null;

export async function createReadingSession(
  _prevState: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  let userId: string;
  try {
    userId = await requireAuth();
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

  // #59, #20: Fetch libro per validazione pagine e aggiornamento currentPage
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true, pageCount: true },
  });

  if (!book) return { error: "Libro non trovato o non autorizzato." };

  // #20: endPage non può superare pageCount
  if (endPage != null && book.pageCount != null && endPage > book.pageCount) {
    return { error: `La pagina finale (${endPage}) non può superare il totale delle pagine del libro (${book.pageCount}).` };
  }

  const pagesRead = (startPage != null && endPage != null && endPage >= startPage)
    ? endPage - startPage
    : pagesReadManual;

  try {
    // #59: Transazione per garantire atomicità tra sessione e aggiornamento libro
    await prisma.$transaction(async (tx) => {
      await tx.readingSession.create({
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
        await tx.book.update({
          where: { id: bookId, userId },
          data:  { currentPage: endPage },
        });
      }
    });

    revalidatePath("/dashboard");
    return { success: "Sessione registrata!" };
  } catch (e) {
    logger.error("CREATE_SESSION_ERROR", e);
    return { error: "Errore durante il salvataggio della sessione." };
  }
}

export async function deleteReadingSession(id: string): Promise<void> {
  try {
    const userId = await requireAuth();
    await prisma.readingSession.deleteMany({ where: { id, userId } });
    revalidatePath("/dashboard");
  } catch (e) {
    logger.error("DELETE_SESSION_ERROR", e);
    throw e;
  }
}
