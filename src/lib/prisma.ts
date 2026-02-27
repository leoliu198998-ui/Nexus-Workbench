import { PrismaClient } from '../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Required for Supabase/Cloud SQL
  ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false } 
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
