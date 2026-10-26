# 第三方组件与许可证边界

日期：2026-10-25。此表记录研究阶段核实的公开仓库；当前实现没有引入这些仓库的运行时代码或依赖。

| 项目 | GitHub | 核实许可证 | 研究源码路径 | 借鉴/复用 | 当前依赖 | 风险 |
|---|---|---|---|---|---|---|
| dsh-soul | https://github.com/Aliuyanfeng/dsh-soul | MIT（package.json 与仓库许可证） | `package.json`、`cordis.patch.yml`、`index.mjs`、`client/` | 借鉴配置、作用域、审批和审计思路；不复制代码 | 否 | DSH peer 范围需单独验证 |
| dsh-meow-memory | https://github.com/Phant0Meow/dsh-meow-memory | MIT（`LICENSE`） | `package.json`、`cordis.patch.yml`、`src/`、`docs/configuration-reference.md` | 借鉴分层记忆与首轮/压缩后注入设计；不复制代码 | 否 | 与本仓库 SQLite 记忆职责重叠 |
| dsh-mneme | https://github.com/slow-stack/mneme | MIT（`LICENSE`） | `dsh-mneme/package.json`、`dsh-mneme/cordis.patch.yml`、`dsh-mneme/src/` | 借鉴 SQLite/Markdown 镜像、作用域和 autoDream 边界；不复制代码 | 否 | 依赖范围和职责较重，不能与本仓库双写 |
| dsh-memory-evolve | https://github.com/csyangwen/dsh-memory-evolve | package.json 标 MIT；本阶段未把它作为可分发依赖 | `package.json`、`cordis.patch.yml`、`src/`、`docs/` | 借鉴提议审批、熔断和审计思路；不复制代码 | 否 | `private: true`；完整许可证文本需在引入前再次核验 |
| dsh-her-companion | https://github.com/zhuyun017/dsh-her-companion | README 声明 MIT | `packages/her-companion/`、`examples/persona-repo/`、`README.md` | 借鉴 persona/history/memory 分层与注入隔离；不复制代码 | 否 | Windows/Node 版本和 preset 约束 |
| dsh-companion | https://github.com/LamplitIsles/dsh-companion | Apache-2.0（仓库页面） | `src/`、`cordis.patch.yml`、`README.md` | 借鉴 finalized-only 对话表面和 Host/Browser 分离；不复制代码 | 否 | 锁定 DSH 0.1.2-rc.1，不能直接套用 |
| Aibo / dsh-gal | https://github.com/omdsh-dev/dsh-gal；已迁移至 https://github.com/drewnekota/aibo | BSD-3-Clause（旧仓库页面） | `src/`、`plugins/`、`app/`、`README.md` | 借鉴角色状态、语音和桌面宠物边界；不复制代码 | 否 | 旧仓库已停止维护，平台依赖明显 |
| dsh-plugin-fun | 公开目录条目：https://duink.com/plugins/1358462109 | 未声明 | 仅研究目录描述，未复用源码 | 不复制 | 否 | 许可证和源码入口未充分核验 |
| dsh-soft-sidekick | 未找到可核验的同名公开仓库 | 未确认 | 无 | 不复制 | 否 | 不得把搜索不到当作许可证或兼容性结论 |

Everlasting Ally 只保留自己的 MIT `LICENSE`。若未来实际复制第三方代码，必须把对应版权/许可证文本加入分发物并重新做兼容性审查；当前仅采用独立实现和接口层面的设计借鉴。

