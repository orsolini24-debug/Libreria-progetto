// Script one-shot per aggiornare gli stati dei suggerimenti
// Uso: node prisma/update-suggestions.mjs
import { readFileSync } from "fs";
import { resolve } from "path";

// Carica manualmente .env prima di qualsiasi import
const envPath = resolve(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const { neon }       = await import("@neondatabase/serverless");
const { PrismaNeon } = await import("@prisma/adapter-neon");
const { PrismaClient } = await import("../app/generated/prisma/index.js");

const url     = process.env.DATABASE_URL;
const sql     = neon(url);
const adapter = new PrismaNeon(sql);
const prisma  = new PrismaClient({ adapter });

const updates = [
  { keyword: "export",       status: "IMPLEMENTED",   note: "Implementato: export CSV e JSON dalla dashboard." },
  { keyword: "statistic",    status: "IMPLEMENTED",   note: "Implementato: statistiche cliccabili, modal dettaglio libri per anno/stato." },
  { keyword: "appunt",       status: "ACCEPTED",      note: "Implementeremo note per pagina nell'area citazioni." },
  { keyword: "connession",   status: "UNDER_REVIEW",  note: "Integrazione con AI: in valutazione — richiede API esterna." },
];

const all = await prisma.suggestion.findMany();

for (const s of all) {
  const match = updates.find((u) =>
    s.title.toLowerCase().includes(u.keyword) ||
    (s.description?.toLowerCase().includes(u.keyword))
  );
  if (match) {
    await prisma.suggestion.update({
      where: { id: s.id },
      data:  { status: match.status, adminNote: match.note },
    });
  }
}

await prisma.$disconnect();
console.log("Done.");
