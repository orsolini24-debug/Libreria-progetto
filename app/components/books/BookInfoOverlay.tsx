"use client";

import { X, Sparkles, ChevronLeft, ChevronRight, Book as BookIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  author: string | null;
  description: string | null;
  aiAnalysis: string | null;
}

export function BookInfoOverlay({ isOpen, onClose, title, author, description, aiAnalysis }: Props) {
  const [currentPage, setCurrentPage] = useState<"plot" | "ai">(description ? "plot" : "ai");

  // Lock scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasBoth = description && aiAnalysis;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6 animate-in fade-in duration-500">
      {/* Backdrop Immersivo */}
      <div 
        className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" 
        onClick={onClose}
      />

      {/* Contenitore Folio */}
      <div className="relative w-full max-w-4xl h-full sm:h-[85vh] flex flex-col sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 bg-[#0a0a0a]">
        
        {/* Header Elegante */}
        <div className="flex items-center justify-between p-8 sm:p-10 pb-4">
          <div className="flex-1">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight leading-tight">{title}</h2>
            <p className="text-sm sm:text-base text-white/40 mt-1 font-medium">{author}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab di navigazione "a segnalibro" */}
        {hasBoth && (
          <div className="flex px-10 gap-8 border-b border-white/5">
            <button 
              onClick={() => setCurrentPage("plot")}
              className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative
                ${currentPage === "plot" ? "text-indigo-400" : "text-white/20 hover:text-white/40"}`}
            >
              01. La Trama
              {currentPage === "plot" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 animate-in slide-in-from-left-full duration-500" />}
            </button>
            <button 
              onClick={() => setCurrentPage("ai")}
              className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative
                ${currentPage === "ai" ? "text-indigo-400" : "text-white/20 hover:text-white/40"}`}
            >
              02. Sanctuary Insights
              {currentPage === "ai" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 animate-in slide-in-from-left-full duration-500" />}
            </button>
          </div>
        )}

        {/* Area di Lettura Pagina */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-hidden relative">
          <div className="max-w-2xl mx-auto p-10 sm:p-16 py-12">
            
            {/* PAGINA: TRAMA */}
            {currentPage === "plot" && description && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex items-center gap-3 mb-10 opacity-20">
                  <BookIcon className="w-5 h-5 text-white" />
                  <div className="h-px flex-1 bg-white" />
                </div>
                <div className="font-reading text-lg sm:text-xl leading-[1.8] text-white/80 space-y-8 first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-white">
                  {description.split("\n").map((para, i) => (
                    para.trim() && <p key={i} className="text-justify">{para}</p>
                  ))}
                </div>
              </div>
            )}

            {/* PAGINA: AI INSIGHTS */}
            {currentPage === "ai" && aiAnalysis && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex items-center gap-3 mb-10">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <div className="h-px flex-1 bg-indigo-400/20" />
                </div>
                <div className="font-reading text-lg sm:text-xl leading-[1.8] text-indigo-100/90 space-y-8">
                  {aiAnalysis.split("\n").map((para, i) => (
                    para.trim() && (
                      <p key={i} className="relative pl-8">
                        <span className="absolute left-0 top-3 w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                        {para}
                      </p>
                    )
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer con controlli pagina */}
        <div className="p-8 border-t border-white/5 bg-black/20 flex justify-between items-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
            Digital Folio Edition &copy; 2026
          </div>
          
          <div className="flex gap-4">
            {hasBoth && (
              <>
                <button 
                  onClick={() => setCurrentPage(currentPage === "plot" ? "ai" : "plot")}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {currentPage === "plot" ? "Vai all'Analisi AI" : "Torna alla Trama"}
                  </span>
                  {currentPage === "plot" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
