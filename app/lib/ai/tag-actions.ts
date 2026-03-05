"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { requireAuth } from "../auth-utils";
import { logger } from "../logger";

/**
 * Suggerisce dei tag basandosi sulla descrizione del libro utilizzando l'AI.
 */
export async function suggestBookTags(description: string): Promise<string[]> {
  if (!description || description.length < 20) return [];

  try {
    await requireAuth();

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: `Analizza questa trama di un libro e restituisci ESATTAMENTE 5 tag (parole chiave singole) 
        che lo descrivano meglio (es. genere, atmosfera, temi). 
        Rispondi solo con i tag separati da virgola, senza altro testo.
        Trama: "${description}"`,
    });

    return text.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
  } catch (e) {
    logger.error("SUGGEST_TAGS_ERROR", e);
    return [];
  }
}
