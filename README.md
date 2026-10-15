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

## v0.2 事件采集基础（历史基础）

第二阶段增加了数据结构和会话事件监听。当前分支还没有持久化：

- src/memory/types.ts 定义双方消息、工具调用、工具结果和回合结束事件。
- src/memory/capture.ts 监听公开的 session/event 流，并保留内存中的结构化事件。
- 用户事件标记为 user，DS 消息标记为 assistant，工具证据标记为 tool。
- 工具调用和同一会话中的工具结果通过 callId 关联。
- 未知事件、来源不明事件和角色冲突事件会跳过；缺少内容的已知事件标记为 partial。
- 情绪、意义、重要性和关联记忆字段只作为空字段预留，不会被自动推断。

（第二阶段分支的说明保留在这里；持久化实现见当前第三阶段代码。）

## v0.3 SQLite 持久化与隐私控制

当前分支使用 Node.js 内置的 node:sqlite，不引入第三方数据库依赖。MemoryStorage
负责 schema 初始化、版本记录、参数化查询、幂等写入、跨进程重启读取、删除和安全关闭。
数据库文件默认放在应用数据目录：

- Windows：APPDATA/everlasting-ally/memory.sqlite
- Linux：XDG_DATA_HOME/everlasting-ally/memory.sqlite，未设置时使用 HOME/.local/share

默认配置是关闭内容持久化。通过 DSH facet/bundle 配置显式启用：

    {
      "memory": {
        "enabled": true,
        "captureUserMessages": true,
        "captureAssistantMessages": true,
        "captureToolEvents": true,
        "maxEventBytes": 65536,
        "retentionDays": 0
      }
    }

配置关闭后不会写入事件；删除接口只作为受信任的程序接口提供，没有暴露给模型的
无确认删除工具。明显的 token、password、secret、authorization 等字段会被替换为
[REDACTED]，过滤规则不是绝对可靠保障。超出大小限制的事件只保存元数据并标记
partial；数据库错误不会把事件内容写入日志。

程序接口包括 saveEvent、getEvent、listSessionEvents、listRecentEvents、
deleteSession、clearAllMemories 和 getMemoryStats。inside_memory_status 只返回开关、
数据库状态、事件数、会话数和最近写入时间，不返回正文。

## 本地开发

需要支持 node:sqlite 的 Node.js 22.5 或更高版本；DSH Desktop 目标运行时应使用其
随附的兼容 Node 版本：

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
- 云端测试覆盖 Node.js SQLite 和模拟的 DSH session/event 监听；真实 DSH Desktop
  加载及 Windows Node 版本的内置 SQLite 行为仍需在 Windows 环境中 smoke test。
- 后续阶段可在当前事件和存储接口上增加更细的用户管理界面，但本阶段不实现情绪、
  向量搜索、Prompt 注入或人格系统。

## 参考

插件组织方式参考了 T-Auto/dsh-ops 的公开源码：
https://github.com/T-Auto/dsh-ops
