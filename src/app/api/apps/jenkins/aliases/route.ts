import { NextResponse } from 'next/server';
import { JenkinsService } from '@/lib/services/jenkins';

export async function GET() {
  try {
    const service = new JenkinsService();
    const aliases = await service.getAliases();
    return NextResponse.json(aliases);
  } catch (error) {
    console.error('Failed to get aliases:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const aliases = await req.json();
    const service = new JenkinsService();
    await service.saveAliases(aliases);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save aliases:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}