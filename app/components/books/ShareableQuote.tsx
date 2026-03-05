"use client";

import { Share2, Quote as QuoteIcon } from "lucide-react";
import Image from "next/image";

interface Props {
  text: string;
  author?: string;
  bookTitle: string;
  bookCover?: string;
  onClose: () => void;
}

export function ShareableQuote({ text, author, bookTitle, bookCover, onClose }: Props) {
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Citazione da ${bookTitle}`,
          text: `"${text}" — ${author || "Anonimo"} (da ${bookTitle})`,
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* The Card */}
        <div id="quote-card" className="relative aspect-square w-full rounded-[3rem] overflow-hidden shadow-2xl bg-[#0a0a0a] border border-white/10 group">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32 transition-transform group-hover:scale-110" />

          <div className="relative h-full p-10 flex flex-col justify-between items-center text-center">
            <QuoteIcon className="w-12 h-12 text-amber-500/20 mb-4" />
            
            <div className="flex-1 flex items-center">
              <p className="font-display text-2xl font-black italic tracking-tight leading-snug text-white/90">
                &ldquo;{text}&rdquo;
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                {bookCover && (
                  <Image src={bookCover} alt="" width={32} height={44} unoptimized className="rounded shadow-lg" />
                )}
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">{bookTitle}</p>
                  <p className="text-[9px] opacity-40 font-medium">{author || "Autore sconosciuto"}</p>
                </div>
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20">Libreria Personale AI</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={share}
            className="flex-1 py-4 rounded-3xl bg-amber-500 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-amber-400 active:scale-95 transition-all shadow-xl shadow-amber-500/20"
          >
            <Share2 className="w-4 h-4" /> Condividi
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-4 rounded-3xl bg-white/5 border border-white/10 text-white/60 font-black uppercase tracking-widest text-xs hover:bg-white/10 active:scale-95 transition-all"
          >
            Chiudi
          </button>
        </div>

        <p className="text-center text-[10px] opacity-40 font-medium">
          Fai uno screenshot per salvare l&apos;immagine
        </p>
      </div>
    </div>
  );
}
