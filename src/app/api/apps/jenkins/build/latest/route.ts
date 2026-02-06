import { NextResponse } from 'next/server';
import { JenkinsService } from '@/lib/services/jenkins';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const viewName = searchParams.get('viewName') || 'all';
    const jobName = searchParams.get('jobName');
    const serviceName = searchParams.get('serviceName');

    if (!jobName) {
      return NextResponse.json({ error: 'Job name is required' }, { status: 400 });
    }

    const service = new JenkinsService();
    // Reusing getJobDetails which fetches latest build info + params
    const result = await service.getJobDetails(jobName, viewName);

    // Filter APPS parameter if serviceName is provided
    if (serviceName) {
      const appsParam = result.parameters?.find((p) => p.name === 'APPS');
      if (appsParam && typeof appsParam.lastBuildValue === 'string') {
        const lines = appsParam.lastBuildValue.split('\n');
        const filtered = lines.filter((line: string) => line.includes(serviceName));
        appsParam.lastBuildValue = filtered.join('\n');
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get latest build:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}