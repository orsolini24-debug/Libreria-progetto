"use server";

import { prisma } from "@/app/lib/prisma";
import { requireAuth } from "./auth-utils";
import { revalidatePath } from "next/cache";
import { logger } from "./logger";

/**
 * #164: Cambia lo stato di visibilità pubblica della propria libreria
 */
export async function togglePublicShelf(isPublic: boolean) {
  try {
    const userId = await requireAuth();
    if (!userId) throw new Error("USER_ID_MISSING");

    await prisma.user.update({
      where: { id: userId },
      data: { isPublicShelf: isPublic }
    });
    
    // Tenta la revalidazione, ma non bloccare se fallisce
    try {
      revalidatePath("/dashboard");
      revalidatePath(`/scaffale/${userId}`);
    } catch (revalidateError) {
      console.warn("REVALIDATE_ERROR_NON_FATAL:", revalidateError);
    }
    
    return { success: true };
  } catch (e: unknown) {
    logger.error("TOGGLE_PUBLIC_SHELF_ERROR", e);
    const errorMessage = e instanceof Error ? e.message : "";
    return { 
      error: errorMessage === "UNAUTHORIZED" 
        ? "Sessione scaduta. Ricarica la pagina." 
        : "Errore durante l'aggiornamento della privacy" 
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
