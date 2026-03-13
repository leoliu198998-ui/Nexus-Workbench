import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase pooler can return a cert chain that fails strict validation
  // in some serverless environments; keep TLS enabled but skip CA verification.
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
