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
        "analysisEnabled": false,
        "recallEnabled": false,
        "reflectionEnabled": false,
        "autoRecallEnabled": false,
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

## v0.4 情绪记忆球与意义分析

v0.4 在原始事件之外增加独立的记忆球解释记录。原始事件仍是事实证据，记忆球
保存的是带置信度的解释，不会覆盖原始内容。

本地规则分析器位于 src/memory/orb/analyzer.ts，支持多情绪标签、助手行为风格、
保守意义摘要和 needs_review 状态。助手的友好、遗憾或兴奋用行为风格记录，不代表
DeepSeek 具有人类情绪。重要性评分位于 importance.ts，依据明确的记忆请求、目标、
纠正候选和工具证据计算 0 到 1 的分数；coreMemoryCandidate 只是候选。

配置 memory.analysisEnabled 后，已成功保存的用户和助手事件会进入有限内存队列，
由本地分析器异步生成记忆球。队列满时丢弃新的分析任务，不影响正常对话。当前没有
经过 DSH 官方确认的模型调用适配器；createUnavailableModelProvider 会明确报告未配置，
不会伪装成远程分析。历史消息不会被作为系统指令执行。

记忆球保存在 schema v2 的 memory_orbs 表中，支持按事件、会话、情绪、重要性和核心
候选查询，支持更新和删除。删除原始事件、会话或全部记忆时会同步删除派生记忆球。
颜色映射位于 colors.ts，只提供前端元数据，不实现界面。

示例（虚构数据）：

    {
      "id": "orb:event-42:local-rules-1",
      "sourceEventIds": ["event-42"],
      "actor": "user",
      "emotions": ["fear", "anticipation"],
      "emotionConfidence": 0.65,
      "meaning": "The message contains observable cues that may matter to the user or the current task; review is recommended.",
      "meaningConfidence": 0.35,
      "importance": 0.7,
      "coreMemoryCandidate": true,
      "reviewStatus": "needs_review",
      "analysisMethod": "local-rules"
    }

情绪和意义始终带有置信度与复核状态，规则无法判断时使用 neutral 或 unknown。
敏感信息过滤沿用 v0.3，模型模式默认关闭且未接入真实远程服务。

## 参考

插件组织方式参考了 T-Auto/dsh-ops 的公开源码：
https://github.com/T-Auto/dsh-ops

## v0.6 反思与成长记忆

ReflectionService 提供受信任程序接口 reflectSession、consolidateMemories、
listReflections 和 getReflection。reflectionEnabled 默认关闭，预算限制包括最大事件数、
输入输出字符数、模型调用数、Token 预算和超时。当前只实现本地确定性规则分析，不会自动
后台运行，也没有真实 DSH 模型 provider。

反思记录保存在独立的 memory_reflections 和 reflection_sources 表中。原始事件与记忆球
保持不变；反思记录只保存来源 ID、证据状态、置信度和复核状态。工具失败、用户纠正和
助手自我声明会被分别处理，助手说“完成”不会自动生成 confirmed 成功记录。删除事件、
会话或全部记忆时会清理派生反思。

inside_memory_reflections 只读返回已有摘要。反思文本来自已保存证据，不读取模型思维链，
不修改系统提示词，也不会执行历史消息中的指令。

## v0.6.1 真实集成边界

已核对的公开接口包括 manifest 0.15、host facet v1alpha1、root.inject、
ctx.tools.register 和 dsh-ops 使用的 session/event 监听形状。当前没有从可核实的
DSH 公开源码确认模型请求前上下文 Hook、用户身份字段或 Desktop 专属加载 API，因此
没有声明自动注入已经接入。AutoRecallService 仅提供带超时、数量、字符数和作用域限制
的适配接口；没有可验证 Hook 时安全返回 hook_unavailable，继续使用工具式回忆。

本地模式使用单一应用作用域 local-user。DSH 未提供可核实的多用户身份隔离时，插件
不声称支持跨用户共享记忆。自动回忆和反思默认关闭。Windows 手动步骤见
docs/windows-dsh-smoke-test.md。
DSH 接口审计记录见 docs/dsh-api-audit.md。

## v0.5 主动回忆

MemoryRecallService 使用本地确定性检索，从已保存的用户消息、助手消息和记忆球中
提取中英文关键词，结合主题标签、情绪、重要性和证据来源排序。检索结果只引用存在
于 SQLite 的原始事件 ID，并限制结果数量和上下文字符数。没有可靠匹配时返回
“未找到足够可靠的记忆。”。

recallEnabled 默认关闭；启用后可通过只读工具 inside_memory_recall 查询。该工具不执行
写入、删除或外部调用，也不会把用户消息当作系统指令。当前检索没有向量搜索或全文索引，
避免依赖目标 DSH Node 运行时未确认的 SQLite 扩展。
