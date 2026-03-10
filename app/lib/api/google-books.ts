import { logger } from "../logger";

export interface GoogleBookResult {
  googleId: string;
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  publishedDate: string | null;
  language: string | null;
  pageCount: number | null;
  coverUrl: string | null;
  description: string | null;
  categories: string[];
}

interface GoogleApiResponse {
  items?: Array<{
    id: string;
    volumeInfo: {
      title: string;
      authors?: string[];
      industryIdentifiers?: Array<{ type: string; identifier: string }>;
      publisher?: string;
      publishedDate?: string;
      language?: string;
      pageCount?: number;
      imageLinks?: { thumbnail?: string };
      description?: string;
      categories?: string[];
    };
  }>;
}

const CACHE_LIMIT = 100;
const cache = new Map<string, { data: GoogleBookResult[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 ora

function getFromCache(query: string): GoogleBookResult[] | null {
  const cached = cache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setToCache(query: string, data: GoogleBookResult[]) {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(query, { data, timestamp: Date.now() });
}

export async function searchBooks(query: string, maxResults: number = 20): Promise<GoogleBookResult[]> {
  if (!query.trim()) return [];

  const cached = getFromCache(query);
  if (cached) return cached;

  const TIMEOUT_MS = 3000;
  const RETRIES = 2;

  async function fetchWithRetry(url: string, attempt: number = 0): Promise<GoogleApiResponse> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);

      if (!response.ok) {
        if (response.status === 429 && attempt < RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          return fetchWithRetry(url, attempt + 1);
        }
        throw new Error(`Google API Error: ${response.status}`);
      }

      return response.json();
    } catch (err: unknown) {
      clearTimeout(id);
      if (err instanceof Error && err.name === "AbortError" && attempt < RETRIES) {
        return fetchWithRetry(url, attempt + 1);
      }
      throw err;
    }
  }

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || "";
    const base = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&printType=books&key=${apiKey}`;

    // Ricerca parallela: generale + specifica in italiano (per mettere le edizioni italiane in cima)
    const [generalRes, italianRes] = await Promise.allSettled([
      fetchWithRetry(`${base}&maxResults=${maxResults}`),
      fetchWithRetry(`${base}&maxResults=5&langRestrict=it`),
    ]);

    const generalItems = generalRes.status === "fulfilled" ? generalRes.value.items || [] : [];
    const italianItems = italianRes.status === "fulfilled" ? italianRes.value.items || [] : [];

    // Merge: edizioni italiane prima, poi le altre (deduplicato per googleId)
    const seen = new Set<string>();
    const merged: GoogleBookResult[] = [];
    for (const item of italianItems) {
      const book = mapGoogleBook(item);
      if (book && !seen.has(book.googleId)) { seen.add(book.googleId); merged.push(book); }
    }
    for (const item of generalItems) {
      const book = mapGoogleBook(item);
      if (book && !seen.has(book.googleId)) { seen.add(book.googleId); merged.push(book); }
    }

    setToCache(query, merged);
    return merged;
  } catch (err) {
    logger.error("GOOGLE_BOOKS_SEARCH_ERROR", err);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGoogleBook(item: any): GoogleBookResult | null {
  const info = item.volumeInfo;
  if (!info || !info.title) return null;

  const industryIdentifiers = info.industryIdentifiers as Array<{ type: string; identifier: string }> | undefined;
  const isbn13 = industryIdentifiers?.find(i => i.type === "ISBN_13")?.identifier;
  const isbn10 = industryIdentifiers?.find(i => i.type === "ISBN_10")?.identifier;

  return {
    googleId: item.id,
    title: info.title,
    author: info.authors?.join(", ") || "Autore sconosciuto",
    isbn: isbn13 || isbn10 || null,
    publisher: info.publisher || null,
    publishedDate: info.publishedDate || null,
    language: info.language || null,
    pageCount: info.pageCount || null,
    coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:") || null,
    description: info.description || null,
    categories: info.categories || [],
  };
}
