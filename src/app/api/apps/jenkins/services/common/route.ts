import { NextResponse } from 'next/server';
import { JenkinsService } from '@/lib/services/jenkins';

export async function GET() {
  try {
    const service = new JenkinsService();
    const services = await service.getCommonServices();
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching common services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch common services' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const services = await request.json();
    const service = new JenkinsService();
    await service.saveCommonServices(services);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving common services:', error);
    return NextResponse.json(
      { error: 'Failed to save common services' },
      { status: 500 }
    );
  }
}