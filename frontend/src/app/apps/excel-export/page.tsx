'use client';

import { useState } from 'react';
import { Wizard, WizardStep } from '@/components/wizard/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowLeft, KeyRound, Search, Download, FileSpreadsheet, RefreshCcw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Home() {
  const [token, setToken] = useState('');
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Note: This URL points to localhost:4000. Ensure the backend proxy is running.
      const response = await fetch('http://localhost:4000/proxy/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(Array.isArray(result) ? result : [result]);
      toast.success('Data retrieved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    }
    finally {
      setIsLoading(false);
    }
  };

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
        <WizardStep title="Authentication" description="Verify your identity to access the data source.">
          {(next) => (
            <div className="space-y-6 max-w-md">
              <div className="space-y-4">
                 <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-start gap-3">
                   <KeyRound className="w-5 h-5 text-primary mt-0.5" />
                   <div className="text-sm">
                     <p className="font-medium text-foreground">Secure Token Required</p>
                     <p className="text-muted-foreground mt-1">Please enter your valid access token. This ensures you have the necessary permissions to export this dataset.</p>
                   </div>
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Access Token</Label>
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
                  Continue
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          )}
        </WizardStep>

        <WizardStep title="Data Preview" description="Review the fetched data before exporting.">
          {(next, prev) => (
            <div className="space-y-6">
              {data.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Ready to Fetch</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-1 mb-6">
                    Click the button below to retrieve the data associated with your token.
                  </p>
                  <Button onClick={fetchData} size="lg">
                    Fetch Data
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground animate-pulse">Retrieving data from secure endpoint...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium">{data.length} records found</span>
                    </div>
                    <Button onClick={fetchData} variant="outline" size="sm" className="h-8">
                      <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-20">ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 5).map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs">{item.id}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {data.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-2 bg-muted/20 rounded border border-dashed">
                      Showing preview of first 5 records only. Full dataset will be exported.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-border/40">
                <Button variant="ghost" onClick={prev}>
                  Back
                </Button>
                <Button disabled={data.length === 0 || isLoading} onClick={next}>
                  Confirm & Continue
                </Button>
              </div>
            </div>
          )}
        </WizardStep>

        <WizardStep title="Export" description="Generate and download your Excel report.">
          {(next, prev) => (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center ring-8 ring-emerald-500/5 mb-2">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
              </div>
              
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-semibold">Ready to Export</h3>
                <p className="text-muted-foreground">
                  Your data has been processed and is ready for download. The file will be generated in .xlsx format.
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
                        'http://localhost:4000/proxy/download',
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
                        throw new Error(errorData.message || 'Download failed');
                      }

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `export_${new Date().toISOString().split('T')[0]}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast.success('Download started');
                    } catch {
                      toast.error('Error during download');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
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