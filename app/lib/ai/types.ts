// Tipi condivisi del layer AI

export interface ThematicAxis {
  name: string;
  evidence: string[];
  bookIds: string[];
  trend: "growing" | "stable" | "declining";
  weight: number;
}

export interface ReadingPrefs {
  genres: string[];
  avgPagesPerDay: number;
  preferredFormat: string;
  languages: string[];
}

export interface UserContext {
  recentCheckIns: string[];
  recentQuotes: { text: string; bookTitle: string }[];
  readingBooks: string[];
  recentReadBooks: string[];
  toReadBooks: string[];
  wishlistBooks: string[];
  thematicAxes: ThematicAxis[];
  emotionalSummary: string | null;
  recentConversations: string[];
}

export interface CurrentBook {
  title: string;
  author: string | null;
  currentPage: number | null;
  pageCount: number | null;
  status: string;
  comment: string | null;
  tags: string | null;
  rating: number | null;
}

export type Intent =
  | "library_update"
  | "recommendation"
  | "book_discussion"
  | "personal_reflection"
  | "crisis_overwhelm"
  | "meta"
  | "casual_dialogue";

export type FTVariant = "quick_decision" | "tradeoff" | "minimal_plan" | "conversational_humility";
export type RCVariant = "contradiction" | "timeline" | "experiment";
export type ILVariant = "theme" | "ending" | "comparison" | "reading_path";

export interface StanceWeights {
  FT: number;
  RC: number;
  IL: number;
}

export interface OrchestrationResult {
  intent: Intent;
  weights: StanceWeights;
  ftVariant: FTVariant;
  rcVariant: RCVariant;
  ilVariant: ILVariant;
  safetyFlag: boolean;
}
