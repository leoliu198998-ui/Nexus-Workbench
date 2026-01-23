'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CreateBatchForm } from './create-batch-form';

interface CreateBatchDialogProps {
  envId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (batch: { id: string; status: string; envId: string; batchName: string }) => void;
}

export function CreateBatchDialog({ envId, open, onClose, onSuccess }: CreateBatchDialogProps) {
  const handleSuccess = (batch: { id: string; status: string; envId: string; batchName: string }) => {
    onSuccess(batch);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建发布批次</DialogTitle>
          <DialogDescription>
            配置新发布的基本信息。创建后将自动通知目标环境。
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <CreateBatchForm envId={envId} onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
