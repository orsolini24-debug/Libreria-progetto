import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/components/DashboardClient";
import { WelcomeGreeting } from "@/app/components/WelcomeGreeting";
import { BookStatus } from "@/app/generated/prisma/client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status as BookStatus : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "updatedAt";

  // Mappa campi ordinamento sicuri
  const orderByMap: Record<string, Record<string, "asc" | "desc">> = {
    updatedAt: { updatedAt: "desc" },
    title: { title: "asc" },
    rating: { rating: "desc" },
  };

  const [books, user] = await Promise.all([
    prisma.book.findMany({
      where: {
        userId: session.user.id,
        AND: [
          q ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { author: { contains: q, mode: "insensitive" } },
              { isbn: { contains: q, mode: "insensitive" } },
              { tags: { contains: q, mode: "insensitive" } },
            ],
          } : {},
          status ? { status } : {},
        ],
      },
      orderBy: orderByMap[sort] || orderByMap.updatedAt,
    }),
    prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { displayName: true },
    }),
  ]);

  return (
    <div>
      <WelcomeGreeting displayName={user?.displayName ?? null} books={books} />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: "var(--fg-primary)" }}>
          {user?.displayName ? `La libreria di ${user.displayName}` : "La tua libreria"}
        </h1>
        <p className="font-reading text-sm mt-1 italic" style={{ color: "var(--fg-muted)" }}>
          {books.length} {books.length === 1 ? "libro" : "libri"} trovati
        </p>
      </div>

      <DashboardClient initialBooks={books} />
    </div>
  );
}
