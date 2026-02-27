'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Assuming shadcn select exists
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Environment {
  id: string;
  name: string;
  baseUrl: string;
}

interface EnvironmentSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function EnvironmentSelector({ value, onChange }: EnvironmentSelectorProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnvironments() {
      try {
        const res = await fetch('/api/apps/outage-manager/environments');
        if (!res.ok) throw new Error('Failed to fetch environments');
        const data = await res.json();
        setEnvironments(data);
      } catch (error) {
        console.error(error);
        toast.error('无法加载环境列表');
      } finally {
        setLoading(false);
      }
    }

    fetchEnvironments();
  }, []);

  return (
    <div className="space-y-2">
      <Label>目标环境</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? '加载中...' : '选择环境'} />
        </SelectTrigger>
        <SelectContent>
          {environments.map((env) => (
            <SelectItem key={env.id} value={env.id}>
              {env.name} ({env.baseUrl})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
