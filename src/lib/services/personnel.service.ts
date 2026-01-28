import { generateCurlCommand, safeJsonParse } from '@/lib/utils';

interface TokenResponse {
  data: {
    accessToken: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ProjectInfoResponse {
  data: {
    applicableServiceVersion: string[];
    serviceType: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * 人员创建相关服务
 * 封装了获取 Token 和项目信息的逻辑
 */
export class PersonnelService {
  private static instance: PersonnelService;
  
  // 硬编码的配置信息，源自 curl
  private readonly baseUrl = 'https://global-test-butter.bipocloud.com';
  private readonly tenantCode = 'bipo';
  private readonly defaultHeaders = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'content-type': 'application/json',
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    'x-tenant-code': 'bipo',
    'x-timezone': 'Asia/Shanghai',
    'x-language': 'en',
    'x-biz': 'SERVICE_ONLINE_SD',
  };

  private constructor() {}

  public static getInstance(): PersonnelService {
    if (!PersonnelService.instance) {
      PersonnelService.instance = new PersonnelService();
    }
    return PersonnelService.instance;
  }

  /**
   * 1. 获取认证 Token
   * 对应接口 1: /services/dukang-iam-identity/id_token/password_signin
   */
  async getToken(): Promise<{ token: string; cookie: string | null; userInfo: Record<string, any> }> {
    const url = `${this.baseUrl}/services/dukang-iam-identity/id_token/password_signin`;
    
    const payload = {
      businessEmail: "miasd@123.com",
      rsaPassword: "OS0Ol7SNO+EWpseh4riA9QfoKv6/l3wXS/N49CdP8DKEH5LFB/2K5A5iSIJrajOXAbYlolBHX5NGLZBwS8uEju2XtcbqT6A6ULtEi9jLTGz0B5lQmbscPRTxCMaylHfF0hoqWlzxi++RMijiE/1lU66G9oLBXFpUogDrIeAeXBI=",
      clientId: "7e5e017fd1004d5395857dbe1fd5a07a",
      companyCode: "bipo",
      principalType: "BUSINESS_EMAIL"
    };

    const headers = {
      ...this.defaultHeaders,
      'origin': this.baseUrl,
      'referer': `${this.baseUrl}/bipo`,
      'x-actived-menu': 'NORMAL',
    };

    try {
      console.log('Fetching Token from:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      
      const data = safeJsonParse<TokenResponse>(responseText);

      if (!response.ok) {
        console.error('Token API Error:', responseText);
        throw new Error(`Failed to get token: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
      }

      // 获取 Set-Cookie
      const setCookie = response.headers.get('set-cookie');

      // 优先从 Body 获取 accessToken
      let token: string | undefined = data?.data?.accessToken;

      // 如果 Body 没有，再尝试从 Header 获取
      if (!token) {
        const headerToken = response.headers.get('x-dk-token');
        if (headerToken) {
          token = headerToken;
        }
      }
      
      if (!token) {
        console.log('Token Response Data:', data);
        throw new Error('Token not found in response');
      }

      // 解析 Token 获取用户信息 (特别是 externalId 作为 x-contact-id)
      let userInfo: Record<string, any> = {};
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          // 修复：直接截取字符串中的 externalId，避免 JSON 解析导致的大整数精度丢失
          const payloadString = Buffer.from(tokenParts[1], 'base64').toString();
          
          // 尝试用正则精确匹配 externalId
          const externalIdMatch = payloadString.match(/"externalId":\s*(\d+)/);
          
          if (externalIdMatch && externalIdMatch[1]) {
            // 手动构造 userInfo 对象的一部分，避免 JSONBig 的复杂性，直接拿 string
            userInfo = safeJsonParse(payloadString); // 还是解析一下拿其他字段
            userInfo.externalId = externalIdMatch[1]; // 覆盖为正则提取的精确字符串
          } else {
            // 如果正则没匹配到，回退到 safeJsonParse
            userInfo = safeJsonParse(payloadString);
          }
          
          console.log('Parsed Token Payload:', {
            externalId: String(userInfo.externalId), 
            userAccountId: String(userInfo.userAccountId),
            userAccountType: userInfo.userAccountType
          });
        }
      } catch (e) {
        console.warn('Failed to parse JWT token:', e);
      }

      // 调试日志：打印获取到的 token
      console.log('Successfully retrieved token:', token.substring(0, 20) + '...');
      
      // 验证 externalId 和 token 的一致性
      if (userInfo?.externalId) {
        console.log('Token externalId:', userInfo.externalId);
      }

      return { token, cookie: setCookie, userInfo };

    } catch (error) {
      console.error('Get Token Failed:', error);
      throw error;
    }
  }

  /**
   * 2. 获取项目信息 (Type 和 Version)
   * 对应接口 2: /services/dukang-service-online/projects/{projectId}
   * @param projectId 项目ID
   * @param token 认证Token
   * @param cookie (可选) Cookie
   * @param userInfo (可选) 从Token解析出的用户信息
   */
  async getProjectInfo(projectId: string, token: string, cookie?: string | null, userInfo?: Record<string, any>) {
    const url = `${this.baseUrl}/services/dukang-service-online/projects/${projectId}`;
    
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'x-dk-token': token, // 确保这里使用了正确的 token
      'x-actived-menu': 'Common-All Projects',
      'referer': `${this.baseUrl}/projects/all-projects/${projectId}/candidate`,
    };

    if (cookie) {
      headers['cookie'] = cookie;
    }

    // 填充 x-contact-id
    // 注意：根据用户反馈，这里必须使用第一个接口返回的 externalId
    if (userInfo?.externalId) {
      headers['x-contact-id'] = String(userInfo.externalId);
    } else {
      console.warn('Warning: externalId missing from token payload, x-contact-id may be incorrect');
    }

    // 调试日志
    console.log('Using token for Project Info request:', token.substring(0, 20) + '...');
    console.log('Request Headers (Partial):', {
      'x-contact-id': headers['x-contact-id'],
      'x-dk-token': headers['x-dk-token']?.substring(0, 10) + '...',
      'cookie': headers['cookie'] ? 'Present' : 'Missing'
    });

    try {
      console.log('Fetching Project Info from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      const responseText = await response.text();
      const data = safeJsonParse<ProjectInfoResponse>(responseText);

      if (!response.ok) {
        console.error('Project API Error:', responseText);
        // 返回更详细的错误信息
        throw new Error(`Failed to get project info: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
      }

      if (!data?.data) {
        throw new Error('Invalid project response: missing data');
      }

      const { applicableServiceVersion, serviceType } = data.data;

      return {
        applicableServiceVersion,
        serviceType,
        fullData: data.data // 返回完整数据以备后用
      };

    } catch (error) {
      console.error('Get Project Info Failed:', error);
      throw error;
    }
  }
}

export const personnelService = PersonnelService.getInstance();
