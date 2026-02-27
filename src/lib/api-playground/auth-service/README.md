# Auth Manager (API Token 管理模块)

这是一个通用的多系统、多环境 API Token 管理模块。它支持自动获取、缓存、刷新 Token，并处理并发请求和错误重试。

## 功能特性

*   **多系统/多环境支持**：支持 Butter、Tax 等系统的 Dev/Test/Prod 环境配置。
*   **自动缓存**：Token 获取后自动缓存，直到过期前自动刷新。
*   **并发控制**：同一系统环境的并发请求会合并为一个 HTTP 请求，避免资源浪费。
*   **自动重试**：网络请求失败时支持自动指数退避重试。
*   **统一配置**：支持环境变量配置，易于扩展。

## 目录结构

*   `types.ts`: 类型定义
*   `config.ts`: 配置管理 (环境变量读取)
*   `token-manager.ts`: 核心逻辑实现
*   `index.ts`: 统一导出

## 快速开始

### 1. 配置环境变量

在 `.env` 文件中添加对应环境的认证信息：

```env
# Butter System
BUTTER_DEV_CLIENT_ID=your_client_id
BUTTER_DEV_CLIENT_SECRET=your_client_secret
BUTTER_DEV_AUTH_URL=https://dev-auth.butter.com/oauth/token

# Tax System
TAX_PROD_CLIENT_ID=your_client_id
TAX_PROD_CLIENT_SECRET=your_client_secret
TAX_PROD_AUTH_URL=https://api.tax.com/v1/auth
```

### 2. 使用 TokenManager

```typescript
import { tokenManager } from '@/lib/api-playground/auth-service';

async function main() {
  try {
    // 获取 Butter 系统 Dev 环境的 Token
    const token = await tokenManager.getToken('butter', 'dev');
    console.log('Got token:', token);

    // 使用 Token 调用 API
    const response = await fetch('https://dev-api.butter.com/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // ...
  } catch (error) {
    console.error('Failed to get token:', error);
  }
}
```

### 3. 强制刷新 Token

如果 API 返回 401，可以尝试强制刷新 Token：

```typescript
try {
  // call api...
} catch (e) {
  if (e.status === 401) {
    // 强制刷新并重试
    const newToken = await tokenManager.refreshToken('butter', 'dev');
    // retry api call...
  }
}
```

## 配置扩展

要添加新的系统，请修改 `src/lib/api-playground/auth-service/types.ts` 中的 `SystemType` 定义，并在 `src/lib/api-playground/auth-service/config.ts` 中添加相应的配置映射。

```typescript
// types.ts
export type SystemType = 'butter' | 'tax' | 'new_system';

// config.ts
// ... inside authConfig.systems
new_system: {
  dev: { ... },
  prod: { ... },
}
```
