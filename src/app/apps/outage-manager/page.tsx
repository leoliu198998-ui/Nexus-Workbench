'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BatchList } from '@/components/outage-manager/batch-list';
import { CreateBatchDialog } from '@/components/outage-manager/create-batch-dialog';
import { Plus, ArrowLeft, Clock } from 'lucide-react';
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
    <main className="min-h-screen bg-background bg-dot-pattern">
      <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-1"
          >
            <div className="mr-2 p-1 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Dashboard
          </Link>
        </div>

        {/* Hero Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Outage Manager</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Coordinate and execute system release outages with a standardized 4-step workflow.
            </p>
          </div>
          
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            size="lg"
            className="shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Batch
          </Button>
        </header>

        {/* Content Area */}
        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Release Batches</CardTitle>
                <CardDescription className="mt-1.5">View and manage all active and historical release batches.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <BatchList 
                key={refreshKey}
                onBatchClick={handleBatchClick}
              />
            </div>
          </CardContent>
        </Card>

        <CreateBatchDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </main>
  );
}
