# 实施计划 - 修复发布通知 EntityNotFound 异常及流程控制 Bug

## 阶段 1: 问题诊断与重现 (Diagnosis) [checkpoint: 9328fa1]
- [x] Task: 审查代码以定位 `EntityNotFoundException` 的来源
    - [x] 在 `src/app/api/` 中搜索受影响的 API 路由和控制器
    - [x] 检查 `MysqlReleaseBatch` 模型的相关查询逻辑
    - [x] 追踪 `batchId` 的传递路径（从创建到发布调用）
- [x] Task: 验证 ID 生成和存储逻辑
    - [x] 确认 ID 是否在数据库中真实存在，以及是否存在格式或时区导致的 ID 匹配失败
    - [x] 检查是否存在数据库事务隔离级别导致的数据不可见问题
    - **诊断结果:** 确认是 JavaScript `Number` 类型精度丢失导致的问题。External API 返回的 `batchId` (18位) 超出 `MAX_SAFE_INTEGER`，`JSON.parse` 导致精度丢失（如 `...181` -> `...180`），导致后续调用 ID 不匹配。
- [x] Task: Conductor - User Manual Verification '阶段 1: 问题诊断与重现' (Protocol in workflow.md)

## 阶段 2: 修复后端 Bug 与增强鲁棒性 (Core Fix)
- [ ] Task: 修复 ID 查找失败的根本原因
    - [ ] 确保查询前数据已正确持久化
    - [ ] 修复任何 ID 格式转换或参数传递中的 Bug
- [ ] Task: 改进 API 错误处理逻辑
    - [ ] 完善异常捕获，确保 `EntityNotFoundException` 被转化为标准的 `errcode: "1"` 响应
    - [ ] 确保响应结构符合：`{ "errcode": "1", "errmsg": "...", "data": null }`
- [ ] Task: Conductor - User Manual Verification '阶段 2: 修复后端 Bug 与增强鲁棒性' (Protocol in workflow.md)

## 阶段 3: 前端流程控制修复 (Flow Control)
- [ ] Task: 更新前端 API 调用层
    - [ ] 在调用发布通知接口后，增加对 `errcode` 的显式判断
    - [ ] 只有当 `errcode === "0"` 且 `releaseStatus` 匹配时才推进 `currentStep`
- [ ] Task: 实现失败反馈 UI
    - [ ] 增加错误处理分支，弹出包含服务端 `errmsg` 的 Toast/Alert
    - [ ] 确保出错后流程停留在当前步骤，并启用“重试”按钮（如果适用）
- [ ] Task: Conductor - User Manual Verification '阶段 3: 前端流程控制修复' (Protocol in workflow.md)

## 阶段 4: 最终验证 (Final Verification)
- [ ] Task: 进行端到端测试
    - [ ] 验证正常流程：成功发布，状态更新，流程进入下一步
    - [ ] 验证异常流程：人为制造失败响应，确认前端报错且不自动跳转
- [ ] Task: Conductor - User Manual Verification '阶段 4: 最终验证' (Protocol in workflow.md)
