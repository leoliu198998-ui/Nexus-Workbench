import { NextRequest, NextResponse } from 'next/server';
import { WeComCrypto } from '@/lib/services/wecom-crypto';

// === 配置信息 (需填入企业微信后台) ===
// Token: NexusWorkbench2024
// EncodingAESKey: s2A9xQ1c3V7b4N0mJ8h5g2f1d4s3a2q1w0eR5t6y7u8
const WECOM_TOKEN = 'NexusWorkbench2024';
const WECOM_AES_KEY = 's2A9xQ1c3V7b4N0mJ8h5g2f1d4s3a2q1w0eR5t6y7u8';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const msg_signature = searchParams.get('msg_signature');
    const timestamp = searchParams.get('timestamp');
    const nonce = searchParams.get('nonce');
    const echostr = searchParams.get('echostr');

    console.log('WeCom Verify Request:', { msg_signature, timestamp, nonce, echostr });

    if (!msg_signature || !timestamp || !nonce || !echostr) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    const crypto = new WeComCrypto(WECOM_TOKEN, WECOM_AES_KEY);
    
    // 1. 校验签名
    const signature = crypto.getSignature(timestamp, nonce, echostr);
    if (signature !== msg_signature) {
      console.error('Signature mismatch:', { expected: signature, actual: msg_signature });
      return new NextResponse('Invalid signature', { status: 403 });
    }

    // 2. 解密 echostr
    const decrypted = crypto.decrypt(echostr);
    console.log('Decrypted echostr:', decrypted);

    // 3. 返回解密后的明文
    return new NextResponse(decrypted);
  } catch (error) {
    console.error('WeCom Verify Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}