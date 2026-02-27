import { NextRequest, NextResponse } from 'next/server';
import { tokenManager, SystemType, EnvType } from '@/lib/api-playground/auth-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { system, env, credentials } = body;

    if (!system || !env) {
      return NextResponse.json({ error: 'System and env are required' }, { status: 400 });
    }

    // 验证 system 和 env 是否合法
    // 实际项目中可能需要更严格的验证
    if (!['butter', 'tax'].includes(system) || !['dev', 'test', 'prod'].includes(env)) {
       return NextResponse.json({ error: 'Invalid system or env' }, { status: 400 });
    }

    const token = await tokenManager.getToken(system as SystemType, env as EnvType, credentials);
    
    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('API Playground Token Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
