import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";

// #133: Configurazione necessaria per Neon in ambiente Serverless/Edge
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

async function getAdapter() {
  if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
    const ws = (await import("ws")).default;
    neonConfig.webSocketConstructor = ws;
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return new PrismaNeon(pool);
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
