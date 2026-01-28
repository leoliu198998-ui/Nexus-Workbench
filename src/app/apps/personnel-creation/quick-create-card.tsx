'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import { initializeCreation } from './actions';

interface QuickCreateCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'candidate' | 'contractor' | 'applicant';
  color: string;
  bgColor: string;
}

export function QuickCreateCard({
  title,
  description,
  icon,
  type,
  color,
  bgColor,
}: QuickCreateCardProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    quantity: 1,
  });
  const [apiResult, setApiResult] = useState<{
    applicableServiceVersion: string[];
    serviceType: string[] | { name: string; id?: string }[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiResult(null);

    if (!formData.projectId.trim()) {
      toast.error('Please enter a Project ID');
      return;
    }

    if (formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setLoading(true);

    try {
      console.log(`Starting creation process for ${type} with Project ID: ${formData.projectId}`);
      
      // 调用 Server Action 执行 Step 1 & 2
      const result = await initializeCreation(formData.projectId);

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('Step 1 & 2 Completed Successfully:', result.data);
      
      if (result.data?.projectInfo) {
        setApiResult({
          applicableServiceVersion: result.data.projectInfo.applicableServiceVersion,
          serviceType: result.data.projectInfo.serviceType as any, // 临时使用 any 以兼容复杂对象
        });
      }

      toast.success('Successfully authenticated and fetched project info!');
      
      // TODO: 接下来的步骤 (Step 3 & 4) 将在这里继续
      
    } catch (error) {
      console.error('Creation failed:', error);
      toast.error(error instanceof Error ? error.message : `Failed to process ${type}`);
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
          <div className="space-y-2">
            <Label htmlFor={`${type}-projectId`}>Project ID <span className="text-red-500">*</span></Label>
            <Input
              id={`${type}-projectId`}
              placeholder="e.g. PROJ-123"
              value={formData.projectId}
              onChange={(e) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
              disabled={loading}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${type}-quantity`}>Quantity</Label>
            <Input
              id={`${type}-quantity`}
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
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
                <span className="text-muted-foreground">Service Type:</span>{' '}
                <span className="font-mono break-all">
                  {renderServiceType(apiResult.serviceType as any[])}
                </span>
              </div>
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
