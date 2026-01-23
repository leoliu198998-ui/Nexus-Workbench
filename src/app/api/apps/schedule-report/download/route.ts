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
      console.error('Missing environment variable: SCHEDULE_REPORT_API_URL');
      return NextResponse.json(
        { 
          error: 'Server configuration error',
          message: 'SCHEDULE_REPORT_API_URL environment variable is not configured'
        },
        { status: 500 }
      );
    }

    // 1. Fetch data from external API with FULL headers from curl
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'content-type': 'application/json',
        'origin': 'https://global.butterglobe.com',
        'priority': 'u=1, i',
        'referer': 'https://global.butterglobe.com/app/calendar-schedule-v2/all',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'x-actived-menu': 'SD-All Calendar Schedule',
        'x-biz': 'SERVICE_ONLINE_SD',
        'x-contact-id': '202203310914110067',
        'x-dk-token': token,
        'x-language': 'en',
        'x-session-id': 'q3q025q5',
        'x-sse-session-id': '6b9638f9-d183-469d-ba1f-532929379d02',
        'x-tenant-code': 'bipo',
        'x-timezone': 'Asia/Shanghai',
        'Cookie': 'JSESSIONID=nd8f6cd3y1HbC2mHtUViwh4m7FHl0WJdcwnAB4Y0',
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
      const errorText = await response.text();
      console.error('External API Error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch data from external API', 
          details: {
            status: response.status,
            message: errorText
          }
        },
        { status: response.status }
      );
    }

    const rawData = await response.json();
    
    // 从 data.content 中提取数组 (支持分页结构)
    let dataList: any[] = [];
    if (rawData.data && Array.isArray(rawData.data.content)) {
      dataList = rawData.data.content;
    } else if (Array.isArray(rawData.content)) {
      dataList = rawData.content;
    } else if (Array.isArray(rawData.data)) {
      dataList = rawData.data;
    } else if (Array.isArray(rawData)) {
      dataList = rawData;
    }

    if (dataList.length === 0) {
      console.warn('Warning: Extracted data list is empty.');
    }

    // 2. Transform data (Replicating Python logic)
    const transformedData = transformScheduleData(dataList);

    // 3. Define Excel Columns
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
        'Content-Disposition': `attachment; filename="schedules_2026_${new Date().toISOString().split('T')[0]}.xlsx"`,
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