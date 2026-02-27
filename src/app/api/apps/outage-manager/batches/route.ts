import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { outageService } from '@/lib/services/outage.service';
import { handleApiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const envId = searchParams.get('envId');

    const where = envId ? { envId } : {};

    const batches = await prisma.outageBatch.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        environment: true,
      },
      take: 20,
    });

    return NextResponse.json(batches);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch batches');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const batch = await outageService.createBatch(body);
    return NextResponse.json(batch);
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to create batch');
  }
}
