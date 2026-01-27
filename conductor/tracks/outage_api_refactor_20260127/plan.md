# 实施计划：停机发布 API 架构优化

## 阶段 1：基础设施准备 [checkpoint: 87b0c77]
- [x] Task: 引入 `json-bigint` 依赖 d8ac684
    - [x] 安装 `json-bigint` 包和类型定义
- [x] Task: 封装 JSON 安全解析工具 876d669
    - [x] 在 `src/lib/utils.ts` 中实现 `safeJsonParse` 函数
    - [x] 编写 `safeJsonParse` 的单元测试
- [x] Task: 抽离 Curl 生成工具 69bee0b
    - [x] 将 `generateCurlCommand` 从 `route.ts` 移动到 `src/lib/utils.ts` (或新文件)
    - [x] 确保导出并在原文件中引用（临时）
- [x] Task: Conductor - User Manual Verification '阶段 1：基础设施准备' (Protocol in workflow.md)

## 阶段 2：Service 层实现 (TDD) [checkpoint: 6ccc336]
- [x] Task: 创建 OutageService 骨架与测试
    - [x] 创建 `src/lib/services/outage.service.ts`
    - [x] 创建 `src/lib/services/outage.service.test.ts`
    - [x] **Red**: 编写测试用例（Mock Prisma 和 fetch），验证创建、更新、查询、外部调用的逻辑
- [x] Task: 实现 OutageService 核心逻辑
    - [x] **Green**: 实现 `createBatch`, `updateBatch`, `getBatch`
    - [x] **Green**: 实现 `executeAction` (含鉴权、外部调用封装、日志)
    - [x] **Refactor**: 确保使用 `safeJsonParse` 处理外部响应
- [x] Task: Conductor - User Manual Verification '阶段 2：Service 层实现' (Protocol in workflow.md)

## 阶段 3：路由重构 [checkpoint: 7fba5c9]
- [x] Task: 重构 GET 路由
    - [x] 修改 `src/app/api/apps/outage-manager/batches/[id]/route.ts` 的 GET 方法调用 Service
    - [x] 验证现有集成测试 (`route.test.ts`) 是否通过
- [x] Task: 重构 POST 路由
    - [x] 修改 `src/app/api/apps/outage-manager/batches/route.ts` 的 POST 方法调用 Service
    - [x] 验证现有集成测试
- [x] Task: 重构 PATCH 和 PUT 路由
    - [x] 修改 `src/app/api/apps/outage-manager/batches/[id]/route.ts` 的 PATCH/PUT 方法调用 Service
    - [x] 验证现有集成测试
- [x] Task: Conductor - User Manual Verification '阶段 3：路由重构' (Protocol in workflow.md)

## 阶段 4：清理与回归测试 [checkpoint: e48ccac]
- [x] Task: 清理废弃代码 
    - [x] 删除 `route.ts` 中不再使用的正则替换逻辑和辅助函数
    - [x] 检查并移除其他冗余代码
- [x] Task: 运行全量测试
    - [x] 执行所有单元测试和集成测试，确保无回归
- [x] Task: Conductor - User Manual Verification '阶段 4：清理与回归测试' (Protocol in workflow.md)
