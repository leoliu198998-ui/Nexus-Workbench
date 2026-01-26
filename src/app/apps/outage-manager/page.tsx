'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';



import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { BatchList } from '@/components/outage-manager/batch-list';

import { CreateBatchDialog } from '@/components/outage-manager/create-batch-dialog';

import { Plus } from 'lucide-react';
import type { OutageBatch } from '@/types/outage';

export default function OutageManagerPage() {

  const router = useRouter();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);



  const handleCreateSuccess = () => {

    setRefreshKey((prev) => prev + 1);

  };



  const handleBatchClick = (batch: OutageBatch) => {

    router.push(`/apps/outage-manager/wizard/${batch.id}`);

  };



  return (

    <div className="container mx-auto py-6 space-y-6">

      <div className="flex justify-between items-center">

        <h1 className="text-3xl font-bold">系统停机发布管理</h1>

      </div>



      <Card>

        <CardHeader>

          <div className="flex items-center justify-between">

            <div>

              <CardTitle>发布批次管理</CardTitle>

              <CardDescription>创建和管理系统发布批次，跟踪发布流程</CardDescription>

            </div>

            <Button 

              onClick={() => setCreateDialogOpen(true)}

              className="gap-2"

            >

              <Plus className="h-4 w-4" />

              创建新批次

            </Button>

          </div>

        </CardHeader>

        <CardContent>

          <BatchList 

            key={refreshKey}

            onBatchClick={handleBatchClick}

          />

        </CardContent>

      </Card>



      <CreateBatchDialog

        open={createDialogOpen}

        onClose={() => setCreateDialogOpen(false)}

        onSuccess={handleCreateSuccess}

      />

    </div>

  );

}
