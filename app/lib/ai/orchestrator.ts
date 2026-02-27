import type {
  Intent,
  FTVariant,
  RCVariant,
  ILVariant,
  StanceWeights,
  OrchestrationResult,
} from "./types";

// Matrice intent → pesi (FT / RC / IL)
const INTENT_WEIGHTS: Record<Intent, StanceWeights> = {
  library_update:      { FT: 0.7, RC: 0.1, IL: 0.2 },
  recommendation:      { FT: 0.2, RC: 0.2, IL: 0.6 },
  book_discussion:     { FT: 0.1, RC: 0.2, IL: 0.7 },
  personal_reflection: { FT: 0.3, RC: 0.6, IL: 0.1 },
  crisis_overwhelm:    { FT: 0.5, RC: 0.4, IL: 0.1 },
  meta:                { FT: 0.6, RC: 0.1, IL: 0.3 },
};

// Parole chiave di sicurezza — check prioritario
const CRISIS_KEYWORDS = [
  "suicid",
  "autolesion",
  "farmi del male",
  "non voglio più vivere",
  "finirla",
  "spararmi",
  "tagliarmi",
  "ammazzarmi",
];

// Pattern di riconoscimento intent
const PATTERNS: Record<Intent, RegExp[]> = {
  crisis_overwhelm: [
    /non voglio (più )?vivere/i,
    /farmi del male/i,
    /suicid/i,
    /autolesion/i,
    /mi sento (completamente )?(a pezzi|distrutto|distrutta|vuoto|vuota|perso|persa) e non so/i,
  ],
  library_update: [
    /aggiungi (il libro|questo libro|un libro)/i,
    /ho (finito|terminato|completato) (di leggere|il libro)?/i,
    /ho iniziato (a leggere)?/i,
    /segna(mi|lo|la)? come (letto|in lettura|da leggere|abbandonato)/i,
    /sposta(lo|la)? (a|in|tra)/i,
    /dai?( un)? voto/i,
    /valuta(lo|la)?/i,
    /ho letto \d+ pagine/i,
  ],
  recommendation: [
    /cosa (mi )?consigli/i,
    /cosa (devo|posso|dovrei) leggere/i,
    /consigliami/i,
    /suggeriscimi/i,
    /prossimo libro/i,
    /cosa leggo (ora|dopo|adesso|stasera|questa settimana)/i,
    /qualcosa (da leggere|di simile|come)/i,
    /dammi (un consiglio|suggerimenti)/i,
  ],
  book_discussion: [
    /analisi (del libro|di questo)/i,
    /spiega(mi)? (il )?finale/i,
    /tema (principale|dominante|del libro|centrale)/i,
    /tesi (implicita|del libro|dell'autore)/i,
    /cosa vuol dire/i,
    /perché (si chiama|finisce così|l'autore)/i,
    /confronta(lo|la)? con/i,
    /simbolism/i,
    /personaggio (principale|di questo|centrale)/i,
    /cosa racconta( veramente)?/i,
  ],
  personal_reflection: [
    /cosa dice di me/i,
    /perché mi (colpisce|tocca|emoziona|turba)/i,
    /mi (ci )?ritrovo/i,
    /mi sento (come|simile|uguale a)/i,
    /mi ha fatto (pensare|riflettere)/i,
    /come lo collego alla mia vita/i,
    /mi sento (strano|stranamente|angosciato|vuoto|pieno|perso)/i,
    /cosa mi dice questo libro/i,
  ],
  meta: [
    /come funzion/i,
    /cosa puoi fare/i,
    /come (mi )?aiuti/i,
    /cosa sei/i,
    /modalità (bibliotecario|amico|coach|terapeuta)/i,
  ],
};

function detectIntent(message: string): Intent {
  // Safety: sempre prima
  for (const pattern of PATTERNS.crisis_overwhelm) {
    if (pattern.test(message)) return "crisis_overwhelm";
  }

  // Ordine di priorità per gli altri intent
  const ordered: Exclude<Intent, "crisis_overwhelm">[] = [
    "library_update",
    "recommendation",
    "book_discussion",
    "personal_reflection",
    "meta",
  ];

  for (const intent of ordered) {
    for (const pattern of PATTERNS[intent]) {
      if (pattern.test(message)) return intent;
    }
  }

  // Default: reflection (il più comune in un'app di lettura)
  return "personal_reflection";
}

function selectFTVariant(message: string): FTVariant {
  if (/non so|bloccato|bloccata|che faccio|non riesco a scegliere/i.test(message))
    return "quick_decision";
  if (/primo passo|adesso|subito|iniziare|stasera/i.test(message))
    return "minimal_plan";
  return "tradeoff";
}

function selectRCVariant(message: string): RCVariant {
  if (/sempre|di solito|tendenza|tende|ripeto|pattern/i.test(message))
    return "timeline";
  if (/cambiare|migliorare|provare|testare|esperimento/i.test(message))
    return "experiment";
  return "contradiction";
}

function selectILVariant(message: string, intent: Intent): ILVariant {
  if (/finale|come finisce|perché finisce/i.test(message)) return "ending";
  if (/confronta|simile a|come in|rispetto a|parallelo/i.test(message))
    return "comparison";
  if (/percorso|sequenza|ordine|programma|piano di lettura/i.test(message))
    return "reading_path";
  if (intent === "recommendation") return "reading_path";
  return "theme";
}

function checkSafetyFlag(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

export function orchestrate(lastUserMessage: string): OrchestrationResult {
  const intent = detectIntent(lastUserMessage);
  const weights = INTENT_WEIGHTS[intent];
  const safetyFlag = checkSafetyFlag(lastUserMessage);

  return {
    intent,
    weights,
    safetyFlag,
    ftVariant: selectFTVariant(lastUserMessage),
    rcVariant: selectRCVariant(lastUserMessage),
    ilVariant: selectILVariant(lastUserMessage, intent),
  };
}
