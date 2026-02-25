"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export type LoanActionState = { error?: string; success?: string } | null;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return session.user.id;
}

export async function createLoan(
  _prevState: LoanActionState,
  formData: FormData
): Promise<LoanActionState> {
  let userId: string;
  try { userId = await requireUserId(); }
  catch { return { error: "Sessione scaduta." }; }

  const bookId   = (formData.get("bookId")   as string)?.trim();
  const borrower = (formData.get("borrower") as string)?.trim();
  if (!bookId)   return { error: "Libro mancante." };
  if (!borrower) return { error: "Inserisci il nome di chi ha preso il libro." };

  const book = await prisma.book.findFirst({ where: { id: bookId, userId } });
  if (!book) return { error: "Libro non trovato." };

  const loanedAtRaw = formData.get("loanedAt") as string;
  const loanedAt    = loanedAtRaw ? new Date(loanedAtRaw) : new Date();

  try {
    await prisma.loan.create({
      data: {
        bookId,
        userId,
        borrower,
        loanedAt,
        note: (formData.get("note") as string)?.trim() || null,
      },
    });
    revalidatePath("/dashboard");
    return { success: "Prestito registrato!" };
  } catch {
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
