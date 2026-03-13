# Switch Outage External Auth To Bearer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 outage manager 对外 release-batch 请求的鉴权头从 `x-dk-token` 切换为 `Authorization: Bearer <token>`，同时保持内部 token 流程不变。

**Architecture:** 变更集中在 `src/lib/services/outage.service.ts` 的出站请求边界。先用定向 Vitest 用例锁定创建、更新、动作执行和仅更新 token 的行为，再做最小实现修改，并验证日志 / curl 元数据同步变化。

**Tech Stack:** Next.js, TypeScript, Vitest

---

### Task 1: Bearer 鉴权测试

**Files:**
- Modify: `src/lib/services/outage.service.test.ts`

**Step 1: 写失败测试**

- 为 `createBatch` 断言 `fetch` 使用 `Authorization: Bearer <token>`，且不包含 `x-dk-token`
- 为 `updateBatch` 断言出站请求与持久化日志记录使用 Bearer 头
- 为 `executeAction` 断言出站请求与返回的 debug metadata 使用 Bearer 头
- 为仅更新 token 的内部流程补充兼容性测试，确认后续动作请求使用已保存 token 组装 Bearer 头

**Step 2: 运行失败测试**

Run: `npm test -- src/lib/services/outage.service.test.ts`

Expected: 失败，现有实现仍在发送 `x-dk-token`

### Task 2: 最小实现

**Files:**
- Modify: `src/lib/services/outage.service.ts`

**Step 1: 最小修改**

- 创建、更新、动作执行三类对外请求统一改为 `Authorization: Bearer <token>`
- 保持仅更新 token 的内部持久化逻辑不变
- 确保日志和 curl/debug 元数据反映 Bearer 头

**Step 2: 运行定向测试**

Run: `npm test -- src/lib/services/outage.service.test.ts`

Expected: 通过

### Task 3: OpenSpec 收尾

**Files:**
- Modify: `openspec/changes/switch-outage-external-auth-to-bearer/tasks.md`

**Step 1: 更新任务勾选**

- 每完成一组实现后立即将对应 OpenSpec 任务改为 `- [x]`

**Step 2: 做最终验证**

Run: `npm test -- src/lib/services/outage.service.test.ts`

Expected: 通过且无新增范围内回归
