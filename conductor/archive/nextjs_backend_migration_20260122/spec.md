# 规格说明 (spec.md) - 后端迁移至 Next.js API (移除 NestJS)

## 1. 概述 (Overview)
为了简化在 Vercel 上的部署流程并降低架构复杂度，本项目将把现有的 NestJS 后端服务迁移到 Next.js 的 API Routes (App Router) 中。迁移完成后，将完全移除原有的 `backend/` 目录。

## 2. 目标 (Goals)
- 实现后端逻辑与前端项目的合并，实现单体部署。
- 将 Prisma 数据库访问层直接集成到 Next.js 目录结构中。
- 在 Next.js 中重现现有的数据抓取 (`fetch`) 和 Excel 下载 (`download`) 功能。
- 确保在 Vercel 上部署时，环境变量和 API 调用能正常工作。

## 3. 功能需求 (Functional Requirements)
- **数据库集成**:
  - 将 `backend/prisma` (或相关 schema) 移动到 `frontend/prisma`。
  - 在 `frontend/src/lib/prisma.ts` 中实现 Prisma Client 的单例模式实例化。
- **API 路由重构**:
  - 创建 `app/api/proxy/fetch/route.ts`：处理 POST 请求，实现原有的数据代理抓取逻辑。
  - 创建 `app/api/proxy/download/route.ts`：处理 POST 请求，生成并返回 Excel 流。
- **业务逻辑迁移**:
  - 在 `frontend/src/lib/excel-utils.ts` 中实现 Excel 生成逻辑（迁移自 `ExcelService`）。
  - 在 API 路由中直接调用上述工具函数。
- **前端适配**:
  - 修改 `frontend/src/app/apps/excel-export/page.tsx` 中的 fetch 请求路径，从 `http://localhost:4000/proxy/...` 改为相对路径 `/api/proxy/...`。

## 4. 非功能需求 (Non-Functional Requirements)
- **性能**: 保持与现有 NestJS 服务相当的响应速度。
- **安全性**: 确保 API 路由正确处理 Token 验证（保持原有逻辑）。
- **可维护性**: 移除冗余的 NestJS 配置文件和依赖，简化 CI/CD 流程。

## 5. 验收标准 (Acceptance Criteria)
- [ ] 成功移除 `backend/` 整个目录。
- [ ] 前端应用可以成功通过 `/api/proxy/fetch` 获取数据。
- [ ] 前端应用可以成功从 `/api/proxy/download` 下载生成的 Excel 文件。
- [ ] 项目可以通过 `npm run build` 成功构建，无类型错误。
- [ ] 环境变量（如 `EXTERNAL_API_URL`）在 Next.js 环境下配置正确且生效。

## 6. 超出范围 (Out of Scope)
- 暂时不引入 Next.js Server Actions，保持原有的 API 调用模式以减少对现有 UI 逻辑的冲击。
- 不进行数据库结构的更改。
