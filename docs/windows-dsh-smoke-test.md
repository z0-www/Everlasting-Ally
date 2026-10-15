# Windows DSH Desktop v0.6.1 smoke test

这份文档只记录可观察的检查步骤。云端环境不能代替本机 Windows DSH Desktop
实测；如果某个菜单名称与安装版本不同，请使用 DSH 的插件管理器或日志面板定位
同一功能，不要修改插件代码来猜测 UI。

## 运行时和插件

1. 在 DSH Desktop 的关于或诊断页面记录 DSH 版本。
2. 在 DSH 使用的终端检查 Node.js 版本；本插件的 node:sqlite 需要 Node.js 22.5
   或更高版本。
3. 在仓库目录运行 npm ci、npm run build。
4. 按该版本 DSH 文档支持的本地插件加载方式加载仓库或打包后的 npm 包。
   本仓库没有假设一个未核实的 Desktop 菜单名称。
5. 如果 DSH 要求 profile bundle，确认 bundle 配置中的 memory.enabled、
   recallEnabled、reflectionEnabled 默认均为 false。

## 基本检查

使用虚构内容，例如“我们测试了示例项目”。先调用 inside_memory_ping，再调用
inside_memory_status，确认工具注册和状态输出中没有消息正文。

如需本地保存，用户应明确编辑受支持的插件配置，把 memory.enabled 设为 true。
如需回忆，再明确启用 memory.recallEnabled。反思需要单独启用
memory.reflectionEnabled，并通过受信任程序接口触发；没有自动后台任务。

开始一个会话，发送一条虚构的用户消息和助手回复，关闭并重新启动 DSH，再在新会话
调用 inside_memory_recall。预期只返回带证据事件 ID 的历史摘要。没有可靠匹配时
应返回“未找到足够可靠的记忆”。

inside_memory_reflections 只读已有反思。v0.6.1 不声称 DSH 已提供可用的模型请求前
上下文 Hook，因此自动回忆默认不会注入模型请求；请把这一点记录在测试结果中。

## 删除和日志

使用受信任的程序接口删除测试会话或全部测试数据，再查询确认为空。不要把删除接口
暴露成无确认的模型工具。确认数据库路径位于 Windows 应用数据目录下的
everlasting-ally/memory.sqlite，不在 Git 工作区。

失败时只收集 DSH 版本、Node 版本、工具名称、错误类型和数据库状态。日志中不要包含
聊天正文、工具参数、令牌或数据库文件。
