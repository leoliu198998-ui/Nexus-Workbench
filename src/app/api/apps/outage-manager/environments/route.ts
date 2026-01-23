import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const environments = await prisma.releaseEnvironment.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(environments);
  } catch (error) {
    console.error('Failed to fetch environments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
