# 任务规格说明: 系统停机管理流程重构与进度续传功能

## 1. 概述
重构停机管理工具（Outage Manager）的工作流，支持对“未完成”发布批次的进度续传，并提供灵活、持久化的 Token 管理机制。目标是确保用户在创建批次后的任何阶段退出，都能通过批次 ID 重新找回进度，并在 Token 过期时能够随时手动更新。

## 2. 功能需求

### 2.1 批次上下文持久化
- **存储机制：** 利用数据库中的 `OutageBatch` 模型存储从外部接口返回的 `remoteBatchId` 以及当前使用的授权 `token`。
- **创建阶段：** 在第一步（创建批次）成功后，必须立即将外部接口返回的 `remoteBatchId` 更新到数据库记录中。

### 2.2 流程续传与进入入口
- **批次列表集成：**
    - 在“批次列表”页面，对于状态为 `CREATED`、`NOTIFIED`、`STARTED` 的批次，点击应跳转至向导页面：`/apps/outage-manager/wizard/[id]`。
- **向导页初始化：**
    - 向导组件需检查 URL 中是否存在 `id` 参数。
    - 若存在，则从后端 API 获取该批次的详细信息（包括 `remoteBatchId`、`token` 和当前 `status`）。
    - 将获取的信息注入向导的全局状态中，实现进度恢复。

### 2.3 Token 管理机制
- **UI 组件：**
    - 在向导页面的显著位置（如顶部 Header 或固定侧边栏）实现一个 **全局 Token 输入框**。
    - **显示要求：** Token 必须以 **明文（非脱敏）** 形式显示，方便用户查看。
    - **交互要求：** 用户可以在流程的任何步骤随时修改此输入框的内容。
- **业务逻辑：**
    - 该 Token 将作为后续所有外部 API 请求的授权凭证。
    - 当用户手动修改 Token 时，应同步更新内存状态，并建议自动同步更新到数据库，以确保下次恢复流程时使用的是最新的 Token。

## 3. 技术实现要点
- **数据模型：** 使用现有的 `OutageBatch` 字段（`remoteBatchId`, `token`）。
- **后端 API：**
    - `POST /api/apps/outage-manager/batches`: 确保创建成功后存储 `remoteBatchId`。
    - `GET /api/apps/outage-manager/batches/[id]`: 新增或完善接口，返回包含 `remoteBatchId` 和 `token` 的详情。
    - `PATCH /api/apps/outage-manager/batches/[id]`: 用于在流程中随时更新 Token 或状态。
- **前端状态管理：** 向导组件（Wizard）需要能够根据 API 返回值自动跳转到对应的步骤。

## 4. 用户交互流程示例
1. 用户在列表页点击一个“进行中”的批次。
2. 页面进入向导模式，URL 包含批次 ID。
3. 页面顶部显示该批次之前保存的 Token（明文）。
4. 向导自动识别 `remoteBatchId`，用户直接进入下一步操作。
5. 若请求接口提示 Token 失效，用户直接在页面顶部修改 Token。
6. 修改后再次发起请求，流程继续。
