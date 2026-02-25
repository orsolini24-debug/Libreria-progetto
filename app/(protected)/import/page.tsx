"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBook } from "@/app/lib/book-actions";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const router = useRouter();

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setResults(null);

    const text = await file.text();
    const rows = text.split("\n").filter(r => r.trim());
    rows.shift(); // Rimuovi header
    
    let successCount = 0;
    const errorList: string[] = [];

    for (const [idx, row] of rows.entries()) {
      const values = row.split(",").map(v => v.replace(/^"|"$/g, '').trim());
      const formData = new FormData();
      
      formData.set("title", values[0] || "");
      formData.set("author", values[1] || "");
      formData.set("status", "TO_READ");

      try {
        const res = await createBook(null, formData);
        if (res?.success) successCount++;
        else errorList.push(`Riga ${idx + 2}: ${res?.error || "Errore di validazione"}`);
      } catch {
        errorList.push(`Riga ${idx + 2}: Errore di sistema`);
      }
    }

    setResults({ success: successCount, errors: errorList });
    setImporting(false);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Importazione</h1>
        <p className="opacity-50 text-sm italic mt-1 font-reading">Aggiungi libri in massa tramite file CSV</p>
      </div>
      
      <div className="p-8 rounded-2xl border border-white/5 bg-white/5 flex flex-col gap-6 shadow-2xl">
        <div className="flex flex-col gap-3">
          <p className="text-[10px] opacity-40 uppercase font-bold tracking-[0.2em]">Scegli file .csv</p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs file:mr-6 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
          />
          <p className="text-[10px] opacity-30 mt-1 italic">Il file deve avere Titolo e Autore nelle prime due colonne.</p>
        </div>

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="py-3 rounded-xl bg-white text-black font-bold uppercase text-[10px] tracking-[0.2em] disabled:opacity-20 transition-all active:scale-[0.98]"
        >
          {importing ? "Elaborazione dati..." : "Avvia Importazione"}
        </button>
      </div>

      {results && (
        <div className="mt-8 space-y-4 animate-fade-up">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <span className="text-xl">✅</span>
            <p className="text-sm font-bold text-emerald-400">{results.success} libri importati con successo!</p>
          </div>
          
          {results.errors.length > 0 && (
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-[10px] font-bold text-red-400 mb-4 uppercase tracking-widest">Dettaglio Errori ({results.errors.length})</p>
              <ul className="text-[10px] text-red-400/70 space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                {results.errors.map((err, i) => <li key={i} className="border-b border-red-500/10 pb-1">{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
