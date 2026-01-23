# Implementation Plan: 系统停机发布管理工具 (Outage Release Manager)

## 阶段 1: 数据库模型与基础设施 (Database Schema & Infrastructure) [checkpoint: 7a60373]

- [x] Task: 在 `prisma/schema.prisma` 中定义模型 b0283eb
    - [x] `ReleaseEnvironment`: 存储环境名称和基础 URL
    - [x] `OutageBatch`: 存储批次信息、状态和 JSON 日志
- [x] Task: 运行 Prisma Migration 应用架构更改
- [x] Task: 编写并执行 Seed 脚本
    - [x] 初始化常用环境域名数据到数据库
- [x] Task: Conductor - User Manual Verification '数据库模型与基础设施' (Protocol in workflow.md) 7a60373

## 阶段 2: 后端 API 开发与外部接口集成 (Backend API & Integration) [checkpoint: b694854]

- [x] Task: 实现环境列表查询接口 8855a66
- [x] Task: 实现“创建发布批次”后端接口 c13ca09
    - [x] 包含外部接口代理调用
    - [x] 包含本地数据库记录创建
- [x] Task: 实现“步骤流转”后端通用接口 (Publish, Release, Finish) e3789bf
    - [x] 动态根据环境域名转发请求
    - [x] 实时更新本地数据库状态和日志
- [x] Task: 为 API 逻辑编写单元测试 (TDD - 模拟 Fetch 调用)
- [x] Task: Conductor - User Manual Verification '后端 API 开发与外部接口集成' (Protocol in workflow.md) b694854

## 阶段 3: 前端基础界面与环境选择 (Frontend UI - Basic & Selection) [checkpoint: 5d72057]

- [x] Task: 创建工具主页面 `src/app/apps/outage-manager/page.tsx` e438feb
- [x] Task: 实现环境选择器组件 8cdc32e
    - [x] 从后端获取环境列表并展示
- [x] Task: 实现发布批次历史/当前进行中批次的列表展示 59d034e
- [x] Task: 在 Dashboard 中添加工具入口卡片
- [x] Task: Conductor - User Manual Verification '前端基础界面与环境选择' (Protocol in workflow.md) 5d72057

## 阶段 4: 四步骤向导式 UI (4-Step Wizard UI) [checkpoint: 7029b45]

- [x] Task: 实现“创建批次”表单界面 (Step 1) 50965d2
- [x] Task: 实现“发布流程控制”向导组件 (Steps 2-4) 50965d2
    - [x] 包含状态持久化检查（如果已有进行中批次，自动恢复步骤）
    - [x] 包含每一步的执行日志预览
- [x] Task: 编写前端组件单元测试
- [x] Task: Conductor - User Manual Verification '四步骤向导式 UI' (Protocol in workflow.md) 08bb397

## 阶段 5: 最终整理与质量检查 (Finalization)

- [x] Task: 执行项目质量门禁检查 (Quality Gates) 33786
    - [x] 运行 linting, 类型检查和所有测试
- [ ] Task: Conductor - User Manual Verification '最终整理与质量检查' (Protocol in workflow.md)
