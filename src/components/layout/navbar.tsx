'use client';

import React from 'react';
import Link from 'next/link';
import { Box, ChevronRight, LayoutDashboard, Search, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

const routeMap: Record<string, string> = {
  'apps': 'Tools',
  'excel-export': 'Schedule Report Exporter',
  'outage-manager': 'Outage Manager',
  'wizard': 'Release Wizard',
};

// Simple UUID regex check
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function Navbar() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-primary/5 border border-primary/10 p-1 rounded-md group-hover:bg-primary/10 transition-colors">
              <Box className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
              Nexus<span className="text-muted-foreground font-normal ml-1">Workbench</span>
            </span>
          </Link>

          <div className="hidden md:block h-5 w-px bg-border/60" />

          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link 
                    href="/" 
                    className="flex items-center gap-1.5 hover:text-primary transition-colors text-muted-foreground/70"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              
              {pathSegments.map((segment, index) => {
                // Hide breadcrumbs for wizard pages as they have their own internal navigation
                if (pathname.includes('/wizard/')) return null;

                const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                
                // Handle label display
                let label = routeMap[segment] || segment;
                if (isUUID(segment)) {
                   label = `ID: ${segment.slice(0, 8)}...`;
                }

                return (
                  <React.Fragment key={href}>
                    <BreadcrumbSeparator>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="font-medium text-foreground">
                          {label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href} className="hover:text-primary transition-colors text-muted-foreground/70">
                            {label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden sm:block w-64">
             <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-muted-foreground">
               <Search className="h-4 w-4" />
             </div>
             <input 
               type="text" 
               placeholder="Search tools..." 
               className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/70"
             />
             <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
               <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                 <span className="text-xs">⌘</span>K
               </kbd>
             </div>
          </div>

          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            L
          </div>
        </div>
      </div>
    </nav>
  );
}