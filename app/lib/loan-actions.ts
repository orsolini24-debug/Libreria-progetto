"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { LoanSchema } from "./validation/schemas";
import { mapZodError } from "./validation/errors";
import { requireAuth } from "./auth-utils";
import { createNotification } from "./notification-actions";
import { logger } from "./logger";

export type LoanActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> } | null;

export async function createLoan(
  _prevState: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return { error: "Sessione scaduta." };
  }

  const raw = Object.fromEntries(formData.entries());
  const validated = LoanSchema.safeParse(raw);

  if (!validated.success) {
    const mapped = mapZodError(validated.error);
    return {
      error: !mapped.ok ? mapped.error.message : "Errore di validazione",
      fieldErrors: !mapped.ok ? mapped.error.fieldErrors : undefined,
    };
  }

  const { bookId, borrower, loanedAt, note } = validated.data;

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true, title: true },
  });
  if (!book) return { error: "Libro non trovato o non autorizzato." };

  try {
    await prisma.loan.create({
      data: {
        bookId,
        userId,
        borrower,
        loanedAt: loanedAt ?? new Date(),
        note,
      },
    });

    // #166: Notifica creazione prestito
    await createNotification(
      userId,
      "Nuovo prestito",
      `Hai prestato "${book.title}" a ${borrower}.`,
      "LOAN"
    );

    revalidatePath("/dashboard");
    return { success: "Prestito registrato!" };
  } catch (e) {
    logger.error("CREATE_LOAN_ERROR", e);
    return { error: "Errore durante il salvataggio." };
  }
}

export async function returnLoan(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await requireAuth();

    const loan = await prisma.loan.findFirst({
      where: { id, userId },
      include: { book: true },
    });

    if (!loan) return { success: false, error: "Prestito non trovato." };

    await prisma.loan.update({
      where: { id, userId },
      data:  { returnedAt: new Date() },
    });

    await createNotification(
      userId,
      "Libro restituito",
      `"${loan.book.title}" è stato restituito da ${loan.borrower}.`,
      "LOAN"
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    logger.error("RETURN_LOAN_ERROR", e);
    return { success: false, error: "Impossibile registrare la restituzione." };
  }
}

export async function deleteLoan(id: string): Promise<void> {
  try {
    const userId = await requireAuth();
    await prisma.loan.deleteMany({ where: { id, userId } });
    revalidatePath("/dashboard");
  } catch (e) {
    logger.error("DELETE_LOAN_ERROR", e);
  }
}
