"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateBook, deleteBook } from "@/app/lib/book-actions";
import { StarRating } from "./StarRating";
import { STATUS_OPTIONS, FORMAT_OPTIONS } from "@/app/lib/constants";
import type { Book } from "@/app/generated/prisma/client";

const fieldClass = `w-full border border-amber-900/20 bg-[#1f1710]/60 text-stone-200 rounded-xl px-3 py-2.5 text-sm
  placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-700/40 focus:border-amber-700/40
  transition-colors`;

const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="flex-1 bg-amber-600 text-stone-950 py-2.5 px-4 rounded-xl text-sm font-semibold
        hover:bg-amber-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150 shadow-md shadow-amber-900/30">
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
      <input type="text" value={val} onChange={(e) => setVal(e.target.value)}
        placeholder="fantasy, storico, distopia…"
        className={fieldClass} />
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {chips.map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-0.5 bg-amber-950/40 text-amber-300/80
              rounded-full border border-amber-800/30">
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
      <p className={`font-reading text-xs text-stone-400 leading-relaxed italic
        ${!expanded && isLong ? "line-clamp-5" : ""}`}>{text}</p>
      {isLong && (
        <button onClick={() => setExpanded((p) => !p)}
          className="text-xs text-amber-600 hover:text-amber-400 mt-1 transition-colors">
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

  return (
    <div className="flex flex-col gap-6">

      {/* Intestazione libro */}
      <div className="flex gap-4 items-start pb-5 border-b border-amber-900/20">
        {book.coverUrl ? (
          <Image src={book.coverUrl} alt={book.title} width={72} height={100}
            className="rounded-lg shadow-lg shadow-black/50 object-cover shrink-0" />
        ) : (
          <div className="w-[72px] h-[100px] rounded-lg bg-gradient-to-b from-stone-700
            to-stone-900 shrink-0 border border-stone-700" />
        )}
        <div className="min-w-0">
          <p className="font-display font-bold text-amber-100/90 text-base leading-snug">{book.title}</p>
          {book.author      && <p className="font-reading text-sm text-stone-400 mt-0.5 italic">{book.author}</p>}
          {book.publishedDate && <p className="text-xs text-stone-600 mt-1">{book.publishedDate.slice(0, 4)}</p>}
          {book.pageCount   && <p className="text-xs text-stone-600">{book.pageCount} pagine</p>}
        </div>
      </div>

      {/* Form */}
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="formats" value={formats.join(",")} />

        {/* Stato */}
        <div>
          <label className={labelClass}>Stato</label>
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)}
            className={fieldClass}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Valutazione condizionale */}
        {showRating && (
          <div>
            <label className={labelClass}>Valutazione</label>
            <StarRating name="rating" defaultValue={book.rating} size="md" />
          </div>
        )}
        {showReminder && (
          <div className="flex items-start gap-2 p-3 bg-blue-950/30 rounded-xl border border-blue-900/40 text-xs text-blue-300">
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
          <label className={labelClass}>Formato posseduto</label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => toggleFormat(value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150
                  ${formats.includes(value)
                    ? "bg-amber-600 text-stone-950 border-amber-600"
                    : "border-amber-900/25 text-stone-400 hover:border-amber-700/50 hover:text-stone-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag */}
        <div>
          <label className={labelClass}>Tag</label>
          <TagInput name="tags" defaultValue={book.tags ?? ""} />
        </div>

        {/* Nota */}
        <div>
          <label className={labelClass}>Nota personale</label>
          <textarea name="comment" defaultValue={book.comment ?? ""} rows={4}
            placeholder="Le tue impressioni, citazioni, ricordi…"
            className={`${fieldClass} resize-none leading-relaxed`} />
        </div>

        {state?.error && (
          <p className="text-xs text-red-400 bg-red-950/50 border border-red-900/60 px-3 py-2 rounded-xl">
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <SaveButton />
          <button type="button" onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl text-sm text-red-400 border border-red-900/40
              hover:bg-red-950/40 transition-colors">
            Elimina
          </button>
        </div>
      </form>

      {/* Sinossi */}
      {book.description && (
        <div className="border-t border-amber-900/15 pt-4">
          <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Sinossi</p>
          <ExpandableText text={book.description} />
        </div>
      )}

      {/* Link agli store */}
      <div className="border-t border-amber-900/15 pt-4">
        <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3">Acquista o ascolta</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: links.ibs,     label: "IBS",     icon: "📚" },
            { href: links.amazon,  label: "Amazon",  icon: "🛒" },
            { href: links.kindle,  label: "Kindle",  icon: "📱" },
            { href: links.audible, label: "Audible", icon: "🎧" },
          ].map(({ href, label, icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg
                border border-amber-900/20 hover:border-amber-700/50 hover:bg-amber-950/30
                transition-all duration-150 text-stone-500 hover:text-amber-300">
              <span>{icon}</span> {label}
            </a>
          ))}
        </div>
      </div>

      {/* Metadati edizione */}
      {(book.publisher || book.isbn || book.language) && (
        <div className="border-t border-amber-900/15 pt-4">
          <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Edizione</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {book.publisher && <><dt className="text-stone-600">Editore</dt><dd className="text-stone-400">{book.publisher}</dd></>}
            {book.isbn      && <><dt className="text-stone-600">ISBN</dt><dd className="text-stone-400 font-mono">{book.isbn}</dd></>}
            {book.language  && <><dt className="text-stone-600">Lingua</dt><dd className="text-stone-400 uppercase">{book.language}</dd></>}
          </dl>
        </div>
      )}
    </div>
  );
}
