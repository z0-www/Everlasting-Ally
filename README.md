# Everlasting Ally

**Public Beta Candidate · 尚未正式稳定发布**

为 DeepSeek Harness 提供本地长期记忆，并提供实验性的角色剧情存储与上下文预览。默认不保存对话，只有显式开启后才写入 SQLite。不需要模型 API Key。

- 当前包：`1.0.0-rc.2`；RC3 准备分支：[feat/public-beta-readiness-rc3](https://github.com/z0-www/Everlasting-Ally/tree/feat/public-beta-readiness-rc3)。Windows CI 与 Desktop 验收未确认前保持 RC2。
- 推荐 **Node.js 24**；package 实际最低要求 **Node.js >=22.5**。没有验证所有 Node 22 版本。
- [下载此测试分支源码](https://github.com/z0-www/Everlasting-Ally/archive/refs/heads/feat/public-beta-readiness-rc3.zip)。main 仍未合并完整实现，请勿下载 main 测试。
- 尚未公开 Release、未发布 npm。预编译 tgz 和 SHA-256 可由 `npm run verify:package` 在本机生成，或在成功的 [Actions](https://github.com/z0-www/Everlasting-Ally/actions) 中下载对应 artifact（如果本次运行实际成功）。

## 现在能测试什么

| 能力 | 状态 |
|---|---|
| 双向事件采集、工具结果、SQLite、规则记忆球、检索、基础反思 | 本地模块及模拟 Host 测试；显式启用 |
| 四个 inside_memory_* 工具、Host apply、manifest | 恢复并自动测试；真实 Desktop 未验证 |
| 角色档案、故事、更正、剧情连续性 | 本地实验模块；没有完整 Desktop 角色管理 UI |
| 普通对话自动回忆/自动上下文注入 | 未验证 Hook，`hook_unavailable`，不承诺模型自动使用记忆 |
| 多用户隔离 | 不支持；仅可信单用户本地使用 |

## 初次测试

在解压后的项目目录打开 PowerShell（见[逐步 Windows 指南](docs/WINDOWS-START-HERE.zh-CN.md)）：

```powershell
node --version
npm ci
npm run build
npm test
npm run verify:manifest
npm run demo:integrated
npm run test:memory-lifecycle
npm run verify:package
```

预期：测试计数非零且无失败；集成演示显示 `crossProcess`、`roleplay`、`fictionExcludedFromReal` 为 `pass`；打包验证显示 `cleanInstall: true`、`entryImport: true`，产物位于 `artifacts/`。演示只使用唯一临时目录，结束关闭数据库并清理。它们不连接 DeepSeek，不生成真实模型回答。

## 显式启用和关闭

[examples/config](examples/config/) 中的 JSON 是正式 `resolveMemoryConfig()` 可读取的插件配置对象，**不是可直接导入 Desktop 的 profile**。从 `capture.json`、`recall.json` 开始，按需选择规则分析或反思，`off.json` 关闭全部记忆。所有示例关闭自动注入与模型反思。

DSH 安装到隔离 profile 的具体命令需要测试者按目标版本官方说明确认。不要改主 profile，不要同时加载其他记忆插件混淆结果。详见[隔离 Desktop 实测协议](docs/verification/desktop-protocol.md)。

## 隐私、删除与反馈

Host 不提供未授权的删除工具。测试数据库必须单独指定；停止插件、关闭全部连接后，按指南删除自己创建的测试目录。角色纠正保留审计，不能把 superseded 等同于物理删除。角色模块仍有待修复的派生删除与可信调用边界问题，勿用于私人数据或共享服务，见[安全复审](docs/verification/security-review.md)。

反馈请使用 [Issues](https://github.com/z0-www/Everlasting-Ally/issues)，附 Node/DSH 版本、命令和脱敏错误；不要上传真实数据库、聊天或凭证。[测试记录表](docs/verification/desktop-protocol.md) 区分 PASS / FAIL / BLOCKED / NOT_VERIFIED。

开发沿革见 [CHANGELOG](CHANGELOG.md) 和 [RC2 合流审计](docs/dsh-merge-audit.md)。未合并 main、未创建正式 Release、未发布 npm。
