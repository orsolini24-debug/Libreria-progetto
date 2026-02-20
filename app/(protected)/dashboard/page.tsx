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
        <h1 className="text-2xl font-bold text-stone-100 tracking-tight">La tua libreria</h1>
        <p className="text-sm text-stone-500 mt-1">
          {books.length} {books.length === 1 ? "libro" : "libri"} totali
        </p>
      </div>

      <DashboardClient initialBooks={books} />
    </div>
  );
}
