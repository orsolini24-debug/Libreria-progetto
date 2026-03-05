import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * #133: Versione standard e stabile di Prisma per Vercel.
 * Se l'adapter Neon causa errori di rendering, usiamo il client diretto.
 */
export const prisma = globalForPrisma.prisma ?? (() => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
})();
