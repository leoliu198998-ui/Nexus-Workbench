# 技术栈 - Nexus Workbench

## 1.0 前端核心
*   **框架:** Next.js (App Router)
*   **语言:** TypeScript
*   **UI 库:** React
*   **样式:** Tailwind CSS
*   **组件库:** shadcn/ui
*   **包管理器:** pnpm

## 2.0 后端核心
*   **框架:** NestJS
*   **语言:** TypeScript
*   **运行时:** Node.js

## 3.0 数据与持久化
*   **数据库:** PostgreSQL (可选/根据需求)
*   **ORM:** Prisma (如果使用数据库)

## 4.0 核心功能实现
*   **Excel 生成:** 由后端 (NestJS) 使用相关库（如 `exceljs` 或 `xlsx`）生成，并以文件流形式提供下载。
*   **API 交互:** 使用 Axios 或 Fetch API 进行外部服务调用。

## 5.0 开发与部署
*   **架构:** 前端 (Next.js) 与后端 (NestJS) 解耦。
*   **理念:** 保持轻量化。初始阶段优先使用简单的脚本或基础的 Makefile 进行本地开发管理，避免过于复杂的编排工具。
