# Nexus Workbench

Nexus Workbench 是一个专为研发团队打造的内部 Web 效率工具集平台。旨在通过一系列原子化的工具，简化研发日常工作中的重复性任务，提升团队整体交付效率。

## 核心功能

- **API 内容快捷创建**: 图形化界面调用接口，实现内容快速生成。
- **日程报表导出**: 对接生产环境 API，自动将日程数据转换为 Excel 报表。
- **系统停机发布管理**: 标准化的 4 步向导式流程，精准控制不同环境的停机与恢复。
- **团队共享资源库**: 存储与共享常用代码片段、配置模板。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **数据库**: Prisma ORM (PostgreSQL)
- **UI 组件**: Radix UI + Tailwind CSS 4
- **动画**: Framer Motion
- **测试**: Vitest + React Testing Library

## 目录结构

- `src/app`: 应用路由与页面逻辑
- `src/components`: 可复用的 UI 组件
- `src/lib`: 工具函数与第三方库配置
- `prisma`: 数据库建模与迁移脚本
- `conductor`: 项目管理、技术规范与工作流文档

## 快速开始

1. **安装依赖**:
   ```bash
   pnpm install
   ```

2. **环境变量**:
   在根目录创建 `.env` 文件，并配置相应的数据库连接字符串。

3. **数据库初始化**:
   ```bash
   npx prisma db push
   ```

4. **启动开发服务器**:
   ```bash
   pnpm dev
   ```

## 开发规范

本项目遵循 `conductor/` 目录中定义的详细技术指南和工作流。在开始贡献代码前，请务必阅读相关的 `code_styleguides`。
