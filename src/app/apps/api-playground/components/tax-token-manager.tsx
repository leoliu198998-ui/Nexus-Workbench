'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export interface TaxConfig {
  clientId: string;
  mobile: string;
  mobileAreaCode: string;
}

const DEFAULT_TAX_CONFIG: TaxConfig = {
  clientId: '',
  mobile: '',
  mobileAreaCode: '86',
};

const TEST_TAX_CONFIG: TaxConfig = {
  clientId: 'e99239eac2fa4ed986b1f9e05d1bb175',
  mobile: '13122220805', 
  mobileAreaCode: '86',
};

export default function TaxTokenManager() {
  const [env, setEnv] = useState<string>('test'); // Default to test
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(TEST_TAX_CONFIG);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    // Clear previous environment's result
    setToken('');
    setError('');

    if (typeof window !== 'undefined') {
      const savedTaxConfig = localStorage.getItem(`tax_config_${env}`);
      if (savedTaxConfig) {
        try {
          const parsedConfig = JSON.parse(savedTaxConfig);
          
          // Intelligent Reset for Tax
          // If we are NOT in 'test' env, but the saved config has the 'test' Client ID,
          // it means it was likely auto-saved from the previous default values.
          if (env !== 'test' && parsedConfig.clientId === TEST_TAX_CONFIG.clientId) {
             console.log(`[Tax] Detected stale test data in ${env} environment, resetting to defaults.`);
             setTaxConfig(DEFAULT_TAX_CONFIG);
          } else if (!('mobile' in parsedConfig)) {
             // Handle legacy config format
             setTaxConfig(env === 'test' ? TEST_TAX_CONFIG : DEFAULT_TAX_CONFIG);
          } else {
             setTaxConfig({ ...DEFAULT_TAX_CONFIG, ...parsedConfig });
          }
        } catch (e) {
          console.error('Failed to parse saved tax config', e);
          setTaxConfig(env === 'test' ? TEST_TAX_CONFIG : DEFAULT_TAX_CONFIG);
        }
      } else {
        setTaxConfig(env === 'test' ? TEST_TAX_CONFIG : DEFAULT_TAX_CONFIG);
      }
      setIsConfigLoaded(true);
    }
  }, [env]);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (isConfigLoaded && typeof window !== 'undefined') {
      localStorage.setItem(`tax_config_${env}`, JSON.stringify(taxConfig));
    }
  }, [taxConfig, env, isConfigLoaded]);

  const handleTaxConfigChange = (field: keyof TaxConfig, value: string) => {
    setTaxConfig(prev => ({
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
      if (!taxConfig.clientId) missingFields.push('Client ID');
      if (!taxConfig.mobile) missingFields.push('Mobile Number');

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for Tax system: ${missingFields.join(', ')}`);
      }

      const payload = {
        system: 'tax',
        env,
        credentials: {
          clientId: taxConfig.clientId,
          mobile: taxConfig.mobile,
          mobileAreaCode: parseInt(taxConfig.mobileAreaCode || '86', 10),
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
        <CardTitle>Tax System</CardTitle>
        <CardDescription>
          Generate access tokens for Tax system.
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
            <Label htmlFor="clientId">Client ID</Label>
            <Input 
              id="clientId" 
              value={taxConfig.clientId} 
              onChange={(e) => handleTaxConfigChange('clientId', e.target.value)} 
              placeholder="Client ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input 
                id="mobile" 
                value={taxConfig.mobile} 
                onChange={(e) => handleTaxConfigChange('mobile', e.target.value)} 
                placeholder="13122220805"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileAreaCode">Area Code</Label>
              <Input 
                id="mobileAreaCode" 
                value={taxConfig.mobileAreaCode} 
                onChange={(e) => handleTaxConfigChange('mobileAreaCode', e.target.value)} 
                placeholder="86"
              />
            </div>
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
