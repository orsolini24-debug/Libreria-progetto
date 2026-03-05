import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { Role } from "@/app/generated/prisma/client";

/**
 * Richiede che l'utente sia autenticato.
 * Ritorna l'ID utente o lancia un errore.
 */
export async function requireAuth(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

/**
 * Richiede che l'utente sia un ADMIN.
 */
export async function requireAdmin(): Promise<string> {
  const userId = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN_ADMIN_ONLY");
  }
  return userId;
}

/**
 * Verifica l'ownership di un libro.
 * Utile per azioni che non usano direttamente findFirst con userId.
 */
export async function requireBookOwnership(bookId: string): Promise<string> {
  const userId = await requireAuth();
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  });

  if (!book) {
    throw new Error("BOOK_NOT_FOUND_OR_NOT_OWNED");
  }
  return userId;
}
