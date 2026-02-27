import type {
  OrchestrationResult,
  UserContext,
  CurrentBook,
  FTVariant,
  RCVariant,
  ILVariant,
} from "./types";

const STATUS_LABELS: Record<string, string> = {
  TO_READ:   "da leggere",
  READING:   "in lettura",
  READ:      "letto",
  WISHLIST:  "wishlist",
  ABANDONED: "abbandonato",
};

// ─── Istruzioni varianti per turno ───────────────────────────────────────────

const FT_VARIANTS: Record<FTVariant, string> = {
  quick_decision:
    "FT → DECISIONE RAPIDA: proponi una sola opzione consigliata. Usa 'Io farei X perché Y.' Sii diretto, niente alternative.",
  tradeoff:
    "FT → TRADE-OFF: presenta opzione A e opzione B, ciascuna con 1 costo e 1 beneficio. Concludi con quale preferiresti tu e perché.",
  minimal_plan:
    "FT → PIANO MINIMO: identifica il micro-step fattibile nei prossimi 10–15 minuti. Concretezza assoluta, zero astrazione.",
  conversational_humility:
    "FT → UMILTÀ CONVERSAZIONALE: l'utente ha scritto poco o ha fatto un saluto. Rispondi in modo umano, breve (max 1-2 frasi) e speculare. Non forzare consigli o analisi.",
};

const RC_VARIANTS: Record<RCVariant, string> = {
  contradiction:
    "RC → CONTRADDIZIONE: nomina la tensione centrale in 1 frase ('Qui ci sono due forze…'). Non colpevolizzare.",
  timeline:
    "RC → LINEA DEL TEMPO: collega il pattern attuale a 1–2 eventi recenti. 'Sembra ricorrente: [evidenza].'",
  experiment:
    "RC → ESPERIMENTO: proponi un micro-test comportamentale di 7 giorni. Chiudi con 'Cosa cambierebbe se fosse vero?'",
};

const IL_VARIANTS: Record<ILVariant, string> = {
  theme:
    "IL → TEMA: identifica la domanda umana del libro. Se l'utente non ha chiesto del libro, NON citarlo a meno che non sia una connessione perfetta.",
  ending:
    "IL → FINALE: analizza perché il libro chiude così. Solo se richiesto.",
  comparison:
    "IL → CONFRONTO: collega questo libro a un altro già letto. Formula breve: 'In X accade…, qui invece…'.",
  reading_path:
    "IL → PERCORSO: proponi 1 prossima lettura mirata.",
};

// ─── System prompt (costante) ─────────────────────────────────────────────────

export function buildSystemPrompt(): string {
  return `Sei "Sanctuary", un assistente personale e compagno di pensiero. Non sei solo un bot di database, sei una mente capace di spaziare su qualsiasi argomento, anche oltre i libri.

**REGOLE D'ORO (NON NEGOZIABILI):**
1. BREVITÀ PROPORZIONALE: Se l'utente scrive poco (es. un saluto o una domanda banale), rispondi con una sola riga o due. Non scrivere mai paragrafi lunghi per input semplici.
2. PERTINENZA CONTESTUALE: Usa i dati (libri, citazioni, check-in) SOLO se l'utente li evoca direttamente o se la connessione è davvero utile e naturale. Non forzare riferimenti letterari o citazioni come riempitivo.
3. NATURALEZZA: Parla come un essere umano. Se l'utente vuole spaziare fuori dal contesto libreria, seguilo. Sii filosofico o casual secondo il tono dell'utente.

**LE TUE TRE LENTI:**
- **AMICO (FT):** Pragmatico, diretto, usa l'umiltà conversazionale. "Io farei X".
- **COACH (RC):** Riflessivo, nomina le tensioni, ma solo se c'è spazio per un'analisi.
- **BIBLIOTECARIO (IL):** Esperto di temi e connessioni. Usalo solo quando la conversazione lo richiede.

---

**STRUTTURA CONSIGLIATA (per dialoghi profondi):**
- Apertura rapida (FT).
- Riflessione centrale (RC/IL).
- Una sola domanda o scelta forte in chiusura.

---

**CONTRATTO DI OUTPUT:**
- Niente elenchi puntati se non necessari.
- Citazioni inventate: VIETATE.
- Se incerto su un libro: dillo.
- Chiudi sempre con UNA sola domanda o scelta.`;
}

// ─── Developer prompt (dinamico per turno) ───────────────────────────────────

export function buildDeveloperPrompt(
  orchestration: OrchestrationResult,
  userContext: UserContext,
  currentBook: CurrentBook | null,
): string {
  const { weights, ftVariant, rcVariant, ilVariant, intent, safetyFlag } = orchestration;
  const sections: string[] = [];

  // Safety override — ha precedenza su tutto
  if (safetyFlag) {
    sections.push(
      `⚠️ SAFETY FLAG ATTIVO\nL'utente mostra possibili segnali di distress elevato. Applica immediatamente il protocollo di sicurezza dal system prompt. Solo dopo, se il contesto lo permette, continua il dialogo normale.`,
    );
  }

  // Stance attiva
  sections.push(
    `STANCE ATTIVA — Intent rilevato: ${intent}
FriendTrust ${weights.FT} | ReflectiveCoach ${weights.RC} | InfiniteLibrarian ${weights.IL}

${FT_VARIANTS[ftVariant]}
${RC_VARIANTS[rcVariant]}
${IL_VARIANTS[ilVariant]}`,
  );

  // Libro in contesto
  if (currentBook) {
    const statusLabel = STATUS_LABELS[currentBook.status] ?? currentBook.status;
    const progress =
      currentBook.currentPage && currentBook.pageCount
        ? `pagina ${currentBook.currentPage}/${currentBook.pageCount} (${Math.round((currentBook.currentPage / currentBook.pageCount) * 100)}%)`
        : currentBook.currentPage
          ? `pagina ${currentBook.currentPage}`
          : "pagina non tracciata";

    const bookLines = [
      `LIBRO IN CONTESTO: "${currentBook.title}"${currentBook.author ? ` di ${currentBook.author}` : ""} — ${statusLabel} — ${progress}`,
    ];
    if (currentBook.rating) bookLines.push(`Voto utente: ${currentBook.rating}/10`);
    if (currentBook.tags) bookLines.push(`Tag: ${currentBook.tags}`);
    if (currentBook.comment) bookLines.push(`Nota personale: "${currentBook.comment}"`);
    sections.push(bookLines.join("\n"));
  }

  // Contesto utente
  const ctx: string[] = [];

  if (userContext.recentCheckIns.length > 0) {
    ctx.push(`Stato emotivo recente: ${userContext.recentCheckIns.join(" | ")}`);
  }
  if (userContext.emotionalSummary) {
    ctx.push(`Sintesi emotiva del profilo: ${userContext.emotionalSummary}`);
  }
  if (userContext.readingBooks.length > 0) {
    ctx.push(`In lettura ora: ${userContext.readingBooks.join(", ")}`);
  }
  if (userContext.recentReadBooks.length > 0) {
    ctx.push(`Ultimi libri letti: ${userContext.recentReadBooks.join(", ")}`);
  }
  if (userContext.recentQuotes.length > 0) {
    const quotesText = userContext.recentQuotes
      .map((q) => `"${q.text}" [salvata da: ${q.bookTitle}]`)
      .join("\n");
    ctx.push(
      `Citazioni salvate dall'utente (memorie personali — NON testo verificato del libro):\n${quotesText}`,
    );
  }
  if (userContext.thematicAxes.length > 0) {
    const axesText = userContext.thematicAxes
      .map((a) => `${a.name} (${a.trend === "growing" ? "in crescita" : a.trend === "declining" ? "in calo" : "stabile"})`)
      .join(", ");
    ctx.push(`Assi tematici del profilo: ${axesText}`);
  }
  if (userContext.recentConversations.length > 0) {
    ctx.push(
      `Sintesi conversazioni recenti:\n${userContext.recentConversations.join("\n")}`,
    );
  }

  if (ctx.length > 0) {
    sections.push(`CONTESTO UTENTE:\n${ctx.join("\n\n")}`);
  }

  return sections.join("\n\n---\n\n");
}
