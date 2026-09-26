import { PrismaClient } from "@prisma/client";

// Cache en variable propia (no globalThis) para evitar problemas cuando
// se actualiza el schema y el dev server mantiene el cliente viejo.
let prismaInstance: PrismaClient | null = null;

export const db: PrismaClient = prismaInstance ?? (prismaInstance = new PrismaClient({ log: ["query"] }));
