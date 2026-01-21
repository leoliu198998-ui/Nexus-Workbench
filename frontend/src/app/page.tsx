'use client';

import { useState } from 'react';
import { Wizard, WizardStep } from '@/components/wizard/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [token, setToken] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/proxy/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('获取数据失败');
      }

      const result = await response.json();
      setData(Array.isArray(result) ? result : [result]);
      toast.success('数据获取成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <Wizard>
        <WizardStep title="身份验证">
          {(next) => (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="token">身份令牌 (Token)</Label>
                <Input
                  id="token"
                  placeholder="请输入您的 Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  请输入有效的令牌以继续数据处理。
                </p>
              </div>
              <div className="flex justify-end">
                <Button disabled={!token} onClick={next}>
                  下一步
                </Button>
              </div>
            </div>
          )}
        </WizardStep>

        <WizardStep title="数据处理与预览">
          {(next, prev) => (
            <div className="space-y-4 py-4">
              {data.length === 0 && !isLoading ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-gray-500">尚未获取数据，点击下方按钮开始。</p>
                  <Button onClick={fetchData}>获取数据</Button>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p>正在从后端获取并处理数据...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-md max-h-64 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead>姓名</TableHead>
                          <TableHead>邮箱</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 5).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm text-gray-500 italic text-right">
                    仅显示前 5 条预览数据（总计 {data.length} 条）
                  </p>
                  <div className="flex justify-center pt-4">
                    <Button onClick={fetchData} variant="outline" size="sm">
                      重新获取
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prev}>
                  上一步
                </Button>
                <Button disabled={data.length === 0 || isLoading} onClick={next}>
                  确认并继续
                </Button>
              </div>
            </div>
          )}
        </WizardStep>

        <WizardStep title="下载 Excel">
          {(next, prev) => (
            <div className="space-y-4 py-4 text-center">
              <p>数据处理完成。您可以下载生成的 Excel 文件了。</p>
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prev} disabled={isLoading}>
                  上一步
                </Button>
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch(
                        'http://localhost:4000/proxy/download',
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ token }),
                        }
                      );

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || '下载失败');
                      }

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'data.xlsx';
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast.success('下载开始');
                    } catch (error) {
                      toast.error('下载过程中发生错误');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      正在准备...
                    </>
                  ) : (
                    '下载 Excel'
                  )}
                </Button>
              </div>
            </div>
          )}
        </WizardStep>
      </Wizard>
    </main>
  );
}

