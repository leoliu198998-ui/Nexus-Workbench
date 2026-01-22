import { NextRequest, NextResponse } from 'next/server';
import { generateExcel } from '@/lib/excel-utils';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.EXTERNAL_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 1. Fetch data from external API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from external API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const dataArray = Array.isArray(data) ? data : [data];

    // 2. Generate Excel Buffer
    const buffer = await generateExcel(dataArray);

    // 3. Return as stream with correct headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="data.xlsx"',
      },
    });
  } catch (error) {
    console.error('Proxy download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
