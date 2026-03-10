"use server";

import { prisma } from "@/app/lib/prisma";
import { requireAuth } from "./auth-utils";
import { revalidatePath } from "next/cache";
import { logger } from "./logger";

/**
 * #166: Recupera le notifiche non lette dell'utente
 */
export async function getNotifications() {
  try {
    const userId = await requireAuth();
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (e) {
    logger.error("GET_NOTIFICATIONS_ERROR", e);
    return [];
  }
}

/**
 * Segna una notifica come letta
 */
export async function markAsRead(id: string) {
  try {
    const userId = await requireAuth();
    await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    logger.error("MARK_READ_ERROR", e);
    return { error: "Errore" };
  }
}

/**
 * Crea una nuova notifica (interna — solo per l'utente autenticato)
 */
export async function createNotification(userId: string, title: string, message: string, type: "LOAN" | "GOAL" | "SYSTEM") {
  try {
    const authUserId = await requireAuth();
    if (authUserId !== userId) {
      logger.error("CREATE_NOTIFICATION_UNAUTHORIZED", { attempted: userId });
      return;
    }
    await prisma.notification.create({
      data: { userId, title, message, type }
    });
    revalidatePath("/dashboard");
  } catch (e) {
    logger.error("CREATE_NOTIFICATION_ERROR", e);
  }
}
