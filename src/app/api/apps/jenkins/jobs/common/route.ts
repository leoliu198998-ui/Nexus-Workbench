import { NextResponse } from 'next/server';
import { JenkinsService } from '@/lib/services/jenkins';

export async function GET() {
  try {
    const service = new JenkinsService();
    const jobs = await service.getCommonJobs();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching common jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch common jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const jobs = await request.json();
    const service = new JenkinsService();
    await service.saveCommonJobs(jobs);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving common jobs:', error);
    return NextResponse.json(
      { error: 'Failed to save common jobs' },
      { status: 500 }
    );
  }
}