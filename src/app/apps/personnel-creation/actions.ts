'use server';

import { personnelService } from '@/lib/services/personnel.service';

export type PersonnelType = 'candidate' | 'contractor' | 'applicant';

export interface CreatePersonnelState {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    projectInfo?: {
      applicableServiceVersion: string[];
      serviceType: string[];
      locationId?: string;
      [key: string]: unknown;
    };
    creationFields?: unknown;
    createResults?: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  };
}

/**
 * 执行完整的人员创建流程 (Step 1-4)
 */
export async function executePersonnelCreation(
  type: PersonnelType,
  projectId: string,
  quantity: number = 1
): Promise<CreatePersonnelState> {
  try {
    if (!projectId) {
      return { success: false, message: 'Project ID is required' };
    }

    // 1. 获取 Token
    const { token, cookie, userInfo } = await personnelService.getToken();
    if (!token) {
      return { success: false, message: 'Failed to retrieve authentication token' };
    }

    // 2. 获取项目信息
    const projectInfo = await personnelService.getProjectInfo(projectId, token, cookie, userInfo);

    // 配置不同类型的参数
    const config = {
      candidate: {
        getFieldsOptions: (locId: string) => ({
          // Default options
        }),
        createMethod: personnelService.createCandidate.bind(personnelService),
        requiresLocation: true,
      },
      contractor: {
        getFieldsOptions: (locId: string) => ({
          referenceId: projectId,
          objectType: ["create,sd"],
          excludeProjectId: true,
          excludeVersion: true
        }),
        createMethod: personnelService.createContractor.bind(personnelService),
        requiresLocation: false, // Contractor creation allows missing locationId in Step 3
      },
      applicant: {
        getFieldsOptions: (locId: string) => ({
          referenceId: "globalVisaSystemId",
          objectType: ["applicantVisit", "sdAccess"],
        }),
        createMethod: personnelService.createApplicant.bind(personnelService),
        requiresLocation: true,
      }
    };

    const typeConfig = config[type];
    if (!typeConfig) {
       return { success: false, message: `Invalid personnel type: ${type}` };
    }

    // 3. 获取创建字段
    let creationFields = null;
    let version = 'V2'; // Default
    
    // 如果需要 location 且没有，报错
    if (typeConfig.requiresLocation && !projectInfo.locationId) {
       throw new Error('Location ID missing, cannot proceed to step 3');
    }

    // 尝试获取 version
    const appVer = projectInfo.applicableServiceVersion;
    if (appVer) {
        version = String(appVer);
    }

    try {
      // 即使 Contractor 不强制要求 location，API 可能仍需要一个空字符串占位
      const locId = projectInfo.locationId || '';
      const options = typeConfig.getFieldsOptions(locId);

      creationFields = await personnelService.getCreationFields(
        token, 
        userInfo, 
        projectId, 
        locId,
        version,
        options
      );
    } catch (err) {
      console.error('Failed to get creation fields:', err);
      throw new Error('Failed to retrieve creation fields required for step 4');
    }

    // 4. 创建人员 (循环调用)
    const createResults: Array<{ id: string; name: string; email: string }> = [];
    
    if (creationFields) {
      try {
        for (let i = 0; i < quantity; i++) {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          const result = await typeConfig.createMethod(
            token,
            userInfo,
            projectId,
            creationFields,
            projectInfo.locationId
          );
          
          if (result && result.data && result.data.id) {
             const attributes = result._sentAttributes || {};
             
             let name = 'Unknown';
             let email = 'Unknown';

             const groups = (creationFields as any)?.data?.groups;
             if (groups) {
               for (const group of groups) {
                 if (group.attributes) {
                   for (const attr of group.attributes) {
                     const value = attributes[attr.id];
                     if (value) {
                       if (attr.type === 'EmployeeName' || attr.id.toLowerCase().includes('name')) {
                         if (attr.id === 'displayName' || attr.type === 'EmployeeName') {
                            name = value;
                         } else if (name === 'Unknown') {
                            name = value;
                         }
                       }
                       if (attr.type === 'Text' && attr.id.toLowerCase().includes('email')) {
                         email = value;
                       }
                     }
                   }
                 }
               }
             }

             createResults.push({
               id: result.data.id,
               name,
               email
             });
          }
        }
      } catch (err) {
         console.error(`Failed to create ${type}:`, err);
         throw err;
      }
    }

    // 序列化返回数据
    const serializedProjectInfo = JSON.parse(JSON.stringify(projectInfo));
    const serializedCreationFields = JSON.parse(JSON.stringify(creationFields));
    const serializedCreateResults = JSON.parse(JSON.stringify(createResults));

    return {
      success: true,
      data: {
        token,
        projectInfo: serializedProjectInfo,
        creationFields: serializedCreationFields,
        createResults: serializedCreateResults
      },
      message: `Successfully created ${createResults.length} ${type}(s)!`,
    };

  } catch (error) {
    console.error(`${type} creation process failed:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * 初始化人员创建流程
 * (仅保留此函数用于可能的初始化检查，尽管 executePersonnelCreation 已包含所有步骤)
 */
export async function initializeCreation(projectId: string): Promise<CreatePersonnelState> {
  // 复用 executePersonnelCreation 的前几步逻辑有点复杂，这里保持原样，或者直接移除如果不再使用
  // 鉴于 QuickCreateCard 不再调用它，可以考虑简化或移除。
  // 但为了安全起见，保留原逻辑。
    try {
    if (!projectId) {
      return { success: false, message: 'Project ID is required' };
    }

    // 1. 获取 Token
    const { token, cookie, userInfo } = await personnelService.getToken();
    if (!token) {
      return { success: false, message: 'Failed to retrieve authentication token' };
    }

    // 2. 获取项目信息
    const projectInfo = await personnelService.getProjectInfo(projectId, token, cookie, userInfo);

    // 序列化返回数据
    const serializedProjectInfo = JSON.parse(JSON.stringify(projectInfo));

    return {
      success: true,
      data: {
        token,
        projectInfo: serializedProjectInfo,
      },
      message: 'Successfully initialized creation process',
    };

  } catch (error) {
    console.error('Initialization failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
