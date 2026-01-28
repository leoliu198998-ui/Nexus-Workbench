import Link from 'next/link';
import { UserPlus, Briefcase, FileText, ArrowLeft } from 'lucide-react';
import { QuickCreateCard } from './quick-create-card';

/**
 * 人员创建模块主页面
 * 提供 Candidate, Contractor, Applicant 的快速创建功能
 * 所有操作在当前页面直接完成，无需跳转
 */
export default function PersonnelCreationPage() {
  return (
    <main className="min-h-screen bg-background bg-dot-pattern">
      <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-1"
          >
            <div className="mr-2 p-1 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Personnel Creation</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Quickly create personnel records directly from this dashboard.
            </p>
          </div>
        </header>

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
    </main>
  );
}
