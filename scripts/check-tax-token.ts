
import { fetch } from 'undici'; // Use native fetch if Node 18+ or install undici
// In recent Node versions, fetch is global. If using older node, we might need a polyfill.
// Assuming Node 18+ environment based on the project context.

const VCODE_URL = 'https://awsdktest-workio.bipocloud.com/services/dukang-sms/sms/vcode'; 
const VCODE_CHECK_URL = 'https://awsdktest-workio.bipocloud.com/services/dukang-sms/sms/vcode_check';
const TOKEN_URL = 'https://awsdktest-workio.bipocloud.com/services/dukang-iam-identity/access_token/by_mobile';

const clientId = 'e99239eac2fa4ed986b1f9e05d1bb175';
const mobile = '13122220805';
const mobileAreaCode = '86';
const vcode = '6666';

// Generate x-flow-id
const xFlowId = 'test-' + Date.now(); // Simple simulation

const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'appversion': '1.15.0',
    'clientnumber': 'Mac',
    'clienttype': 'PC',
    'x-actived-menu': 'NORMAL',
    'x-flow-id': xFlowId,
    'x-language': 'zh',
    'x-timezone': 'Asia/Shanghai',
};

async function run() {
    console.log('--- Step 1: Send VCode ---');
    const step1Url = `${VCODE_URL}?phoneNumber=${mobile}&areaCode=${mobileAreaCode}&scene=VCODE_LOGIN`;
    try {
        const res1 = await fetch(step1Url, { headers });
        console.log('Step 1 Status:', res1.status);
        console.log('Step 1 Text:', await res1.text());
    } catch (e) {
        console.error('Step 1 Failed:', e);
    }

    console.log('
--- Step 2: Check VCode ---');
    const step2Url = `${VCODE_CHECK_URL}?clientId=${clientId}&areaCode=${mobileAreaCode}&phoneNumber=${mobile}&vcode=${vcode}`;
    try {
        const res2 = await fetch(step2Url, { headers });
        console.log('Step 2 Status:', res2.status);
        console.log('Step 2 Text:', await res2.text());
    } catch (e) {
        console.error('Step 2 Failed:', e);
    }

    console.log('
--- Step 3: Get Token ---');
    try {
        const res3 = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: {
                ...headers,
                'content-type': 'application/json;charset=UTF-8',
            },
            body: JSON.stringify({ clientId, mobile, mobileAreaCode: parseInt(mobileAreaCode) })
        });
        console.log('Step 3 Status:', res3.status);
        console.log('Step 3 Text:', await res3.text());
    } catch (e) {
        console.error('Step 3 Failed:', e);
    }
}

run();

