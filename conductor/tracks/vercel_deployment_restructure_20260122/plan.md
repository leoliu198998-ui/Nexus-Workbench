# 执行计划 - 项目结构重构以支持 Vercel 部署

## 阶段 1：目录重组 [checkpoint: 9da3039]
- [x] Task: 备份与准备
- [x] Task: 文件移动
- [x] Task: Conductor - User Manual Verification '目录重组' (Protocol in workflow.md)

## 阶段 2：配置适配与清理 [checkpoint: aeaee34]
- [x] Task: 更新 Git 配置
- [x] Task: 更新依赖管理
- [x] Task: 验证开发环境
- [x] Task: Conductor - User Manual Verification '配置适配与清理' (Protocol in workflow.md)

## 阶段 3：部署准备
- [ ] Task: 环境变量模版
    - [ ] 检查并更新 `.env.example`，确保包含 `SCHEDULE_REPORT_API_URL` 和 `DATABASE_URL`。
- [ ] Task: 构建验证
    - [ ] 运行 `pnpm run build` 模拟 Vercel 构建过程，确保无路径错误。
- [ ] Task: Conductor - User Manual Verification '部署准备' (Protocol in workflow.md)
