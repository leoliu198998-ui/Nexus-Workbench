'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Briefcase, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { initializeCreation, executePersonnelCreation } from './actions';

export function QuickCreateCard() {
  const [loading, setLoading] = useState(false);
  const [personnelType, setPersonnelType] = useState<'candidate' | 'contractor' | 'applicant'>('candidate');
  const [environment, setEnvironment] = useState<'test' | 'dev'>('test');
  const [formData, setFormData] = useState<{
    projectId: string;
    quantity: number | string;
  }>({
    projectId: '',
    quantity: 1,
  });

  // Dynamic content based on type
  const typeConfig = {
    candidate: {
      title: 'Create Candidate',
      description: 'Create a new candidate profile for potential hires.',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    contractor: {
      title: 'Create Contractor',
      description: 'Register a new external contractor or freelancer.',
      icon: <Briefcase className="w-5 h-5" />,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800'
    },
    applicant: {
      title: 'Create Applicant',
      description: 'Add a new job applicant to the tracking system.',
      icon: <FileText className="w-5 h-5" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  };

  const { title, description, icon, color, bgColor, borderColor } = typeConfig[personnelType];

  const [apiResult, setApiResult] = useState<{
    applicableServiceVersion: string[];
    serviceType: string[] | { name: string; id?: string }[];
    locationId?: string;
    creationFields?: any;
    createResults?: Array<{ id: string; name: string; email: string }>;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiResult(null);

    if (!formData.projectId.trim()) {
      toast.error('Please enter a Project ID');
      return;
    }

    if (!formData.quantity || Number(formData.quantity) < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setLoading(true);

    try {
      console.log(`Starting creation process for ${personnelType} with Project ID: ${formData.projectId}, Quantity: ${formData.quantity}, Env: ${environment}`);
      
      // 调用 Server Action 执行 Step 1-4
      const result = await executePersonnelCreation(personnelType, formData.projectId, Number(formData.quantity), environment);

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('Creation Completed Successfully:', result.data);
      
      if (result.data?.projectInfo) {
        setApiResult({
          applicableServiceVersion: result.data.projectInfo.applicableServiceVersion,
          serviceType: result.data.projectInfo.serviceType as any,
          locationId: result.data.projectInfo.locationId,
          creationFields: result.data.creationFields,
          createResults: result.data.createResults,
        });
      }

      toast.success(result.message || `Successfully created ${personnelType}!`);
      
    } catch (error) {
      console.error('Creation failed:', error);
      toast.error(error instanceof Error ? error.message : `Failed to process ${personnelType}`);
    } finally {
      setLoading(false);
    }
  };


  const renderServiceType = (types: any[]) => {
    if (!types || !Array.isArray(types)) return '';
    return types.map((type, index) => {
      if (typeof type === 'string') return type;
      return type.name || type.id || JSON.stringify(type);
    }).join(', ');
  };

  const renderVersion = (versions: any) => {
    if (!versions) return '';
    if (Array.isArray(versions)) return versions.join(', ');
    return String(versions);
  };

  return (
    <Card className="h-full border-0 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className={cn("h-2 w-full", bgColor.replace('/30', ''))} />
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-xl transition-all duration-300", bgColor, color)}>
            {icon}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <CardContent className="space-y-6 pt-6 flex-1">
          {/* Configuration Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personnel Type Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personnel Type</Label>
              <div className="grid grid-cols-1 gap-2">
                {(['candidate', 'contractor', 'applicant'] as const).map((t) => (
                  <div 
                    key={t}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all duration-200 hover:bg-muted/50",
                      personnelType === t 
                        ? cn("border-primary/50 bg-primary/5 shadow-sm", typeConfig[t].borderColor) 
                        : "border-transparent bg-muted/30"
                    )}
                    onClick={() => setPersonnelType(t)}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full border transition-all",
                      personnelType === t ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}>
                      {personnelType === t && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <Label className="cursor-pointer font-medium capitalize flex-1">{t}</Label>
                    {personnelType === t && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Environment Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Environment</Label>
              <div className="grid grid-cols-1 gap-2">
                {(['test', 'dev'] as const).map((env) => (
                  <div 
                    key={env}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all duration-200 hover:bg-muted/50",
                      environment === env 
                        ? "border-primary/50 bg-primary/5 shadow-sm" 
                        : "border-transparent bg-muted/30"
                    )}
                    onClick={() => setEnvironment(env)}
                  >
                     <div className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full border transition-all",
                      environment === env ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}>
                      {environment === env && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <Label className="cursor-pointer font-medium flex-1">{env === 'test' ? 'Test Environment' : 'Dev Environment'}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-border/50 my-2" />

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="projectId" className="text-sm font-medium">
                Project ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectId"
                placeholder="e.g. PROJ-123"
                value={formData.projectId}
                onChange={(e) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
                disabled={loading}
                className="bg-background/50 h-10"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity (0-20)
              </Label>
              <Input
                id="quantity"
                type="text"
                value={formData.quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setFormData((prev) => ({ ...prev, quantity: '' }));
                    return;
                  }
                  if (!/^\d+$/.test(val)) return;
                  const num = parseInt(val, 10);
                  if (num >= 0 && num <= 20) {
                    setFormData((prev) => ({ ...prev, quantity: num }));
                  }
                }}
                disabled={loading}
                className="bg-background/50 h-10"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-6 px-6 flex-col gap-6">
          <Button type="submit" disabled={loading} size="lg" className="w-full shadow-lg shadow-primary/20">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Create Personnel'
            )}
          </Button>

          {apiResult && (
            <div className="w-full rounded-lg border bg-muted/30 p-4 text-sm space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="font-semibold text-foreground">Creation Results</span>
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                  {apiResult.createResults?.length || 0} created
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Version</span>
                  <span className="font-mono font-medium">{renderVersion(apiResult.applicableServiceVersion)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Location ID</span>
                  <span className="font-mono font-medium">{apiResult.locationId || 'N/A'}</span>
                </div>
              </div>
              
              {apiResult.createResults && apiResult.createResults.length > 0 && (
                <div className="mt-2 pt-2">
                   <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                     {apiResult.createResults.map((res, index) => (
                       <div key={index} className="flex flex-col p-2.5 rounded-md bg-background border shadow-sm">
                         <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-primary">{res.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{res.id}</span>
                         </div>
                         <div className="text-muted-foreground text-xs truncate flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                           {res.email}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
