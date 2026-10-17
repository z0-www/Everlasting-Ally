# 显式测试配置（不是 DSH profile）

这些 JSON 是插件 rawConfig 对象，正式业务使用 `resolveMemoryConfig(rawConfig)`。相对 databasePath 相对于 Host 当前工作目录；请在隔离目录运行，或在本机替换为自己创建的绝对测试路径。不要指向已有私人数据库。

- capture.json：只保存用户/助手/工具事件。
- recall.json：保存和只读工具检索。
- analysis.json：加上本地规则记忆球分析。
- reflection.json：启用规则反思能力；读取 reflections 工具不会自动生成反思，需程序显式调用 reflectSession。
- off.json：不写新记录、不检索；不会删除旧文件。

模型反思和自动注入始终关闭。由 DSH 官方支持的配置位置传递这些字段；没有确认 Desktop profile 加载语法前，不要把 JSON 当成可导入 profile。

检查配置（不打开数据库）：

```powershell
node --input-type=module -e "import fs from 'node:fs'; import {resolveMemoryConfig} from './dist/memory/config.js'; const c=resolveMemoryConfig(JSON.parse(fs.readFileSync('examples/config/recall.json','utf8'))); console.log({enabled:c.enabled,recallEnabled:c.recallEnabled,databasePath:c.databasePath})"
```

删除：停用测试 profile，确认所有连接关闭，然后只删除自己创建的 `ally-test-data` 目录。关闭配置不等于清空历史。
