import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  console.log('API /environments called');
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 10));
  
  try {
    const environments = await prisma.releaseEnvironment.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    console.log('Environments fetched:', environments.length);
    return NextResponse.json(environments);
  } catch (error) {
    console.error('Failed to fetch environments:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error),
      env_check: process.env.DATABASE_URL ? 'Defined' : 'Undefined'
    }, { status: 500 });
  }
}
