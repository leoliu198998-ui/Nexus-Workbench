# 实施计划 (plan.md) - 停机流程优化与日志增强

## Phase 1: 数据库与模型重构 (Backend)
本阶段专注于基础设施的变更，确保数据模型支持新的关联需求，并预置最新的环境数据。

- [x] Task: 更新数据库 Schema 并生成迁移 dc88f86
    - [ ] Sub-task: 在 `prisma/schema.prisma` 中更新 `SystemLog` 模型，添加 `outageBatchId` 字段及与 `OutageBatch` 的外键关联。
    - [ ] Sub-task: 运行 `pnpm prisma migrate dev --name link_systemlog_outage` 生成并应用迁移文件。
- [x] Task: 更新种子数据脚本 44ab701
    - [ ] Sub-task: 修改 `prisma/seed.ts`，添加或更新 5 个标准环境（Test, UAT, EU, CN, Wise）及其对应的维护页面 URL。
    - [ ] Sub-task: 运行 `pnpm prisma db seed` 并验证数据库中的数据是否正确更新。
- [ ] Task: 单元测试 - 模型关联
    - [ ] Sub-task: 编写或更新单元测试，验证 `SystemLog` 与 `OutageBatch` 之间的关联写入和读取是否正常工作。
- [ ] Task: Conductor - User Manual Verification '数据库与模型重构' (Protocol in workflow.md)

## Phase 2: 后端日志逻辑实现 (Backend)
本阶段将业务逻辑与新的日志表进行集成。

- [ ] Task: 封装 SystemLog 记录服务 (Service Layer)
    - [ ] Sub-task: 创建或更新 `src/lib/services/logger.ts` (如适用)，提供一个简化的函数用于记录与 OutageBatch 关联的系统日志。
- [ ] Task: 集成 API 路由日志记录
    - [ ] Sub-task: 修改 `src/app/api/apps/outage-manager/batches/[id]/route.ts`。
    - [ ] Sub-task: 在 `publish`, `release`, `finish`, `fix-batch-id`, `token-update` 等分支中，添加调用 SystemLog 写入的代码。
- [ ] Task: 集成测试 - 日志流程
    - [ ] Sub-task: 编写集成测试，模拟 API 调用，验证操作后 `SystemLog` 中是否生成了带有正确 `outageBatchId` 的记录。
- [ ] Task: Conductor - User Manual Verification '后端日志逻辑实现' (Protocol in workflow.md)

## Phase 3: 前端界面增强 (Frontend)
本阶段关注用户体验的微调。

- [ ] Task: 更新发布详情页 UI
    - [ ] Sub-task: 找到发布详情页组件（预计在 `src/components/outage-manager/` 或 `src/app/apps/outage-manager/` 下）。
    - [ ] Sub-task: 在页面头部区域增加显示 `batchName`。
- [ ] Task: 前端验证
    - [ ] Sub-task: 启动开发服务器，访问详情页，确认批次名称显示位置合理且数据加载正确。
- [ ] Task: Conductor - User Manual Verification '前端界面增强' (Protocol in workflow.md)