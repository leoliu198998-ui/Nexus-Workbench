import { NextResponse } from 'next/server';
import { JenkinsService } from '@/lib/services/jenkins';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const viewName = searchParams.get('viewName') || 'all';
    const jobName = searchParams.get('jobName'); 
    const tag = searchParams.get('tag');
    const serviceName = searchParams.get('serviceName') || undefined;

    if (!jobName || !tag) {
       return NextResponse.json({ error: 'Job name (or alias) and tag are required' }, { status: 400 });
    }

    const service = new JenkinsService();
    const result = await service.findBuildByTag(jobName, tag, viewName, serviceName);

    return NextResponse.json(result || { found: false });
  } catch (error) {
    console.error('Failed to verify build:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}