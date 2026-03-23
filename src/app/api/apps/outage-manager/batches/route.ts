import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { outageService } from '@/lib/services/outage.service';
import { handleApiError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const envId = searchParams.get('envId');
    const pageParam = Number(searchParams.get('page') || '1');
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const where = envId ? { envId } : {};

    const [total, batches] = await Promise.all([
      prisma.outageBatch.count({ where }),
      prisma.outageBatch.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          environment: true,
        },
        skip,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      items: batches,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
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
