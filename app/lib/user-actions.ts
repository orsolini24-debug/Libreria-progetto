"use server";

import { prisma } from "@/app/lib/prisma";
import { requireAuth } from "./auth-utils";
import { revalidatePath } from "next/cache";
import { logger } from "./logger";

/**
 * #164: Cambia lo stato di visibilità pubblica della propria libreria
 */
export async function togglePublicShelf(isPublic: boolean) {
  console.log(`[DEBUG] Attempting to set public status to ${isPublic}`);
  try {
    const userId = await requireAuth();
    console.log(`[DEBUG] Auth check passed for user: ${userId}`);
    
    if (!userId) throw new Error("USER_ID_MISSING");

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isPublicShelf: isPublic },
      select: { id: true, isPublicShelf: true }
    });
    
    console.log(`[DEBUG] DB Update successful:`, updatedUser);
    
    try {
      revalidatePath("/dashboard");
      revalidatePath(`/scaffale/${userId}`);
      console.log(`[DEBUG] Revalidation successful`);
    } catch (rvErr) {
      console.warn("[DEBUG] Revalidation soft-failed:", rvErr);
    }
    
    return { success: true };
  } catch (e: unknown) {
    console.error("[CRITICAL] TOGGLE_PUBLIC_SHELF_ERROR:", e);
    const errorMessage = e instanceof Error ? e.message : "UNKNOWN_ERROR";
    return { 
      error: errorMessage === "UNAUTHORIZED" 
        ? "Sessione scaduta. Ricarica la pagina." 
        : `Errore: ${errorMessage}` 
    };
  }
}

/**
 * Recupera i dati utente per la pagina pubblica
 */
export async function getPublicUserData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        isPublicShelf: true,
        createdAt: true,
      }
    });
    return user;
  } catch (e) {
    logger.error("GET_PUBLIC_USER_DATA_ERROR", e);
    return null;
  }
}
