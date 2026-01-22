# 规格说明 (spec.md) - 项目结构重构以支持 Vercel 部署

## 1. 概述 (Overview)
为了简化在 Vercel 上的部署流程，并符合 Next.js 项目的标准布局，本项目将进行结构重构。原本位于 `frontend/` 目录下的所有内容将被移动到项目根目录。

## 2. 目标 (Goals)
- 实现前端项目与项目根目录的合并。
- 确保项目可以通过 Vercel 的默认 Next.js 部署配置一键部署。
- 保持现有的 Conductor 开发工作流及其相关工具（`conductor/`, `.agents/` 等）在根目录正常运行。

## 3. 功能需求 (Functional Requirements)

### 3.1 目录结构重组
- **文件移动**:
  - 将 `frontend/` 目录下的所有内容（`src/`, `public/`, `package.json`, `next.config.ts`, `prisma/`, `tsconfig.json` 等）移动到项目根目录。
  - 移除已经变为空目录的 `frontend/`。
- **Git 适配**:
  - 合并 `frontend/.gitignore` 到根目录的 `.gitignore`。
- **路径修正**:
  - 更新可能引用了硬编码路径的文件。

### 3.2 部署适配
- **环境配置**:
  - 确保根目录下包含 `.env.example`，列出部署所需的所有核心变量（`DATABASE_URL`, `SCHEDULE_REPORT_API_URL` 等）。
- **Prisma 适配**:
  - 确保 `prisma generate` 脚本在 Vercel 的构建生命周期中正确执行（通常通过 `postinstall` 钩子）。

## 4. 非功能需求 (Non-Functional Requirements)
- **零停机转换**: 确保重构后，本地开发命令（`pnpm dev`, `pnpm test`）在新的根目录下能立即正常工作。
- **保持整洁**: 保持根目录下原有工具文件（`conductor/`, `.agents/`）的完整性。

## 5. 验收标准 (Acceptance Criteria)
- [ ] 根目录下存在 `package.json` 且包含所有前端依赖。
- [ ] 运行 `pnpm dev` 能够正常启动本地预览。
- [ ] 运行 `pnpm run build` 无路径错误，且能生成 `.next` 构建产物。
- [ ] 原有的 Conductor 轨道管理功能依然可用。

## 6. 超出范围 (Out of Scope)
- 不涉及具体的 Vercel 项目创建或 DNS 配置（用户手动在 UI 侧执行）。
- 不涉及数据库迁移的生产环境执行（仅提供配置适配）。
