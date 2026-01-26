# 规范: 修复发布通知 EntityNotFound 异常及流程控制 Bug

## 1. 概述 (Overview)
目前在进行发布通知调用时存在两个严重问题：
1.  服务端报错：抛出 `EntityNotFoundException`，提示无法找到对应 ID 的 `MysqlReleaseBatch`。
2.  流程控制失效：尽管接口返回了错误 (errcode: "1")，前端/调用层仍错误地进入了下一步。

本 Track 旨在**优先修复导致 `EntityNotFound` 的根本原因**，同时完善错误处理机制，确保失败时流程正确中止。

## 2. 功能需求 (Functional Requirements)
### 2.1 核心 Bug 修复 (Core Fix)
- **调查数据丢失/ID 错误原因**：排查为何在调用发布接口时，系统无法通过 ID 找到 `MysqlReleaseBatch`。可能原因包括：
    - 创建 Batch 后事务未提交或未持久化。
    - 传递给发布接口的 ID 与创建时的 ID 不一致。
    - 异步操作导致的时序竞争问题。
- **修复数据访问逻辑**：确保发布接口 be 被调用时，能够正确读取到对应的 Batch 记录，并返回 `errcode: "0"`。

### 2.2 流程控制优化 (Flow Control)
- **API 响应验证**：在 `src/app/api/` 的相关路由中，严格检查 `errcode`。
- **阻断机制**：如果 `errcode` 为 "1" 或 `data` 为 `null`，必须立即中止流程，**禁止**自动进入下一步。
- **状态校验**：仅当 `errcode: "0"` 且 `releaseStatus` 为有效状态（如 `PUBLISHED`）时，才允许推进流程。

### 2.3 用户体验 (UX)
- **错误反馈**：当接口报错时，前端需弹出 Toast 或 Alert 显示 `errmsg`，并保持在当前界面，允许用户重试。

## 3. 验收标准 (Acceptance Criteria)
- [ ] **异常消除**：调用发布接口时，后端不再报 `EntityNotFoundException`，必须返回正确的 Batch 数据结构。
- [ ] **成功路径**：修复后，正常流程下接口返回 `errcode: "0"`，且 `releaseStatus` 正确更新。
- [ ] **失败保护**：模拟接口失败（`errcode: "1"`）场景下，前端界面正确报错并停止在当前步骤，不发生跳转。

## 4. 非功能需求 (Non-Functional Requirements)
- **日志增强**：在后端关键节点（Batch 创建、查询、更新）增加日志，便于追踪 ID 变化。

## 5. 超出范围 (Out of Scope)
- 对发布流程之外的其他模块进行重构。
