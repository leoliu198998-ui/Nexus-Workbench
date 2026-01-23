# 执行计划 - 修复 Vercel 构建流程

## 阶段 1：修复与验证
- [ ] Task: 更新 package.json
    - [ ] 读取 `package.json`。
    - [ ] 将 `scripts.build` 更新为 `prisma generate && next build`。
- [ ] Task: 本地构建验证
    - [ ] 运行 `pnpm run build`。
    - [ ] 确保 `prisma generate` 成功执行并生成客户端。
    - [ ] 确保 `next build` 随后成功完成。
- [ ] Task: Conductor - User Manual Verification '修复与验证' (Protocol in workflow.md)
