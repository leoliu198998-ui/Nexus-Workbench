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
    locations?: Array<{ id: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface CreationFieldsResponse {
  data: unknown;
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

      const { applicableServiceVersion, serviceType, locations, location } = data.data;

      // 提取 locationId
      // 优先从 location 对象获取，如果不存在则尝试从 locations 数组获取
      // 使用 any 类型转换以避免潜在的 TypeScript 类型推断问题
      let locationId = (location as any)?.id;
      if (!locationId && locations && locations.length > 0) {
        locationId = (locations[0] as any).id;
      }
      
      if (!locationId) {
        console.warn('Warning: Location ID not found in project info (checked data.location.id and data.locations[0].id)');
      }

      return {
        applicableServiceVersion,
        serviceType,
        locationId,
        fullData: data.data // 返回完整数据以备后用
      };

    } catch (error) {
      console.error('Get Project Info Failed:', error);
      throw error;
    }
  }
  /**
   * 3. 获取创建字段
   * 对应接口 3: /services/dukang-service-online/schemas/filter
   */
  async getCreationFields(
    token: string, 
    userInfo: Record<string, any>, 
    projectId: string, 
    locationId: string, 
    version: string
  ) {
    const url = `${this.baseUrl}/services/dukang-service-online/schemas/filter`;
    
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'x-dk-token': token,
      'x-actived-menu': 'Common-All Projects',
      'referer': `${this.baseUrl}/projects/all-projects/${projectId}/candidate?clientId=${userInfo.clientId || ''}&tabKey=Candidate&locationId=${locationId}`,
    };

    if (userInfo?.externalId) {
      headers['x-contact-id'] = String(userInfo.externalId);
    }

    const payload = {
      referenceId: locationId,
      objectType: ["candidateVisit", "sdAccess"],
      projectId: projectId,
      applicableServiceVersion: version
    };

    console.log('Fetching Creation Fields from:', url);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // 生成调试文件
    try {
      const fs = require('fs');
      const path = require('path');
      const curlCommand = generateCurlCommand(url, 'POST', headers, payload);
      const debugDir = path.join(process.cwd()); // 直接生成在项目根目录
      
      fs.writeFileSync(path.join(debugDir, 'debug_creation_fields_curl.sh'), curlCommand);
      console.log('Generated debug curl file: debug_creation_fields_curl.sh');
    } catch (err) {
      console.error('Failed to generate debug curl file:', err);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      // 生成 Response 调试文件
      try {
        const fs = require('fs');
        const path = require('path');
        const debugDir = path.join(process.cwd());
        fs.writeFileSync(path.join(debugDir, 'debug_creation_fields_response.json'), responseText);
        console.log('Generated debug response file: debug_creation_fields_response.json');
      } catch (err) {
        console.error('Failed to generate debug response file:', err);
      }

      const data = safeJsonParse<CreationFieldsResponse>(responseText);

      if (!response.ok) {
        console.error('Creation Fields API Error:', responseText);
        throw new Error(`Failed to get creation fields: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
      }

      return data;
    } catch (error) {
      console.error('Get Creation Fields Failed:', error);
      throw error;
    }
  }
  /**
   * 生成随机值
   */
  private generateRandomValue(attribute: any, locationId?: string): any {
    if (!attribute) return null;

    const { type, schemaData, id, required } = attribute;

    // 特殊处理 Location: 即使不是必填，如果它是 workLocation，通常也需要填
    const isWorkLocation = id === 'workLocation';

    // 必填项才生成值 (除非有特殊逻辑)
    if (!required && !isWorkLocation) {
        return null;
    }

    try {
      if (type === 'Text') {
        // 如果 ID 包含 Email，生成随机邮箱
        if (id && /email/i.test(id)) {
          const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          let user = '';
          for(let i=0; i<8; i++) user += chars.charAt(Math.floor(Math.random() * chars.length));
          return `${user}@example.com`;
        }

        // 生成5位随机字符
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      } 
      else if (type === 'EmployeeName') {
        // 生成随机姓名 (英文或中文)
        const isEnglish = Math.random() > 0.5;
        if (isEnglish) {
          const first = ['Alex', 'Bill', 'Chris', 'David', 'Eric', 'Frank', 'George', 'Henry', 'Jack', 'Tom'];
          const last = ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Miller', 'Davis'];
          return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
        } else {
           const xing = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈'];
           const ming = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
           return `${xing[Math.floor(Math.random() * xing.length)]}${ming[Math.floor(Math.random() * ming.length)]}`;
        }
      }
      else if (type === 'Number') {
        // 生成5位随机数字
        return Math.floor(10000 + Math.random() * 90000);
      }
      else if (type === 'Date') {
        // 生成当前日期 YYYY-MM-DD
        return new Date().toISOString().split('T')[0];
      }
      else if (type === 'Select') {
        // 取 schemaData 中的第一个 id
        if (schemaData) {
          const parsedSchema = typeof schemaData === 'string' ? safeJsonParse(schemaData) : schemaData;
          
          // 处理 selectOptions (新格式)
          if (parsedSchema?.selectOptions && Array.isArray(parsedSchema.selectOptions) && parsedSchema.selectOptions.length > 0) {
             const option = parsedSchema.selectOptions[0];
             // 根据用户指示：需传递 [{ name: "...", id: "..." }] 的数组格式，且第一个元素索引为 0
             // option 结构示例: { id, code, value, hrmsValue }
             // 我们取 value 作为 name
             return [{ name: option.value || option.code, id: option.id }];
          }
          
          // 兼容旧逻辑 (dataSource)
          if (parsedSchema?.dataSource && Array.isArray(parsedSchema.dataSource) && parsedSchema.dataSource.length > 0) {
            return parsedSchema.dataSource[0].id;
          }
        }
        return null;
      }
      else if (type === 'Location') {
        // 返回包含 id 和 name 的数组
        if (locationId) {
          // 注意：这里需要确保返回的是对象数组
          return [{ id: locationId, name: "Asia" }];
        }
        return null;
      }
      else if (type === 'Bool' || type === 'Boolean') {
        // 默认返回 false
        return false;
      }
    } catch (e) {
      console.warn(`Failed to generate random value for attribute ${attribute.id}:`, e);
    }
    
    return null;
  }

  /**
   * 4. 创建 Candidate
   * 对应接口 4: /services/dukang-service-online/candidates
   */
  async createCandidate(
    token: string,
    userInfo: Record<string, any>,
    projectId: string,
    creationFields: any,
    locationId?: string
  ) {
    const url = `${this.baseUrl}/services/dukang-service-online/candidates`;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'x-dk-token': token,
      'x-actived-menu': 'Common-All Projects',
      'referer': `${this.baseUrl}/projects/all-projects/${projectId}/candidate`,
    };

    if (userInfo?.externalId) {
      headers['x-contact-id'] = String(userInfo.externalId);
    }

    // 构造 attributes 参数
    const attributes: Record<string, any> = {};
    const schemaId = creationFields?.data?.schemaId;

    if (creationFields?.data?.groups) {
      for (const group of creationFields.data.groups) {
        if (group.attributes) {
          for (const attr of group.attributes) {
            attributes[attr.id] = this.generateRandomValue(attr, locationId);
          }
        }
      }
    }

    const payload = {
      projectId: projectId,
      creationType: "FULL_ENTRY",
      schemaId: schemaId,
      attributes: attributes
    };

    console.log('Creating Candidate at:', url);
    // console.log('Payload:', JSON.stringify(payload, null, 2)); // Payload might be large

    // 生成调试文件
    try {
      const fs = require('fs');
      const path = require('path');
      const curlCommand = generateCurlCommand(url, 'POST', headers, payload);
      const debugDir = path.join(process.cwd());
      
      fs.writeFileSync(path.join(debugDir, 'debug_create_candidate_curl.sh'), curlCommand);
      console.log('Generated debug curl file: debug_create_candidate_curl.sh');
    } catch (err) {
      console.error('Failed to generate debug curl file:', err);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      // 生成 Response 调试文件
      try {
        const fs = require('fs');
        const path = require('path');
        const debugDir = path.join(process.cwd());
        fs.writeFileSync(path.join(debugDir, 'debug_create_candidate_response.json'), responseText);
        console.log('Generated debug response file: debug_create_candidate_response.json');
      } catch (err) {
        console.error('Failed to generate debug response file:', err);
      }

      if (!response.ok) {
        console.error('Create Candidate API Error:', responseText);
        throw new Error(`Failed to create candidate: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
      }

      const apiResult: any = safeJsonParse(responseText);
      return {
        ...(apiResult || {}), // 确保 apiResult 为 null 时不会出错
        _sentAttributes: attributes // 返回发送的属性，用于 UI 展示
      };

    } catch (error) {
      console.error('Create Candidate Failed:', error);
      throw error;
    }
  }
}

export const personnelService = PersonnelService.getInstance();
