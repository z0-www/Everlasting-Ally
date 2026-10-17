# Windows 初学者从这里开始

目前是 RC3 准备分支、RC2 包。推荐 Node 24；最低 engines 为 22.5，不能保证所有 Node 22 均通过。所有本地演示使用虚构输入，不用密钥，也不会连接 DSH。

## 1 下载并打开 PowerShell

从 README 的 `feat/public-beta-readiness-rc3` ZIP 链接下载，右键解压，进入含 package.json 的文件夹，在地址栏输入 `powershell` 回车。也可用 Git：

```powershell
git clone --branch feat/public-beta-readiness-rc3 https://github.com/z0-www/Everlasting-Ally.git
cd Everlasting-Ally
```

成功会看到 package.json、src、examples。报找不到目录：确认进入解压后的内层目录。这一步只新增项目文件，不改 DSH。

## 2 检查运行环境

```powershell
node --version
npm.cmd --version
$PSVersionTable.PSVersion
```

推荐 node 输出 v24.x。找不到 node/npm 时，从 Node 官方安装 LTS，再重新打开 PowerShell。npm.ps1 被执行策略阻止时，下文将 `npm` 换成 `npm.cmd`，不要全局放宽系统执行策略。此步骤只读取环境。

## 3 安装并诊断

```powershell
npm ci
npm run build
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-windows.ps1
npm run verify:manifest
```

预期无非零退出；诊断逐项 PASS/FAIL/UNKNOWN，manifest 命令通过才证明 Schema 可解析。依赖下载失败检查网络；不要禁用 TLS 或包校验。build 找不到 tsc 时先解决 npm ci。只写项目 node_modules/dist，不改 DSH，不需要管理员。

## 4 验证本地功能

```powershell
npm test
npm run test:memory-lifecycle
npm run demo:integrated
npm run demo:roleplay-continuity
```

预期测试数非零、fail 0；集成演示显示跨进程恢复 pass；角色演示有来源 ID、otherCharacterSources 为空。失败请保留脱敏错误和 Node 版本，不继续安装到真实 DSH。只在唯一临时目录写测试数据，finally 关闭并清理。此步骤不是 Desktop 实测。

## 5 制作/验证候选包

```powershell
npm run verify:package
Get-ChildItem .\artifacts\
Get-FileHash .\artifacts\everlasting-ally-1.0.0-rc.2.tgz -Algorithm SHA256
Get-Content .\artifacts\everlasting-ally-1.0.0-rc.2.tgz.sha256
```

预期 cleanInstall/entryImport 为 true；SHA256 与校验文件一致。只写项目 artifacts 和临时安装目录。候选包是 npm 本地包，能导入 apply 不代表 Desktop 已加载。没有公开 Release 时不要寻找不存在的下载资产。

## 6 隔离 DSH 测试——需要测试者确认

不要修改主 profile，也不要自动禁用别人的插件。请按本机 DSH Desktop 官方帮助记录完整版本、支持的 profile 创建/选择方式、本地插件安装方式和配置导出方式。若机器提供 `dsh` 可先查看：

```powershell
Get-Command dsh -ErrorAction SilentlyContinue
dsh --help
```

若没有该命令，或帮助未列出对应操作，停止安装，记录 BLOCKED。**这里未确认 Desktop 0.2.0-rc.2 的安装命令、菜单或配置路径，不应猜测。** 将官方说明/脱敏帮助提供给维护者。测试表见 [desktop-protocol.md](verification/desktop-protocol.md)。

## 7 明确启用测试采集

使用官方确认的隔离 profile 配置入口，把 [examples/config/recall.json](../examples/config/recall.json) 中 memory 对象传给插件；先把 databasePath 替换为自己新建的绝对测试路径。它不是完整 profile 文件，不可凭空导入。模型反思和自动注入保持 false。

启动后，调用 inside_memory_ping，再调用 inside_memory_status。预期 enabled=true、databaseStatus=ready；工具不存在则先排查插件加载，不要认为模型一定会自动调用。该步骤开始保存测试 profile 的内容，因此只写虚构对话。

## 8 两次真实会话验收

会话 A 输入：`虚构测试：Atlas 项目选择蓝色按钮。`，让助手回答。确认 status 计数增加。关闭会话，重启测试 profile，再开会话 B，通过目标 DSH 已验证的工具调用方式执行 inside_memory_recall，query 为 `Atlas`。预期返回来源事件 ID，内容匹配 A。返回空不等于失败：先检查 enabled/recallEnabled、路径、计数和实际事件监听。

这一步必须测试者在 Desktop 完成。即使工具成功，也不能认定普通模型自动记忆或自动注入已成功。

## 9 关闭、删除与恢复

把同一隔离 profile 的 memory.enabled 和 recallEnabled 改为 false，再停用插件并关闭该测试 Host。不要只关闭对话窗口就假设数据库已释放。记录原配置并按官方方式恢复；卸载指令需从目标版本官方帮助确认。

仅在确认数据库是你刚创建的测试目录、所有连接已关闭时执行：

```powershell
$testDirectory = Read-Host '输入你自己创建的测试数据目录完整路径'
Get-ChildItem -LiteralPath $testDirectory
Remove-Item -LiteralPath $testDirectory -Recurse -Confirm
```

这是真正删除数据的危险步骤，看到私人文件时取消。不要用默认 DSH 目录代替测试目录，不要上传数据库。禁用采集不会删除已有历史。文件占用时确认 Host 已关闭后重试，不强制杀死未知进程。
