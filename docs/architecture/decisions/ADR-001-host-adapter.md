# ADR-001：统一 Host Adapter 作为 DSH 边界

- 状态：Accepted for Phase 1
- 日期：2026-10-25
- 基础提交：`252bf5c85d79f7e0722d36541d78fc993de24445`

## 决策

Everlasting Ally 保留现有 `apply(root, rawConfig?)` 入口，在其内部使用独立的 `HostAdapter`（`src/host-adapter.ts`）。Adapter 只处理宿主能力检测、工具注入、事件订阅、清理和诊断；记忆捕获、SQLite、召回、orb 和 reflection 继续由现有业务服务负责。

## 为什么需要边界

此前 `src/host.ts` 同时声明 Host 类型、创建 SQLite/分析服务、订阅 `session/event`、注册四个工具并实现工具业务。这样使资源清理、Host 能力缺失和注册失败路径分散在单个入口中，也无法稳定报告“宿主没有提供某项可选能力”。

## 已经足够的现有实现

- `MemoryCapture` 已处理事件去重、内容抽取、工具调用关联和有界缓存。
- `MemoryStorage` 已负责 SQLite schema、脱敏、统计、删除和 `close()`。
- `MemoryOrbService`、`ReflectionService` 和召回服务已有独立测试。
- `dsh-plugin.json` 与 `everlasting-ally.bundle.yml` 已提供插件 Manifest 与默认关闭的 memory 配置。

Adapter 不重写这些服务，也不启用自动 recall、reflection 或提示词注入。

## Adapter 负责什么

1. 记录已观察到的 `tools`、`session/event`、lifecycle effect 能力。
2. 对 `inject(['tools'], ...)`、`on('session/event', ...)` 提供统一入口。
3. 把工具 unregister、事件 disposer、orb close、SQLite close 纳入一次性 cleanup。
4. 处理重复启动、停止后调用、初始化异常和诊断错误。
5. 保留宿主版本字段，但当前 DSH 版本没有从私有对象读取；未传入的版本记为 `null`，API 版本为 `unverified`。

Adapter 不负责模型调用、提示词组装、人格策略、长期记忆 schema、角色扮演状态或 UI/语音。

## 兼容边界

仓库 `package.json` 声明 Node `>=22.5`，可选 peer 为 `@deepseek-ai/cordis >=4.0.4` 与 `@deepseek-ai/dsh >=0.2.0-rc.2`。这些是包级兼容声明，不等于本 Adapter 已通过真实 DSH Desktop 验收。`session/event`、`inject` 和 `effect` 只按当前仓库已使用的公开形态建模；没有证据的私有 API 不被访问。真实 DSH Desktop 测试仍标记为 NOT_VERIFIED，直到目标版本的官方接口测试运行。

## 生命周期与错误

- Adapter 只允许一次有效启动；重复 `start()` 是幂等的，停止后重新启动会抛错。
- cleanup 使用一次性包装，Adapter 停止和宿主 effect 后续清理不会双重关闭。
- 工具注入或事件订阅抛错时记录诊断并清理已登记资源。
- 缺少可选 `on` 或 `effect` 时返回明确的 unsupported/未验证状态；`inject` 缺失则初始化失败。
- SQLite 与 orb 关闭由 Adapter 统一登记；不删除数据库文件，不吞掉关闭错误。

## 隐私与权限默认值

现有 `resolveMemoryConfig` 的 `enabled`、`recallEnabled`、`reflectionEnabled`、`autoRecallEnabled` 默认仍为 `false`。Adapter 不读网络、凭证或其他插件配置，不主动写配置文件，不改变其他插件设置。Host 工具只能通过现有业务服务访问本地、已脱敏的记忆接口。

## 后续模块接入

人格、memory provider、roleplay 和 presentation 通过业务接口接入 Adapter 的生命周期；它们不能依赖 Cordis 内部对象、未验证的事件字段或宿主私有路径。未来若需要 DSH 版本分支，应增加显式能力探测和契约测试，不在业务服务中散落版本判断。

## 事实与建议

已由仓库源码验证：`apply` 入口、`inject(['tools'])`、`on('session/event')`、`effect` 清理形态、Manifest、默认关闭配置、SQLite `close()` 和当前 peer 声明。设计建议：Adapter 的 `HostDiagnostics`、生命周期状态机、一次性 cleanup、版本字段与未来模块接口；它们不是 DSH 官方 API 的声明。

