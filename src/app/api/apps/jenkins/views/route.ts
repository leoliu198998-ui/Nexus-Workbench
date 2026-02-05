import { NextResponse } from 'next/server';
import { JenkinsService } from '@/lib/services/jenkins';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewName = searchParams.get('name');
    const service = new JenkinsService();

    if (viewName) {
      // Fetch specific view info (jobs)
      const data = await service.getViewInfo(viewName);
      return NextResponse.json(data);
    } else {
      // Fetch all views
      const views = await service.getAllViews();
      return NextResponse.json(views);
    }
  } catch (error) {
    console.error('Failed to fetch views:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}