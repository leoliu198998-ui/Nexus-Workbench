# 规格说明书：停机发布 API 架构优化 (Outage Manager API Refactoring)

## 1. 概述 (Overview)
对停机发布管理模块的后端 API (`route.ts`) 进行全面重构。解决代码审查中发现的“胖路由”、逻辑重复、BigInt 处理脆弱等问题，提升代码的可维护性、可测试性和健壮性。

## 2. 核心目标 (Core Objectives)
1.  **架构分层**：将业务逻辑从 Route Handler 剥离，迁移至独立的 Service 层。
2.  **健壮性提升**：引入专业库处理 BigInt 精度，替代脆弱的正则替换。
3.  **代码复用**：抽离通用辅助函数，消除重复代码。
4.  **测试增强**：为新创建的 Service 层编写独立的单元测试。

## 3. 功能需求 (Functional Requirements)

### 3.1 引入 BigInt 安全解析
- **引入依赖**：安装 `json-bigint` 包。
- **全局工具**：在 `src/lib/utils.ts` 或新文件中封装 `safeJsonParse` 函数，统一处理包含大整数的 JSON 解析。
- **替换范围**：在所有涉及外部 API 调用的地方替换原有的正则替换逻辑。

### 3.2 Service 层重构
- **创建 Service 类**：在 `src/lib/services/outage.service.ts` 中实现 `OutageService` 类（单例模式）。
- **封装方法**：
    - `getBatch(id: string)`: 获取批次详情。
    - `createBatch(data: CreateBatchDto)`: 创建批次。
    - `updateBatch(id: string, data: UpdateBatchDto)`: 更新批次信息（含状态重置逻辑）。
    - `executeAction(id: string, action: string)`: 执行发布、完成、取消等操作（含鉴权、外部调用、日志）。
    - `callExternalApi(...)`: 私有方法，封装 `fetch`、鉴权、错误处理和日志记录。
- **路由瘦身**：`src/app/api/apps/outage-manager/batches/[id]/route.ts` 仅保留参数解析和 Service 调用。

### 3.3 辅助函数抽离
- 将 `generateCurlCommand` 移至 `src/lib/utils.ts` 或 `src/lib/curl-utils.ts`。
- 确保所有模块均从新位置引用该函数。

## 4. 技术要求 (Technical Requirements)
- **依赖管理**：`npm install json-bigint`。
- **类型定义**：完善 `CreateBatchDto` 和 `UpdateBatchDto` 类型，减少 `any` 的使用。
- **测试策略**：保留现有的 Route 集成测试（作为回归测试），新增 Service 单元测试（使用 Vitest mock `prisma` 和 `fetch`）。

## 5. 验收标准 (Acceptance Criteria)
- [ ] `json-bigint` 成功引入并用于解析外部 API 响应。
- [ ] `OutageService` 类创建完成，包含所有核心业务逻辑。
- [ ] API 路由文件代码行数显著减少，不再包含业务逻辑。
- [ ] 所有现有集成测试 (`route.test.ts`) **必须全部通过**。
- [ ] 新增 Service 单元测试并通过。
- [ ] `generateCurlCommand` 被复用，无重复定义。

## 6. 出项范围 (Out of Scope)
- 数据库 Schema 变更（本次仅重构代码逻辑）。
- 前端 UI 变更。
