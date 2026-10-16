# Windows 新手安装与验收

本项目当前是可运行的本地 TypeScript/SQLite 库。它没有经过验证的 DSH Desktop 私有安装 API，因此下面步骤只使用公开命令和独立测试目录，不修改你的真实记忆数据库。

## 1. 准备项目

在 PowerShell 中执行：

```powershell
git clone --branch feat/windows-memory-acceptance https://github.com/z0-www/Everlasting-Ally.git
cd Everlasting-Ally
```

如果分支尚未推送，请使用 Codex 导出的项目压缩包解压后进入包含 `package.json` 的目录。

## 2. 检查 Node.js 并安装

```powershell
node --version
npm --version
npm ci
npm run build
```

Node.js 需要 22 或更高版本。成功时会生成 `dist\index.js`。

## 3. 运行诊断

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-windows.ps1
```

每项会显示 `PASS`、`FAIL` 或 `UNKNOWN`。脚本不会安装软件、修改环境变量或读取 API Key。

## 4. 运行当前可用的角色记忆演示

```powershell
npm run demo:roleplay
npm run demo:emotional
```

演示使用临时 SQLite 文件，结束后删除。输出应包含已恢复的剧情和来源事件 ID。

## 5. 构建本地安装包

```powershell
npm run package:local
```

成功时会输出 `everlasting-ally-1.0.0-rc.1.tgz`。包中不应包含 `.sqlite` 文件、API Key 或真实聊天记录。

## 6. DSH Desktop 验证

当前仓库没有可确认的公开 DSH Desktop 插件安装命令、manifest 验证器或请求前 Hook。请先确认本机 DSH 版本和官方 profile 命令：

```powershell
dsh --version
dsh --help
dsh profile --help
```

如果 `dsh` 不存在，诊断会显示 `UNKNOWN`。不要猜测菜单名称，也不要直接修改 Desktop 或 web profile。请使用官方文档提供的独立测试 profile 和 `--dump-config` 流程。

## 7. 当前验收边界

已验证的是 SQLite 角色剧情保存、关闭重开、检索、记忆更正和上下文预览。普通 v0.6.1 记忆模块在此仓库中不存在，因此不能声称 `MemoryStorage` 生命周期或真实 DSH 对话自动回忆已通过验证。Windows Desktop 实机测试必须由 Windows 环境执行。

## RC2 集成测试

在项目目录执行 `npm run demo:integrated`。成功时会输出 `crossProcess: "pass"`、`roleplay: "pass"` 和 `fictionExcludedFromReal: "pass"`。旧版 DSH 工具测试可用 `npm test` 一起运行；Windows Desktop 仍需按官方 profile 文档实测。
