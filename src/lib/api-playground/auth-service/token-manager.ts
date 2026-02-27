import { 
  SystemType, 
  EnvType, 
  TokenInfo, 
  TokenResponse, 
  AuthCredentials 
} from './types';
import { authConfig } from './config';

/**
 * 简单的日志工具，后续可替换为更复杂的日志系统
 */
const logger = {
  info: (msg: string, meta?: any) => console.log(`[AuthManager][INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
  error: (msg: string, meta?: any) => console.error(`[AuthManager][ERROR] ${msg}`, meta ? JSON.stringify(meta) : ''),
  warn: (msg: string, meta?: any) => console.warn(`[AuthManager][WARN] ${msg}`, meta ? JSON.stringify(meta) : ''),
};

/**
 * API Token 管理器
 * 实现自动获取、缓存、刷新和并发控制
 */
export class TokenManager {
  private static instance: TokenManager;
  private tokens: Map<string, TokenInfo> = new Map();
  private fetchPromises: Map<string, Promise<TokenInfo>> = new Map();

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * 生成缓存键
   */
  private getKey(system: SystemType, env: EnvType): string {
    return `${system}:${env}`;
  }

  /**
   * 获取有效的 Token
   * 如果提供了 customCredentials，则忽略缓存（或者使用特定策略），这里简单起见，如果提供了 customCredentials，我们直接获取不缓存，或者基于配置哈希缓存。
   * 为了支持 Playground 的即时调试需求，如果传入了 credentials，我们暂不缓存，或者只在当前请求中使用。
   */
  public async getToken(system: SystemType, env: EnvType, customCredentials?: AuthCredentials): Promise<string> {
    // 如果有自定义配置，直接获取，不走缓存逻辑（或者后续实现基于配置的缓存）
    if (customCredentials) {
       const tokenInfo = await this.fetchTokenWithRetry(system, env, 1, customCredentials);
       return tokenInfo.accessToken;
    }

    const key = this.getKey(system, env);
    const cachedToken = this.tokens.get(key);

    // 检查缓存是否存在且未过期 (提前 5 分钟刷新)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
      return cachedToken.accessToken;
    }

    // 如果已有正在进行的请求，直接复用 Promise
    if (this.fetchPromises.has(key)) {
      try {
        const tokenInfo = await this.fetchPromises.get(key)!;
        return tokenInfo.accessToken;
      } catch (error) {
        // 如果等待的请求失败，移除 Promise 并重试（递归调用会重新进入流程）
        this.fetchPromises.delete(key);
        throw error;
      }
    }

    // 发起新的获取请求
    const fetchPromise = this.fetchTokenWithRetry(system, env);
    this.fetchPromises.set(key, fetchPromise);

    try {
      const tokenInfo = await fetchPromise;
      this.tokens.set(key, tokenInfo);
      return tokenInfo.accessToken;
    } finally {
      this.fetchPromises.delete(key);
    }
  }

  /**
   * 强制刷新 Token
   */
  public async refreshToken(system: SystemType, env: EnvType): Promise<string> {
    const key = this.getKey(system, env);
    this.tokens.delete(key);
    return this.getToken(system, env);
  }

  /**
   * 带重试机制的 Token 获取
   */
  private async fetchTokenWithRetry(
    system: SystemType, 
    env: EnvType, 
    attempt: number = 1, 
    customCredentials?: AuthCredentials
  ): Promise<TokenInfo> {
    try {
      return await this.fetchToken(system, env, customCredentials);
    } catch (error) {
      const maxAttempts = authConfig.retryAttempts ?? 3;
      if (attempt <= maxAttempts) {
        const delay = (authConfig.retryDelay ?? 1000) * attempt; // 简单的指数退避
        logger.warn(`Failed to fetch token for ${system}-${env}, retrying in ${delay}ms... (Attempt ${attempt}/${maxAttempts})`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchTokenWithRetry(system, env, attempt + 1, customCredentials);
      }
      logger.error(`Failed to fetch token for ${system}-${env} after ${maxAttempts} attempts`, error);
      throw error;
    }
  }

  /**
   * 执行实际的 HTTP 请求获取 Token
   */
  private async fetchToken(system: SystemType, env: EnvType, customCredentials?: AuthCredentials): Promise<TokenInfo> {
    let credentials: AuthCredentials;

    if (customCredentials) {
        credentials = customCredentials;
    } else {
        const config = authConfig.systems[system]?.[env];
        if (!config) {
          throw new Error(`Configuration not found for system: ${system}, env: ${env}`);
        }
        credentials = config.credentials;
    }
    
    logger.info(`Fetching token for ${system}-${env} from ${credentials.authUrl || 'default-url'}`);

    // 特殊逻辑：如果提供了 mobile，则认为是 Tax 系统的特殊认证接口
    if (credentials.mobile) {
       // Tax system authentication flow:
       // 1. Get VCode (SMS code) - skipped in this demo, assuming hardcoded vcode '6666'
       // 2. Check VCode
       // 3. Get Access Token

       // Hardcoded URLs for Tax system (from user requirements)
       const VCODE_URL = 'https://awsdktest-workio.bipocloud.com/services/dukang-sms/sms/vcode'; 
       const VCODE_CHECK_URL = 'https://awsdktest-workio.bipocloud.com/services/dukang-sms/sms/vcode_check';
       const TOKEN_URL = 'https://awsdktest-workio.bipocloud.com/services/dukang-iam-identity/access_token/by_mobile';
       
       const HARDCODED_VCODE = '6666';
       
       // Generate a random x-flow-id to satisfy the header requirement
       const xFlowId = crypto.randomUUID().replace(/-/g, '');

       const commonHeaders: Record<string, string> = {
         'accept': 'application/json, text/plain, */*',
         'accept-language': 'zh-CN,zh;q=0.9',
         'appversion': '1.15.0',
         'clientnumber': 'Mac',
         'clienttype': 'PC',
         'x-actived-menu': 'NORMAL',
         'x-flow-id': xFlowId, // Added x-flow-id as required
         'x-language': 'zh',
         'x-timezone': 'Asia/Shanghai',
         // Add other headers if strictly necessary
       };

       // Step 1: Send/Trigger VCode
       // curl 'https://awsdktest-workio.bipocloud.com/services/dukang-sms/sms/vcode?phoneNumber=13122220805&areaCode=86&scene=VCODE_LOGIN'
       const sendVCodeUrl = new URL(VCODE_URL);
       sendVCodeUrl.searchParams.append('phoneNumber', credentials.mobile);
       sendVCodeUrl.searchParams.append('areaCode', (credentials.mobileAreaCode || 86).toString());
       sendVCodeUrl.searchParams.append('scene', 'VCODE_LOGIN');

       logger.info(`[Tax] Step 1: Sending vcode...`);
       const sendVCodeResponse = await fetch(sendVCodeUrl.toString(), {
           method: 'GET',
           headers: commonHeaders
       });

       if (!sendVCodeResponse.ok) {
           const text = await sendVCodeResponse.text();
           throw new Error(`Tax Step 1 (Send VCode) Failed (${sendVCodeResponse.status}): ${text}`);
       }

       // Step 2: Check VCode
       // curl 'https://awsdktest-workio.bipocloud.com/services/dukang-sms/sms/vcode_check?clientId=...&areaCode=86&phoneNumber=...&vcode=6666'
       const checkVCodeUrl = new URL(VCODE_CHECK_URL);
       checkVCodeUrl.searchParams.append('clientId', credentials.clientId);
       checkVCodeUrl.searchParams.append('areaCode', (credentials.mobileAreaCode || 86).toString());
       checkVCodeUrl.searchParams.append('phoneNumber', credentials.mobile);
       checkVCodeUrl.searchParams.append('vcode', HARDCODED_VCODE);

       logger.info(`[Tax] Step 2: Checking vcode...`);
       const vcodeResponse = await fetch(checkVCodeUrl.toString(), {
           method: 'GET',
           headers: commonHeaders
       });

       if (!vcodeResponse.ok) {
           const text = await vcodeResponse.text();
           throw new Error(`Tax Step 2 (VCode Check) Failed (${vcodeResponse.status}): ${text}`);
       }
       
       // Step 3: Get Access Token
       // curl 'https://awsdktest-workio.bipocloud.com/services/dukang-iam-identity/access_token/by_mobile'
       logger.info(`[Tax] Step 3: Getting access token...`);
       const taxPayload = {
         clientId: credentials.clientId,
         mobile: credentials.mobile,
         mobileAreaCode: credentials.mobileAreaCode || 86,
       };

       const tokenResponse = await fetch(TOKEN_URL, {
         method: 'POST',
         headers: {
             ...commonHeaders,
             'content-type': 'application/json;charset=UTF-8',
         },
         body: JSON.stringify(taxPayload),
       });

       if (!tokenResponse.ok) {
         const errorText = await tokenResponse.text();
         throw new Error(`Tax Token Fetch Failed ${tokenResponse.status}: ${errorText}`);
       }

       const data = await tokenResponse.json();
       // 假设返回结构中直接包含 access_token，或者在 data 字段中
       // 根据用户反馈，Tax 系统返回结构为 data.accessToken
       const accessToken = data.access_token || data.data?.accessToken || data.data?.access_token || data.token || data.data?.token || (typeof data.data === 'string' ? data.data : undefined); 

       if (!accessToken) {
         // Also log the full response data for debugging purposes
         logger.error('Invalid token response structure:', data);
         throw new Error(`Invalid token response: missing access_token in response. Response data: ${JSON.stringify(data)}`);
       }
       
       // Tax system usually returns standard OAuth fields or custom ones. 
       // Assuming standard-ish response for now.
       const expiresIn = data.expires_in || data.data?.expires_in || 3600;
       
       return {
         accessToken,
         tokenType: data.token_type || 'Bearer',
         expiresIn,
         expiresAt: Date.now() + expiresIn * 1000,
         refreshToken: data.refresh_token || data.data?.refresh_token,
         scope: data.scope,
       };
    }

    // Default OAuth2 Logic
    if (!credentials.authUrl) {
         throw new Error(`Auth URL is required for generic OAuth2 flow`);
    }

    // 构建请求体
    const body = new URLSearchParams();
    
    // 如果是 Butter 系统，使用 JSON 格式而不是 form-urlencoded
    // 这里通过判断是否有 businessEmail/rsaPassword 来简单区分，或者根据 authUrl
    const isButter = credentials.authUrl.includes('password_signin');

    if (isButter) {
        const butterPayload = {
            clientId: credentials.clientId,
            businessEmail: credentials.username,
            rsaPassword: credentials.password,
            companyCode: credentials.companyCode || 'bipo',
            principalType: credentials.principalType || 'BUSINESS_EMAIL'
        };

        if (credentials.additionalParams) {
            Object.assign(butterPayload, credentials.additionalParams);
        }

        // Log CURL for debugging
        const curlCommand = `curl '${credentials.authUrl}' \\
  -H 'accept: application/json, text/plain, */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9' \\
  -H 'content-type: application/json' \\
  -H 'origin: https://global-test-butter.bipocloud.com' \\
  -H 'priority: u=1, i' \\
  -H 'referer: https://global-test-butter.bipocloud.com/bipo' \\
  -H 'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: same-origin' \\
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36' \\
  -H 'x-actived-menu: NORMAL' \\
  -H 'x-biz: SERVICE_ONLINE_SD' \\
  -H 'x-contact-id;' \\
  -H 'x-language: en' \\
  -H 'x-tenant-code: bipo' \\
  -H 'x-timezone: Asia/Shanghai' \\
  --data-raw '${JSON.stringify(butterPayload)}'`;
        
        logger.info(`[Butter] Executing CURL:\n${curlCommand}`);

        const response = await fetch(credentials.authUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'zh-CN,zh;q=0.9',
                'content-type': 'application/json',
                'origin': 'https://global-test-butter.bipocloud.com',
                'priority': 'u=1, i',
                'referer': 'https://global-test-butter.bipocloud.com/bipo',
                'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
                'x-actived-menu': 'NORMAL',
                'x-biz': 'SERVICE_ONLINE_SD',
                'x-contact-id': '',
                'x-language': 'en',
                'x-tenant-code': 'bipo',
                'x-timezone': 'Asia/Shanghai'
            },
            body: JSON.stringify(butterPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Butter token extraction
        const accessToken = data.access_token || data.data?.accessToken || data.data?.access_token || data.token || data.data?.token || (typeof data.data === 'string' ? data.data : undefined);

        if (!accessToken) {
             logger.error('Invalid token response structure:', data);
             throw new Error(`Invalid token response: missing access_token. Response: ${JSON.stringify(data)}`);
        }

        const expiresIn = data.expires_in || 3600;
        return {
            accessToken,
            tokenType: 'Bearer',
            expiresIn,
            expiresAt: Date.now() + expiresIn * 1000,
            scope: data.scope
        };
    }

    // Standard OAuth2 Flow (for other systems)
    // 优先使用传入的 grantType，如果没有则根据是否有 username/password 智能推断，最后默认 client_credentials
    let grantType = credentials.grantType;
    if (!grantType) {
        if (credentials.username && credentials.password) {
            grantType = 'password';
        } else {
            grantType = 'client_credentials';
        }
    }
    body.append('grant_type', grantType);
    body.append('client_id', credentials.clientId);
    
    // Client Secret 通常是必须的，但也有些 Public Client 不需要
    if (credentials.clientSecret) {
        body.append('client_secret', credentials.clientSecret);
    }

    if (credentials.username) {
        body.append('username', credentials.username);
    }
    if (credentials.password) {
        body.append('password', credentials.password);
    }
    
    if (credentials.scope) {
      body.append('scope', credentials.scope);
    }
    
    if (credentials.additionalParams) {
      Object.entries(credentials.additionalParams).forEach(([k, v]) => body.append(k, v));
    }

    const response = await fetch(credentials.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as TokenResponse;

    // 验证返回数据
    if (!data.access_token) {
      throw new Error('Invalid token response: missing access_token');
    }

    // 计算过期时间
    const expiresIn = data.expires_in || 3600; // 默认 1 小时
    const expiresAt = Date.now() + expiresIn * 1000;

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'Bearer',
      expiresIn: expiresIn,
      expiresAt: expiresAt,
      refreshToken: data.refresh_token,
      scope: data.scope,
    };
  }
}

// 导出单例方便直接使用
export const tokenManager = TokenManager.getInstance();
