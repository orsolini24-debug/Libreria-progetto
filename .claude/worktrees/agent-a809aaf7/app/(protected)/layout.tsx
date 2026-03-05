import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #2d1a08 0%, #17110c 60%)" }}
    >
      {/* Topbar */}
      <header
        className="backdrop-blur-md border-b sticky top-0 z-10"
        style={{ background: "rgba(20, 13, 7, 0.92)", borderColor: "rgba(120, 60, 10, 0.35)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <span className="font-display font-bold text-amber-500 text-xl tracking-tight">
            Librer<em className="italic">IA</em>
          </span>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-sm rounded-lg text-stone-400 hover:text-amber-400
                hover:bg-amber-950/40 transition-all duration-200"
            >
              Libreria
            </Link>
            <Link
              href="/room"
              className="px-3 py-1.5 text-sm rounded-lg text-stone-400 hover:text-amber-400
                hover:bg-amber-950/40 transition-all duration-200"
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
                className="text-xs px-3 py-1.5 rounded-lg text-stone-500
                  border border-stone-700/40 hover:border-amber-700/50
                  hover:text-amber-400 hover:bg-amber-950/30 transition-all duration-200"
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
