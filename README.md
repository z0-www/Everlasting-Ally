# Everlasting Ally（永恒的伙伴）

Everlasting Ally 是一个面向 DeepSeek Harness（DSH）的开源插件，目标是
逐步支持长期记忆、共同经历、反思成长和可修正的人格连续性。项目不会把
AI 描述为具有人类意识或真实情绪，也不会为了营造人格而刻意制造错误。

## v0.1 已实现范围

当前版本只提供能被 DSH 识别、加载并调用的最小 host facet：

- dsh-plugin.json 使用已验证的 Community manifest 0.15 和 host API v1alpha1。
- dist/index.js 通过公开的 ctx.inject(['tools'], ...) 与
  ctx.tools.register(...) 注册工具。
- inside_memory_ping 不需要 API Key，返回插件名称、成功标记和可选回显消息。
- everlasting-ally.bundle.yml 提供标准 Cordis bundle row；是否启用由 DSH profile 管理。

记忆数据库、情绪标签、反思调用、人格系统和前端页面尚未实现。

## v0.2 事件采集基础

第二阶段目前只增加数据结构和会话事件监听，不做持久化：

- src/memory/types.ts 定义双方消息、工具调用、工具结果和回合结束事件。
- src/memory/capture.ts 监听公开的 session/event 流，并保留内存中的结构化事件。
- 用户事件标记为 user，DS 消息标记为 assistant，工具证据标记为 tool。
- 工具调用和同一会话中的工具结果通过 callId 关联。
- 未知事件、来源不明事件和角色冲突事件会跳过；缺少内容的已知事件标记为 partial。
- 情绪、意义、重要性和关联记忆字段只作为空字段预留，不会被自动推断。

本阶段没有 SQLite、状态工具、Prompt 注入、隐私过滤或第三方上传。当前内存事件会随插件进程结束而消失。

## 本地开发

需要 Node.js 22 或更高版本：

    npm ci
    npm test

npm test 会先将 TypeScript 编译到 dist/，然后运行工具注册测试和 manifest
解析测试。npm run build 可单独生成加载文件。

## Windows DSH Desktop 验证

云端环境不能运行 Windows DSH Desktop，因此以下是待在 Windows 本机执行的验证步骤：

1. 安装 Node.js 22+，在仓库目录运行 npm ci 和 npm run build。
2. 打包或发布该 npm 包，或将仓库目录作为本地插件目录提供给 DSH Desktop。
3. 在 DSH Desktop 的插件管理器安装/启用 everlasting-ally，必要时重启 Desktop。
4. 新建一个会话，让模型调用 inside_memory_ping；也可在插件/工具面板确认该名称已出现。
5. 预期结果为 JSON：ok: true、plugin: everlasting-ally，并包含默认或自定义 message。

如果 DSH Desktop 报告 manifest、facet 或 bundle schema 错误，请保留完整日志，
按实际 DSH 版本的公开 schema 调整；本仓库不会猜测未公开的字段。

## 已知限制与下一步

- 本云端只验证了 Node.js 构建、manifest 解析和模拟 DSH tool registry；没有声称已在
  DSH Desktop 中加载成功。
- 云端测试覆盖模拟的 DSH session/event 监听；真实 DSH Desktop 事件字段仍需在 Windows
  环境中进行 smoke test。
- 后续阶段可在当前 MemoryEvent 接口上增加 SQLite 存储，再单独设计隐私开关和删除能力。

## 参考

插件组织方式参考了 T-Auto/dsh-ops 的公开源码：
https://github.com/T-Auto/dsh-ops
