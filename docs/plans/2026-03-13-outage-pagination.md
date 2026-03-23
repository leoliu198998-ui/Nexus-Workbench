# Outage Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 outage 列表增加每页 10 条的分页能力，并让 `/api/apps/outage-manager/batches` 只返回当前页所需的 10 条数据与分页元信息。

**Architecture:** 后端 `GET /api/apps/outage-manager/batches` 接收 `page` 查询参数，使用 `skip/take` 和 `count()` 返回当前页数据及总数。前端 `BatchList` 持有当前页状态，调用分页接口并渲染上一页/下一页控件，同时保留现有状态筛选和点击跳转行为。

**Tech Stack:** Next.js App Router, TypeScript, Vitest, React Testing Library, Prisma

---

### Task 1: API Pagination

**Files:**
- Modify: `src/app/api/apps/outage-manager/batches/route.ts`
- Modify: `src/app/api/apps/outage-manager/batches/route.test.ts`

**Step 1: Write the failing test**

- 为 `GET /api/apps/outage-manager/batches` 增加测试：
  - 默认返回 `page=1`，`pageSize=10`
  - `findMany` 使用 `take: 10`
  - 指定 `page=2` 时使用正确的 `skip`
  - 响应包含 `items`、`page`、`pageSize`、`total`、`totalPages`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/apps/outage-manager/batches/route.test.ts`

Expected: FAIL，因为当前 `GET` 仍返回数组且固定 `take: 20`

**Step 3: Write minimal implementation**

- 在 route 中解析 `page`
- 使用 Prisma `count` + `findMany`
- 返回分页对象

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/apps/outage-manager/batches/route.test.ts`

Expected: PASS

### Task 2: Batch List Pagination UI

**Files:**
- Modify: `src/components/outage-manager/batch-list.tsx`
- Modify: `src/components/outage-manager/batch-list.test.tsx`
- Modify: `src/types/outage.ts`

**Step 1: Write the failing test**

- 初次加载时请求 `?page=1`
- 渲染分页状态
- 点击“下一页”后请求 `?page=2`
- 刷新保留当前页

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/outage-manager/batch-list.test.tsx`

Expected: FAIL，因为组件当前只请求一次无分页接口

**Step 3: Write minimal implementation**

- 新增分页响应类型
- 组件保存 `page` 与分页元信息
- 增加上一页/下一页按钮和页码文案
- 刷新仍请求当前页

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/outage-manager/batch-list.test.tsx`

Expected: PASS

### Task 3: Targeted Verification

**Files:**
- Verify only

**Step 1: Run targeted tests**

Run: `npm test -- src/app/api/apps/outage-manager/batches/route.test.ts src/components/outage-manager/batch-list.test.tsx`

Expected: PASS

**Step 2: Review diff**

Run: `git diff -- src/app/api/apps/outage-manager/batches/route.ts src/app/api/apps/outage-manager/batches/route.test.ts src/components/outage-manager/batch-list.tsx src/components/outage-manager/batch-list.test.tsx src/types/outage.ts`

Expected: 仅包含分页相关修改
