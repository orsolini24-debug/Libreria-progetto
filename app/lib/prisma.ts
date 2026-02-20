import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * PrismaNeon usa WebSocket Pool internamente (non HTTP).
 * Accetta PoolConfig — non un'istanza Pool già costruita.
 *
 * Il pattern globalForPrisma evita di creare nuove istanze
 * a ogni hot-reload di Next.js in sviluppo.
 */
function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
