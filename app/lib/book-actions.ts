"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreateBookSchema, UpdateBookSchema } from "./validation/schemas";
import { mapZodError } from "./validation/errors";
import { requireAuth } from "./auth-utils";
import { logger } from "./logger";

export type ActionState =
  | { error?: string; success?: string; fieldErrors?: Record<string, string[]> }
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formDataToObject(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries());
}

/**
 * Normalizza stringhe per deduplicazione robusta (#29)
 */
function normalize(s: string | null | undefined): string {
  return (s || "").trim().toLowerCase();
}

// ── createBook ────────────────────────────────────────────────────────────────
export async function createBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return { error: "Sessione scaduta. Effettua di nuovo il login." };
  }

  const raw = formDataToObject(formData);
  const validated = CreateBookSchema.safeParse(raw);

  if (!validated.success) {
    const mapped = mapZodError(validated.error);
    return {
      error: !mapped.ok ? mapped.error.message : "Errore di validazione",
      fieldErrors: !mapped.ok ? mapped.error.fieldErrors : undefined,
    };
  }

  const data = validated.data;

  try {
    const existing = await prisma.book.findFirst({
      where: {
        userId,
        title: { equals: data.title, mode: 'insensitive' },
        author: { equals: data.author, mode: 'insensitive' },
        isbn: data.isbn || undefined,
        formats: data.formats || undefined,
      },
    });

    if (existing) {
      return { error: `Il libro "${data.title}" è già presente nella tua libreria.` };
    }

    await prisma.book.create({
      data: {
        userId,
        ...data,
      },
    });

    revalidatePath("/dashboard");
    return { success: `Libro "${data.title}" aggiunto!` };
  } catch (e) {
    logger.error("CREATE_BOOK_ERROR", e);
    return { error: "Errore durante il salvataggio. Riprova." };
  }
}

// ── createBooksBulk ──────────────────────────────────────────────────────────
export async function createBooksBulk(
  books: (Partial<z.infer<typeof CreateBookSchema>> & { 
    googleId?: string; 
    publisher?: string; 
    publishedDate?: string; 
    language?: string; 
    coverUrl?: string; 
    description?: string 
  })[]
): Promise<{ success: number; skipped: number; error?: string }> {
  let userId: string;
  try { userId = await requireAuth(); }
  catch { return { success: 0, skipped: 0, error: "Sessione scaduta." }; }

  const toCreate: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  let skippedCount = 0;

  const existingBooks = await prisma.book.findMany({
    where: { userId },
    select: { title: true, author: true, isbn: true }
  });

  const existingSet = new Set(
    existingBooks.map(b => `${normalize(b.title)}|${normalize(b.author)}|${b.isbn || ""}`)
  );

  for (const bookData of books) {
    const validated = CreateBookSchema.safeParse(bookData);
    if (!validated.success) {
      skippedCount++;
      continue;
    }

    const data = validated.data;
    const key = `${normalize(data.title)}|${normalize(data.author)}|${data.isbn || ""}`;

    if (existingSet.has(key)) {
      skippedCount++;
      continue;
    }

    toCreate.push({
      userId,
      ...data,
      googleId: bookData.googleId,
      publisher: bookData.publisher,
      publishedDate: bookData.publishedDate,
      language: bookData.language,
      coverUrl: bookData.coverUrl,
      description: bookData.description,
    });
    
    existingSet.add(key);
  }

  if (toCreate.length > 0) {
    try {
      await prisma.book.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      revalidatePath("/dashboard");
    } catch (e) {
      logger.error("BULK_CREATE_ERROR", e);
      return { success: 0, skipped: skippedCount, error: "Errore durante l'importazione massiva." };
    }
  }

  return { success: toCreate.length, skipped: skippedCount };
}

// ── updateBook ────────────────────────────────────────────────────────────────
export async function updateBook(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string;
  try { userId = await requireAuth(); }
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

  const data = Object.fromEntries(
    Object.entries(validated.data).filter(([k, v]) => k !== "" && v !== undefined)
  );

  try {
    const result = await prisma.book.update({
      where: { id, userId },
      data,
    });

    if (!result) return { error: "Libro non trovato o non autorizzato." };

    revalidatePath("/dashboard");
    revalidatePath(`/books/${id}`); 
    
    return { success: "Libro aggiornato!" };
  } catch (e) {
    logger.error("UPDATE_BOOK_ERROR", e);
    return { error: "Errore durante l'aggiornamento." };
  }
}

// ── deleteBook ────────────────────────────────────────────────────────────────
export async function deleteBook(id: string): Promise<void> {
  try {
    const userId = await requireAuth();
    await prisma.book.delete({ where: { id, userId } });
    revalidatePath("/dashboard");
  } catch (e) {
    logger.error("DELETE_BOOK_ERROR", e);
    throw e;
  }
}
