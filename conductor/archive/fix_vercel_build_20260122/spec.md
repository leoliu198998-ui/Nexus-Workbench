# 规格说明 (spec.md) - 修复 Vercel 构建流程

## 1. 概述 (Overview)
解决在 Vercel 上部署时因 `prisma generate` 未执行导致构建失败的问题。目前 `next build` 试图编译使用了 Prisma Client 的代码，但生成的客户端文件尚不存在。

## 2. 目标 (Goals)
- 确保在执行 Next.js 构建之前，Prisma Client 已经生成。
- 修复 Vercel 部署时的 "Cannot find module" 错误。

## 3. 功能需求 (Functional Requirements)
- **构建脚本更新**:
  - 修改根目录 `package.json` 中的 `scripts.build`。
  - 将命令从 `next build` 更新为 `prisma generate && next build`。

## 4. 非功能需求 (Non-Functional Requirements)
- **无副作用**: 确保这一更改不会破坏本地开发流程。
- **透明性**: 确保构建过程中的 Prisma 生成步骤在日志中可见。

## 5. 验收标准 (Acceptance Criteria)
- [ ] `package.json` 中的 `build` 脚本包含 `prisma generate`。
- [ ] 本地运行 `pnpm run build` 能够成功执行（包括生成 client 和构建应用）。
