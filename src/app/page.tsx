import { ToolCard } from '@/components/dashboard/tool-card';
import { FileSpreadsheet, Sparkles, Terminal, Database, Clock, Users } from 'lucide-react';

const tools = [
  {
    title: 'Personnel Creator',
    description: 'Create and manage personnel records including Candidates, Contractors, and Applicants.',
    icon: Users,
    href: '/apps/personnel-creation',
    status: 'active' as const,
  },
  {
    title: 'Outage Release Manager',
    description: '4-step standardized workflow for managing system outages during releases across different environments.',
    icon: Clock,
    href: '/apps/outage-manager',
    status: 'active' as const,
  },
  {
    title: 'Schedule Report Exporter',
    description: 'Export schedule report data from the API and transform it into Excel format. Features token-based authentication and data transformation.',
    icon: FileSpreadsheet,
    href: '/apps/excel-export',
    status: 'active' as const,
  },
  {
    title: 'API Playground',
    description: 'Interactive environment to test and debug internal APIs with real-time response visualization.',
    icon: Terminal,
    href: '/apps/api-playground',
    status: 'active' as const,
  },
  {
    title: 'Schema Registry',
    description: 'Centralized repository for viewing and managing data schemas across the Nexus ecosystem.',
    icon: Database,
    href: '/apps/schema',
    status: 'coming_soon' as const,
  },
  {
    title: 'Jenkins Toolkit',
    description: 'Monitor builds, check tags, and view job details directly from your workbench.',
    icon: Terminal,
    href: '/apps/jenkins',
    status: 'active' as const,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background bg-dot-pattern">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-12">

        {/* Hero Section */}
        <header className="relative py-10 md:py-16 space-y-6">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Nexus Workbench v1.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Developer Efficiency<br />
            <span className="text-primary">Unlocked</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            A unified suite of tools designed to accelerate your R&D workflow.
            Access data utilities, API helpers, and automation wizards in one workspace.
          </p>
        </header>

        {/* Tools Grid */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <h2 className="text-2xl font-semibold tracking-tight">Available Tools</h2>
            <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{tools.length} modules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
