"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { SuggestionCategory, SuggestionStatus, Role } from "@/app/generated/prisma/client";

export type ActionState = { error?: string; success?: string } | null;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return session.user.id;
}

async function requireAdmin(): Promise<string> {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== Role.ADMIN) throw new Error("Non autorizzato");
  return userId;
}

const VALID_CATEGORIES = Object.values(SuggestionCategory) as string[];
const VALID_STATUSES   = Object.values(SuggestionStatus)   as string[];

// ── createSuggestion ─────────────────────────────────────────────────────────
export async function createSuggestion(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string;
  try { userId = await requireUserId(); }
  catch { return { error: "Sessione scaduta." }; }

  const title       = (formData.get("title")       as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const categoryRaw =  formData.get("category")    as string;

  if (!title)                             return { error: "Il titolo è obbligatorio." };
  if (!description || description.length < 10)
    return { error: "La descrizione deve essere di almeno 10 caratteri." };

  const category = VALID_CATEGORIES.includes(categoryRaw)
    ? (categoryRaw as SuggestionCategory)
    : SuggestionCategory.OTHER;

  try {
    await prisma.suggestion.create({ data: { userId, title, description, category } });
    revalidatePath("/suggestions");
    return { success: "Suggerimento inviato! Grazie per il contributo." };
  } catch (e) {
    console.error("[createSuggestion]", e);
    return { error: "Errore durante l'invio. Riprova." };
  }
}

// ── updateSuggestionStatus (admin) ───────────────────────────────────────────
export async function updateSuggestionStatus(
  id: string,
  status: string,
  adminNote: string
): Promise<{ error?: string }> {
  try { await requireAdmin(); }
  catch { return { error: "Non autorizzato." }; }

  if (!VALID_STATUSES.includes(status)) return { error: "Status non valido." };

  await prisma.suggestion.update({
    where: { id },
    data: {
      status:    status as SuggestionStatus,
      adminNote: adminNote.trim() || null,
    },
  });
  revalidatePath("/suggestions");
  revalidatePath("/admin/suggestions");
  return {};
}

// ── deleteSuggestion (admin) ─────────────────────────────────────────────────
export async function deleteSuggestion(id: string): Promise<void> {
  await requireAdmin();
  await prisma.suggestion.delete({ where: { id } });
  revalidatePath("/admin/suggestions");
}
