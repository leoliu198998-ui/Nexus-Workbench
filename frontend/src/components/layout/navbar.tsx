'use client';

import Link from 'next/link';
import { Box, ChevronRight, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeMap: Record<string, string> = {
  'apps': '工具',
  'excel-export': 'Excel 导出向导',
};

export function Navbar() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-primary p-1.5 rounded-lg">
              <Box className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">Nexus Workbench</span>
          </Link>

          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">
                    <LayoutDashboard className="w-4 h-4 mr-1 inline-block" />
                    仪表盘
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              
              {pathSegments.map((segment, index) => {
                const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                const label = routeMap[segment] || segment;

                return (
                  <React.Fragment key={href}>
                    <BreadcrumbSeparator>
                      <ChevronRight className="w-4 h-4" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>{label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-4">
          {pathname !== '/' && (
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              返回仪表盘
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

import React from 'react';
