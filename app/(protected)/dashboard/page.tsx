import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const books = await prisma.book.findMany({
    where:   { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-amber-100 tracking-tight">
          La tua libreria
        </h1>
        <p className="font-reading text-sm text-stone-500 mt-1 italic">
          {books.length} {books.length === 1 ? "libro" : "libri"} nella collezione
        </p>
      </div>

      <DashboardClient initialBooks={books} />
    </div>
  );
}
