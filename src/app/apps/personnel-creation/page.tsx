import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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

        {/* Create Card */}
        <div className="max-w-3xl mx-auto">
          <QuickCreateCard />
        </div>
      </div>
    </main>
  );
}
