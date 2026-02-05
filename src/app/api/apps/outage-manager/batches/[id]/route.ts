import { NextRequest, NextResponse } from 'next/server';
import { outageService } from '@/lib/services/outage.service';
import { handleApiError } from '@/lib/api-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await outageService.getBatch(id);
    return NextResponse.json(batch);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch batch');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, token } = body;

    const result = await outageService.executeAction(id, action, token);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'Failed to update batch status');
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedBatch = await outageService.updateBatch(id, body);
    return NextResponse.json(updatedBatch);
  } catch (error) {
    return handleApiError(error, 'Failed to update batch');
  }
}
