# Specification: 系统停机发布管理工具 (Outage Release Manager)

## 1. 概述 (Overview)
创建一个新的效率工具应用，用于研发团队在进行系统发布时，通过 4 个标准化步骤控制不同环境系统的停机状态。该工具支持环境域名的预维护、发布进度的持久化存储以及跨会话的操作。

## 2. 功能要求 (Functional Requirements)

### 2.1 环境管理 (Environment Management)
*   **数据库预维护**: 需要在数据库中维护 `ReleaseEnvironment` 表，存储各环境的显示名称和基础域名（Base URL）。
*   **环境选择**: 用户在开始发布前，必须从数据库加载并手动选择目标环境。

### 2.2 发布流程控制 (4-Step Workflow)
系统必须严格遵循以下 4 个阶段，并支持“断点续传”（即中途退出后可重新进入）：

1.  **创建发布批次 (Create Batch)**
    *   **输入**: 批次名称 (`batchName`)、发布时间 (`releaseDatetime`)、时区 (`releaseTimeZone`)、持续时长 (`duration`)、操作 Token (`x-dk-token`)。
    *   **动作**: 调用目标环境域名下的 `/devops/release-batch` 接口。
    *   **存储**: 保存接口返回的 `batchId` (remoteBatchId) 到本地数据库，并将本地状态更新为 `CREATED`。

2.  **公布发布通知 (Publish Notification)**
    *   **动作**: 使用 `remoteBatchId` 调用目标环境的 `/devops/release-batch/publish` 接口。
    *   **存储**: 更新本地状态为 `NOTIFIED`。

3.  **开始发布/停机 (Start Release/Outage)**
    *   **动作**: 调用 `/devops/release-batch/release` 接口。
    *   **存储**: 更新本地状态为 `STARTED`。

4.  **完成发布/解除停机 (Finish Release)**
    *   **动作**: 调用 `/devops/release-batch/finish` 接口。
    *   **存储**: 更新本地状态为 `COMPLETED`。

### 2.3 数据模型与持久化 (Persistence)
需要新增两个核心模型：
*   **ReleaseEnvironment**: 存储环境名称、API 基础域名等。
*   **OutageBatch**: 存储批次详情、当前步骤状态 (`status`)、操作 Token、以及每一步接口调用的原始响应日志 (`logs` JSON 字段)。

## 3. 非功能要求 (Non-Functional Requirements)
*   **安全性**: 操作 Token 应在数据库中加密存储。
*   **健壮性**: 每次接口调用失败时应记录错误日志，并允许用户重试。
*   **用户体验**: 采用向导式 UI 引导用户完成四个步骤。

## 4. 验收标准 (Acceptance Criteria)
*   [ ] 能够从数据库中选择不同的发布环境。
*   [ ] 成功实现 4 个步骤的接口调用及状态流转。
*   [ ] 退出应用后再进入，能正确恢复到上次未完成的步骤。
*   [ ] 数据库正确记录了每一步的执行日志。
