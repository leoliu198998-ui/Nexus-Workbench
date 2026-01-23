import { ToolCard } from '@/components/dashboard/tool-card';
import { FileSpreadsheet, Sparkles, Terminal, Database, Clock } from 'lucide-react';

const tools = [
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
    status: 'coming_soon' as const,
  },
  {
    title: 'Schema Registry',
    description: 'Centralized repository for viewing and managing data schemas across the Nexus ecosystem.',
    icon: Database,
    href: '/apps/schema',
    status: 'coming_soon' as const,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background bg-dot-pattern">
      <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-10">
        
        {/* Hero Section */}
        <header className="relative py-8 md:py-12 space-y-4">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-xl">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span>Nexus Workbench v1.0</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Developer Efficiency <span className="text-primary">Unlocked</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
            A unified suite of tools designed to accelerate your R&D workflow. 
            Access data utilities, API helpers, and automation wizards in one workspace.
          </p>
        </header>

        {/* Tools Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h2 className="text-xl font-semibold tracking-tight">Available Tools</h2>
            <span className="text-sm text-muted-foreground">{tools.length} modules loaded</span>
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
