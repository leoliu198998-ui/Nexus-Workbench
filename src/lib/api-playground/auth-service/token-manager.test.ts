import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenManager } from './token-manager';
import { authConfig } from './config';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('TokenManager', () => {
  let manager: TokenManager;

  beforeEach(() => {
    // 重置单例状态 (通过访问私有属性或重新实例化，这里为了测试方便，我们假设每次测试前清除内部状态)
    // 由于是单例，我们只能尽量模拟环境。
    // 更严谨的做法是在 TokenManager 中提供 reset 方法用于测试
    // 或者我们直接操作 TokenManager 的 prototype 或者使用 instance
    
    // 这里我们简单地通过 cast to any 来清除 private map
    manager = TokenManager.getInstance();
    (manager as any).tokens.clear();
    (manager as any).fetchPromises.clear();
    
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch a token successfully', async () => {
    const mockResponse = {
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const token = await manager.getToken('butter', 'dev');

    expect(token).toBe('mock_access_token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('dev-auth.butter.com'), // based on default config
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('grant_type=client_credentials'),
      })
    );
  });

  it('should return cached token if valid', async () => {
    const mockResponse = {
      access_token: 'cached_token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // First call
    await manager.getToken('butter', 'dev');
    
    // Second call
    const token = await manager.getToken('butter', 'dev');

    expect(token).toBe('cached_token');
    expect(fetchMock).toHaveBeenCalledTimes(1); // Should still be 1
  });

  it('should handle concurrent requests by merging them', async () => {
    const mockResponse = {
      access_token: 'concurrent_token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    // 模拟延迟响应
    fetchMock.mockReturnValue(new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => mockResponse,
        });
      }, 50);
    }));

    // 并发调用
    const [token1, token2] = await Promise.all([
      manager.getToken('butter', 'test'),
      manager.getToken('butter', 'test')
    ]);

    expect(token1).toBe('concurrent_token');
    expect(token2).toBe('concurrent_token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const mockResponse = {
      access_token: 'retry_token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    // First attempt fails
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    // Second attempt succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // 临时修改 retryDelay 加速测试
    const originalDelay = authConfig.retryDelay;
    authConfig.retryDelay = 1; // 1ms

    try {
      const token = await manager.getToken('tax', 'dev');
      expect(token).toBe('retry_token');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      authConfig.retryDelay = originalDelay;
    }
  });

  it('should fail after max retries', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const originalDelay = authConfig.retryDelay;
    authConfig.retryDelay = 0;

    await expect(manager.getToken('tax', 'prod')).rejects.toThrow('HTTP Error 500');
    
    // Initial + 3 retries = 4 calls
    expect(fetchMock).toHaveBeenCalledTimes(4); 
    
    authConfig.retryDelay = originalDelay;
  });

  it('should refresh token if expired', async () => {
     const expiredResponse = {
      access_token: 'expired_token',
      token_type: 'Bearer',
      expires_in: -100, // Already expired
    };

    const newResponse = {
      access_token: 'new_token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => newResponse,
    });

    // Manually inject an expired token into the map to simulate time passing
    // Or just let it fetch an expired one (though logic prevents using it if we fetched it as expired? No, fetch returns it, next get checks expiry)
    // But getToken checks expiry AFTER getting from cache.
    // Let's manually set cache.
    const key = 'butter:prod';
    (manager as any).tokens.set(key, {
      accessToken: 'old_token',
      expiresAt: Date.now() - 1000, // Expired 1s ago
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => newResponse,
    });

    const token = await manager.getToken('butter', 'prod');
    expect(token).toBe('new_token');
    expect(fetchMock).toHaveBeenCalledTimes(1); // Only the new fetch
  });

  it('should use custom credentials if provided', async () => {
    const mockResponse = {
      access_token: 'custom_token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const customCreds = {
      authUrl: 'https://custom.auth.com',
      clientId: 'custom_id',
      clientSecret: 'custom_secret',
      username: 'user',
      password: 'pass',
    };

    const token = await manager.getToken('tax', 'dev', customCreds);

    expect(token).toBe('custom_token');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://custom.auth.com',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('grant_type=password'),
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://custom.auth.com',
      expect.objectContaining({
        body: expect.stringContaining('username=user'),
      })
    );
  });
});
