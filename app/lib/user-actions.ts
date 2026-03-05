"use server";

import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { requireAuth } from "./auth-utils";
import { revalidatePath } from "next/cache";
import { logger } from "./logger";

/**
 * #164: Cambia lo stato di visibilità pubblica della propria libreria
 */
export async function togglePublicShelf(isPublic: boolean) {
  console.log(">>> [TOGGLE_START] Requested:", isPublic);
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error(">>> [TOGGLE_ERROR] No userId in session");
      return { error: "Sessione non valida. Effettua il logout e rientra." };
    }

    console.log(">>> [TOGGLE_DB_UPDATE] Target User:", userId);
    
    // Proviamo l'update con un blocco try/catch isolato
    let updated;
    try {
      updated = await prisma.user.update({
        where: { id: userId },
        data: { isPublicShelf: isPublic },
      });
      console.log(">>> [TOGGLE_DB_SUCCESS] New status:", updated.isPublicShelf);
    } catch (dbErr: any) {
      console.error(">>> [TOGGLE_DB_FAIL]", dbErr);
      return { error: `Database Error: ${dbErr.code || 'UNKNOWN'}` };
    }
    
    try {
      revalidatePath("/dashboard");
      revalidatePath(`/scaffale/${userId}`);
      console.log(">>> [TOGGLE_REVALIDATE_OK]");
    } catch (rvErr) {
      console.warn(">>> [TOGGLE_REVALIDATE_SOFT_FAIL]", rvErr);
    }
    
    return { success: true };
  } catch (e: any) {
    console.error(">>> [TOGGLE_CRITICAL_FAIL]", e);
    return { error: `Errore Critico: ${e.message || 'Unknown'}` };
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
