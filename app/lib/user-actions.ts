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
    await prisma.user.update({
      where: { id: userId },
      data: { isPublicShelf: isPublic }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    logger.error("TOGGLE_PUBLIC_SHELF_ERROR", e);
    return { error: "Errore durante il cambio della privacy" };
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
