import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OutageManagerPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">系统停机发布管理</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>环境选择</CardTitle>
          <CardDescription>请选择本次发布的目标环境</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">环境选择器即将推出...</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近发布批次</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">批次列表即将推出...</p>
        </CardContent>
      </Card>
    </div>
  );
}
