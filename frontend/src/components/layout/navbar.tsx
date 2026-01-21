import Link from 'next/link';
import { LayoutDashboard, Box } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-primary p-1.5 rounded-lg">
            <Box className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">Nexus Workbench</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            仪表盘
          </Link>
        </div>
      </div>
    </nav>
  );
}
