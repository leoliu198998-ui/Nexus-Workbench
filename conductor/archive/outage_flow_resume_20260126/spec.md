# 需求规格说明书 (spec.md) - 停机流程优化与日志增强

## 1.0 概述
本任务旨在优化 Nexus Workbench 的停机管理流程，包括更新各环境的固定维护页面 URL、在发布详情页增强标识展示，以及改进日志记录机制，实现 `SystemLog` 与停机批次的关联追踪。

## 2.0 业务需求
1.  **环境配置更新**：确保数据库中的停机环境（ReleaseEnvironment）包含最新的维护页面 URL。
2.  **标识增强**：在发布详情页显著位置展示“批次名称 (batchName)”，方便用户快速识别当前任务。
3.  **日志审计关联**：在执行停机流程的各个关键步骤时，除了现有的 JSON 日志外，还需在 `SystemLog` 表中记录标准审计日志，并建立与停机批次的 ID 关联。

## 3.0 功能要求

### 3.1 数据库与环境配置 (Backend)
*   **Seed 脚本更新**：修改 `prisma/seed.ts`，确保以下 5 个环境的 `baseUrl`（维护页面地址）准确无误：
    *   **Test**: `https://test-maintenance.bipocloud.com`
    *   **UAT**: `https://uat-maintenance.butterglobe.com`
    *   **EU**: `https://maintenance.butterglobe.com`
    *   **CN**: `https://maintenance.butterglobe.cn`
    *   **Wise**: `http://wise-maintenance.bipocloud.com`
*   **Schema 变更**：
    *   修改 `SystemLog` 模型，新增 `outageBatchId` 字段。
    *   建立 `SystemLog` 与 `OutageBatch` 的外键关联（一对多：一个批次可以对应多条系统日志）。

### 3.2 日志记录逻辑 (Backend)
*   在 `src/app/api/apps/outage-manager/batches/[id]/route.ts` 中，当执行以下 Action 时，同步在 `SystemLog` 表中插入记录：
    *   `publish` (通知)
    *   `release` (开始停机)
    *   `finish` (完成)
    *   `fix-batch-id` (修复 ID)
    *   `token-update` (Token 更新)
*   `SystemLog` 记录内容要求：
    *   `action`: 记录具体操作（如 "OUTAGE_BATCH_PUBLISH"）。
    *   `details`: 记录操作简述或关键结果。
    *   `outageBatchId`: 关联当前的批次 UUID。

### 3.3 界面显示优化 (Frontend)
*   **详情页更新**：修改停机管理发布详情页，在页面头部或显眼位置增加“批次名称”的展示。

## 4.0 非功能要求
*   **数据一致性**：通过数据库外键确保关联关系的有效性。
*   **向下兼容**：现有的 `OutageBatch.logs` (JSON) 字段保持不变，作为详细的 API 追踪日志。

## 5.0 验收标准
1.  [ ] 运行 `pnpm prisma db seed` 后，数据库中的环境 URL 已更新为上述 5 个值。
2.  [ ] 执行停机流程步骤后，`SystemLog` 表中能查询到对应的记录，且 `outageBatchId` 正确指向对应批次。
3.  [ ] 访问发布详情页，能够清晰看到该批次的名称。
4.  [ ] 所有新增代码通过 Lint 和类型检查。
