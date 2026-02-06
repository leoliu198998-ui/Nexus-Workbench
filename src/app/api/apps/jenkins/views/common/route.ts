import { NextResponse } from 'next/server';
import { JenkinsService } from '@/lib/services/jenkins';

export async function GET() {
  try {
    const service = new JenkinsService();
    const views = await service.getCommonViews();
    return NextResponse.json(views);
  } catch (error) {
    console.error('Failed to get common views:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const views = await req.json();
    const service = new JenkinsService();
    await service.saveCommonViews(views);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save common views:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}