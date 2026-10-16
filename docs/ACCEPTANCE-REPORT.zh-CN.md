# Windows 记忆验收报告

## 实际运行通过

- `npm_config_cache=/tmp/npm-cache npm ci`
- `npm run build`
- `npm test`：14 个测试通过
- 角色 SQLite 跨进程恢复、角色/世界/分支隔离、剧情更正和上下文预览
- `npm run demo:roleplay`
- `npm run demo:emotional`
- `npm pack --dry-run`

## 阻塞与未运行

需求要求的 `MemoryStorage`、`MemoryCapture`、`MemoryRecallService`、`MemoryOrbService` 和 `ReflectionService` 在当前仓库不存在；因此没有伪造 `demo:memory`，也没有宣称 v0.6.1 真实记忆闭环通过。仓库没有 `dsh-plugin.json` 或可验证 DSH CLI。

## 需要 Windows 手动验证

- `scripts/check-windows.ps1`
- DSH Desktop 真实版本、profile、插件加载和工具注册
- 真实请求前 Hook、自动上下文注入和真实 DS 对话回忆

## 安全边界

本地角色记忆限定为单用户场景。诊断脚本只读，不安装软件、不修改系统变量、不输出数据库正文或凭证。MVP 演示使用临时数据库并在结束时清理。
