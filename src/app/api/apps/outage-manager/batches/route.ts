import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    console.error('Failed to fetch batches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { envId, batchName, releaseDatetime, releaseTimeZone, duration, token } = body;

    // 1. Fetch environment info
    const environment = await prisma.releaseEnvironment.findUnique({
      where: { id: envId },
    });

    if (!environment) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
    }

    // 2. Call external API
    const externalUrl = `${environment.baseUrl}/devops/release-batch`;
    const externalPayload = {
      batchName,
      releaseDatetime,
      releaseTimeZone,
      duration,
    };

    let remoteBatchId = null;
    let logs: any = { steps: [] };

    try {
      const response = await fetch(externalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dk-token': token,
        },
        body: JSON.stringify(externalPayload),
      });

      const responseData = await response.json();
      
      logs.steps.push({
        step: 'CREATE_BATCH',
        url: externalUrl,
        status: response.status,
        response: responseData,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) {
        throw new Error(responseData.message || 'External API failed');
      }

      // 假设接口返回数据包含 batchId
      remoteBatchId = responseData.batchId?.toString();
    } catch (apiError: any) {
      console.error('External API Error:', apiError);
      return NextResponse.json({ 
        error: 'External API Error', 
        details: apiError.message,
        logs 
      }, { status: 502 });
    }

    // 3. Create local record
    const batch = await prisma.outageBatch.create({
      data: {
        envId,
        batchName,
        releaseDatetime: new Date(releaseDatetime),
        releaseTimeZone,
        duration,
        token,
        remoteBatchId,
        status: 'CREATED',
        logs,
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Failed to create batch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
