# 执行计划 - 后端迁移至 Next.js API

## 阶段 1：环境与数据库设置 [checkpoint: 2fcc710]
- [x] Task: 安装依赖 c8bc8fd
    - [ ] 在 `frontend` 目录安装 `prisma` 作为开发依赖。
    - [ ] 安装 `@prisma/client` 和 `exceljs` 到 `frontend` 项目中。
    - [ ] 在 `frontend` 中初始化 Prisma（如果尚未存在）。
- [x] Task: 迁移 Prisma 配置 2e2119c
    - [ ] 将 `backend/prisma/schema.prisma` 移动到 `frontend/prisma/schema.prisma`。
    - [ ] 更新 `schema.prisma` 的 generator 配置以适配 Next.js。
    - [ ] 生成 Prisma Client (`npx prisma generate`)。
- [x] Task: 创建 Prisma 单例 (TDD) 880c0a5
    - [ ] 创建测试文件 `frontend/src/lib/prisma.test.ts` (模拟 prisma)。
    - [ ] 实现 `frontend/src/lib/prisma.ts` 以提供单例实例。
- [x] Task: Conductor - User Manual Verification '环境与数据库设置' (Protocol in workflow.md)

## 阶段 2：业务逻辑迁移 (TDD) [checkpoint: 8fcb2cc]
- [x] Task: 迁移 Excel 生成逻辑 1577876
    - [ ] 创建测试文件 `frontend/src/lib/excel-utils.test.ts`。
    - [ ] 实现 `frontend/src/lib/excel-utils.ts` (移植原 `ExcelService` 的逻辑)。
- [x] Task: Conductor - User Manual Verification '业务逻辑迁移 (TDD)' (Protocol in workflow.md)

## 阶段 3：API 实现 [checkpoint: 28c60e7]
- [x] Task: 实现数据抓取 API (Fetch API) 48f1872
    - [ ] 创建 `frontend/src/app/api/proxy/fetch/route.ts`。
    - [ ] 实现 POST 处理器，调用外部 API。
    - [ ] 确保错误处理和 Token 传递逻辑正确。
- [x] Task: 实现文件下载 API (Download API) 0cf00dd
    - [ ] 创建 `frontend/src/app/api/proxy/download/route.ts`。
    - [ ] 实现 POST 处理器，抓取数据并使用 `excel-utils` 生成流。
    - [ ] 设置正确的文件下载响应头。
- [x] Task: Conductor - User Manual Verification 'API 实现' (Protocol in workflow.md)

## 阶段 4：前端集成与清理 [checkpoint: 7b9f36f]
- [x] Task: 更新前端调用 fa13da6
    - [ ] 修改 `frontend/src/app/apps/excel-export/page.tsx` 以调用新的相对路径 API。
    - [ ] 必要时更新环境变量引用逻辑。
- [x] Task: 环境配置 b78a61d
    - [ ] 在 `frontend/.env` (或 `.env.local`) 中配置 `EXTERNAL_API_URL`。
- [x] Task: 验证与清理 acdf07e
    - [ ] 运行完整构建 `pnpm run build` 确保无类型错误。
    - [ ] 验证端到端 (E2E) 流程（抓取与下载）。
    - [ ] 删除 `backend/` 整个目录。
    - [ ] 如果存在 `pnpm-workspace.yaml`，从中移除 `backend`。
- [x] Task: Conductor - User Manual Verification '前端集成与清理' (Protocol in workflow.md)
