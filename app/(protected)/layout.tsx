import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-stone-900">
      {/* Topbar */}
      <header className="bg-stone-950/80 backdrop-blur-md border-b border-stone-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <span className="font-bold text-amber-500 text-lg tracking-tight">
            LibrerIA
          </span>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-sm rounded-md text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition-colors"
            >
              Libreria
            </Link>
            <Link
              href="/room"
              className="px-3 py-1.5 text-sm rounded-md text-stone-400 hover:bg-stone-800 hover:text-stone-100 transition-colors"
            >
              Stanza
            </Link>
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600 hidden sm:block truncate max-w-[180px]">
              {session?.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded-md border border-stone-700 text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
