# 实施计划：停机发布批次取消与更新功能

## 阶段 1：基础架构与数据库更新 [checkpoint: 0515a3e]

- [x] Task: 修改 Prisma Schema 以支持 `CANCELLED` 状态 c16c2cd

    - [x] 在 `OutageStatus` 枚举中添加 `CANCELLED`

    - [x] 执行数据库迁移并生成客户端 (`npx prisma migrate dev --name add_cancelled_status`)

- [x] Task: 更新 TypeScript 类型定义 c16c2cd

    - [x] 确保 `src/types/outage.ts` 与新的 Prisma 枚举一致


- Task: Conductor - User Manual Verification '阶段 1：基础架构与数据库更新' (Protocol in workflow.md)

## 阶段 2：后端 API 开发 (TDD) [checkpoint: 8cc5294]
- [x] Task: 实现批次更新 API (`PUT /api/apps/outage-manager/batches/[id]`) f3ac026
    - [x] **Red**: 编写测试用例验证更新逻辑（校验、调用外部 API、本地同步、状态重置为 CREATED、日志）
    - [x] **Green**: 在 `route.ts` 中实现 `PUT` 方法，确保更新后状态回退
- [x] Task: 实现批次取消逻辑 (集成在 `PATCH` API) 3929aec
    - [x] **Red**: 编写测试用例验证 `action: 'cancel'` 逻辑
    - [x] **Green**: 在 `route.ts` 的 `PATCH` 方法中处理 `cancel` 操作

- Task: Conductor - User Manual Verification '阶段 2：后端 API 开发' (Protocol in workflow.md)

## 阶段 3：前端 UI 开发 [checkpoint: 0c13a2c]
- [x] Task: 创建更新批次对话框组件 (`UpdateBatchDialog`)
    - [x] 实现包含名称、日期、时长等字段的表单及校验
- [x] Task: 在 `WizardControl` 中集成按钮
    - [x] 在主按钮下方添加“更新”和“取消”按钮
    - [x] 仅在 `CREATED` 和 `NOTIFIED` 状态下显示这些按钮
- [x] Task: 实现交互逻辑与状态刷新
    - [x] 集成取消确认对话框
    - [x] 成功操作后调用 `onUpdate` 或刷新页面数据

- Task: Conductor - User Manual Verification '阶段 3：前端 UI 开发' (Protocol in workflow.md)

## 阶段 4：回归测试与收尾
- [x] Task: 运行全量测试套件确保无回归风险
    - [x] Task: 清理测试数据并完善代码文档
    - [x] Task: Conductor - User Manual Verification '阶段 4：回归测试与收尾' (Protocol in workflow.md)

