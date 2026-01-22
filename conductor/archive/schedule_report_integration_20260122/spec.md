# 规格说明 (spec.md) - 日程安排报表真实数据集成

## 1. 概述 (Overview)
将现有的“Excel 导出向导”从模拟数据源迁移到真实的 `global.butterglobe.com` API。该工具将用于抓取日程安排数据，并根据特定的业务规则将其转换为 Excel 报表。

## 2. 目标 (Goals)
- 实现与生产环境 API 的真实对接。
- 复刻 Python 脚本 (`jsontrans_副本.py`) 中的复杂数据展平与逻辑处理。
- 优化后端架构，使用专用路由处理特定业务请求。
- 保持用户界面的简洁性，仅需输入 Token 即可完成操作。

## 3. 功能需求 (Functional Requirements)

### 3.1 后端 API 实现
- **专用抓取路由 (`/api/apps/schedule-report/fetch`)**:
  - 接收前端传递的 `token`。
  - 向 `https://global.butterglobe.com/services/dukang-service-online/schedules/review/search/all?key=pykhvksu` 发起 `POST` 请求。
  - 注入必要的固定请求头（如 `x-biz`, `User-Agent`, `x-actived-menu` 等）。
  - 将用户 Token 映射至 `x-dk-token` 请求头。
  - 发送固定请求体：`{ "q": "", "size": 1500, "page": 0, "year": 2026, "type": "" }`。
- **专用下载路由 (`/api/apps/schedule-report/download`)**:
  - 执行与抓取路由相同的逻辑获取数据。
  - 调用数据转换工具进行处理。
  - 返回生成的 Excel 流。

### 3.2 数据转换逻辑 (复刻 Python 逻辑)
- **字段提取与展平**:
  - `Schedule ID` -> `id`
  - `Schedule Name` -> `name`
  - `Client Name` -> `client.fullName`
  - `Client Code` -> `client.code`
  - `Entity Name` -> `entity.name`
  - `Location Name` -> `location.name`
  - `Service Type` -> `serviceType.name`
  - `Service Module Name` -> `serviceModule.name`
  - `Generate Status` -> `generateStatus`
- **特殊处理**:
  - **失败原因 (`Failure Reason`)**: 
    - 遍历 `failureReason` 数组。
    - 如果包含 `PUBLIC_HOLIDAY_ERROR`，则拼接 `missingHolidayLocations` 中的地区名称（格式：`PUBLIC_HOLIDAY_ERROR(地区1,地区2)`）。
    - 多个原因以逗号分隔。
  - **联系人列表**: 
    - `Global SD` -> 提取 `serviceDeliverContacts` 数组中所有 `name` 并以逗号分隔。
    - `Local Process SD` -> 提取 `serviceDeliverLocalProcessContacts` 数组中所有 `name` 并以逗号分隔。

### 3.3 前端适配
- 更新 `excel-export/page.tsx`，将流程简化为“身份验证”与“导出”两步。
- 移除“数据预览”步骤，点击“继续”直接进入导出页面。

## 4. 非功能需求 (Non-Functional Requirements)
- **安全性**: 敏感的 API URL 和固定请求头应存储在 `.env` 中。
- **效率**: 简化交互路径，减少用户点击次数。

## 5. 验收标准 (Acceptance Criteria)
- [ ] 前端输入真实 Token 后能直接跳转至导出确认页。
- [ ] 点击下载生成的 Excel 文件，其表头与数据逻辑与 Python 脚本输出完全一致。
- [ ] API 报错时，前端能展示友好的错误提示。

## 6. 超出范围 (Out of Scope)
- 暂时不提供用户自定义 `year` 或 `size` 的 UI 选项（保持硬编码）。
- 不处理 Excel 样式的精细调整（如单元格颜色等）。
