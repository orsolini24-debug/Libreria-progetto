import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // PrismaNeon v7 accetta PoolConfig e crea il Pool internamente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! } as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
