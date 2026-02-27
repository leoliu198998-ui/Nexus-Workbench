# 技术栈 - Nexus Workbench

## 1.0 前端核心
*   **框架:** Next.js (App Router)
*   **语言:** TypeScript
*   **UI 库:** React
*   **样式:** Tailwind CSS
*   **组件库:** shadcn/ui
*   **通知组件:** sonner
*   **包管理器:** pnpm

## 2.0 架构与后端 (单体)
*   **架构:** 采用单体 Next.js (App Router) 架构，API 逻辑集成在 `src/app/api` 路由中。
*   **部署:** 优化支持 Vercel 一键部署，项目根目录即为 Next.js 根目录。

## 3.0 数据与持久化
*   **数据库:** Supabase PostgreSQL (已启用)
*   **ORM:** Prisma 7 (已启用，使用 `@prisma/adapter-pg` 适配器)
*   **连接策略:** 
    *   **DATABASE_URL (端口 6543):** 连接池模式，用于应用程序运行时。
    *   **DIRECT_URL (端口 5432):** 直连模式，用于 Prisma Migration 及 CLI 操作。

## 4.0 核心功能实现
*   **Excel 生成:** 由后端 (Next.js API) 使用 `exceljs` 生成，并以文件流形式提供下载。
*   **API 交互:** 后端使用原生 Fetch API 进行外部代理调用，采用 Service 层封装业务逻辑，并使用 `json-bigint` 处理大整数精度问题。
*   **状态管理:** 系统停机向导采用 React Context (Provider 模式) 结合服务端状态注入，实现复杂流程的状态共享与持久化恢复。

## 5.0 开发与部署
*   **理念:** 保持轻量化。初始阶段优先使用简单的脚本或基础的 Makefile 进行本地开发管理，避免过于复杂的编排工具。
