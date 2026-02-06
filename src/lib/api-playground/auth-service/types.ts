/**
 * 认证管理模块的类型定义
 */

export type SystemType = 'butter' | 'tax';
export type EnvType = 'dev' | 'test' | 'prod';

export interface AuthCredentials {
  clientId: string;
  clientSecret?: string; // Optional for Tax/Butter
  authUrl?: string; // Optional
  username?: string; // For Butter (businessEmail)
  password?: string; // For Butter (rsaPassword)
  mobile?: string; // For Tax
  mobileAreaCode?: number; // For Tax
  companyCode?: string; // For Butter
  principalType?: string; // For Butter (e.g., BUSINESS_EMAIL)
  scope?: string;
  grantType?: string; // default: client_credentials
  additionalParams?: Record<string, string>;
}

export interface TokenInfo {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // seconds
  expiresAt: number; // timestamp (ms)
  refreshToken?: string;
  scope?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface SystemConfig {
  [key: string]: { // EnvType
    credentials: AuthCredentials;
  };
}

export interface AuthManagerConfig {
  systems: Record<SystemType, SystemConfig>;
  retryAttempts?: number;
  retryDelay?: number; // ms
}
