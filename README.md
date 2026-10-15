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
- 当前插件没有持久化状态，也不会读取聊天记录或上传数据。
- 下一阶段可在独立模块中定义记忆存储接口，再选择 SQLite 实现；同时增加真实 DSH
  Desktop smoke test，并在确认 API 后逐步加入双向事件记录和反思流程。

## 参考

插件组织方式参考了 T-Auto/dsh-ops 的公开源码：
https://github.com/T-Auto/dsh-ops
