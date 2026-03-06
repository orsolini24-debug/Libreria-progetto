"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooksBulk } from "@/app/lib/book-actions";
import { Loader2, AlertCircle, CheckCircle2, FileUp } from "lucide-react";
import { BookStatus } from "@/app/generated/prisma/client";

/**
 * #165: Parser CSV semplice ma robusto che gestisce i doppi apici (comuni in Goodreads)
 */
function parseCSV(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || char === "\r") {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = "";
        }
        if (char === "\r" && nextChar === "\n") i++;
      } else {
        currentField += char;
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [results, setResults] = useState<{ success: number; skipped: number; error?: string } | null>(null);
  const router = useRouter();

  async function handleImport() {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setResults({ success: 0, skipped: 0, error: "File troppo grande. Massimo 10 MB." });
      return;
    }
    setImporting(true);
    setResults(null);
    setProgress(10);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("File vuoto o non valido");

      const header = rows[0].map(h => h.toLowerCase());
      const dataRows = rows.slice(1);
      
      setProgress(30);

      const col = {
        title: header.indexOf("title"),
        author: header.indexOf("author"),
        isbn: header.indexOf("isbn13") !== -1 ? header.indexOf("isbn13") : header.indexOf("isbn"),
        rating: header.indexOf("my rating"),
        status: header.indexOf("exclusive shelf"),
        pages: header.indexOf("number of pages"),
      };

      const titleIdx = col.title !== -1 ? col.title : 0;
      const authorIdx = col.author !== -1 ? col.author : 1;

      const booksToImport = dataRows.map(row => {
        const statusRaw = col.status !== -1 ? row[col.status]?.toLowerCase() : "";
        let status: BookStatus = BookStatus.TO_READ;
        if (statusRaw.includes("read") && !statusRaw.includes("to-read")) status = BookStatus.READ;
        else if (statusRaw.includes("currently")) status = BookStatus.READING;

        return {
          title: row[titleIdx],
          author: row[authorIdx],
          isbn: col.isbn !== -1 ? row[col.isbn]?.replace(/[^0-9]/g, "") : null,
          rating: (() => { const r = col.rating !== -1 ? parseFloat(row[col.rating]) : NaN; return !isNaN(r) && r > 0 ? Math.min(r * 2, 10) : null; })(),
          pageCount: col.pages !== -1 ? parseInt(row[col.pages]) : null,
          status,
        };
      }).filter(b => b.title && b.author);

      setProgress(60);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await createBooksBulk(booksToImport as any);
      
      setProgress(100);
      setResults(res);
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Errore durante l'elaborazione";
      setResults({ success: 0, skipped: 0, error: msg });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
      <div className="mb-10 text-center">
        <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 mb-4">
          <FileUp className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: "var(--fg-primary)" }}>Importazione Dati</h1>
        <p className="opacity-50 text-sm mt-2 font-reading">Sincronizza la tua libreria da Goodreads o file CSV</p>
      </div>
      
      <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/5 flex flex-col gap-8 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <p className="text-[10px] opacity-40 uppercase font-black tracking-[0.2em] text-center">Trascina o seleziona il file</p>
          <div className="relative group">
            <input 
              type="file" 
              accept=".csv" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="p-10 rounded-2xl border-2 border-dashed border-white/10 group-hover:border-amber-500/50 transition-all flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-bold opacity-60 group-hover:text-amber-500 transition-colors">
                {file ? file.name : "Carica file .csv"}
              </span>
              <span className="text-[10px] opacity-30">Formati supportati: Goodreads Export, Custom CSV</span>
            </div>
          </div>
        </div>

        {importing && (
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
              <span>Elaborazione in corso...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="h-14 rounded-2xl bg-white text-black font-black uppercase text-[11px] tracking-[0.2em] disabled:opacity-20 transition-all active:scale-95 shadow-xl hover:brightness-110 flex items-center justify-center gap-2"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inizia Importazione"}
        </button>
      </div>

      {results && (
        <div className="mt-8 space-y-4 animate-fade-up">
          {results.error ? (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{results.error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
                <span className="text-2xl font-black text-emerald-400">{results.success}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Importati</span>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                <AlertCircle className="w-6 h-6 text-amber-500 mb-1 opacity-40" />
                <span className="text-2xl font-black opacity-40">{results.skipped}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Duplicati/Saltati</span>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity"
          >
            Vai alla Libreria →
          </button>
        </div>
      )}
    </div>
  );
}
