# 隔离 Desktop 实测记录

云端状态：NOT_VERIFIED。Node/Manifest/模拟 Host 验证不代表 Desktop 通过。

记录：测试者日期、Windows 版本、DSH Desktop 完整版本（含 nightly 标识）、Node 版本、包 SHA256、Git commit、官方安装/配置文档来源、隔离 profile 名称、独立数据库路径（提交报告时脱敏）。

先检查隔离 profile 是否还有其他记忆插件；若有，不自动关闭或改动，另建干净 profile，无法确认则 BLOCKED。

| 项目 | PASS/FAIL/BLOCKED/NOT_VERIFIED | 实际证据/错误 |
|---|---|---|
| 官方方式创建隔离 profile | NOT_VERIFIED | |
| 本地 tgz 安装与 Host 加载 | NOT_VERIFIED | |
| ping 工具注册和返回 | NOT_VERIFIED | |
| status 显示默认 disabled | NOT_VERIFIED | |
| 显式开启并传独立路径 | NOT_VERIFIED | |
| 用户、助手、工具事件实际保存 | NOT_VERIFIED | |
| 重启后 recall 返回 Atlas 与来源 ID | NOT_VERIFIED | |
| reflections 返回已存在有来源记录 | NOT_VERIFIED | 无反思记录时空数组是正常结果 |
| 关闭采集后计数不再增长 | NOT_VERIFIED | |
| 停用/卸载/关闭连接/删除测试目录 | NOT_VERIFIED | |
| 恢复原环境 | NOT_VERIFIED | |
| 模型自动接收与使用上下文 | BLOCKED | 无已验证请求前 Hook |

官方流程待确认项：本地包安装命令或设置入口、profile 创建选择语法、配置导出方式、插件原始配置的传递位置、工具的直接调用方式、停用卸载与 Host 完整关闭方式。不得用猜测命令替代。
