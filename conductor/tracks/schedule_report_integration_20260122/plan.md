# 执行计划 - 日程安排报表真实数据集成

## 阶段 1：数据转换层实现 (TDD) [checkpoint: ebd7ae7]
- [x] Task: 定义数据类型与接口 03a3b72
    - [ ] 在 `frontend/src/lib/types/schedule.ts` 中定义 API 响应的 TypeScript 接口（嵌套结构）。
    - [ ] 定义展平后的导出数据接口。
- [x] Task: 实现数据转换逻辑 d323a37
    - [ ] 创建测试 `frontend/src/lib/schedule-transformer.test.ts`，使用 mock 数据验证 Python 脚本中的特殊逻辑（如 `PUBLIC_HOLIDAY_ERROR` 拼接、联系人合并）。
    - [ ] 实现 `frontend/src/lib/schedule-transformer.ts`，完成从 API 原始数据到 Excel 导出格式的转换。
    - [ ] 更新 `frontend/src/lib/excel-utils.ts` 以支持动态列定义（如果尚未支持）。
- [x] Task: Conductor - User Manual Verification '数据转换层实现 (TDD)' (Protocol in workflow.md)

## 阶段 2：后端 API 路由开发 [checkpoint: 9dc5f46]
- [x] Task: 配置环境变量 cac277f
    - [ ] 更新 `.env.example` 和 `.env`，添加 `SCHEDULE_REPORT_API_URL` 及其他必要的固定 Header 常量（虽然 URL 是固定的，但放入配置更佳）。
- [x] Task: 实现专用数据抓取 API e7ca196
    - [ ] 创建 `frontend/src/app/api/apps/schedule-report/fetch/route.ts`。
    - [ ] 实现 POST 处理逻辑：组装 Header（注入 `x-dk-token`），构造请求体（固定 year/size），处理外部响应。
    - [ ] 编写集成测试 `route.test.ts` 验证 Header 组装和错误处理。
- [x] Task: 实现专用下载 API 9051415
    - [ ] 创建 `frontend/src/app/api/apps/schedule-report/download/route.ts`。
    - [ ] 复用抓取逻辑获取数据。
    - [ ] 调用 `schedule-transformer` 进行数据处理。
    - [ ] 调用 `excel-utils` 生成 Excel 流并返回。
- [x] Task: Conductor - User Manual Verification '后端 API 路由开发' (Protocol in workflow.md)

## 阶段 3：前端 UI 适配 [checkpoint: 20e5c53]
- [x] Task: 更新 Excel 导出向导页面 1dcf893
    - [ ] 修改 `frontend/src/app/apps/excel-export/page.tsx`。
    - [ ] 将 API 请求路径更新为专用路由。
    - [ ] 更新 Token 输入的提示文案（如需要 x-dk-token）。
    - [ ] 移除“数据预览”步骤，实现从身份验证直接跳转到下载页面的逻辑。
- [x] Task: Conductor - User Manual Verification '前端 UI 适配' (Protocol in workflow.md)

## 阶段 4：清理与集成验证
- [x] Task: 清理模拟数据 996656b
    - [ ] 移除旧的、不再使用的模拟 API (`/api/mock/...`) 或旧的代理逻辑（如果完全不再需要）。
- [x] Task: 最终集成测试 fcb99eb
    - [ ] 运行完整构建 `pnpm build`。
    - [ ] 执行全套自动化测试。
- [ ] Task: Conductor - User Manual Verification '清理与集成验证' (Protocol in workflow.md)
