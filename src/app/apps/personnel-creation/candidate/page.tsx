import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

/**
 * 创建 Candidate 页面
 * 目前为占位页面，等待具体接口接入
 */
export default function CreateCandidatePage() {
  return (
    <div className="container max-w-4xl py-10 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/apps/personnel-creation">
          <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Selection
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Candidate</h1>
            <p className="text-muted-foreground">
              Fill in the details to create a new candidate profile.
            </p>
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Form</CardTitle>
          <CardDescription>
            Form interface will be implemented here once the API specification is provided.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center border-t border-dashed m-6 bg-muted/30 rounded-lg">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">Form Placeholder</p>
            <p className="text-sm">Waiting for API integration details...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
