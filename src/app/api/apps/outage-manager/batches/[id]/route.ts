import { NextRequest, NextResponse } from 'next/server';
import { outageService } from '@/lib/services/outage.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await outageService.getBatch(id);
    return NextResponse.json(batch);
  } catch (error) {
    if (error instanceof Error && error.message === 'Batch not found') {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    console.error('Failed to fetch batch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
  } catch (error: any) {
    if (error.message === 'Batch not found') {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    if (error.message === 'Invalid action') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Handle external API errors wrapped by service
    if (error.apiCall) {
      return NextResponse.json({
        error: 'External API Error',
        details: error.message,
        apiCall: error.apiCall,
        logs: error.logs,
      }, { status: error.status || 502 });
    }

    console.error('Failed to update batch status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
  } catch (error: any) {
    if (error.message === 'Batch not found') {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    if (error.message.includes('Only CREATED or NOTIFIED')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    // Handle external API errors
    // Note: updateBatch currently re-throws the error but doesn't attach logs/apiCall like executeAction.
    // However, the original route.ts logic for PUT also didn't return full details on 502, just message and logs.
    // The service logs the failure to DB.
    // We should probably align the service to throw standardized errors, but for now we adapt the route to catch what we have.
    
    console.error('Failed to update batch:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 502 });
  }
}
