'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ApiPlaygroundPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Playground</h1>
        <p className="text-muted-foreground mt-2">
          Interactive environment to test and debug internal APIs with real-time response visualization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/apps/api-playground/token-manager">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Token Manager
              </CardTitle>
              <CardDescription>
                Generate and manage access tokens for Butter and Tax systems.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary font-medium">
                Open Manager <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
