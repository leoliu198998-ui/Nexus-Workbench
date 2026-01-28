'use server';

import { personnelService } from '@/lib/services/personnel.service';

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
 * 执行完整的 Contractor 创建流程 (Step 1-4)
 */
export async function executeContractorCreation(projectId: string, quantity: number = 1): Promise<CreatePersonnelState> {
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

    // 3. 获取创建字段
    let creationFields = null;
    let version = 'V2'; // Default
    
    const appVer = projectInfo.applicableServiceVersion;
    if (appVer) {
        version = String(appVer);
    }

    try {
    creationFields = await personnelService.getCreationFields(
        token, 
        userInfo, 
        projectId, 
        projectInfo.locationId || '', // Contractor creation does not strictly require locationId
        version,
        {
        referenceId: projectId,
         objectType: ["create,sd"],
         excludeProjectId: true,
         excludeVersion: true
        }
    );
    } catch (err) {
    console.error('Failed to get creation fields:', err);
    throw new Error('Failed to retrieve creation fields required for step 4');
    }

    // 4. 创建 Contractor (循环调用)
    const createResults: Array<{ id: string; name: string; email: string }> = [];
    
    if (creationFields) {
      try {
        for (let i = 0; i < quantity; i++) {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          const result = await personnelService.createContractor(
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
         console.error('Failed to create contractor:', err);
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
      message: `Successfully created ${createResults.length} contractor(s)!`,
    };

  } catch (error) {
    console.error('Contractor creation process failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * 执行完整的人员创建流程 (Step 1-4)
 */
export async function executeCandidateCreation(projectId: string, quantity: number = 1): Promise<CreatePersonnelState> {
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

    // 3. 获取创建字段
    let creationFields = null;
    let version = 'V2'; // Default
    if (projectInfo.locationId) {
      const appVer = projectInfo.applicableServiceVersion;
      
      // 总是使用 API 返回的 version，不进行数组处理
      if (appVer) {
         version = String(appVer);
      }

      try {
        creationFields = await personnelService.getCreationFields(
          token, 
          userInfo, 
          projectId, 
          projectInfo.locationId, 
          version
        );
      } catch (err) {
        console.error('Failed to get creation fields:', err);
        throw new Error('Failed to retrieve creation fields required for step 4');
      }
    } else {
      throw new Error('Location ID missing, cannot proceed to step 3');
    }

    // 4. 创建 Candidate (循环调用)
    const createResults: Array<{ id: string; name: string; email: string }> = [];
    
    if (creationFields) {
      try {
        for (let i = 0; i < quantity; i++) {
          // 增加 500ms 延时，防止请求过快触发限制
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          const result = await personnelService.createCandidate(
            token,
            userInfo,
            projectId,
            creationFields,
            projectInfo.locationId
          );
          
          if (result && result.data && result.data.id) {
             const attributes = result._sentAttributes || {};
             
             // 查找 Name 和 Email
             // 需要遍历 attributes 找到对应的值。
             // 由于我们不知道具体的 key (可能是 staffCode, emailAddress, displayName 等)
             // 我们需要一种方法来识别。
             // 简单起见，我们遍历 attributes 的 values，看是否像 Email 或 Name
             
             let name = 'Unknown';
             let email = 'Unknown';

             // 尝试从 creationFields 中找到 displayName 和 emailAddress 的 key
             // 这需要再次遍历 groups
             const groups = (creationFields as any)?.data?.groups;
             if (groups) {
               for (const group of groups) {
                 if (group.attributes) {
                   for (const attr of group.attributes) {
                     const value = attributes[attr.id];
                     if (value) {
                       if (attr.type === 'EmployeeName' || attr.id.toLowerCase().includes('name')) {
                         // 优先取 displayName 或 EmployeeName
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
         console.error('Failed to create candidate:', err);
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
      message: `Successfully created ${createResults.length} candidate(s)!`,
    };

  } catch (error) {
    console.error('Creation process failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * 初始化人员创建流程
 * 执行 Step 1 (获取 Token) 和 Step 2 (获取项目信息)
 * @param projectId 项目 ID
 */
export async function initializeCreation(projectId: string): Promise<CreatePersonnelState> {
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

    // 3. 获取创建字段 (如果有 locationId)
    let creationFields = null;
    if (projectInfo.locationId) {
      // 确定 version: 优先使用 "V2"，或者取第一个
      let version = 'V2';
      const appVer = projectInfo.applicableServiceVersion;

      // 总是使用 API 返回的 version，不进行数组处理
      if (appVer) {
         version = String(appVer);
      }

      try {
        creationFields = await personnelService.getCreationFields(
          token, 
          userInfo, 
          projectId, 
          projectInfo.locationId, 
          version
        );
      } catch (err) {
        console.error('Failed to get creation fields:', err);
        // 不阻断流程，但记录错误
      }
    }

    // 序列化返回数据，防止 Server Action 传递非普通对象 (如 BigInt 或某些原型链对象)
    const serializedProjectInfo = JSON.parse(JSON.stringify(projectInfo));
    const serializedCreationFields = creationFields ? JSON.parse(JSON.stringify(creationFields)) : null;

    return {
      success: true,
      data: {
        token,
        projectInfo: serializedProjectInfo,
        creationFields: serializedCreationFields,
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
