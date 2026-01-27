import Link from 'next/link';
import { UserPlus, Briefcase, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickCreateCard } from './quick-create-card';

/**
 * 人员创建模块主页面
 * 提供 Candidate, Contractor, Applicant 的快速创建功能
 * 所有操作在当前页面直接完成，无需跳转
 */
export default function PersonnelCreationPage() {
  return (
    <div className="container max-w-6xl py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Personnel Creation</h1>
          <p className="text-muted-foreground text-lg">
            Quickly create personnel records directly from this dashboard.
          </p>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickCreateCard
          title="Create Candidate"
          description="Create a new candidate profile for potential hires."
          icon={<UserPlus className="w-6 h-6" />}
          type="candidate"
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        
        <QuickCreateCard
          title="Create Contractor"
          description="Register a new external contractor or freelancer."
          icon={<Briefcase className="w-6 h-6" />}
          type="contractor"
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />

        <QuickCreateCard
          title="Create Applicant"
          description="Add a new job applicant to the tracking system."
          icon={<FileText className="w-6 h-6" />}
          type="applicant"
          color="text-purple-500"
          bgColor="bg-purple-500/10"
        />
      </div>
    </div>
  );
}
