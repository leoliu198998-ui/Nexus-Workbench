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
      [key: string]: unknown;
    };
  };
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

    // 序列化返回数据，防止 Server Action 传递非普通对象 (如 BigInt 或某些原型链对象)
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
