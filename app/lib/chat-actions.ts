"use server";

import { prisma } from "@/app/lib/prisma";
import { requireAuth } from "./auth-utils";
import { logger } from "./logger";
import { ChatMessage } from "@/app/generated/prisma/client";

/**
 * #58, #163: Recupera la cronologia della chat per l'utente corrente
 */
export async function getChatHistory() {
  try {
    const userId = await requireAuth();
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return messages.map((m: ChatMessage) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
      createdAt: m.createdAt,
    }));
  } catch (e) {
    logger.error("GET_CHAT_HISTORY_ERROR", e);
    return [];
  }
}

/**
 * Pulisce la cronologia della chat
 */
export async function clearChatHistory() {
  try {
    const userId = await requireAuth();
    await prisma.chatMessage.deleteMany({ where: { userId } });
    return { success: true };
  } catch (e) {
    logger.error("CLEAR_CHAT_HISTORY_ERROR", e);
    return { error: "Errore durante la pulizia della cronologia" };
  }
}
