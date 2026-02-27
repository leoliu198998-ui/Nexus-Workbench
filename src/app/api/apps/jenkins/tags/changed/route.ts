import { NextResponse } from 'next/server';
import { JenkinsService } from '@/lib/services/jenkins';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const viewName = searchParams.get('viewName') || undefined;
    const jobName = searchParams.get('jobName') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const serviceName = searchParams.get('serviceName') || undefined;

    const service = new JenkinsService();
    const result = await service.getChangedTags({
      viewName,
      jobName,
      startDate,
      endDate,
      serviceName
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get changed tags:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}