"use server";

// Mappa categorie Google Books → tag italiani
const CATEGORY_IT: Record<string, string> = {
  "fiction": "narrativa", "novel": "romanzo", "literary fiction": "letteratura",
  "fantasy": "fantasy", "epic fantasy": "fantasy", "urban fantasy": "fantasy",
  "science fiction": "fantascienza", "sci-fi": "fantascienza",
  "thriller": "thriller", "suspense": "thriller",
  "mystery": "giallo", "crime": "giallo", "detective": "giallo",
  "horror": "horror",
  "romance": "romanzo rosa",
  "historical fiction": "storico", "history": "storia",
  "biography": "biografia", "autobiography": "autobiografia", "memoir": "memoir",
  "self-help": "crescita personale", "personal development": "crescita personale",
  "psychology": "psicologia",
  "philosophy": "filosofia",
  "science": "scienza", "popular science": "divulgazione",
  "technology": "tecnologia", "computers": "informatica",
  "business": "business", "economics": "economia",
  "art": "arte", "architecture": "architettura",
  "travel": "viaggi",
  "cooking": "cucina", "food": "cucina",
  "health": "salute", "medicine": "medicina",
  "religion": "religione", "spirituality": "spiritualità",
  "poetry": "poesia",
  "drama": "teatro",
  "children": "bambini", "juvenile fiction": "ragazzi", "young adult": "young adult",
  "comics": "fumetti", "graphic novel": "graphic novel",
  "political science": "politica",
  "classic": "classici", "classics": "classici",
  "adventure": "avventura",
  "dystopia": "distopia",
};

function mapCategory(raw: string): string {
  const lower = raw.toLowerCase().trim();
  // Ricerca esatta
  if (CATEGORY_IT[lower]) return CATEGORY_IT[lower];
  // Ricerca parziale
  for (const [key, val] of Object.entries(CATEGORY_IT)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  // Fallback: prima parola in minuscolo
  return lower.split(/[\s/]/)[0];
}

export type GoogleBookResult = {
  googleId: string;
  title: string;
  author: string;
  coverUrl: string;
  isbn: string;
  pageCount: number;
  publishedDate: string;
  publisher: string;
  language: string;
  description: string;
  categories: string[]; // tag italiani estratti dalle categorie
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractIsbn(ids: any[]): string {
  if (!Array.isArray(ids)) return "";
  return (
    ids.find((i) => i.type === "ISBN_13")?.identifier ??
    ids.find((i) => i.type === "ISBN_10")?.identifier ??
    ""
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVolume(item: any): GoogleBookResult {
  const info = item.volumeInfo ?? {};
  const rawCats: string[] = Array.isArray(info.categories) ? info.categories : [];

  // Appiattisce "Fiction / Fantasy / Epic" → ["fiction", "fantasy", "epic"]
  const flatCats = rawCats.flatMap((c: string) => c.split(/[/,]/)).map((c: string) => c.trim()).filter(Boolean);
  const italianTags = [...new Set(flatCats.map(mapCategory))].slice(0, 5);

  return {
    googleId:      item.id ?? "",
    title:         info.title ?? "Titolo sconosciuto",
    author:        Array.isArray(info.authors) ? info.authors.join(", ") : "",
    coverUrl:      (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? "")
                     .replace(/^http:\/\//, "https://")
                     .replace("zoom=1", "zoom=2"), // copertina leggermente più grande
    isbn:          extractIsbn(info.industryIdentifiers),
    pageCount:     info.pageCount ?? 0,
    publishedDate: info.publishedDate ?? "",
    publisher:     info.publisher ?? "",
    language:      info.language ?? "",
    // La descrizione è nella lingua del catalogo Google Books.
    // Con printType=books e langRestrict rimosso otteniamo più edizioni;
    // se disponibile, Google restituirà quella in italiano per i libri IT.
    description:   info.description ?? "",
    categories:    italianTags,
  };
}

export async function searchGoogleBooks(query: string): Promise<GoogleBookResult[]> {
  if (!query.trim()) return [];

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("printType", "books");
  // hl=it: preferisce metadati in italiano quando disponibili
  url.searchParams.set("hl", "it");
  if (apiKey) url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items) return [];

    const results: GoogleBookResult[] = data.items.map(mapVolume);

    // Ordina: edizioni italiane prima, poi le altre
    results.sort((a, b) => {
      if (a.language === "it" && b.language !== "it") return -1;
      if (b.language === "it" && a.language !== "it") return 1;
      return 0;
    });

    return results;
  } catch {
    return [];
  }
}
