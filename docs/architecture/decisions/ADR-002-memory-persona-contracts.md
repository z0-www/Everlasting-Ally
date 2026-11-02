# ADR-002：单一 SQLite 只读检索接口与人格配置草案

日期：2026-11-02。阶段：2A，待真实 Desktop 验收。
基础：17a688520d9505128e2000a93f8e04e9f7655a97；PR #1 尚未合并，因此本分支叠加在其上。

## 重新审计
本地找到了 outputs/everlasting-ally-dsh-research-plan.zh-CN.md，但其中进程内主库、许可证缺失等描述已过时，不作为当前状态依据。
上阶段 CI 的 51 项测试虽然通过，但没有覆盖正常 Host 卸载是否关闭数据库、初始化途中事件订阅失败和 SQLite 建表失败。此前“生命周期稳定”的结论不足。
本阶段将 runtime stop 绑定到根 effect，资源创建后立即登记；关闭顺序为监听、orb、数据库。重复 apply 复用当前 runtime，停止后可创建新实例；配置变更需要先停止再启动。
SQLite 构造中的 schema/retention 异常会关闭已打开连接。清理失败记录在 Adapter diagnostics，测试临时目录删除不忽略错误。

## 边界
MemoryReader.search(query, trustedScopeId, options) 是本项目业务接口，不是 DSH API。
SqliteMemoryReader 借用现有 MemoryStorage；不创建第二连接，不增加写入、导入导出、同步、迁移或外部插件依赖。
读取受 enabled、recallEnabled、连接状态与可信 scope 约束。scope 必须由应用身份提供；当前工具仍沿用单用户本地配置 scope，不宣称多用户鉴权。
persona 只有 enabled:false、displayName、tone、animeExpression；这是一份冻结的配置草案，不能启用人格提示词或改变记忆。未知 persona 字段和错误类型明确拒绝；原有 flat/nested memory 格式保留。
MemoryCapture 仍可能维护进程内有界捕获缓存；默认关闭保证不写 SQLite，不等同于没有内存中的事件处理。

## 源码证据
本次检查 DSH 官方提交 [ce7073d51254c26cd63b22a60835b8f948deb447](https://github.com/deepseek-ai/deepseek-harness/tree/ce7073d51254c26cd63b22a60835b8f948deb447)：
- [session/src/index.ts](https://github.com/deepseek-ai/deepseek-harness/blob/ce7073d51254c26cd63b22a60835b8f948deb447/packages/core/session/src/index.ts)：Events 中声明 session/event(session,event)，作为提交后的观察事件。
- [tools/src/index.ts](https://github.com/deepseek-ai/deepseek-harness/blob/ce7073d51254c26cd63b22a60835b8f948deb447/packages/core/tools/src/index.ts)：ToolsService.register 返回注销函数，要求 output schema/render。
- [LICENSE](https://github.com/deepseek-ai/deepseek-harness/blob/ce7073d51254c26cd63b22a60835b8f948deb447/LICENSE)：MIT，Copyright 2026 DeepSeek。只研究接口，未复制实现或引入依赖；以后复制实质代码须保留声明。

这只能确认所检查提交的部分接口，不能证明所有 >=0.2.0-rc.2 版本兼容。Cordis effect/inject 的完整动态重注入语义、真实事件 payload 与 Desktop 仍未验证；apiVersion 继续 unverified。Host 版本只接受调用方显式传入，不猜测 root.version。
缺少根 effect 时，调用方必须持有 mountMemoryRuntime 返回值并显式 adapter.stop；apply 的真实 Desktop 支持要求宿主提供根生命周期。

## 验收与下一步
test/integration-contracts.test.mjs 的 10 项均为模拟 Host + 真实本地 SQLite 测试。Windows 与 Linux CI 覆盖临时路径、重启保存、关闭、初始化失败、默认关闭、配置隔离、作用域、重复 apply 和晚到回调。
没有真实 Desktop、网络阻断或凭证访问沙箱验收，不能把模拟测试名称当作证明。
下一步先固定目标 Desktop/SDK 版本，验证加载、禁用、依赖移除/重新注入、事件格式、取消和重启；然后才讨论人格配置审批及按会话生效。外部记忆插件和自动回忆继续关闭。
