# Implementation Plan - Layout Optimization & Dashboard

## Phase 1: 路由重构与页面迁移 [checkpoint: 0ce48db]
- [x] Task: 迁移现有 Excel 向导逻辑 [bd48e09]
    - [x] 在 `src/app` 下创建 `apps/excel-export` 目录
    - [x] 将原 `src/app/page.tsx` 的内容移动到 `src/app/apps/excel-export/page.tsx`
    - [x] 修复相关的组件导入路径
- [x] Task: 编写测试验证路径迁移 [9365aee]
    - [x] 确保 `/apps/excel-export` 路径可访问且功能正常
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md) [0ce48db]

## Phase 2: 仪表盘主页开发 [checkpoint: 4b6a4d1]
- [x] Task: 创建仪表盘卡片组件 `ToolCard` [cb63ab7]
    - [x] 基于 shadcn/ui Card 实现
- [x] Task: 实现主页 (`src/app/page.tsx`) 布局 [a97324e]
    - [x] 编写工具列表配置数据
    - [x] 使用 Grid 布局渲染工具卡片
- [x] Task: 编写单元测试验证仪表盘渲染 [a97324e]
    - [x] 验证卡片内容是否按配置正确显示
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md) [4b6a4d1]

## Phase 3: 全局导航与体验优化 [checkpoint: 2fd992e]
- [x] Task: 创建全局导航栏组件 `Navbar` [3a416fa]
    - [x] 包含项目名称及返回主页的链接
- [x] Task: 优化响应式布局 [cfcde26]
    - [x] 确保仪表盘在移动端和桌面端都有良好的显示效果
- [x] Task: 增强导航体验（面包屑与返回功能） [0b6657c]
    - [x] 在 Navbar 中引入动态面包屑
    - [x] 在工具页面添加显式的返回仪表盘按钮
- [x] Task: 最终冒烟测试与代码清理 [f04e61a]
    - [x] 运行所有测试并检查代码质量
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md) [2fd992e]
