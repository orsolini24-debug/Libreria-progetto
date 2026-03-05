import { z } from "zod";
import { BookStatus, NoteType } from "@/app/generated/prisma/client";

/** Trasforma: undefined/null/""/"   " -> undefined */
const emptyToUndefined = z.preprocess((v: unknown) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}, z.any());

/** Trasforma: "" -> null, altrimenti string trim, maxLen, oppure null */
const nullableTrimmedString = (maxLen: number) =>
  z.preprocess((v: unknown) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== "string") return v;
    const s = v.trim();
    return s === "" ? null : s;
  }, z.string().max(maxLen).nullable());

/** Trasforma: "" -> null, altrimenti numero coerced, con vincoli */
const nullableNumber = (schema: z.ZodNumber) =>
  z.preprocess((v: unknown) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  }, z.coerce.number().pipe(schema).nullable());

/** Trasforma: "" -> null, altrimenti Date coerced (da string/Date), valida */
const nullableDate = () =>
  z.preprocess((v: unknown) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    const d = v instanceof Date ? v : new Date(String(v));
    return Number.isNaN(d.getTime()) ? null : d;
  }, z.date().nullable());

export const CreateBookSchema = z
  .object({
    // obbligatori
    title: z.string().trim().min(1, "Il titolo è obbligatorio").max(200),
    author: z.string().trim().min(1, "L'autore è obbligatorio").max(100),

    // stato
    status: emptyToUndefined
      .pipe(z.nativeEnum(BookStatus))
      .default(BookStatus.TO_READ),

    // campi testo/metadata (tutti validati: niente bypass)
    googleId: nullableTrimmedString(64),
    isbn: nullableTrimmedString(32),
    publisher: nullableTrimmedString(120),
    publishedDate: nullableTrimmedString(32),
    language: nullableTrimmedString(32),
    coverUrl: z.preprocess((v) => {
      if (!v || v === "") return null;
      return v;
    }, z.string().url("URL cover non valido").max(2048).nullable()),
    description: nullableTrimmedString(20000),
    aiAnalysis: nullableTrimmedString(20000),

    // campi “funzionali”
    rating: nullableNumber(z.number().min(0, "Rating min 0").max(10, "Rating max 10")),
    comment: nullableTrimmedString(2000),
    tags: nullableTrimmedString(500),
    formats: nullableTrimmedString(200),

    purchasedAt: nullableDate(),
    startedAt: nullableDate(),
    finishedAt: nullableDate(),

    currentPage: nullableNumber(z.number().int("Deve essere un intero").min(0, "Min 0")),
    pageCount: nullableNumber(z.number().int("Deve essere un intero").min(0, "Min 0")),

    series: nullableTrimmedString(120),
    seriesOrder: nullableNumber(z.number().int("Deve essere un intero").min(1, "Min 1")),
  })
  .strict()
  .refine((data) => {
    // #48: Coerenza date
    if (data.startedAt && data.finishedAt && data.startedAt > data.finishedAt) {
      return false;
    }
    return true;
  }, {
    message: "La data di fine lettura non può essere precedente alla data di inizio",
    path: ["finishedAt"],
  })
  .refine((data) => {
    // #20: currentPage vs pageCount
    if (data.currentPage !== null && data.pageCount !== null && data.currentPage > data.pageCount) {
      return false;
    }
    return true;
  }, {
    message: "La pagina corrente non può superare il numero totale di pagine",
    path: ["currentPage"],
  })
  .refine((data) => {
    // #31: seriesOrder obbligatorio se series è presente
    if (data.series && data.seriesOrder === null) {
      return false;
    }
    return true;
  }, {
    message: "L'ordine nella serie è obbligatorio se il libro fa parte di una serie",
    path: ["seriesOrder"],
  }); // P0: allowlist, niente campi inattesi

export const UpdateBookSchema = CreateBookSchema.partial();

export const QuoteSchema = z.object({
  bookId: z.string().min(1, "ID libro obbligatorio"),
  text: z.string().trim().min(1, "Il testo è obbligatorio").max(2000),
  type: z.nativeEnum(NoteType).default(NoteType.QUOTE),
  page: nullableNumber(z.number().int().min(0)),
  chapter: nullableTrimmedString(100),
}).strict();

export const LoanSchema = z.object({
  bookId: z.string().min(1, "ID libro obbligatorio"),
  borrower: z.string().trim().min(1, "Il nome del debitore è obbligatorio").max(100),
  loanedAt: nullableDate().default(() => new Date()),
  note: nullableTrimmedString(500),
}).strict();

export const ReadingSessionSchema = z.object({
  bookId: z.string().min(1, "ID libro obbligatorio"),
  date: nullableDate().default(() => new Date()),
  startPage: nullableNumber(z.number().int().min(0)),
  endPage: nullableNumber(z.number().int().min(0)),
  pagesRead: nullableNumber(z.number().int().min(0)),
  duration: nullableNumber(z.number().int().min(0)),
  note: nullableTrimmedString(1000),
})
.strict()
.refine((data) => {
  // #32: startPage vs endPage
  if (data.startPage !== null && data.endPage !== null && data.startPage > data.endPage) {
    return false;
  }
  return true;
}, {
  message: "La pagina finale non può essere precedente alla pagina iniziale",
  path: ["endPage"],
});
