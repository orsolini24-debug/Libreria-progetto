"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateBook, deleteBook } from "@/app/lib/book-actions";
import { StarRating } from "./StarRating";
import type { Book } from "@/app/generated/prisma/client";

const STATUS_OPTIONS = [
  { value: "TO_READ",  label: "📚 Da leggere" },
  { value: "READING",  label: "📖 In lettura"  },
  { value: "READ",     label: "✅ Letto"        },
  { value: "WISHLIST", label: "🔖 Wishlist"     },
];

const FORMAT_OPTIONS = [
  { value: "cartaceo", label: "📖 Cartaceo" },
  { value: "kindle",   label: "📱 E-book" },
  { value: "audible",  label: "🎧 Audiolibro" },
];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium
        hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
      {pending ? "Salvataggio…" : "Salva modifiche"}
    </button>
  );
}

function TagInput({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [val, setVal] = useState(defaultValue);
  const chips = val.split(",").map((t) => t.trim()).filter(Boolean);
  return (
    <div>
      <input type="hidden" name={name} value={val} readOnly />
      <input type="text" value={val} onChange={(e) => setVal(e.target.value)}
        placeholder="fantasy, storico, distopia…"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-300" />
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {chips.map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
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
      <p className={`text-xs text-gray-500 leading-relaxed ${!expanded && isLong ? "line-clamp-5" : ""}`}>{text}</p>
      {isLong && (
        <button onClick={() => setExpanded((p) => !p)} className="text-xs text-indigo-500 hover:text-indigo-700 mt-1">
          {expanded ? "Mostra meno ↑" : "Mostra tutto ↓"}
        </button>
      )}
    </div>
  );
}

// Link esterni calcolati da ISBN o titolo+autore
function storeLinks(book: Book) {
  const q = encodeURIComponent(book.isbn || book.title);
  const qa = encodeURIComponent(`${book.title} ${book.author ?? ""}`.trim());
  return {
    ibs:    `https://www.ibs.it/search/?ts=as&query=${q}`,
    amazon: `https://www.amazon.it/s?k=${q}`,
    kindle: `https://www.amazon.it/s?k=${qa}&rh=n%3A827080031`,
    audible:`https://www.audible.it/search?keywords=${qa}`,
  };
}

export function EditBookForm({ book, onClose }: { book: Book; onClose: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(book.status);
  const [formats, setFormats] = useState<string[]>(
    book.formats ? book.formats.split(",").map((f) => f.trim()).filter(Boolean) : []
  );

  const boundUpdate = updateBook.bind(null, book.id);
  const [state, formAction] = useFormState(boundUpdate, null);

  useEffect(() => {
    if (state?.success) { router.refresh(); onClose(); }
  }, [state?.success, router, onClose]);

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
      <div className="flex gap-4 items-start pb-5 border-b border-gray-100">
        {book.coverUrl ? (
          <Image src={book.coverUrl} alt={book.title} width={72} height={100}
            className="rounded-lg shadow-md object-cover shrink-0" unoptimized />
        ) : (
          <div className="w-[72px] h-[100px] rounded-lg bg-gradient-to-b from-gray-200 to-gray-300 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-base leading-snug">{book.title}</p>
          {book.author      && <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>}
          {book.publishedDate && <p className="text-xs text-gray-400 mt-1">{book.publishedDate.slice(0, 4)}</p>}
          {book.pageCount   && <p className="text-xs text-gray-400">{book.pageCount} pagine</p>}
        </div>
      </div>

      {/* Form */}
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="formats" value={formats.join(",")} readOnly />

        {/* Stato */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Stato</label>
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
              focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Valutazione condizionale */}
        {showRating && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Valutazione</label>
            <StarRating name="rating" defaultValue={book.rating} size="md" />
          </div>
        )}
        {showReminder && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
            <span className="text-base">💡</span>
            <span>
              Ricordati di aggiornare la valutazione quando finisci il libro.
              Portando lo stato su <strong>Letto</strong> potrai dargli un voto.
            </span>
          </div>
        )}
        {!showRating && <input type="hidden" name="rating" value={book.rating ?? ""} />}

        {/* Formati posseduti */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Formato posseduto</label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => toggleFormat(value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all
                  ${formats.includes(value)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tag</label>
          <TagInput name="tags" defaultValue={book.tags ?? ""} />
        </div>

        {/* Nota */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nota personale</label>
          <textarea name="comment" defaultValue={book.comment ?? ""} rows={4}
            placeholder="Le tue impressioni, citazioni, ricordi…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-300 leading-relaxed" />
        </div>

        {state?.error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{state.error}</p>}

        <div className="flex gap-2">
          <SaveButton />
          <button type="button" onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
            Elimina
          </button>
        </div>
      </form>

      {/* Sinossi */}
      {book.description && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sinossi</p>
          <ExpandableText text={book.description} />
        </div>
      )}

      {/* Link agli store */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Acquista o ascolta</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: links.ibs,    label: "IBS",     icon: "📚" },
            { href: links.amazon, label: "Amazon",   icon: "🛒" },
            { href: links.kindle, label: "Kindle",   icon: "📱" },
            { href: links.audible,label: "Audible",  icon: "🎧" },
          ].map(({ href, label, icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-gray-200
                hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-gray-600 hover:text-indigo-700">
              <span>{icon}</span> {label}
            </a>
          ))}
        </div>
      </div>

      {/* Metadati edizione */}
      {(book.publisher || book.isbn || book.language) && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Edizione</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {book.publisher && <><dt className="text-gray-400">Editore</dt><dd className="text-gray-700">{book.publisher}</dd></>}
            {book.isbn      && <><dt className="text-gray-400">ISBN</dt><dd className="text-gray-700 font-mono">{book.isbn}</dd></>}
            {book.language  && <><dt className="text-gray-400">Lingua</dt><dd className="text-gray-700 uppercase">{book.language}</dd></>}
          </dl>
        </div>
      )}
    </div>
  );
}
