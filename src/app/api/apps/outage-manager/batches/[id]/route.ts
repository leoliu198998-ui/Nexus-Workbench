import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OutageStatus, Prisma } from '@/generated/client';

const ACTION_MAP: Record<string, { path: string; nextStatus: OutageStatus }> = {
  publish: { path: '/publish', nextStatus: OutageStatus.NOTIFIED },
  release: { path: '/release', nextStatus: OutageStatus.STARTED },
  finish: { path: '/finish', nextStatus: OutageStatus.COMPLETED },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const config = ACTION_MAP[action];
    if (!config) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 1. Fetch batch info with environment
    const batch = await prisma.outageBatch.findUnique({
      where: { id },
      include: { environment: true },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (!batch.remoteBatchId) {
      return NextResponse.json({ error: 'Remote batch ID is missing' }, { status: 400 });
    }

    // 2. Call external API
    const externalUrl = `${batch.environment.baseUrl}/devops/release-batch${config.path}`;
    const externalPayload = {
      batchId: Number(batch.remoteBatchId),
    };

    const logs = (batch.logs as { steps: Record<string, unknown>[] }) || { steps: [] };

    try {
      const response = await fetch(externalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dk-token': batch.token,
        },
        body: JSON.stringify(externalPayload),
      });

      const responseData = (await response.json()) as Record<string, unknown>;

      logs.steps.push({
        step: action.toUpperCase(),
        url: externalUrl,
        status: response.status,
        response: responseData,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        throw new Error((responseData.message as string) || `External API failed for ${action}`);
      }
    } catch (apiError: unknown) {
      console.error(`External API Error (${action}):`, apiError);
      
      // Update logs even on failure
      await prisma.outageBatch.update({
        where: { id },
        data: { logs: logs as unknown as Prisma.InputJsonValue },
      });

      return NextResponse.json({ 
        error: 'External API Error', 
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        logs 
      }, { status: 502 });
    }

    // 3. Update local record
    const updatedBatch = await prisma.outageBatch.update({
      where: { id },
      data: {
        status: config.nextStatus,
        logs: logs as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(updatedBatch);
  } catch (error) {
    console.error('Failed to update batch status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
