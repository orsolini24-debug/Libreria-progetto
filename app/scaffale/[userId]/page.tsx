import { prisma } from "@/app/lib/prisma";
import { BookCard } from "@/app/components/books/BookCard";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function PublicShelfPage({ params }: Props) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      isPublicShelf: true,
      createdAt: true,
    }
  });

  if (!user || !user.isPublicShelf) {
    notFound();
  }

  const books = await prisma.book.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header Pubblico */}
      <header className="py-16 px-4 text-center" style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--accent) 8%, transparent), transparent)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-2xl" style={{ background: "color-mix(in srgb, var(--accent) 20%, rgba(255,255,255,0.05))" }}>
            📚
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight mb-2">
            La Libreria di {user.displayName || "un lettore"}
          </h1>
          <p className="text-slate-400 font-reading italic">
            &quot;Leggere è un atto di libertà, condividere è un atto d&apos;amore.&quot;
          </p>
          <div className="mt-8 flex justify-center gap-8">
            <div className="text-center">
              <span className="block text-2xl font-black">{books.length}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Libri</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black">
                {books.filter(b => b.status === "READ").length}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Letti</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6 sm:gap-8">
          {books.map((book) => (
            <div key={book.id} className="pointer-events-none">
              <BookCard 
                book={book} 
                onClick={() => {}} 
              />
            </div>
          ))}
        </div>

        {books.length === 0 && (
          <div className="py-20 text-center opacity-30 italic">
            Questa libreria è ancora vuota.
          </div>
        )}
      </main>

      <footer className="mt-20 py-10 border-t border-white/5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
          Creato con LibrerIA
        </p>
      </footer>
    </div>
  );
}
