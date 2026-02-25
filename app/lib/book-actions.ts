"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { BookStatus } from "@/app/generated/prisma/client";
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

const VALID_STATUSES = Object.values(BookStatus) as string[];

function parseStatus(raw: FormDataEntryValue | null, fallback: BookStatus): BookStatus {
  if (raw && VALID_STATUSES.includes(raw as string)) return raw as BookStatus;
  return fallback;
}

function parseIntOrNull(raw: FormDataEntryValue | null): number | null {
  const n = parseInt(raw as string, 10);
  return isNaN(n) ? null : n;
}

function parseFloatOrNull(raw: FormDataEntryValue | null): number | null {
  const n = parseFloat(raw as string);
  return isNaN(n) ? null : Math.round(n * 2) / 2;
}

function str(raw: FormDataEntryValue | null): string | null {
  const s = (raw as string)?.trim();
  return s || null;
}

function parseDateOrNull(raw: FormDataEntryValue | null): Date | null {
  const s = (raw as string)?.trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
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
