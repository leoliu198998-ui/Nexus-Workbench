# Implementation Plan - Layout Optimization & Dashboard

## Phase 1: 路由重构与页面迁移
- [x] Task: 迁移现有 Excel 向导逻辑 [bd48e09]
    - [x] 在 `src/app` 下创建 `apps/excel-export` 目录
    - [x] 将原 `src/app/page.tsx` 的内容移动到 `src/app/apps/excel-export/page.tsx`
    - [x] 修复相关的组件导入路径
- [~] Task: 编写测试验证路径迁移
    - [ ] 确保 `/apps/excel-export` 路径可访问且功能正常
    - [ ] 将原 `src/app/page.tsx` 的内容移动到 `src/app/apps/excel-export/page.tsx`
    - [ ] 修复相关的组件导入路径
- [ ] Task: 编写测试验证路径迁移
    - [ ] 确保 `/apps/excel-export` 路径可访问且功能正常
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: 仪表盘主页开发
- [ ] Task: 创建仪表盘卡片组件 `ToolCard`
    - [ ] 基于 shadcn/ui Card 实现
    - [ ] 支持名称、描述、图标和标签等 props
- [ ] Task: 实现主页 (`src/app/page.tsx`) 布局
    - [ ] 编写工具列表配置数据
    - [ ] 使用 Grid 布局渲染工具卡片
- [ ] Task: 编写单元测试验证仪表盘渲染
    - [ ] 验证卡片内容是否按配置正确显示
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: 全局导航与体验优化
- [ ] Task: 创建全局导航栏组件 `Navbar`
    - [ ] 包含项目名称及返回主页的链接
    - [ ] 在 `src/app/layout.tsx` 中集成
- [ ] Task: 优化响应式布局
    - [ ] 确保仪表盘在移动端和桌面端都有良好的显示效果
- [ ] Task: 最终冒烟测试与代码清理
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)
