import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'content-type': 'application/json',
        'origin': 'https://global.butterglobe.com',
        'referer': 'https://global.butterglobe.com/app/calendar-schedule-v2/all',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'x-actived-menu': 'SD-All Calendar Schedule',
        'x-biz': 'SERVICE_ONLINE_SD',
        'x-dk-token': token,
        'x-language': 'en',
        'x-timezone': 'Asia/Shanghai',
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
        { error: 'External API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Schedule report fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
