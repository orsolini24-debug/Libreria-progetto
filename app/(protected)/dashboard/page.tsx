import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/components/DashboardClient";
import { WelcomeGreeting } from "@/app/components/WelcomeGreeting";
import { BookStatus, Prisma } from "@/app/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { q, status, sort, page } = await searchParams;
  const userId = session.user.id;

  const LIMIT = 24;
  const currentPage = parseInt(page ?? "1");
  const skip = (currentPage - 1) * LIMIT;

  const where: Prisma.BookWhereInput = { userId };
  if (q) {
    where.OR = [
      { title:  { contains: q, mode: 'insensitive' } },
      { author: { contains: q, mode: 'insensitive' } },
      { tags:   { contains: q, mode: 'insensitive' } },
    ];
  }
  if (status && Object.values(BookStatus).includes(status as BookStatus)) {
    where.status = status as BookStatus;
  }

  const orderBy: Prisma.BookOrderByWithRelationInput = {};
  if (sort === "title")  orderBy.title = "asc";
  else if (sort === "rating") orderBy.rating = "desc";
  else orderBy.updatedAt = "desc";

  const [books, totalCount, user] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy,
      take: LIMIT,
      skip,
    }),
    prisma.book.count({ where }),
    prisma.user.findUnique({
      where:  { id: userId },
      select: { displayName: true, isPublicShelf: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / LIMIT);

  return (
    <div className="pb-12">
      <WelcomeGreeting displayName={user?.displayName ?? null} books={books} />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: "var(--fg-primary)" }}>
          {user?.displayName ? `La libreria di ${user.displayName}` : "La tua libreria"}
        </h1>
        <p className="font-reading text-sm mt-1 italic" style={{ color: "var(--fg-muted)" }}>
          {totalCount} {totalCount === 1 ? "libro" : "libri"} {q || status ? "trovati con i filtri" : "nella tua collezione"}
        </p>
      </div>

      <DashboardClient 
        initialBooks={books} 
        totalPages={totalPages}
        currentPage={currentPage}
        totalCount={totalCount}
        userPrivacy={{
          userId,
          isPublic: user?.isPublicShelf ?? false
        }}
      />
    </div>
  );
}
