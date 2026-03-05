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

// Schema base senza refine — necessario per Zod v4 dove .partial() non funziona su schema con .refine()
const BookBaseSchema = z
  .object({
    title: z.string().trim().min(1, "Il titolo e' obbligatorio").max(200),
    author: z.string().trim().min(1, "L'autore e' obbligatorio").max(100),

    status: emptyToUndefined
      .pipe(z.nativeEnum(BookStatus))
      .default(BookStatus.TO_READ),

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
  .strict();

export const CreateBookSchema = BookBaseSchema
  .refine((data) => {
    if (data.startedAt && data.finishedAt && data.startedAt > data.finishedAt) return false;
    return true;
  }, { message: "La data di fine lettura non puo' essere precedente alla data di inizio", path: ["finishedAt"] })
  .refine((data) => {
    if (data.currentPage != null && data.pageCount != null && data.currentPage > data.pageCount) return false;
    return true;
  }, { message: "La pagina corrente non puo' superare il numero totale di pagine", path: ["currentPage"] })
  .refine((data) => {
    if (data.series && data.seriesOrder === null) return false;
    return true;
  }, { message: "L'ordine nella serie e' obbligatorio se il libro fa parte di una serie", path: ["seriesOrder"] });

// In Zod v4 .partial() non puo' essere usato su schema con .refine() — va applicato sul base schema
export const UpdateBookSchema = BookBaseSchema.partial()
  .refine((data) => {
    if (data.startedAt && data.finishedAt && data.startedAt > data.finishedAt) return false;
    return true;
  }, { message: "La data di fine lettura non puo' essere precedente alla data di inizio", path: ["finishedAt"] })
  .refine((data) => {
    if (data.currentPage != null && data.pageCount != null && data.currentPage > data.pageCount) return false;
    return true;
  }, { message: "La pagina corrente non puo' superare il numero totale di pagine", path: ["currentPage"] })
  .refine((data) => {
    if (data.series && data.seriesOrder === null) return false;
    return true;
  }, { message: "L'ordine nella serie e' obbligatorio se il libro fa parte di una serie", path: ["seriesOrder"] });

export const QuoteSchema = z.object({
  bookId: z.string().min(1, "ID libro obbligatorio"),
  text: z.string().trim().min(1, "Il testo e' obbligatorio").max(2000),
  type: z.nativeEnum(NoteType).default(NoteType.QUOTE),
  page: nullableNumber(z.number().int().min(0)),
  chapter: nullableTrimmedString(100),
}).strict();

export const LoanSchema = z.object({
  bookId: z.string().min(1, "ID libro obbligatorio"),
  borrower: z.string().trim().min(1, "Il nome del debitore e' obbligatorio").max(100),
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
  if (data.startPage !== null && data.endPage !== null && data.startPage > data.endPage) {
    return false;
  }
  return true;
}, {
  message: "La pagina finale non puo' essere precedente alla pagina iniziale",
  path: ["endPage"],
});
