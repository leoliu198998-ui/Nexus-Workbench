# 实施计划 - 任务: 系统停机管理流程重构与进度续传

## 第 1 阶段：数据库与后端逻辑 (TDD) [checkpoint: 7a6ee16]
- [x] 任务: 创建 `OutageBatch` 测试工厂和数据种子 83cfbc9
    - [ ] 子任务: 创建测试辅助函数，用于生成包含 `remoteBatchId` 和 `token` 的模拟 `OutageBatch` 数据。
- [x] 任务: 更新 `POST /api/apps/outage-manager/batches` 接口以存储 `remoteBatchId` ac30347
    - [ ] 子任务: 编写失败测试，断言创建接口能够将外部服务返回的 `remoteBatchId` 保存到数据库。
    - [ ] 子任务: 实现逻辑，从外部服务响应中提取并保存 `remoteBatchId`。
    - [ ] 子任务: 验证测试通过。
- [x] 任务: 增强 `GET /api/apps/outage-manager/batches/[id]` 接口 d92af25
    - [ ] 子任务: 编写失败测试，确保接口返回 `remoteBatchId` 和 `token` 字段。
    - [ ] 子任务: 更新 API 路由，在响应中包含这些必要字段。
    - [ ] 子任务: 验证测试通过。
- [x] 任务: 创建 `PATCH /api/apps/outage-manager/batches/[id]` 用于 Token 更新 c7f842e
    - [ ] 子任务: 编写失败测试，验证可以通过 PATCH 请求更新 `token` 字段。
    - [ ] 子任务: 实现 PATCH 路由，允许动态修改批次的 Token。
    - [ ] 子任务: 验证测试通过。
- [ ] 任务: Conductor - 用户手动验证 '数据库与后端逻辑 (TDD)' (遵循 workflow.md 协议)

## 第 2 阶段：前端状态管理与导航 (TDD) [checkpoint: 3bdc563]
- [x] 任务: 实现批次列表跳转逻辑 9fd0d4e
    - [ ] 子任务: 编写组件测试，验证点击列表项时的跳转行为。
    - [ ] 子任务: 更新 `BatchList`，使“进行中”的批次跳转至 `/apps/outage-manager/wizard/[id]`。
    - [ ] 子任务: 验证测试通过。
- [x] 任务: 重构向导上下文 (Wizard Context) 以支持状态注入 2507a236
    - [ ] 子任务: 编写上下文提供者测试，确保其能根据初始数据（hydrate）进行初始化。
    - [ ] 子任务: 更新向导上下文，使其接受初始状态（remoteBatchId, token, currentStep）。
    - [ ] 子任务: 验证测试通过。
- [x] 任务: 实现向导页进度恢复逻辑 d3086155
    - [ ] 子任务: 编写向导页面组件测试，模拟 URL 中包含 ID 时的加载情况。
    - [ ] 子任务: 实现 `useEffect` 或数据获取钩子，在挂载时根据 ID 加载批次详情。
    - [ ] 子任务: 将获取到的数据注入向导上下文。
    - [ ] 子任务: 验证测试通过。
- [ ] 任务: Conductor - 用户手动验证 '前端状态管理与导航 (TDD)' (遵循 workflow.md 协议)

## 第 3 阶段：Token 管理 UI (TDD)
- [x] 任务: 创建 `GlobalTokenInput` 组件 78e8f0db
    - [ ] 子任务: 编写测试，验证新组件能正确显示值并允许编辑。
    - [ ] 子任务: 实现组件，满足“明文显示”的要求。
    - [ ] 子任务: 验证测试通过。
- [ ] 任务: 在向导布局中集成 Token 输入框
    - [ ] 子任务: 编写测试，确保 Token 输入框能更新全局向导上下文。
    - [ ] 子任务: 在向导布局（顶部栏或侧边栏）中放置该组件。
    - [ ] 子任务: 将输入变更连接到上下文更新函数，并实现 API 自动保存（防抖处理）。
    - [ ] 子任务: 验证测试通过。
- [ ] 任务: 处理 API Token 失效场景
    - [ ] 子任务: 编写测试，模拟向导流程中出现 401 错误。
    - [ ] 子任务: 确保 UI 允许通过新的全局输入框更新 Token 后重试操作。
    - [ ] 子任务: 验证测试通过。
- [ ] 任务: Conductor - 用户手动验证 'Token 管理 UI (TDD)' (遵循 workflow.md 协议)
