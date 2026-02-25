"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { LoanSchema } from "./validation/schemas";
import { mapZodError } from "./validation/errors";

export type LoanActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> } | null;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export async function createLoan(
  _prevState: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
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
    select: { id: true },
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
    revalidatePath("/dashboard");
    return { success: "Prestito registrato!" };
  } catch (e) {
    console.error("[createLoan]", e);
    return { error: "Errore durante il salvataggio." };
  }
}

export async function returnLoan(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.loan.updateMany({
    where: { id, userId },
    data:  { returnedAt: new Date() },
  });
  revalidatePath("/dashboard");
}

export async function deleteLoan(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.loan.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}
