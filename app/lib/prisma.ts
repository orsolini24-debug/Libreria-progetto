import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * #133: Pattern Singleton per Prisma con Neon Adapter.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? (() => {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const client = new PrismaClient({ adapter });
  
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
})();

// In produzione, anche se global non persiste tra le lambda, 
// lo assegniamo comunque per coerenza strutturale.
if (process.env.NODE_ENV === "production") {
  globalForPrisma.prisma = prisma;
}
