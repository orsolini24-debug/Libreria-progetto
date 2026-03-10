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
  else if (sort === "createdAt") orderBy.createdAt = "desc";
  else orderBy.updatedAt = "desc";

  const [books, totalCount, user, statusCountsRaw, allBooksStats] = await Promise.all([
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
    prisma.book.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
    prisma.book.findMany({
      where:  { userId },
      select: { author: true, status: true, rating: true, pageCount: true, currentPage: true, finishedAt: true, createdAt: true },
    }),
  ]);

  const statusCounts = statusCountsRaw.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  // Stats calcolate su TUTTI i libri (non solo la pagina corrente)
  const currentYear = new Date().getFullYear();
  const uniqueAuthors = new Set(allBooksStats.map(b => b.author?.trim()).filter(Boolean)).size;
  const ratedBooks = allBooksStats.filter(b => b.status === "READ" && b.rating != null && (b.rating ?? 0) > 0);
  const avgRating = ratedBooks.length > 0
    ? ratedBooks.reduce((s, b) => s + (b.rating ?? 0), 0) / ratedBooks.length
    : null;
  const bookPagesTotal =
    allBooksStats.filter(b => b.status === "READ" && b.pageCount != null).reduce((s, b) => s + (b.pageCount ?? 0), 0) +
    allBooksStats.filter(b => b.status === "READING" && b.currentPage != null).reduce((s, b) => s + (b.currentPage ?? 0), 0);
  const booksReadThisYear = allBooksStats.filter(b =>
    b.status === "READ" && new Date(b.finishedAt ?? b.createdAt).getFullYear() === currentYear
  ).length;

  const serverStats = {
    totalCount,
    readCount:    statusCounts.READ     ?? 0,
    readingCount: statusCounts.READING  ?? 0,
    uniqueAuthors,
    avgRating,
    bookPagesTotal,
  };

  const allBookCreatedDates = allBooksStats.map(b => b.createdAt.toISOString());

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
        statusCounts={statusCounts}
        serverStats={serverStats}
        booksReadThisYear={booksReadThisYear}
        allBookCreatedDates={allBookCreatedDates}
        userPrivacy={{
          userId,
          isPublic: user?.isPublicShelf ?? false
        }}
      />
    </div>
  );
}
