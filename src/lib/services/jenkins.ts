import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';

const ALIAS_FILE_PATH = path.join(process.cwd(), 'src/lib/data/jenkins-aliases.json');
const COMMON_VIEWS_FILE_PATH = path.join(process.cwd(), 'src/lib/data/jenkins-common-views.json');
const COMMON_JOBS_FILE_PATH = path.join(process.cwd(), 'src/lib/data/jenkins-common-jobs.json');
const COMMON_SERVICES_FILE_PATH = path.join(process.cwd(), 'src/lib/data/jenkins-common-services.json');

// Default aliases--- API Response Interfaces ---

interface JenkinsJobSummary {
  name: string;
  url: string;
  color: string;
}

interface JenkinsViewResponse {
  name: string;
  url: string;
  jobs: JenkinsJobSummary[];
}

interface JenkinsParameterDefinition {
  name: string;
  type: string;
  description?: string;
  defaultParameterValue?: {
    value: string | null;
  };
  choices?: string[];
}

interface JenkinsProperty {
  _class: string;
  parameterDefinitions?: JenkinsParameterDefinition[];
}

interface JenkinsJobResponse {
  name: string;
  url: string;
  lastSuccessfulBuild: {
    number: number;
    url: string;
  } | null;
  property: JenkinsProperty[];
}

interface JenkinsParameterValue {
  name: string;
  value: string | number | boolean | null;
}

interface JenkinsAction {
  parameters?: JenkinsParameterValue[];
}

interface JenkinsBuildResponse {
  number: number;
  id: string;
  result: string | null;
  timestamp: number;
  url: string;
  displayName: string;
  actions: JenkinsAction[];
}

interface JenkinsLastBuildResponse {
  actions: JenkinsAction[];
}

// Default aliases
const DEFAULT_ALIASES: Record<string, string> = {
  "online": "build-dukang-service-online",
  "webui": "build-service-online-webui-monorepo-feature-node20",
  "monorepo": "build-service-online-webui-monorepo-feature-node20",
  "webui-node20": "build-service-online-webui-monorepo-feature-node20",
  "onlinetag": "build-tag-dukang-service-online",
  "test": "archegostest",
  "uat": "archegosuat-eu"
};

// --- Service Interfaces ---

export interface JenkinsView {
  name: string;
  url: string;
  jobs: {
    name: string;
    url: string;
    status: string;
  }[];
}

export interface JenkinsParameter {
  name: string;
  type: string;
  description: string;
  defaultValue: string | null;
  choices?: string[];
  lastBuildValue?: string | number | boolean | null;
}

export interface JenkinsJob {
  name: string;
  url: string;
  lastSuccessfulBuild: {
    number: number;
    url: string;
  } | null;
  parameters: JenkinsParameter[];
  buildHistory: string; // Keep as string for now as it returns HTML
}

export interface JenkinsBuildInfo {
  number: number;
  result: string | null; // SUCCESS, FAILURE, ABORTED, null (running)
  timestamp: number;
  url: string;
}

export interface CommonJob {
  name: string;
  scopes: string[];
}

export class JenkinsService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.JENKINS_URL || '';
    const username = process.env.JENKINS_USERNAME;
    const apiToken = process.env.JENKINS_API_TOKEN;

    if (!this.baseUrl || !username || !apiToken) {
      throw new Error(
        'Jenkins configuration missing. Please check JENKINS_URL, JENKINS_USERNAME, and JENKINS_API_TOKEN in .env'
      );
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username,
        password: apiToken,
      },
    });
  }

  public async getAliases(): Promise<Record<string, string>> {
    try {
      if (fs.existsSync(ALIAS_FILE_PATH)) {
        const content = await fs.promises.readFile(ALIAS_FILE_PATH, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('Failed to read aliases file, using defaults:', error);
    }
    return DEFAULT_ALIASES;
  }

  public async saveAliases(aliases: Record<string, string>): Promise<void> {
    try {
      const dir = path.dirname(ALIAS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      await fs.promises.writeFile(ALIAS_FILE_PATH, JSON.stringify(aliases, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save aliases:', error);
      throw error;
    }
  }

  public async getCommonViews(): Promise<string[]> {
    try {
      if (fs.existsSync(COMMON_VIEWS_FILE_PATH)) {
        const content = await fs.promises.readFile(COMMON_VIEWS_FILE_PATH, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('Failed to read common views file, using defaults:', error);
    }
    return ['all', 'archegos'];
  }

  public async saveCommonViews(views: string[]): Promise<void> {
    try {
      const dir = path.dirname(COMMON_VIEWS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      await fs.promises.writeFile(COMMON_VIEWS_FILE_PATH, JSON.stringify(views, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save common views:', error);
      throw error;
    }
  }

  public async getCommonJobs(): Promise<CommonJob[]> {
    try {
      if (fs.existsSync(COMMON_JOBS_FILE_PATH)) {
        const content = await fs.promises.readFile(COMMON_JOBS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(content);
        
        if (Array.isArray(parsed)) {
          // Migration: Convert string[] to CommonJob[]
          return parsed.map((item: string | CommonJob) => {
            if (typeof item === 'string') {
              // Default legacy items to be visible everywhere
              return { 
                name: item, 
                scopes: ['Changed Tags', 'Latest Build', 'Verify Tag'] 
              };
            }
            return item;
          });
        }
      }
    } catch (error) {
      console.warn('Failed to read common jobs file, using defaults:', error);
    }
    // Default fallback
    return [
      { name: 'archegostest', scopes: ['Changed Tags', 'Latest Build', 'Verify Tag'] },
      { name: 'build-dukang-service-online', scopes: ['Changed Tags', 'Latest Build', 'Verify Tag'] }
    ];
  }

  public async saveCommonJobs(jobs: CommonJob[]): Promise<void> {
    try {
      const dir = path.dirname(COMMON_JOBS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      await fs.promises.writeFile(COMMON_JOBS_FILE_PATH, JSON.stringify(jobs, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save common jobs:', error);
      throw error;
    }
  }

  public async getCommonServices(): Promise<string[]> {
    try {
      if (fs.existsSync(COMMON_SERVICES_FILE_PATH)) {
        const content = await fs.promises.readFile(COMMON_SERVICES_FILE_PATH, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('Failed to read common services file, using defaults:', error);
    }
    return [];
  }

  public async saveCommonServices(services: string[]): Promise<void> {
    try {
      const dir = path.dirname(COMMON_SERVICES_FILE_PATH);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      await fs.promises.writeFile(COMMON_SERVICES_FILE_PATH, JSON.stringify(services, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save common services:', error);
      throw error;
    }
  }

  /**
   * Helper to resolve job name from alias
   */
  private async resolveJobName(jobName: string): Promise<string> {
    const aliases = await this.getAliases();
    return aliases[jobName] || jobName;
  }

  /**
   * Helper to construct job path
   */
  private async getJobPath(jobName: string, viewName: string = 'all'): Promise<string> {
    // If jobName is already a path (contains slashes), return it as is (relative to base, but we use leading slash in calls)
    // However, our logic below prepends slash, so we should be careful.
    // Let's assume jobName is just the name.
    
    // Check if it's already a full path-like string provided by legacy code
    if (jobName.startsWith('view/') || jobName.startsWith('job/')) {
        return jobName;
    }

    const resolvedName = await this.resolveJobName(jobName);
    if (viewName.toLowerCase() === 'all') {
      return `job/${resolvedName}`;
    }
    return `view/${viewName}/job/${resolvedName}`;
  }

  /**
   * Get all views from Jenkins
   */
  async getAllViews(): Promise<{ name: string; url: string }[]> {
    const response = await this.client.get<{ views: { name: string; url: string }[] }>(
      '/api/json',
      {
        params: {
          tree: 'views[name,url]',
        },
      }
    );
    return response.data.views;
  }

  /**
   * 获取视图信息及其包含的作业列表
   */
  async getViewInfo(viewName: string): Promise<JenkinsView> {
    console.log(`Fetching view info: ${this.baseUrl}/view/${viewName}/api/json`);
    const response = await this.client.get<JenkinsViewResponse>(
      `/view/${viewName}/api/json`
    );
    const viewData = response.data;

    return {
      name: viewData.name,
      url: viewData.url,
      jobs: viewData.jobs.map((job) => ({
        name: job.name,
        url: job.url,
        status: job.color,
      })),
    };
  }

  /**
   * 获取作业信息
   */
  async getJobInfo(jobPath: string): Promise<JenkinsJobResponse> {
    const response = await this.client.get<JenkinsJobResponse>(
      `/${jobPath}/api/json`,
      {
        params: {
          tree: 'name,url,lastSuccessfulBuild[number,url],property[_class,parameterDefinitions[name,type,defaultParameterValue[value],description,choices]]',
        },
      }
    );
    return response.data;
  }

  /**
   * 获取作业的构建历史
   */
  async getBuildHistory(jobPath: string): Promise<string> {
    const response = await this.client.get<string>(
      `/${jobPath}/buildHistory/ajax`
    );
    return response.data;
  }

  /**
   * 获取最后一次构建的参数
   */
  async getLastBuildParameters(jobPath: string): Promise<JenkinsParameterValue[]> {
    try {
      const response = await this.client.get<JenkinsLastBuildResponse>(
        `/${jobPath}/lastBuild/api/json`,
        {
          params: {
            tree: 'actions[parameters[name,value]]',
          },
        }
      );

      const actions = response.data.actions;
      const parametersAction = actions.find((action) => action.parameters);
      return parametersAction?.parameters || [];
    } catch {
      return [];
    }
  }

  /**
   * 从作业信息中提取构建参数定义
   */
  private extractBuildParameters(
    jobInfo: JenkinsJobResponse
  ): JenkinsParameter[] {
    const parameters: JenkinsParameter[] = [];
    const properties = jobInfo.property || [];

    for (const prop of properties) {
      if (
        prop._class === 'hudson.model.ParametersDefinitionProperty' &&
        prop.parameterDefinitions
      ) {
        for (const param of prop.parameterDefinitions) {
          const parameter: JenkinsParameter = {
            name: param.name,
            type: param.type,
            description: param.description || '',
            defaultValue: param.defaultParameterValue
              ? param.defaultParameterValue.value
              : null,
          };

          if (param.choices) {
            parameter.choices = param.choices;
          }

          parameters.push(parameter);
        }
      }
    }

    return parameters;
  }

  /**
   * 获取作业详细信息
   * Supports jobName (with alias resolution) or direct path
   */
  async getJobDetails(jobNameOrPath: string, viewName: string = 'all'): Promise<JenkinsJob> {
    try {
      const path = await this.getJobPath(jobNameOrPath, viewName);
      
      const [jobInfo, buildHistory, lastBuildParams] = await Promise.all([
        this.getJobInfo(path),
        this.getBuildHistory(path),
        this.getLastBuildParameters(path),
      ]);

      const parameters = this.extractBuildParameters(jobInfo);

      // 填充最后一次构建的值
      parameters.forEach((param) => {
        const lastBuildParam = lastBuildParams.find(
          (p) => p.name === param.name
        );
        if (lastBuildParam) {
          param.lastBuildValue = lastBuildParam.value;
        }
      });

      return {
        name: jobInfo.name,
        url: jobInfo.url,
        lastSuccessfulBuild: jobInfo.lastSuccessfulBuild,
        parameters,
        buildHistory,
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to get job details:', error.message);
      } else {
        console.error('Failed to get job details:', error);
      }
      throw error;
    }
  }

  /**
   * Get changed tags from Jenkins job (APPS parameter)
   */
  async getChangedTags(params: {
    jobName?: string;
    viewName?: string;
    startDate?: string;
    endDate?: string;
    serviceName?: string;
  }): Promise<{
    jobName: string;
    url: string;
    changedTags: string;
  }> {
    const { 
      jobName = 'archegostest', 
      viewName = 'archegos',
      startDate,
      endDate,
      serviceName 
    } = params;

    // Handle "JobName.ServiceName" shorthand
    let targetJob = jobName;
    let targetService = serviceName;
    
    if (!targetService && targetJob.includes('.')) {
      const parts = targetJob.split('.');
      if (parts.length === 2) {
        targetJob = parts[0];
        targetService = parts[1];
      }
    }

    // We use getJobDetails which now handles path construction and aliases
    const jobDetails = await this.getJobDetails(targetJob, viewName);
    
    // Extract APPS parameter changes
    const appsParam = jobDetails.parameters.find(p => p.name === 'APPS');
    let changedTags = (appsParam?.lastBuildValue as string) || 'No APPS parameter found or no value in last build';

    if (changedTags && typeof changedTags === 'string') {
      let lines = changedTags.split('\n');

      // Filter by service name
      if (targetService) {
        lines = lines.filter(line => line.includes(targetService!));
        if (lines.length === 0) {
          return {
            jobName: jobDetails.name,
            url: jobDetails.url,
            changedTags: `No tags found for service '${targetService}'.`
          };
        }
      }

      // Filter by date range
      if (startDate || endDate) {
        // Helper to normalize date to YYYYMMDD (number)
        const normalizeDate = (d: string | undefined, isEnd: boolean): number => {
          if (!d) return isEnd ? 99999999 : 0;
          const num = parseInt(d);
          // If 6 digits (YYMMDD), assume 20YYMMDD
          if (num < 1000000) return 20000000 + num;
          return num;
        };

        const start = normalizeDate(startDate, false);
        const end = normalizeDate(endDate, true);

        const filteredTags = lines.filter(line => {
          // Extract date from tag (YYMMDD or YYYYMMDD format)
          // Matches .YYMMDD, _YYYYMMDD, _YYMMDD
          const match = line.match(/[._]((?:20)?\d{6})(?:\d+)?/);
          if (match) {
            let dateVal = parseInt(match[1]);
            // Normalize extracted date to YYYYMMDD if it is YYMMDD
            if (dateVal < 1000000) {
              dateVal += 20000000;
            }
            return dateVal >= start && dateVal <= end;
          }
          return false;
        });

        if (filteredTags.length > 0) {
          changedTags = filteredTags.join('\n');
        } else {
          changedTags = `No tags found for date range ${startDate || 'start'} - ${endDate || 'end'} in the last build.`;
        }
      } else if (targetService) {
        // If filtered by service but no date range, rejoin lines
        changedTags = lines.join('\n');
      }
    }

    return {
      jobName: jobDetails.name,
      url: jobDetails.url,
      changedTags
    };
  }

  /**
   * 根据服务名和 Tag 查找构建记录
   */
  async findBuildByTag(
    jobName: string,
    tag: string,
    viewName: string = 'all',
    serviceName?: string
  ): Promise<JenkinsBuildInfo | null> {
    try {
      // Resolve job alias
      const resolvedJobName = await this.resolveJobName(jobName);
      
      // Infer service name if not provided: remove 'build-' prefix
      const effectiveServiceName = serviceName || resolvedJobName.replace(/^build-/, '');
      
      const path = await this.getJobPath(resolvedJobName, viewName);
      
      // 获取最近 5 次构建
      const response = await this.client.get<{ builds: JenkinsBuildResponse[] }>(
        `/${path}/api/json`,
        {
          params: {
            tree: 'builds[number,id,result,timestamp,url,displayName,actions[parameters[name,value]]]{0,5}',
          },
        }
      );

      const builds = response.data.builds;

      for (const build of builds) {
        const actions = build.actions || [];
        const parametersAction = actions.find((a) => a.parameters);

        if (parametersAction && parametersAction.parameters) {
          // 策略 1: 直接参数匹配
          const param = parametersAction.parameters.find(
            (p) => p.name === effectiveServiceName && p.value === tag
          );
          if (param) {
            return {
              number: build.number,
              result: build.result,
              timestamp: build.timestamp,
              url: build.url,
            };
          }

          // 策略 2: 在 APPS 参数中搜索 (多行字符串)
          const appsParam = parametersAction.parameters.find(
            (p) => p.name === 'APPS'
          );
          if (
            appsParam &&
            appsParam.value &&
            typeof appsParam.value === 'string'
          ) {
            const targetLine = `${effectiveServiceName}=${tag}`;
            const lines = appsParam.value.split('\n');
            const match = lines.some(
              (line) => line.trim() === targetLine
            );

            if (match) {
              return {
                number: build.number,
                result: build.result,
                timestamp: build.timestamp,
                url: build.url,
              };
            }
          }
        }

        // 策略 3: 检查 displayName
        if (build.displayName && build.displayName.includes(tag)) {
          return {
            number: build.number,
            result: build.result,
            timestamp: build.timestamp,
            url: build.url,
          };
        }
      }

      return null;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to find build by tag:', error.message);
      } else {
        console.error('Failed to find build by tag:', error);
      }
      throw error;
    }
  }
}