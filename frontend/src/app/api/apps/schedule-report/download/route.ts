import { NextRequest, NextResponse } from 'next/server';
import { transformScheduleData } from '@/lib/schedule-transformer';
import { generateExcel, ExcelColumn } from '@/lib/excel-utils';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const apiUrl = process.env.SCHEDULE_REPORT_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 1. Fetch data from external API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'x-actived-menu': 'SD-All Calendar Schedule',
        'x-biz': 'SERVICE_ONLINE_SD',
        'x-dk-token': token,
      },
      body: JSON.stringify({
        q: '',
        size: 1500,
        page: 0,
        year: 2026,
        type: '',
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from external API' },
        { status: response.status }
      );
    }

    const rawData = await response.json();

    // 2. Transform data (Replicating Python logic)
    const transformedData = transformScheduleData(rawData);

    // 3. Define Excel Columns (As per Python script requirement)
    const columns: ExcelColumn[] = [
      { header: 'Schedule ID', key: 'id', width: 15 },
      { header: 'Schedule Name', key: 'name', width: 30 },
      { header: 'Client Name', key: 'clientName', width: 30 },
      { header: 'Client Code', key: 'clientCode', width: 15 },
      { header: 'Entity Name', key: 'entityName', width: 30 },
      { header: 'Location Name', key: 'locationName', width: 20 },
      { header: 'Service Type', key: 'serviceType', width: 20 },
      { header: 'Service Module Name', key: 'serviceModuleName', width: 25 },
      { header: 'Failure Reason', key: 'failureReason', width: 40 },
      { header: 'Generate Status', key: 'generateStatus', width: 15 },
      { header: 'Global SD', key: 'globalSD', width: 30 },
      { header: 'Local Process SD', key: 'localProcessSD', width: 30 },
    ];

    // 4. Generate Excel Buffer
    const buffer = await generateExcel(transformedData, columns);

    // 5. Return as stream
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="schedules_2026.xlsx"',
      },
    });
  } catch (error) {
    console.error('Schedule report download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
