import { AuthManagerConfig, SystemType, EnvType } from './types';

/**
 * 从环境变量获取配置
 * 命名规范: SYSTEM_ENV_KEY (e.g., BUTTER_DEV_CLIENT_ID)
 */
function getEnv(system: SystemType, env: EnvType, key: string, defaultValue: string = ''): string {
  const prefix = `${system.toUpperCase()}_${env.toUpperCase()}`;
  const envKey = `${prefix}_${key}`;
  return process.env[envKey] || defaultValue;
}

/**
 * 统一配置中心
 * 管理所有系统环境的认证信息
 */
export const authConfig: AuthManagerConfig = {
  systems: {
    butter: {
      dev: {
        credentials: {
          clientId: getEnv('butter', 'dev', 'CLIENT_ID'),
          clientSecret: getEnv('butter', 'dev', 'CLIENT_SECRET'),
          authUrl: getEnv('butter', 'dev', 'AUTH_URL', 'https://dev-auth.butter.com/oauth/token'),
        },
      },
      test: {
        credentials: {
          clientId: getEnv('butter', 'test', 'CLIENT_ID'),
          clientSecret: getEnv('butter', 'test', 'CLIENT_SECRET'),
          authUrl: getEnv('butter', 'test', 'AUTH_URL', 'https://test-auth.butter.com/oauth/token'),
        },
      },
      prod: {
        credentials: {
          clientId: getEnv('butter', 'prod', 'CLIENT_ID'),
          clientSecret: getEnv('butter', 'prod', 'CLIENT_SECRET'),
          authUrl: getEnv('butter', 'prod', 'AUTH_URL', 'https://auth.butter.com/oauth/token'),
        },
      },
    },
    tax: {
      dev: {
        credentials: {
          clientId: getEnv('tax', 'dev', 'CLIENT_ID'),
          clientSecret: getEnv('tax', 'dev', 'CLIENT_SECRET'),
          authUrl: getEnv('tax', 'dev', 'AUTH_URL', 'https://dev-api.tax.com/v1/auth'),
        },
      },
      test: {
        credentials: {
          clientId: getEnv('tax', 'test', 'CLIENT_ID'),
          clientSecret: getEnv('tax', 'test', 'CLIENT_SECRET'),
          authUrl: getEnv('tax', 'test', 'AUTH_URL', 'https://test-api.tax.com/v1/auth'),
        },
      },
      prod: {
        credentials: {
          clientId: getEnv('tax', 'prod', 'CLIENT_ID'),
          clientSecret: getEnv('tax', 'prod', 'CLIENT_SECRET'),
          authUrl: getEnv('tax', 'prod', 'AUTH_URL', 'https://api.tax.com/v1/auth'),
        },
      },
    },
  },
  retryAttempts: 3,
  retryDelay: 1000,
};
