import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { QuickCreateCard } from './quick-create-card';

/**
 * 人员创建模块主页面
 * 提供 Candidate, Contractor, Applicant 的快速创建功能
 * 所有操作在当前页面直接完成，无需跳转
 */
export default function PersonnelCreationPage() {
  return (
    <main className="min-h-screen bg-background bg-dot-pattern">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <div className="mr-2 p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-inset ring-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Personnel Creation</h1>
            </div>
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
