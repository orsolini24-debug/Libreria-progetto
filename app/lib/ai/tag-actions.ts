"use server";

import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { requireAuth } from "../auth-utils";
import { logger } from "../logger";

/**
 * Suggerisce dei tag basandosi sulla descrizione del libro utilizzando l'AI.
 */
export async function suggestBookTags(description: string, existingTags?: string[]): Promise<string[]> {
  if (!description || description.length < 20) return [];

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return [];

  try {
    await requireAuth();

    const groq = createGroq({ apiKey: apiKey.trim() });
    const existingNote = existingTags && existingTags.length > 0
      ? `\nTag già presenti (non ripetere): ${existingTags.join(", ")}.`
      : "";
    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: groq("llama-3.3-70b-versatile") as any,
      prompt: `Analizza questa trama di un libro e restituisci ESATTAMENTE 5 tag (parole chiave singole)
        che lo descrivano meglio (es. genere, atmosfera, temi).
        Rispondi solo con i tag separati da virgola, senza altro testo.${existingNote}
        Trama: "${description}"`,
    });

    return text.split(",").map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
  } catch (e) {
    logger.error("SUGGEST_TAGS_ERROR", e);
    return [];
  }
}
