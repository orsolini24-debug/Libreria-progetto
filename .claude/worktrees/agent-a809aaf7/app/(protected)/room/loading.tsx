export default function RoomLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-stone-800 rounded-lg" />
          <div className="h-4 w-56 bg-stone-800/60 rounded-lg" />
        </div>
        <div className="h-7 w-16 bg-stone-800 rounded-full" />
      </div>

      {/* Canvas placeholder */}
      <div
        className="w-full rounded-xl border border-stone-700/50 bg-stone-900/50"
        style={{ height: "75vh", minHeight: "500px" }}
      />

      {/* Legenda */}
      <div className="mt-4 flex gap-4 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-20 bg-stone-800 rounded-full" />
        ))}
      </div>
    </div>
  );
}
