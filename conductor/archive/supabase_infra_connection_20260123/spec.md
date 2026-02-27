# Specification: Supabase 基础设施接入与连接测试

## 1. 概述 (Overview)
本 Track 的目标是建立 Nexus Workbench 应用与 Supabase PostgreSQL 数据库之间的连接。工作内容包括配置必要的环境变量，更新 Prisma Schema 以支持连接，并创建一个专用的 `SystemLog` 表。这项基础设施工作将为未来功能奠定基础，尽管现有的工具暂时不会使用此数据库。

## 2. 功能要求 (Functional Requirements)

### 2.1 数据库配置
*   **环境设置:** 配置项目以连接到 Supabase。
    *   定义 `DATABASE_URL` (Transaction pooler) 用于应用程序连接。
    *   定义 `DIRECT_URL` (Session pooler/Direct) 用于 Migrations。
    *   定义 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 以备未来客户端使用。
*   **交付物:** 更新 `.env.example` 文件包含这些 Key（值留空）。

### 2.2 Schema 定义
*   **SystemLog 模型:** 在 `prisma/schema.prisma` 中定义一个新的模型 `SystemLog`，结构如下：
    *   `id`: String (UUID), 主键, 默认值: uuid()
    *   `action`: String (例如: "TEST_CONNECTION")
    *   `details`: String? (可选描述)
    *   `timestamp`: DateTime, 默认值: now()
*   **清理:** 保留现有的默认 `User` 模型（除非发生冲突，否则默认保留）。

### 2.3 验证机制
*   **Migration:** 针对提供的 Supabase 实例成功运行 Prisma migration 以创建表。
*   **连接测试:** 实现一个临时机制（例如脚本 `src/scripts/test-db-connection.ts` 或临时 API 路由），执行以下操作：
    1.  在 `SystemLog` 表中创建一条新记录。
    2.  从数据库中读取该记录。
    3.  在控制台输出结果以确认成功。

## 3. 非功能要求 (Non-Functional Requirements)
*   **安全性:** 确保没有任何真实的凭证（Credentials）被提交到版本控制系统中。
*   **稳定性:** 引入数据库客户端不得破坏现有的构建或功能。

## 4. 验收标准 (Acceptance Criteria)
*   [ ] `.env.example` 包含所有必要的 Supabase/Prisma Key。
*   [ ] `prisma/schema.prisma` 包含有效的 `SystemLog` 模型。
*   [ ] Migration 能够针对提供的 Supabase 实例成功运行。
*   [ ] 验证脚本/测试确认可以向 `SystemLog` 表写入并读取数据。
