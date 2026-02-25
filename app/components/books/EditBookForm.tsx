"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateBook, deleteBook } from "@/app/lib/book-actions";
import { StarRating } from "./StarRating";
import { QuoteSection } from "./QuoteSection";
import { LoanSection }  from "./LoanSection";
import { STATUS_OPTIONS, FORMAT_OPTIONS } from "@/app/lib/constants";
import type { Book } from "@/app/generated/prisma/client";

const fieldClass = `w-full border rounded-xl px-3 py-2.5 text-sm
  focus:outline-none focus:ring-2 transition-colors`;

const fieldStyle = {
  background: "var(--bg-input)",
  borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
  color: "var(--fg-primary)",
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150 shadow-md"
      style={{
        background: "var(--accent)",
        color: "var(--accent-on)",
        boxShadow: "0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)",
      }}
    >
      {pending ? "Salvataggio…" : "Salva modifiche"}
    </button>
  );
}

function TagInput({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [val, setVal] = useState(defaultValue);
  const chips = val.split(",").map((t) => t.trim()).filter(Boolean);
  return (
    <div>
      <input type="hidden" name={name} value={val} />
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="fantasy, storico, distopia…"
        className={fieldClass}
        style={{ ...fieldStyle, "--tw-ring-color": "color-mix(in srgb, var(--accent) 40%, transparent)" } as React.CSSProperties}
      />
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {chips.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-0.5 rounded-full border"
              style={{
                background: "color-mix(in srgb, var(--accent) 10%, var(--bg-elevated))",
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 280;
  return (
    <div>
      <p
        className={`font-reading text-xs leading-relaxed italic ${!expanded && isLong ? "line-clamp-5" : ""}`}
        style={{ color: "var(--fg-muted)" }}
      >
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-xs mt-1 transition-colors"
          style={{ color: "var(--accent)" }}
        >
          {expanded ? "Mostra meno ↑" : "Mostra tutto ↓"}
        </button>
      )}
    </div>
  );
}

function storeLinks(book: Book) {
  const q  = encodeURIComponent(book.isbn || book.title);
  const qa = encodeURIComponent(`${book.title} ${book.author ?? ""}`.trim());
  return {
    ibs:     `https://www.ibs.it/search/?ts=as&query=${q}`,
    amazon:  `https://www.amazon.it/s?k=${q}`,
    kindle:  `https://www.amazon.it/s?k=${qa}&rh=n%3A827080031`,
    audible: `https://www.audible.it/search?keywords=${qa}`,
  };
}

export function EditBookForm({
  book,
  onClose,
  onCelebrate,
}: {
  book: Book;
  onClose: () => void;
  onCelebrate?: () => void;
}) {
  const router = useRouter();
  const [status,  setStatus]  = useState<string>(book.status);
  const [formats, setFormats] = useState<string[]>(
    book.formats ? book.formats.split(",").map((f) => f.trim()).filter(Boolean) : []
  );

  const boundUpdate = updateBook.bind(null, book.id);
  const [state, formAction] = useActionState(boundUpdate, null);

  useEffect(() => {
    if (state?.success) {
      if (status === "READ") onCelebrate?.();
      router.refresh();
      onClose();
    }
  }, [state?.success, router, onClose, onCelebrate, status]);

  async function handleDelete() {
    if (!confirm(`Eliminare "${book.title}"?`)) return;
    await deleteBook(book.id);
    router.refresh();
    onClose();
  }

  function toggleFormat(fmt: string) {
    setFormats((p) => p.includes(fmt) ? p.filter((f) => f !== fmt) : [...p, fmt]);
  }

  const showRating   = status === "READ";
  const showReminder = status === "READING";
  const links = storeLinks(book);

  const labelStyle = { color: "var(--fg-subtle)", letterSpacing: "0.08em" };
  const sectionBorder = { borderColor: "color-mix(in srgb, var(--accent) 12%, transparent)" };

  return (
    <div className="flex flex-col gap-6">

      {/* Intestazione libro */}
      <div className="flex gap-4 items-start pb-5 border-b" style={sectionBorder}>
        {book.coverUrl ? (
          <Image src={book.coverUrl} alt={book.title} width={72} height={100}
            className="rounded-lg shadow-lg shadow-black/50 object-cover shrink-0" />
        ) : (
          <div
            className="w-[72px] h-[100px] rounded-lg shrink-0 border"
            style={{ background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 25%, transparent)" }}
          />
        )}
        <div className="min-w-0">
          <p className="font-display font-bold text-base leading-snug" style={{ color: "var(--fg-primary)" }}>
            {book.title}
          </p>
          {book.author && (
            <p className="font-reading text-sm mt-0.5 italic" style={{ color: "var(--fg-muted)" }}>
              {book.author}
            </p>
          )}
          {book.publishedDate && (
            <p className="text-xs mt-1" style={{ color: "var(--fg-subtle)" }}>
              {book.publishedDate.slice(0, 4)}
            </p>
          )}
          {book.pageCount && (
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              {book.pageCount} pagine
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="formats" value={formats.join(",")} />

        {/* Stato */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Stato</label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={fieldClass}
            style={fieldStyle}
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Valutazione condizionale */}
        {showRating && (
          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Valutazione</label>
            <StarRating name="rating" defaultValue={book.rating} size="md" />
          </div>
        )}
        {showReminder && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl border text-xs"
            style={{
              background: "color-mix(in srgb, #3b82f6 8%, var(--bg-elevated))",
              borderColor: "color-mix(in srgb, #3b82f6 30%, transparent)",
              color: "#93c5fd",
            }}
          >
            <span className="text-base">💡</span>
            <span>
              Ricordati di aggiornare la valutazione quando finisci il libro.
              Portando lo stato su <strong>Letto</strong> potrai dargli un voto.
            </span>
          </div>
        )}
        {!showRating && <input type="hidden" name="rating" value={book.rating ?? ""} />}

        {/* Formati */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Formato posseduto</label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleFormat(value)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all duration-150"
                style={formats.includes(value)
                  ? { background: "var(--accent)", color: "var(--accent-on)", borderColor: "var(--accent)" }
                  : { background: "transparent", color: "var(--fg-muted)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Progresso lettura — solo se READING */}
        {status === "READING" && (
          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>
              Pagina corrente
              {book.pageCount && (
                <span className="ml-2 normal-case font-normal" style={{ color: "var(--fg-subtle)" }}>
                  su {book.pageCount}
                </span>
              )}
            </label>
            <input
              name="currentPage"
              type="number"
              min={0}
              max={book.pageCount ?? undefined}
              defaultValue={book.currentPage ?? ""}
              placeholder="Es. 142"
              className={fieldClass}
              style={fieldStyle}
            />
            {book.pageCount && book.currentPage && (
              <div className="mt-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--accent) 15%, var(--bg-elevated))" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((book.currentPage / book.pageCount) * 100))}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
                <p className="text-[10px] mt-1" style={{ color: "var(--fg-subtle)" }}>
                  {Math.round((book.currentPage / book.pageCount) * 100)}% completato
                </p>
              </div>
            )}
          </div>
        )}
        {status !== "READING" && <input type="hidden" name="currentPage" value={book.currentPage ?? ""} />}

        {/* Serie */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Serie</label>
            <input
              name="series"
              type="text"
              defaultValue={book.series ?? ""}
              placeholder="Es. Il Signore degli Anelli"
              className={fieldClass}
              style={fieldStyle}
            />
          </div>
          <div className="w-20">
            <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>N°</label>
            <input
              name="seriesOrder"
              type="number"
              min={1}
              defaultValue={book.seriesOrder ?? ""}
              placeholder="1"
              className={fieldClass}
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Tag */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Tag</label>
          <TagInput name="tags" defaultValue={book.tags ?? ""} />
        </div>

        {/* Nota */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Nota personale</label>
          <textarea
            name="comment"
            defaultValue={book.comment ?? ""}
            rows={4}
            placeholder="Le tue impressioni, citazioni, ricordi…"
            className={`${fieldClass} resize-none leading-relaxed`}
            style={{ ...fieldStyle, placeholderColor: "var(--fg-subtle)" } as React.CSSProperties}
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-3 pt-1">
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--fg-subtle)", letterSpacing: "0.08em" }}>Date</p>
          <div>
            <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Data acquisto</label>
            <input
              name="purchasedAt"
              type="date"
              defaultValue={book.purchasedAt ? new Date(book.purchasedAt).toISOString().slice(0, 10) : ""}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>
          {status !== "TO_READ" && status !== "WISHLIST" && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Inizio lettura</label>
              <input
                name="startedAt"
                type="date"
                defaultValue={book.startedAt ? new Date(book.startedAt).toISOString().slice(0, 10) : ""}
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
          )}
          {status === "READ" && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-2" style={labelStyle}>Fine lettura</label>
              <input
                name="finishedAt"
                type="date"
                defaultValue={book.finishedAt ? new Date(book.finishedAt).toISOString().slice(0, 10) : ""}
                className={fieldClass}
                style={fieldStyle}
              />
            </div>
          )}
        </div>

        {state?.error && (
          <p className="text-xs px-3 py-2 rounded-xl border"
            style={{ color: "#f87171", background: "color-mix(in srgb, #ef4444 8%, var(--bg-elevated))", borderColor: "color-mix(in srgb, #ef4444 30%, transparent)" }}>
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <SaveButton />
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl text-sm border transition-colors"
            style={{ color: "#f87171", borderColor: "color-mix(in srgb, #ef4444 30%, transparent)" }}
          >
            Elimina
          </button>
        </div>
      </form>

      {/* Sinossi */}
      {book.description && (
        <div className="border-t pt-4" style={sectionBorder}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-subtle)" }}>
            Sinossi
          </p>
          <ExpandableText text={book.description} />
        </div>
      )}

      {/* Link agli store */}
      <div className="border-t pt-4" style={sectionBorder}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-subtle)" }}>
          Acquista o ascolta
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: links.ibs,     label: "IBS",     icon: "📚" },
            { href: links.amazon,  label: "Amazon",  icon: "🛒" },
            { href: links.kindle,  label: "Kindle",  icon: "📱" },
            { href: links.audible, label: "Audible", icon: "🎧" },
          ].map(({ href, label, icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all duration-150"
              style={{
                color: "var(--fg-muted)",
                borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
              }}
            >
              <span>{icon}</span> {label}
            </a>
          ))}
        </div>
      </div>

      {/* Metadati edizione */}
      {(book.publisher || book.isbn || book.language) && (
        <div className="border-t pt-4" style={sectionBorder}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-subtle)" }}>
            Edizione
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {book.publisher && (
              <>
                <dt style={{ color: "var(--fg-subtle)" }}>Editore</dt>
                <dd style={{ color: "var(--fg-muted)" }}>{book.publisher}</dd>
              </>
            )}
            {book.isbn && (
              <>
                <dt style={{ color: "var(--fg-subtle)" }}>ISBN</dt>
                <dd className="font-mono" style={{ color: "var(--fg-muted)" }}>{book.isbn}</dd>
              </>
            )}
            {book.language && (
              <>
                <dt style={{ color: "var(--fg-subtle)" }}>Lingua</dt>
                <dd className="uppercase" style={{ color: "var(--fg-muted)" }}>{book.language}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Citazioni */}
      <QuoteSection bookId={book.id} />

      {/* Prestiti */}
      <LoanSection bookId={book.id} />
    </div>
  );
}
