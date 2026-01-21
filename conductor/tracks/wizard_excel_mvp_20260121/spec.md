# Specification - Wizard Excel MVP

## 1.0 概述
实现一个核心效率工具：用户通过分步向导，输入身份令牌（Token），调用特定的后端接口，并将返回的 JSON 数据转换为可下载的 Excel 文件。

## 2.0 用户流程 (Wizard Steps)
1.  **步骤 1: 身份验证**: 用户输入必要的 Token。
2.  **步骤 2: 数据处理与预览**:
    *   前端发送请求至 NestJS 后端。
    *   后端使用 Token 代理调用预置的 cURL 接口。
    *   后端解析响应，根据硬编码规则提取字段。
    *   前端显示数据预览（如前 5 条记录）。
3.  **步骤 3: 下载**: 用户点击按钮下载完整的 Excel 文件。

## 3.0 技术实现细节
*   **前端 (Next.js)**: 使用 shadcn/ui 的 Card 和 Button 组件构建向导。
*   **后端 (NestJS)**:
    *   实现代理 Controller。
    *   集成 `exceljs` 库用于 Excel 生成。
    *   硬编码 cURL 请求逻辑和字段映射规则。
*   **数据流**: Token (Client) -> Request (NestJS) -> External API -> JSON Response (External) -> Processed Data (NestJS) -> Excel Stream/JSON Preview (Client).

## 4.0 约束
*   接口 cURL 和字段映射规则在此阶段为硬编码。
*   不涉及用户登录，仅依赖输入的 Token。
