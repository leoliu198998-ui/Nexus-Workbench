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

export type Environment = 'test' | 'dev';

/**
 * 人员创建相关服务
 * 封装了获取 Token 和项目信息的逻辑
 */
export class PersonnelService {
  private static instance: PersonnelService;
  
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

  private getBaseUrl(env: Environment = 'test'): string {
    return env === 'dev' 
      ? 'https://global-dev-butter.bipocloud.com' 
      : 'https://global-test-butter.bipocloud.com';
  }

  /**
   * 1. 获取认证 Token
   * 对应接口 1: /services/dukang-iam-identity/id_token/password_signin
   */
  async getToken(env: Environment = 'test'): Promise<{ token: string; cookie: string | null; userInfo: Record<string, any> }> {
    const baseUrl = this.getBaseUrl(env);
    const url = `${baseUrl}/services/dukang-iam-identity/id_token/password_signin`;
    
    let payload;
    if (env === 'dev') {
        payload = {
            "businessEmail": "miasd@123.com",
            "rsaPassword": "fPgHQohLYC7X/JkqBCUx+nB7tWw2gX4iSJNWxFxp53+m+AFdVAD0VSoDtartpw3RUYeDQLIi87GkG2jwgQ3P7nQvhlrh4zinPrGuUFxz9l+nelcZ1Gj7wa/OOkc4xn+MUp/dTJIVepyHjCya++OUf80QXM4WBFqf8ZXHOqy98EA=",
            "clientId": "7e5e017fd1004d5395857dbe1fd5a07a",
            "companyCode": "bipo",
            "principalType": "BUSINESS_EMAIL"
        };
    } else {
        payload = {
            businessEmail: "miasd@123.com",
            rsaPassword: "OS0Ol7SNO+EWpseh4riA9QfoKv6/l3wXS/N49CdP8DKEH5LFB/2K5A5iSIJrajOXAbYlolBHX5NGLZBwS8uEju2XtcbqT6A6ULtEi9jLTGz0B5lQmbscPRTxCMaylHfF0hoqWlzxi++RMijiE/1lU66G9oLBXFpUogDrIeAeXBI=",
            clientId: "7e5e017fd1004d5395857dbe1fd5a07a",
            companyCode: "bipo",
            principalType: "BUSINESS_EMAIL"
        };
    }

    const headers = {
      ...this.defaultHeaders,
      'origin': baseUrl,
      'referer': `${baseUrl}/bipo`,
      'x-actived-menu': 'NORMAL',
    };

    try {
      console.log(`Fetching Token from (${env}):`, url);
      
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
   * @param env 环境
   */
  async getProjectInfo(projectId: string, token: string, cookie?: string | null, userInfo?: Record<string, any>, env: Environment = 'test') {
    const baseUrl = this.getBaseUrl(env);
    const url = `${baseUrl}/services/dukang-service-online/projects/${projectId}`;
    
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'x-dk-token': token, // 确保这里使用了正确的 token
      'x-actived-menu': 'Common-All Projects',
      'referer': `${baseUrl}/projects/all-projects/${projectId}/candidate`,
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
    version: string,
    options?: {
      referenceId?: string;
      objectType?: string[];
      excludeProjectId?: boolean;
      excludeVersion?: boolean;
    },
    env: Environment = 'test'
  ) {
    const baseUrl = this.getBaseUrl(env);
    const url = `${baseUrl}/services/dukang-service-online/schemas/filter`;
    
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'x-dk-token': token,
      'x-actived-menu': 'Common-All Projects',
      'referer': `${baseUrl}/projects/all-projects/${projectId}/candidate?clientId=${userInfo.clientId || ''}&tabKey=Candidate&locationId=${locationId}`,
    };

    if (userInfo?.externalId) {
      headers['x-contact-id'] = String(userInfo.externalId);
    }

    // 默认 Payload (Candidate)
    const payload: any = {
      referenceId: options?.referenceId || locationId,
      objectType: options?.objectType || ["candidateVisit", "sdAccess"],
    };

    if (!options?.excludeProjectId) {
      payload.projectId = projectId;
    }

    if (!options?.excludeVersion) {
      payload.applicableServiceVersion = version;
    }

    console.log('Fetching Creation Fields from:', url);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

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
  private generateRandomValue(attribute: any, locationId?: string, context?: 'candidate' | 'contractor' | 'applicant'): any {
    if (!attribute) return null;

    const { type, schemaData, id, required } = attribute;

    // 特殊处理 Candidate 的 manager 字段
    if (context === 'candidate' && id === 'manager') {
        return [{
            "reportingToJobTitle": "Business Manager",
            "reportingToEmployeeType": [{ "name": "SD Manager", "id": "SD" }],
            "reportingToMail": "nancymanager@mail.com",
            "reportingToEmployeeCode": "nancymanager01",
            "reportingToName": "Nancy Manager"
        }];
    }

    // 特殊处理 Location: 即使不是必填，如果它是 workLocation，通常也需要填
    const isWorkLocation = id === 'workLocation';

    // 必填项才生成值 (除非有特殊逻辑)
    if (!required && !isWorkLocation) {
        return null;
    }

    try {
      if (type === 'Text') {
        // 1. 如果是 displayName，生成随机姓名
        if (id === 'displayName') {
           const isEnglish = Math.random() > 0.5;
           if (isEnglish) {
             const first = ['Alex', 'Bill', 'Chris', 'David', 'Eric', 'Frank', 'George', 'Henry', 'Jack', 'Tom', 'James', 'Robert', 'John', 'Michael', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Gregory', 'Alexander', 'Raymond', 'Patrick', 'Dennis', 'Jerry'];
             const last = ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Anderson', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
             return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
           } else {
              const xing = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '张', '刘', '杨', '黄', '徐', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '谢', '韩', '唐', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '漕', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文'];
              const ming = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '桂兰', '玲', '萍', '丹', '华', '红', '玉兰', '飞', '鹏', '兰', '凤英', '峰', '辉', '燕', '宏', '鑫', '彬', '斌', '宇', '浩', '凯', '健', '俊', '帆', '然', '婷', '慧', '莹', '颖', '琳', '洁', '梅', '琴', '蕾', '薇', '欣', '悦', '佳', '宁', '欣怡', '梓', '涵', '晨', '曦', '轩', '泽', '睿', '嘉', '懿', '皓', '铭', '钧', '恩', '熙', '瑞', '哲', '瀚', '诚', '致', '远', '硕', '昊'];
              return `${xing[Math.floor(Math.random() * xing.length)]}${ming[Math.floor(Math.random() * ming.length)]}`;
           }
        }

        // 如果 ID 是 Salary，生成 1000-50000 随机数
        if (id === 'Salary' || id === 'salary') {
            return String(Math.floor(Math.random() * (50000 - 1000 + 1)) + 1000);
        }

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
          const first = ['Alex', 'Bill', 'Chris', 'David', 'Eric', 'Frank', 'George', 'Henry', 'Jack', 'Tom', 'James', 'Robert', 'John', 'Michael', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Gregory', 'Alexander', 'Raymond', 'Patrick', 'Dennis', 'Jerry'];
          const last = ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Anderson', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
          return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
        } else {
           const xing = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '张', '刘', '杨', '黄', '徐', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '谢', '韩', '唐', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '漕', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文'];
           const ming = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '桂兰', '玲', '萍', '丹', '华', '红', '玉兰', '飞', '鹏', '兰', '凤英', '峰', '辉', '燕', '宏', '鑫', '彬', '斌', '宇', '浩', '凯', '健', '俊', '帆', '然', '婷', '慧', '莹', '颖', '琳', '洁', '梅', '琴', '蕾', '薇', '欣', '悦', '佳', '宁', '欣怡', '梓', '涵', '晨', '曦', '轩', '泽', '睿', '嘉', '懿', '皓', '铭', '钧', '恩', '熙', '瑞', '哲', '瀚', '诚', '致', '远', '硕', '昊'];
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
      else if (type === 'LandingServiceRegion') {
         // LandingServiceRegion 特殊处理：传 "region":[{"name":"Angola","id":"AGO"}]
         // 这里我们先返回 [{ id: 'AGO', name: 'Angola' }]
         // 但要注意，调用方可能直接用 id 作为 key
         return [{ id: 'AGO', name: 'Angola' }];
      }
      else if (type === 'Currency') {
         // 2. Currency 固定传值
         return [{"id":"ADP","name":"ADP"}];
      }
      else if (type === 'TextArea') {
         // 3. TextArea 随机生成50字符中文或英文
         const isEnglish = Math.random() > 0.5;
         let result = '';
         if (isEnglish) {
             const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
             for (let i = 0; i < 50; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
             }
         } else {
             // 常用汉字
             const chars = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少格山统必况处石千拿更术领即设必离色自';
             for (let i = 0; i < 50; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
             }
         }
         return result;
      }
      else if (type === 'Phone') {
         // 4. Phone 传值 "phoneNoForContractor":{"number":"...","areaCode":"+86"}
         let number = '1'; // 中国手机号通常以1开头
         for (let i = 0; i < 10; i++) {
            number += Math.floor(Math.random() * 10);
         }
         return { number, areaCode: "+86" };
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
   * 提取并生成属性值
   */
  private extractAttributes(creationFields: any, locationId?: string, context?: 'candidate' | 'contractor' | 'applicant') {
    const attributes: Record<string, any> = {};
    if (creationFields?.data?.groups) {
      for (const group of creationFields.data.groups) {
        if (group.attributes) {
          for (const attr of group.attributes) {
            attributes[attr.id] = this.generateRandomValue(attr, locationId, context);
          }
        }
      }
    }
    return attributes;
  }

  /**
   * 通用请求发送方法
   */
  private async sendCreationRequest(
    url: string,
    headers: Record<string, string>,
    payload: any,
    logPrefix: string
  ) {
    console.log(`${logPrefix} at:`, url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`${logPrefix} API Error:`, responseText);
        throw new Error(`Failed to ${logPrefix.toLowerCase()}: ${response.status} ${response.statusText} - ${responseText.substring(0, 200)}`);
      }

      const apiResult: any = safeJsonParse(responseText);
      return {
        ...(apiResult || {}),
        _sentAttributes: payload.attributes
      };

    } catch (error) {
      console.error(`${logPrefix} Failed:`, error);
      throw error;
    }
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
    locationId?: string,
    env: Environment = 'test'
  ) {
    const baseUrl = this.getBaseUrl(env);
    const url = `${baseUrl}/services/dukang-service-online/candidates`;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'x-dk-token': token,
      'x-actived-menu': 'Common-All Projects',
      'referer': `${baseUrl}/projects/all-projects/${projectId}/candidate`,
    };

    if (userInfo?.externalId) {
      headers['x-contact-id'] = String(userInfo.externalId);
    }

    const attributes = this.extractAttributes(creationFields, locationId, 'candidate');
    const schemaId = creationFields?.data?.schemaId;

    const payload = {
      projectId: projectId,
      creationType: "FULL_ENTRY",
      schemaId: schemaId,
      attributes: attributes
    };

    return this.sendCreationRequest(url, headers, payload, 'Create Candidate');
  }

  /**
   * 4. 创建 Contractor
   * 对应接口 4: /services/dukang-service-online/contractors
   */
  async createContractor(
    token: string,
    userInfo: Record<string, any>,
    projectId: string,
    creationFields: any,
    locationId?: string,
    env: Environment = 'test'
  ) {
    const baseUrl = this.getBaseUrl(env);
    const url = `${baseUrl}/services/dukang-service-online/contractors`;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'x-dk-token': token,
      'x-actived-menu': 'Common-All Projects',
      'referer': `${baseUrl}/projects/all-projects/${projectId}/contractor`,
    };

    if (userInfo?.externalId) {
      headers['x-contact-id'] = String(userInfo.externalId);
    }

    const attributes = this.extractAttributes(creationFields, locationId, 'contractor');
    const schemaId = creationFields?.data?.schemaId;

    const payload = {
      projectId: projectId,
      state: "PreService",
      schemaId: schemaId,
      attributes: attributes
    };

    return this.sendCreationRequest(url, headers, payload, 'Create Contractor');
  }

  /**
   * 4. 创建 Applicant
   * 对应接口 4: /services/dukang-service-online/applicants
   */
  async createApplicant(
    token: string,
    userInfo: Record<string, any>,
    projectId: string,
    creationFields: any,
    locationId?: string,
    env: Environment = 'test'
  ) {
    const baseUrl = this.getBaseUrl(env);
    const url = `${baseUrl}/services/dukang-service-online/applicants`;

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'x-dk-token': token,
      'x-actived-menu': 'Common-All Projects',
      'referer': `${baseUrl}/projects/all-projects/${projectId}/applicant?clientId=${userInfo.clientId || ''}&tabKey=Applicant&locationId=${locationId}`,
    };

    if (userInfo?.externalId) {
      headers['x-contact-id'] = String(userInfo.externalId);
    }

    const attributes = this.extractAttributes(creationFields, locationId, 'applicant');
    const schemaId = creationFields?.data?.schemaId;

    const payload = {
      projectId: projectId,
      attributes: attributes,
      schemaId: schemaId,
      status: "active"
    };

    return this.sendCreationRequest(url, headers, payload, 'Create Applicant');
  }
}

export const personnelService = PersonnelService.getInstance();
