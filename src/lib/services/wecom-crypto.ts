import crypto from 'crypto';

export class WeComCrypto {
  token: string;
  encodingAESKey: string;
  key: Buffer;
  iv: Buffer;

  constructor(token: string, encodingAESKey: string) {
    this.token = token;
    this.encodingAESKey = encodingAESKey;
    this.key = Buffer.from(encodingAESKey + '=', 'base64');
    this.iv = this.key.subarray(0, 16);
  }

  getSignature(timestamp: string, nonce: string, encrypt: string): string {
    const shasum = crypto.createHash('sha1');
    const arr = [this.token, timestamp, nonce, encrypt].sort();
    shasum.update(arr.join(''));
    return shasum.digest('hex');
  }

  decrypt(echostr: string): string {
    const aesCipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
    aesCipher.setAutoPadding(false);
    let decipheredBuff = Buffer.concat([aesCipher.update(echostr, 'base64'), aesCipher.final()]);
    
    // Remove padding (PKCS#7)
    let pad = decipheredBuff[decipheredBuff.length - 1];
    if (pad < 1 || pad > 32) {
      pad = 0;
    }
    decipheredBuff = decipheredBuff.subarray(0, decipheredBuff.length - pad);

    // Structure: Random(16) + MsgLen(4) + Msg + ReceiveId
    const content = decipheredBuff.subarray(16);
    const msgLen = content.readUInt32BE(0);
    const msg = content.subarray(4, 4 + msgLen).toString('utf-8');
    
    return msg;
  }
}