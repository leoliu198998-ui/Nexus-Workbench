import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionType = 'publish' | 'release' | 'finish';

interface ActionConfirmationDialogProps {
  open: boolean;
  action: ActionType | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionConfirmationDialog({ 
  open, 
  action, 
  onConfirm, 
  onCancel 
}: ActionConfirmationDialogProps) {
  if (!action) return null;

  const isRelease = action === 'release';
  const isFinish = action === 'finish';

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isRelease ? (
              <>
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                确认开始停机发布？
              </>
            ) : (
              <>
                <div className="p-2 bg-green-100 rounded-full text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                确认完成发布？
              </>
            )}
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            {isRelease 
              ? '此操作将调用停机接口，系统将暂停对外服务。请确保相关人员已就位。'
              : '此操作将调用完成接口，解除系统停机状态，恢复对外服务。'
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button 
            variant={isRelease ? "destructive" : "default"}
            onClick={onConfirm}
            className={cn(
              "w-full sm:w-auto",
              isFinish && "bg-green-600 hover:bg-green-700"
            )}
          >
            确认{isRelease ? '停机' : '完成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
