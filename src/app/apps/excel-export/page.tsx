'use client';

import { useState } from 'react';
import { Wizard, WizardStep } from '@/components/wizard/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, KeyRound, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function Home() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-background bg-dot-pattern">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link 
          href="/" 
          className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-1"
        >
          <div className="mr-2 p-1 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Dashboard
        </Link>
        
        <Wizard>
          <WizardStep 
            title="Authentication" 
            description="Enter your x-dk-token to access the schedule data source."
          >
            {(next) => (
              <div className="space-y-6 max-w-md">
                <div className="space-y-4">
                   <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-start gap-3">
                     <KeyRound className="w-5 h-5 text-primary mt-0.5" />
                     <div className="text-sm">
                       <p className="font-medium text-foreground">X-DK-Token Required</p>
                       <p className="text-muted-foreground mt-1">Please enter your valid Dukang token. This token will be used to securely fetch the latest schedule information.</p>
                     </div>
                   </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">Access Token (x-dk-token)</Label>
                    <Input
                      id="token"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button disabled={!token} onClick={next} className="w-full sm:w-auto">
                    Continue to Export
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </div>
            )}
          </WizardStep>

          <WizardStep title="Export Schedule Report" description="Generate and download your Schedule Report as Excel file.">
            {(next, prev) => (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center ring-8 ring-emerald-500/5 mb-2">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
                </div>
                
                <div className="max-w-md space-y-2">
                  <h3 className="text-xl font-semibold">Ready to Export Schedule Report</h3>
                  <p className="text-muted-foreground">
                    We will fetch schedule report data (up to 1500 records for the year 2026) from the API and apply the standard transformation rules. The file will be generated in .xlsx format.
                  </p>
                </div>

                <div className="flex gap-4 mt-8 w-full max-w-xs">
                  <Button variant="outline" onClick={prev} disabled={isLoading} className="flex-1">
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const response = await fetch(
                          '/api/apps/schedule-report/download',
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ token }),
                          }
                        );

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.error || 'Download failed');
                        }

                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `schedules_2026_${new Date().toISOString().split('T')[0]}.xlsx`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        toast.success('Download started');
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Error during download');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Schedule Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </WizardStep>
        </Wizard>
      </div>
    </main>
  );
}
