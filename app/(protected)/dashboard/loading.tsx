export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Statistiche skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-stone-800/60 border border-stone-800" />
        ))}
      </div>

      {/* Toolbar skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-10 flex-1 rounded-xl bg-stone-800/60" />
        <div className="h-10 w-32 rounded-xl bg-stone-800/60" />
      </div>

      {/* Griglia libri skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <div className="aspect-[2/3] bg-stone-800/70" />
            <div className="bg-stone-800 border-t border-stone-700/50 px-2.5 py-2.5 space-y-1.5">
              <div className="h-3 bg-stone-700 rounded-full w-5/6" />
              <div className="h-2.5 bg-stone-700/60 rounded-full w-3/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
