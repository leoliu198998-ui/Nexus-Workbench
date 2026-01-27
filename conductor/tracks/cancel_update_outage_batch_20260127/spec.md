# 规格说明书：停机发布批次取消与更新功能 (Outage Batch Cancel & Update)

## 1. 概述 (Overview)
为停机发布管理模块增加“取消 (Cancel)”和“更新 (Update)”功能。用户可以在批次处于特定初始状态时，对批次信息进行修改或直接撤销发布计划。

## 2. 功能需求 (Functional Requirements)

### 2.1 状态约束
- “取消”和“更新”操作仅在批次状态为 `CREATED` (已创建) 或 `NOTIFIED` (发布通知) 时可用。
- 一旦进入 `STARTED` (停机发布) 或 `COMPLETED` (完成发布) 状态，这些操作应被禁用或隐藏。

### 2.2 更新功能 (Update)
- **UI 入口**：在 `WizardControl` 主操作区中，在主按钮下方提供“更新”按钮。
- **交互流程**：
  1. 点击后弹出对话框 (Modal)，预填当前批次信息（名称、发布时间、时区、持续时间）。
  2. 提交前进行表单校验（例如确保发布时间在未来）。
  3. 调用外部 API (`PUT /devops/release-batch/update/{remoteBatchId}`)。
- **成功处理**：
  1. 同步更新本地数据库中的 `batchName`, `releaseDatetime`, `releaseTimeZone`, `duration` 字段。
  2. **强制将批次状态 `status` 重置为 `CREATED`**。
  3. 自动刷新当前页面以展示最新数据。
  4. 在 `WizardLogs` 和 `SystemLog` 中记录更新日志。

### 2.3 取消功能 (Cancel)
- **UI 入口**：在 `WizardControl` 主操作区中，在主按钮下方提供“取消”按钮。
- **交互流程**：
  1. 点击后弹出二次确认对话框（防止误操作）。
  2. 确认后调用外部 API (`POST /devops/release-batch/cancel`)。
- **成功处理**：
  1. 更新本地数据库中的批次状态为 `CANCELLED`。
  2. 记录取消日志，并跳转回批次列表页或刷新当前显示。

## 3. 技术要求 (Technical Requirements)
- **数据库变更**：修改 `prisma/schema.prisma`，在 `OutageStatus` 枚举中添加 `CANCELLED`。
- **API 路由**：
  - 增加 `PUT /api/apps/outage-manager/batches/[id]` 处理更新逻辑。
  - 在现有 `PATCH` 路由中增加 `cancel` action 处理取消逻辑。
- **外部 API 精度处理**：继续沿用处理 BigInt (batchId) 精度丢失的安全 JSON 解析策略。

## 4. 验收标准 (Acceptance Criteria)
- [ ] 只有处于 `CREATED` 和 `NOTIFIED` 状态的批次能看到取消和更新按钮。
- [ ] 执行更新操作后，外部系统和本地数据库的数据均已同步，且状态变为 `CREATED`。
- [ ] 执行取消操作后，本地状态变为 `CANCELLED`，外部系统对应批次已撤销。
- [ ] 所有操作均有对应的 `SystemLog` 记录。

## 5. 出项范围 (Out of Scope)
- 历史版本比对功能（不记录修改前后的快照，仅记录修改行为）。
- `CANCELLED` 状态后的恢复功能（一旦取消，不可重新激活）。
