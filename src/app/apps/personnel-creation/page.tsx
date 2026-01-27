import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import Link from 'next/link';
import { UserPlus, Briefcase, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 人员创建模块主页面
 * 提供三种创建类型的入口：Candidate, Contractor, Applicant
 */
export default function PersonnelCreationPage() {
  const creationOptions = [
    {
      title: 'Create Candidate',
      description: 'Create a new candidate profile for potential hires.',
      icon: UserPlus,
      href: '/apps/personnel-creation/candidate',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Create Contractor',
      description: 'Register a new external contractor or freelancer.',
      icon: Briefcase,
      href: '/apps/personnel-creation/contractor',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Create Applicant',
      description: 'Add a new job applicant to the tracking system.',
      icon: FileText,
      href: '/apps/personnel-creation/applicant',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="container max-w-5xl py-10 space-y-8">
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
            Select the type of personnel you want to create in the system.
          </p>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creationOptions.map((option) => (
          <Link key={option.title} href={option.href} className="group block h-full">
            <Card className="h-full border-border/60 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${option.bgColor} ${option.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {option.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {option.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
