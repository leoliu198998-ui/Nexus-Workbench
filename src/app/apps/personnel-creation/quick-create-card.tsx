'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, LucideIcon, UserPlus, Briefcase, FileText } from 'lucide-react';
import { toast } from 'sonner';

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
      icon: <UserPlus className="w-6 h-6" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    contractor: {
      title: 'Create Contractor',
      description: 'Register a new external contractor or freelancer.',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    applicant: {
      title: 'Create Applicant',
      description: 'Add a new job applicant to the tracking system.',
      icon: <FileText className="w-6 h-6" />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  };

  const { title, description, icon, color, bgColor } = typeConfig[personnelType];

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
    <Card className="h-full border-border/60 transition-all duration-300 hover:border-primary/20 hover:shadow-lg flex flex-col">
      <CardHeader>
        <div className={`w-12 h-12 rounded-lg ${bgColor} ${color} flex items-center justify-center mb-4 transition-transform duration-300`}>
          {icon}
        </div>
        <CardTitle className="text-xl transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-base min-h-[50px]">
          {description}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <CardContent className="space-y-4 flex-1">
          {/* Personnel Type Selection */}
          <div className="space-y-2">
            <Label>Personnel Type</Label>
            <div className="grid grid-cols-3 gap-3">
              <div 
                className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-all ${personnelType === 'candidate' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => setPersonnelType('candidate')}
              >
                <input
                  type="radio"
                  id="type-candidate"
                  name="personnel-type"
                  value="candidate"
                  checked={personnelType === 'candidate'}
                  onChange={() => setPersonnelType('candidate')}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <Label htmlFor="type-candidate" className="cursor-pointer font-normal">Candidate</Label>
              </div>
              <div 
                className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-all ${personnelType === 'contractor' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => setPersonnelType('contractor')}
              >
                <input
                  type="radio"
                  id="type-contractor"
                  name="personnel-type"
                  value="contractor"
                  checked={personnelType === 'contractor'}
                  onChange={() => setPersonnelType('contractor')}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <Label htmlFor="type-contractor" className="cursor-pointer font-normal">Contractor</Label>
              </div>
              <div 
                className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-all ${personnelType === 'applicant' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => setPersonnelType('applicant')}
              >
                <input
                  type="radio"
                  id="type-applicant"
                  name="personnel-type"
                  value="applicant"
                  checked={personnelType === 'applicant'}
                  onChange={() => setPersonnelType('applicant')}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <Label htmlFor="type-applicant" className="cursor-pointer font-normal">Applicant</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Environment</Label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-all ${environment === 'test' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => setEnvironment('test')}
              >
                <input
                  type="radio"
                  id="env-test"
                  name="environment"
                  value="test"
                  checked={environment === 'test'}
                  onChange={() => setEnvironment('test')}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <Label htmlFor="env-test" className="cursor-pointer font-normal">Test Env</Label>
              </div>
              <div 
                className={`flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-all ${environment === 'dev' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => setEnvironment('dev')}
              >
                <input
                  type="radio"
                  id="env-dev"
                  name="environment"
                  value="dev"
                  checked={environment === 'dev'}
                  onChange={() => setEnvironment('dev')}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <Label htmlFor="env-dev" className="cursor-pointer font-normal">Dev Env</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID <span className="text-red-500">*</span></Label>
            <Input
              id="projectId"
              placeholder="e.g. PROJ-123"
              value={formData.projectId}
              onChange={(e) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
              disabled={loading}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
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
                // Allow only non-negative integers
                if (!/^\d+$/.test(val)) return;

                const num = parseInt(val, 10);
                // Limit to 0-20
                if (num >= 0 && num <= 20) {
                  setFormData((prev) => ({ ...prev, quantity: num }));
                }
              }}
              disabled={loading}
              className="bg-background/50"
            />
          </div>

          {apiResult && (
            <div className="rounded-md bg-muted p-3 text-xs space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="font-semibold text-foreground">Project Info:</div>
              <div>
                <span className="text-muted-foreground">Version:</span>{' '}
                <span className="font-mono break-all">{renderVersion(apiResult.applicableServiceVersion)}</span>
              </div>
              
              <div>
                <span className="text-muted-foreground">Location ID:</span>{' '}
                <span className="font-mono break-all">{apiResult.locationId || 'N/A'}</span>
              </div>
              
              {apiResult.createResults && apiResult.createResults.length > 0 && (
                <div className="mt-4">
                   <h4 className="font-semibold mb-2">Create Result ({apiResult.createResults.length})</h4>
                   <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded p-2 bg-slate-50 dark:bg-slate-900">
                     {apiResult.createResults.map((res, index) => (
                       <div key={index} className="flex flex-col text-sm border-b last:border-0 pb-2 mb-2 last:mb-0 last:pb-0">
                         <div className="flex justify-between">
                            <span className="font-medium">Name: {res.name}</span>
                            <span className="text-muted-foreground">ID: {res.id}</span>
                         </div>
                         <div className="text-muted-foreground text-xs truncate">Email: {res.email}</div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2 pb-6">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Create'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
