'use client';

import { useState } from 'react';
import { Wizard, WizardStep } from '@/components/wizard/wizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Home() {
  const [token, setToken] = useState('');
  const [data, setData] = useState<any[]>([]);

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
              <p>我们将使用 Token 获取并处理数据。</p>
              <div className="flex justify-between">
                <Button variant="outline" onClick={prev}>
                  上一步
                </Button>
                <Button onClick={next}>
                  获取数据
                </Button>
              </div>
            </div>
          )}
        </WizardStep>

        <WizardStep title="下载 Excel">
          {(next, prev) => (
            <div className="space-y-4 py-4 text-center">
              <p>一切就绪，您可以下载生成的 Excel 文件了。</p>
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prev}>
                  上一步
                </Button>
                <Button onClick={() => alert('下载功能待实现')}>下载 Excel</Button>
              </div>
            </div>
          )}
        </WizardStep>
      </Wizard>
    </main>
  );
}
