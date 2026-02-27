"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreateBookSchema, UpdateBookSchema } from "./validation/schemas";
import { mapZodError } from "./validation/errors";

export type ActionState =
  | { error?: string; success?: string; fieldErrors?: Record<string, string[]> }
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

/**
 * Helper per leggere FormData con comportamenti coerenti.
 * Nota: lo schema gestisce già "" -> null, quindi qui non “normalizziamo”.
 */
function formDataToObject(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries());
}

// ── createBook ────────────────────────────────────────────────────────────────
/**
 * createBook (P0 secure-by-default)
 */
export async function createBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "Sessione scaduta. Effettua di nuovo il login." };
  }

  const raw = formDataToObject(formData);
  const validated = CreateBookSchema.safeParse(raw);

  if (!validated.success) {
    const mapped = mapZodError(validated.error);
    // mapped.ok è garantito false qui dato che validated.success è false
    return {
      error: !mapped.ok ? mapped.error.message : "Errore di validazione",
      fieldErrors: !mapped.ok ? mapped.error.fieldErrors : undefined,
    };
  }

  // Da qui validated.data è garantito
  const data = validated.data;

  try {
    // [GEMINI-ARCH] - Controllo duplicati raffinato (Titolo + Autore + ISBN + Formati)
    const existing = await prisma.book.findFirst({
      where: {
        userId,
        title: data.title,
        author: data.author,
        isbn: data.isbn || undefined,
        formats: data.formats || undefined, // Se il formato è diverso, non è un duplicato
      },
    });

    if (existing) {
      return { error: "Questo libro (stessa edizione/titolo) è già presente nella tua libreria." };
    }

    await prisma.book.create({
      data: {
        userId,
        title: data.title,
        author: data.author,
        status: data.status,
        googleId: data.googleId,
        isbn: data.isbn,
        publisher: data.publisher,
        publishedDate: data.publishedDate,
        language: data.language,
        coverUrl: data.coverUrl,
        description: data.description,
        rating: data.rating,
        comment: data.comment,
        tags: data.tags,
        formats: data.formats,
        purchasedAt: data.purchasedAt,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt,
        currentPage: data.currentPage,
        pageCount: data.pageCount,
        series: data.series,
        seriesOrder: data.seriesOrder,
      },
    });

    revalidatePath("/dashboard");
    return { success: "Libro aggiunto!" };
  } catch (e) {
    console.error("[createBook]", e);
    return { error: "Errore durante il salvataggio. Riprova." };
  }
}

// ── createBooksBulk ──────────────────────────────────────────────────────────
export async function createBooksBulk(
  books: (Partial<z.infer<typeof CreateBookSchema>> & { googleId?: string; publisher?: string; publishedDate?: string; language?: string; coverUrl?: string; description?: string })[]
): Promise<{ success: number; skipped: number; error?: string }> {
  let userId: string;
  try { userId = await requireUserId(); }
  catch { return { success: 0, skipped: 0, error: "Sessione scaduta." }; }

  let successCount = 0;
  let skippedCount = 0;

  for (const bookData of books) {
    const validated = CreateBookSchema.safeParse(bookData);
    if (!validated.success) {
      skippedCount++;
      continue;
    }

    const data = validated.data;
    
    // Controllo duplicati atomico
    const existing = await prisma.book.findFirst({
      where: {
        userId,
        title: data.title,
        author: data.author,
        isbn: data.isbn || undefined,
      },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    try {
      await prisma.book.create({
        data: {
          userId,
          ...data,
          googleId: bookData.googleId,
          publisher: bookData.publisher,
          publishedDate: bookData.publishedDate,
          language: bookData.language,
          coverUrl: bookData.coverUrl,
          description: bookData.description,
        },
      });
      successCount++;
    } catch {
      skippedCount++;
    }
  }

  if (successCount > 0) revalidatePath("/dashboard");
  return { success: successCount, skipped: skippedCount };
}

// ── updateBook ────────────────────────────────────────────────────────────────
export async function updateBook(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string;
  try { userId = await requireUserId(); }
  catch { return { error: "Sessione scaduta." }; }

  const raw = formDataToObject(formData);
  const validated = UpdateBookSchema.safeParse(raw);

  if (!validated.success) {
    const mapped = mapZodError(validated.error);
    return {
      error: !mapped.ok ? mapped.error.message : "Errore di validazione",
      fieldErrors: !mapped.ok ? mapped.error.fieldErrors : undefined,
    };
  }

  const data = validated.data;

  try {
    const result = await prisma.book.update({
      where: { id, userId },
      data: {
        title:       data.title,
        author:      data.author,
        status:      data.status,
        rating:      data.rating,
        comment:     data.comment,
        tags:        data.tags,
        formats:     data.formats,
        purchasedAt: data.purchasedAt,
        startedAt:   data.startedAt,
        finishedAt:  data.finishedAt,
        currentPage: data.currentPage,
        series:      data.series,
        seriesOrder: data.seriesOrder,
        description: data.description,
        aiAnalysis:  data.aiAnalysis,
      },
    });

    if (!result) return { error: "Libro non trovato o non autorizzato." };

    revalidatePath("/dashboard");
    return { success: "Libro aggiornato!" };
  } catch (e) {
    console.error("[updateBook]", e);
    return { error: "Errore durante l'aggiornamento." };
  }
}

// ── deleteBook ────────────────────────────────────────────────────────────────
export async function deleteBook(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.book.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}
