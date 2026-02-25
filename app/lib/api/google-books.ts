// Utilità server-side per la ricerca libri tramite Google Books API.

const CATEGORY_IT: Record<string, string> = {
  "fiction": "narrativa", "novel": "romanzo", "literary fiction": "letteratura",
  "fantasy": "fantasy", "epic fantasy": "fantasy", "urban fantasy": "fantasy",
  "science fiction": "fantascienza", "sci-fi": "fantascienza",
  "thriller": "thriller", "suspense": "thriller",
  "mystery": "giallo", "crime": "giallo", "detective": "giallo",
  "horror": "horror", "romance": "romanzo rosa",
  "historical fiction": "storico", "history": "storia",
  "biography": "biografia", "autobiography": "autobiografia", "memoir": "memoir",
  "self-help": "crescita personale", "personal development": "crescita personale",
  "psychology": "psicologia", "philosophy": "filosofia",
  "science": "scienza", "popular science": "divulgazione",
  "technology": "tecnologia", "computers": "informatica",
  "business": "business", "economics": "economia",
  "art": "arte", "architecture": "architettura", "travel": "viaggi",
  "cooking": "cucina", "food": "cucina", "health": "salute", "medicine": "medicina",
  "religion": "religione", "spirituality": "spiritualità", "poetry": "poesia",
  "drama": "teatro", "children": "bambini", "juvenile fiction": "ragazzi",
  "young adult": "young adult", "comics": "fumetti", "graphic novel": "graphic novel",
  "political science": "politica", "classic": "classici", "classics": "classici",
  "adventure": "avventura", "dystopia": "distopia",
};

function mapCategory(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (CATEGORY_IT[lower]) return CATEGORY_IT[lower];
  for (const [key, val] of Object.entries(CATEGORY_IT)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
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
  categories: string[];
};

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

interface GoogleVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type: string; identifier: string }[];
    pageCount?: number;
    publishedDate?: string;
    publisher?: string;
    language?: string;
    description?: string;
    categories?: string[];
  };
}

function extractIsbn(ids: GoogleVolume["volumeInfo"]["industryIdentifiers"]): string {
  if (!Array.isArray(ids)) return "";
  return (
    ids.find((i) => i.type === "ISBN_13")?.identifier ??
    ids.find((i) => i.type === "ISBN_10")?.identifier ??
    ""
  );
}

function mapGoogleVolume(item: GoogleVolume): GoogleBookResult {
  const info = item.volumeInfo ?? {};
  const rawCats: string[] = Array.isArray(info.categories) ? info.categories : [];
  const flatCats = rawCats
    .flatMap((c: string) => c.split(/[/,]/))
    .map((c: string) => c.trim())
    .filter(Boolean);
  const italianTags = [...new Set(flatCats.map(mapCategory))].slice(0, 5);

  return {
    googleId:      item.id ?? "",
    title:         info.title ?? "Titolo sconosciuto",
    author:        Array.isArray(info.authors) ? info.authors.join(", ") : "",
    coverUrl:      (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? "")
                     .replace(/^http:\/\//, "https://")
                     .replace("zoom=1", "zoom=2"),
    isbn:          extractIsbn(info.industryIdentifiers),
    pageCount:     info.pageCount ?? 0,
    publishedDate: info.publishedDate ?? "",
    publisher:     info.publisher ?? "",
    language:      info.language ?? "",
    description:   info.description ?? "",
    categories:    italianTags,
  };
}

async function fetchGoogleBooks(
  query: string,
  langRestrict?: string
): Promise<GoogleBookResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("printType", "books");
  url.searchParams.set("orderBy", "relevance");
  url.searchParams.set("hl", "it");
  if (langRestrict) url.searchParams.set("langRestrict", langRestrict);
  if (apiKey) url.searchParams.set("key", apiKey);

  try {
    const res = await fetchWithTimeout(url.toString());
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items?.length) return [];
    return data.items
      .map(mapGoogleVolume)
      .filter((b: GoogleBookResult) => b.author.trim().length > 0);
  } catch {
    return [];
  }
}

// Riconosce query probabilmente in italiano (heuristica semplice)
function looksItalian(query: string): boolean {
  const itWords = /\b(il|lo|la|i|gli|le|un|una|di|del|della|dei|degli|e|è|con|per|che|da)\b/i;
  return itWords.test(query);
}

// Deduplicazione per googleId
function dedup(items: GoogleBookResult[]): GoogleBookResult[] {
  const seen = new Set<string>();
  return items.filter((b) => {
    if (seen.has(b.googleId)) return false;
    seen.add(b.googleId);
    return true;
  });
}

export async function searchBooks(query: string): Promise<GoogleBookResult[]> {
  if (!query.trim()) return [];

  const isIsbn  = /^(isbn:)?\d{10,13}$/.test(query.replace(/-/g, ""));
  const isItalian = !isIsbn && looksItalian(query);

  if (isIsbn) {
    // ISBN: ricerca diretta senza langRestrict
    const results = await fetchGoogleBooks(query);
    return results.slice(0, 8);
  }

  // Per query italiane: ricerca con e senza langRestrict=it, unione + priorità IT
  if (isItalian) {
    const [itResults, allResults] = await Promise.all([
      fetchGoogleBooks(query, "it"),
      fetchGoogleBooks(query),
    ]);

    // Priorità: risultati IT, poi gli altri (deduplicati)
    const merged = dedup([...itResults, ...allResults]);

    // Sort: lingua IT prima, poi per rilevanza
    merged.sort((a, b) => {
      if (a.language === "it" && b.language !== "it") return -1;
      if (b.language === "it" && a.language !== "it") return 1;
      return 0;
    });

    return merged.slice(0, 8);
  }

  // Query non italiana: ricerca standard con priorità IT
  const results = await fetchGoogleBooks(query);
  results.sort((a, b) => {
    if (a.language === "it" && b.language !== "it") return -1;
    if (b.language === "it" && a.language !== "it") return 1;
    return 0;
  });

  return results.slice(0, 8);
}
