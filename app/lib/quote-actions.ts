"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { QuoteSchema } from "./validation/schemas";
import { mapZodError } from "./validation/errors";

export type QuoteActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> } | null;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export async function createQuote(
  _prevState: QuoteActionState,
  formData: FormData
): Promise<QuoteActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "Sessione scaduta." };
  }

  const raw = Object.fromEntries(formData.entries());
  const validated = QuoteSchema.safeParse(raw);

  if (!validated.success) {
    const mapped = mapZodError(validated.error);
    return {
      error: !mapped.ok ? mapped.error.message : "Errore di validazione",
      fieldErrors: !mapped.ok ? mapped.error.fieldErrors : undefined,
    };
  }

  const { bookId, text, type, page, chapter } = validated.data;

  // Verifica ownership del libro
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  });
  if (!book) return { error: "Libro non trovato o non autorizzato." };

  try {
    await prisma.quote.create({
      data: {
        bookId,
        userId,
        type,
        text,
        page,
        chapter,
      },
    });
    revalidatePath("/dashboard");
    return { success: "Citazione salvata!" };
  } catch (e) {
    console.error("[createQuote]", e);
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
