'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvironmentSelector } from '@/components/outage-manager/environment-selector';
import { BatchList } from '@/components/outage-manager/batch-list';

export default function OutageManagerPage() {
  const [selectedEnv, setSelectedEnv] = useState<string>('');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">系统停机发布管理</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>环境选择</CardTitle>
          <CardDescription>请选择本次发布的目标环境</CardDescription>
        </CardHeader>
        <CardContent>
          <EnvironmentSelector value={selectedEnv} onChange={setSelectedEnv} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近发布批次</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchList envId={selectedEnv} />
        </CardContent>
      </Card>
    </div>
  );
}
