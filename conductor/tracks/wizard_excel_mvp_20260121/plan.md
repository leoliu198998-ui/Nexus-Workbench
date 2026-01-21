# Implementation Plan - Wizard Excel MVP

## Phase 1: 项目基础架构搭建 [checkpoint: 9501484]
- [x] Task: 初始化 Next.js 前端项目 (shadcn/ui, Tailwind, pnpm) [bff591a]
- [x] Task: 初始化 NestJS 后端项目 [fda469b]
- [x] Task: 配置基础的跨域 (CORS) 与环境变量 [2e0cbd2]
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md) [9501484]

## Phase 2: 后端核心逻辑实现 (NestJS) [checkpoint: ff1163f]
- [x] Task: 实现 API 代理服务，支持替换 Token 并发起外部请求 [f0b4e20]
- [x] Task: 实现 Excel 生成服务 (基于硬编码映射规则) [24dc833]
- [x] Task: 编写单元测试验证 JSON 到 Excel 的转换逻辑 [24dc833]
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md) [ff1163f]

## Phase 3: 前端向导界面开发 (Next.js)
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: 前端向导界面开发 (Next.js) [checkpoint: 3afc5cc]
- [x] Task: 实现分步向导基础组件结构 [e9bb5c0]
- [x] Task: 实现步骤 1：Token 输入与校验界面 [fcff634]
- [x] Task: 实现步骤 2：数据请求、处理状态显示与预览表格 [dc6a6bb]
- [x] Task: 实现步骤 3：Excel 文件流下载功能 [f0a76d8]
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md) [3afc5cc]

## Phase 4: 联调与优化
- [x] Task: 前后端端到端联调 [3c2914b]
- [x] Task: 优化 Toast 通知反馈（操作成功/失败提示） [bbb0738]
- [x] Task: 最终冒烟测试与代码清理 [8aed655]
- [~] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)
- [ ] Task: 最终冒烟测试与代码清理
- [ ] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)
