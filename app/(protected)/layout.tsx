import { auth, signOut } from "@/auth";
import Link from "next/link";
import { ThemeSwitcher } from "@/app/components/ThemeSwitcher";
import { GentleCheckIn } from "@/app/components/ai/GentleCheckIn";
import { SanctuaryChat } from "@/app/components/ai/SanctuaryChat";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at 50% 0%, var(--glow) 0%, var(--bg-page) 60%)" }}
    >
      {/* Topbar */}
      <header
        className="backdrop-blur-md border-b sticky top-0 z-10"
        style={{ background: "color-mix(in srgb, var(--bg-page) 92%, transparent)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand + Theme */}
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl tracking-tight" style={{ color: "var(--accent)" }}>
              Librer<em className="italic">IA</em>
            </span>
            <ThemeSwitcher />
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
              style={{ color: "var(--fg-muted)" }}
            >
              Libreria
            </Link>
            <Link
              href="/suggestions"
              className="px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
              style={{ color: "var(--fg-muted)" }}
            >
              Idee
            </Link>
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-2">
            <span className="text-xs hidden sm:block truncate max-w-[160px]" style={{ color: "var(--fg-subtle)" }}>
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
                className="text-xs px-3 py-1.5 rounded-lg border transition-all duration-200"
                style={{
                  color: "var(--fg-subtle)",
                  borderColor: "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
                }}
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

      {/* AI Components */}
      <GentleCheckIn />
      <SanctuaryChat />
    </div>
  );
}
