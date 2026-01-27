'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId.trim()) {
      toast.error('Please enter a Project ID');
      return;
    }

    if (formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setLoading(true);

    // 模拟 API 调用
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log(`Creating ${type}:`, formData);
      toast.success(`Successfully created ${formData.quantity} ${type}(s) for project ${formData.projectId}`);
      // 可选：创建成功后重置表单
      // setFormData({ projectId: '', quantity: 1 });
    } catch (error) {
      toast.error(`Failed to create ${type}`);
    } finally {
      setLoading(false);
    }
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
        </CardContent>

        <CardFooter className="pt-2 pb-6">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
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
