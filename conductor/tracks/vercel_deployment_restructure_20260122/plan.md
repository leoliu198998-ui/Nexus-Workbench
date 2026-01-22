# 执行计划 - 项目结构重构以支持 Vercel 部署

## 阶段 1：目录重组 [checkpoint: 9da3039]
- [x] Task: 备份与准备
- [x] Task: 文件移动
- [x] Task: Conductor - User Manual Verification '目录重组' (Protocol in workflow.md)

## 阶段 2：配置适配与清理
- [ ] Task: 更新 Git 配置
    - [ ] 合并原 `frontend/.gitignore` 的内容到根目录 `.gitignore`。
    - [ ] 确保 `.env` 和 `.env.local` 被正确忽略。
- [ ] Task: 更新依赖管理
    - [ ] 如果根目录有残留的 `package.json`（非前端的），进行合并。否则直接使用移动过来的前端 `package.json`。
    - [ ] 运行 `pnpm install` 以确保根目录下的 `node_modules` 正确生成。
- [ ] Task: 验证开发环境
    - [ ] 尝试运行 `pnpm dev` 验证启动。
    - [ ] 尝试运行 `pnpm test` 验证测试路径是否正常。
- [ ] Task: Conductor - User Manual Verification '配置适配与清理' (Protocol in workflow.md)

## 阶段 3：部署准备
- [ ] Task: 环境变量模版
    - [ ] 检查并更新 `.env.example`，确保包含 `SCHEDULE_REPORT_API_URL` 和 `DATABASE_URL`。
- [ ] Task: 构建验证
    - [ ] 运行 `pnpm run build` 模拟 Vercel 构建过程，确保无路径错误。
- [ ] Task: Conductor - User Manual Verification '部署准备' (Protocol in workflow.md)
