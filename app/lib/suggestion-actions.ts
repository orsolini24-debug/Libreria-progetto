"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { SuggestionCategory, SuggestionStatus } from "@/app/generated/prisma/client";
import { requireAuth, requireAdmin } from "./auth-utils";

export type ActionState = { error?: string; success?: string } | null;

const VALID_CATEGORIES = Object.values(SuggestionCategory) as string[];
const VALID_STATUSES   = Object.values(SuggestionStatus)   as string[];

// ── createSuggestion ─────────────────────────────────────────────────────────
export async function createSuggestion(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  let userId: string;
  try { userId = await requireAuth(); }
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
    // #95: adminNote non c'è qui, ma sanitizziamo comunque se ci fosse.
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
  try { 
    // #7: requireAdmin lancia errore se non admin. Deve essere catturato o lasciato salire.
    await requireAdmin(); 
  } catch { 
    return { error: "Non autorizzato." }; 
  }

  if (!VALID_STATUSES.includes(status)) return { error: "Status non valido." };

  try {
    await prisma.suggestion.update({
      where: { id },
      data: {
        status:    status as SuggestionStatus,
        adminNote: adminNote.trim() || null, // #95: sanitizzazione base via trim
      },
    });
    revalidatePath("/suggestions");
    revalidatePath("/admin/suggestions");
    return {};
  } catch (e) {
    console.error("[updateSuggestionStatus]", e);
    return { error: "Errore durante l'aggiornamento." };
  }
}

// ── deleteSuggestion (admin) ─────────────────────────────────────────────────
export async function deleteSuggestion(id: string): Promise<void> {
  await requireAdmin();
  await prisma.suggestion.delete({ where: { id } });
  revalidatePath("/admin/suggestions");
}
