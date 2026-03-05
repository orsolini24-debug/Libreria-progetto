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
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { error: "AUTH_REQUIRED" };

    // Update diretto e revalidazione singola
    await prisma.user.update({
      where: { id: userId },
      data: { isPublicShelf: isPublic },
    });
    
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (e: any) {
    console.error("CRITICAL_ACTION_ERROR:", e);
    return { error: `DB_OR_SERVER_ERROR: ${e.message || 'unknown'}` };
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
