"use client";

import { BookStatus } from "@/app/generated/prisma/client";
import { STATUS_VISUAL } from "../EditBookForm";
import { StarRating } from "../StarRating";
import { FORMAT_OPTIONS } from "@/app/lib/constants";
import { FormField, Input, Textarea } from "@/app/components/ui/FormField";
import { SeriesPanel } from "../SeriesPanel";

interface BookSchedaProps {
  status: BookStatus;
  setStatus: (s: BookStatus) => void;
  rating: number;
  formats: string[];
  toggleFormat: (f: string) => void;
  series: string;
  setSeries: (s: string) => void;
  seriesOrder: number | null;
  tags: string[];
  setTags: (t: string[]) => void;
  tagInput: string;
  setTagInput: (i: string) => void;
  comment: string;
  ratingPrompt: boolean;
  handleStatusChange: (s: BookStatus) => void;
  handleTagKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  tagInputRef: React.RefObject<HTMLInputElement | null>;
  fieldErrors?: Record<string, string[]>;
  bookId: string;
  onNavigateToBook?: (id: string) => void;
}

export function BookScheda({
  status, rating, formats, toggleFormat, series, setSeries, seriesOrder,
  tags, setTags, tagInput, setTagInput, comment, ratingPrompt,
  handleStatusChange, handleTagKeyDown, tagInputRef, fieldErrors,
  bookId, onNavigateToBook
}: BookSchedaProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Stato */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--fg-subtle)" }}>Stato</p>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_VISUAL.map(({ value, label, icon }) => {
            const active = status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusChange(value as BookStatus)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold uppercase transition-all
                  ${active ? "border-transparent shadow-lg scale-[1.02]" : "opacity-50 hover:opacity-80"}`}
                style={active
                  ? { background: "var(--accent)", color: "var(--accent-on)", boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent)" }
                  : { background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)", color: "var(--fg-primary)" }
                }
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="leading-tight text-center">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voto */}
      <div className={`transition-all rounded-xl ${ratingPrompt ? "ring-2 ring-amber-500/60 p-2 -m-2" : ""}`}>
        {ratingPrompt && (
          <p className="text-[10px] font-bold text-amber-500 mb-1.5">Il libro è finito — dagli un voto! ⭐</p>
        )}
        <FormField label="Voto" error={fieldErrors?.rating}>
          <div className="pt-1">
            <StarRating name="rating" defaultValue={rating} size="md" />
          </div>
        </FormField>
      </div>

      {/* Formati */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--fg-subtle)" }}>Formati</p>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => toggleFormat(value)}
              className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase transition-all
                ${formats.includes(value) ? "border-transparent" : "opacity-40"}`}
              style={formats.includes(value)
                ? { background: "var(--accent)", color: "var(--accent-on)", borderColor: "transparent" }
                : { borderColor: "color-mix(in srgb, var(--fg-subtle) 25%, transparent)", color: "var(--fg-primary)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Serie */}
      <div className="flex gap-4">
        <FormField label="Serie" error={fieldErrors?.series} className="flex-[3]">
          <Input name="_series_display" value={series} onChange={(e) => setSeries(e.target.value)} placeholder="Saga..." />
        </FormField>
        <FormField label="N°" error={fieldErrors?.seriesOrder} className="flex-1">
          <Input name="seriesOrder" type="number" defaultValue={seriesOrder ?? ""} />
        </FormField>
      </div>

      {series && onNavigateToBook && (
        <SeriesPanel seriesName={series} currentBookId={bookId} onNavigate={onNavigateToBook} />
      )}

      {/* Tag */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--fg-subtle)" }}>Tag</p>
        <div
          className="flex flex-wrap gap-1.5 min-h-[38px] rounded-xl px-3 py-2 border cursor-text"
          style={{ background: "var(--bg-input)", borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)" }}
          onClick={() => tagInputRef.current?.focus()}
        >
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
              {tag}
              <button type="button" onClick={(e) => { e.stopPropagation(); setTags(tags.filter(t => t !== tag)); }} className="opacity-60 hover:opacity-100 leading-none">×</button>
            </span>
          ))}
          <input
            ref={tagInputRef} type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
            onBlur={() => { if (tagInput.trim()) { const t = tagInput.trim().replace(/,+/g, "").trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setTagInput(""); } }}
            placeholder={tags.length === 0 ? "fantasy, storico… (Enter per aggiungere)" : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-xs" style={{ color: "var(--fg-primary)" }}
          />
        </div>
      </div>

      <FormField label="Nota" error={fieldErrors?.comment}>
        <Textarea name="comment" defaultValue={comment} error={fieldErrors?.comment} />
      </FormField>
    </div>
  );
}
