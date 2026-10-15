# DSH API audit for v0.6.1

本次审计使用仓库可访问的公开 dsh-ops 源码和当前锁定的 Community manifest
parser。审计结果分为已观察和未核实两类。

已观察到的兼容形状：

- manifest 使用 Community format 0.15，host facet 使用 v1alpha1。
- dsh-ops 的 host entry 导出 apply，并通过 root.inject 注册服务。
- dsh-ops 在公开源码中使用 ctx.on('session/event', (session, event) => ...)。
- dsh-ops 使用 ctx.tools.register({ name, description, parameters, output, execute })，
  注册返回注销函数。
- 注册定义的 output schema 使用 JSON Schema object root。

本环境没有可运行的 Windows DSH Desktop，也没有可确认的请求前模型上下文 Hook、
Desktop 专属本地加载 API 或用户身份服务。因此本插件没有把这些接口当作已实现：

- AutoRecallService 只提供 ContextExtension 适配层。
- 没有适配器时返回 hook_unavailable，继续使用 inside_memory_recall。
- 存储使用单一 local-user 作用域，不能声明多用户隔离。
- node:sqlite 已在云端 Node.js 24.19 验证；Windows Desktop 的实际 Node 版本和
  内置 SQLite 可用性需要按 docs/windows-dsh-smoke-test.md 在本机确认。

这份审计不把模拟 Host 测试描述为真实 Desktop 集成成功。
