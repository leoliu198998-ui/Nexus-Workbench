import { ToolCard } from '@/components/dashboard/tool-card';
import { FileSpreadsheet } from 'lucide-react';

const tools = [
  {
    title: 'Excel 导出向导',
    description: '通过分步向导，输入身份令牌并调用接口，将返回的 JSON 数据转换为 Excel 文件。',
    icon: FileSpreadsheet,
    href: '/apps/excel-export',
    status: 'active' as const,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">仪表盘</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">欢迎使用 Nexus Workbench，请选择您需要的工具。</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tools.map((tool) => (
            <ToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>
    </main>
  );
}