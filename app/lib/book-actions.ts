"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { BookStatus } from "@/app/generated/prisma/client";

export type ActionState = { error?: string; success?: string } | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return session.user.id;
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

// FIX: scala 0.5–10 → Float invece di Int
function parseFloatOrNull(raw: FormDataEntryValue | null): number | null {
  const n = parseFloat(raw as string);
  return isNaN(n) ? null : Math.round(n * 2) / 2; // arrotonda al mezzo voto più vicino
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
// BUG FIX: rating, comment, tags e formats erano assenti dalla create → ora inclusi
export async function createBook(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string;
  try { userId = await requireUserId(); }
  catch { return { error: "Sessione scaduta. Effettua di nuovo il login." }; }

  const title = str(formData.get("title"));
  if (!title) return { error: "Il titolo è obbligatorio." };

  try {
    await prisma.book.create({
      data: {
        userId,
        title,
        author:        str(formData.get("author")),
        status:        parseStatus(formData.get("status"), BookStatus.TO_READ),
        googleId:      str(formData.get("googleId")),
        isbn:          str(formData.get("isbn")),
        publisher:     str(formData.get("publisher")),
        publishedDate: str(formData.get("publishedDate")),
        language:      str(formData.get("language")),
        pageCount:     parseIntOrNull(formData.get("pageCount")),
        coverUrl:      str(formData.get("coverUrl")),
        description:   str(formData.get("description")),
        // ← questi tre erano mancanti (bug principale)
        rating:        parseFloatOrNull(formData.get("rating")),
        comment:       str(formData.get("comment")),
        tags:          str(formData.get("tags")),
        formats:       str(formData.get("formats")),
        purchasedAt:   parseDateOrNull(formData.get("purchasedAt")),
        startedAt:     parseDateOrNull(formData.get("startedAt")),
        finishedAt:    parseDateOrNull(formData.get("finishedAt")),
        currentPage:   parseIntOrNull(formData.get("currentPage")),
        series:        str(formData.get("series")),
        seriesOrder:   parseIntOrNull(formData.get("seriesOrder")),
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

  const title = str(formData.get("title"));
  if (!title) return { error: "Il titolo è obbligatorio." };

  try {
    // [GEMINI-ARCH] - Motivo: Query singola atomica (filtro userId in where) - Fine ultimo: Riduzione latenza
    const result = await prisma.book.update({
      where: { id, userId },
      data: {
        title, // Ora garantito come string (non null)
        author:      str(formData.get("author")),
        status:      parseStatus(formData.get("status"), BookStatus.TO_READ),
        rating:      parseFloatOrNull(formData.get("rating")),
        comment:     str(formData.get("comment")),
        tags:        str(formData.get("tags")),
        formats:     str(formData.get("formats")),
        purchasedAt: parseDateOrNull(formData.get("purchasedAt")),
        startedAt:   parseDateOrNull(formData.get("startedAt")),
        finishedAt:  parseDateOrNull(formData.get("finishedAt")),
        currentPage: parseIntOrNull(formData.get("currentPage")),
        series:      str(formData.get("series")),
        seriesOrder: parseIntOrNull(formData.get("seriesOrder")),
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

