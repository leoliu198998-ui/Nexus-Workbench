'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export interface ButterConfig {
  clientId: string;
  businessEmail: string;
  rsaPassword: string;
  companyCode: string;
  principalType: string;
}

const DEFAULT_BUTTER_CONFIG: ButterConfig = {
  clientId: '',
  businessEmail: '',
  rsaPassword: '',
  companyCode: 'bipo',
  principalType: 'BUSINESS_EMAIL',
};

const TEST_BUTTER_CONFIG: ButterConfig = {
  clientId: '7e5e017fd1004d5395857dbe1fd5a07a',
  businessEmail: 'miasd@123.com',
  rsaPassword: 'i8v6HVzeK5KmY0uu6UQ/h++abSj1QgSHyFyBzUYoUIvCPgZENYrEpmLGJ0qwopSCEkkJnhOPldDj0jxHLSI519QzRDx+KQaRAPdtqwKuVXXmduSEcczYrjBXJjV7uYa8Wmiw0QhoA6veRW00DgY2ZBRCiiK0xcwbtQZO6EOB8oY=',
  companyCode: 'bipo',
  principalType: 'BUSINESS_EMAIL',
};

export default function ButterTokenManager() {
  const [env, setEnv] = useState<string>('test'); // Default to test
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [butterConfig, setButterConfig] = useState<ButterConfig>(TEST_BUTTER_CONFIG);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    // Clear previous environment's result
    setToken('');
    setError('');

    if (typeof window !== 'undefined') {
      const savedButterConfig = localStorage.getItem(`butter_config_${env}`);
      if (savedButterConfig) {
        try {
          const parsedConfig = JSON.parse(savedButterConfig);
          
          // Intelligent Reset: 
          // If we are NOT in 'test' env, but the saved config has the 'test' Client ID,
          // it means it was likely auto-saved from the previous default values.
          // We should reset it to empty defaults to avoid confusion.
          if (env !== 'test' && parsedConfig.clientId === TEST_BUTTER_CONFIG.clientId) {
             console.log(`[Butter] Detected stale test data in ${env} environment, resetting to defaults.`);
             setButterConfig(DEFAULT_BUTTER_CONFIG);
          } else {
             setButterConfig({ ...DEFAULT_BUTTER_CONFIG, ...parsedConfig });
          }
        } catch (e) {
          console.error('Failed to parse saved butter config', e);
          setButterConfig(env === 'test' ? TEST_BUTTER_CONFIG : DEFAULT_BUTTER_CONFIG);
        }
      } else {
        // No saved config for this env
        setButterConfig(env === 'test' ? TEST_BUTTER_CONFIG : DEFAULT_BUTTER_CONFIG);
      }
      setIsConfigLoaded(true);
    }
  }, [env]);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (isConfigLoaded && typeof window !== 'undefined') {
      localStorage.setItem(`butter_config_${env}`, JSON.stringify(butterConfig));
    }
  }, [butterConfig, env, isConfigLoaded]);

  const handleButterConfigChange = (field: keyof ButterConfig, value: string) => {
    setButterConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchToken = async () => {
    setLoading(true);
    setError('');
    setToken('');
    
    try {
      const missingFields = [];
      if (!butterConfig.clientId) missingFields.push('Client ID');
      if (!butterConfig.businessEmail) missingFields.push('Business Email');
      if (!butterConfig.rsaPassword) missingFields.push('RSA Password');
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for Butter system: ${missingFields.join(', ')}`);
      }

      const payload = {
        system: 'butter',
        env,
        credentials: {
          authUrl: 'https://global-test-butter.bipocloud.com/services/dukang-iam-identity/id_token/password_signin',
          clientId: butterConfig.clientId,
          username: butterConfig.businessEmail,
          password: butterConfig.rsaPassword,
          companyCode: butterConfig.companyCode,
          principalType: butterConfig.principalType,
        }
      };

      const res = await fetch('/api/apps/api-playground/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch token');
      }

      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Butter System</CardTitle>
        <CardDescription>
          Generate access tokens for Butter system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Environment</Label>
          <Select value={env} onValueChange={setEnv}>
            <SelectTrigger>
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="test">Test</SelectItem>
              <SelectItem value="prod">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="butterClientId">Client ID</Label>
            <Input 
              id="butterClientId" 
              value={butterConfig.clientId} 
              onChange={(e) => handleButterConfigChange('clientId', e.target.value)} 
              placeholder="Client ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input 
                id="businessEmail" 
                value={butterConfig.businessEmail} 
                onChange={(e) => handleButterConfigChange('businessEmail', e.target.value)} 
                placeholder="Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCode">Company Code</Label>
              <Input 
                id="companyCode" 
                value={butterConfig.companyCode} 
                onChange={(e) => handleButterConfigChange('companyCode', e.target.value)} 
                placeholder="bipo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsaPassword">RSA Password</Label>
            <Input 
              id="rsaPassword" 
              value={butterConfig.rsaPassword} 
              onChange={(e) => handleButterConfigChange('rsaPassword', e.target.value)} 
              placeholder="RSA Encrypted Password"
            />
          </div>
        </div>

        <Button onClick={fetchToken} disabled={loading} className="w-full">
          {loading ? 'Fetching Token...' : 'Get Access Token'}
        </Button>

        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md break-all">
            Error: {error}
          </div>
        )}

        {token && (
          <div className="space-y-2">
            <Label>Access Token</Label>
            <div className="relative">
              <Input value={token} readOnly className="pr-20 font-mono text-xs" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-full"
                onClick={() => navigator.clipboard.writeText(token)}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Token fetched using provided configuration.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
