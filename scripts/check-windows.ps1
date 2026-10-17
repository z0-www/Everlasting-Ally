$ErrorActionPreference = 'Continue'
function Check($name, $ok, $detail) { if ($ok) { Write-Host "PASS  $name - $detail" -ForegroundColor Green } else { Write-Host "FAIL  $name - $detail" -ForegroundColor Red } }
function Unknown($name, $detail) { Write-Host "UNKNOWN  $name - $detail" -ForegroundColor Yellow }
Check 'Windows' ($env:OS -eq 'Windows_NT') "OS=$env:OS"
$git=Get-Command git -ErrorAction SilentlyContinue; Check 'Git' ($null -ne $git) 'git 命令可用'
$node=Get-Command node -ErrorAction SilentlyContinue; Check 'Node.js' ($null -ne $node) 'node 命令可用'
if ($node) { $v=(node -p "process.versions.node"); $major=[int]($v.Split('.')[0]); Check 'Node.js version' ([version]$v -ge [version]'22.5.0') "$v (最低 22.5，推荐并在 CI 测试 Node 24，非所有 Node 22 均验证)"; $sqlite=(node -e "require('node:sqlite'); console.log('ok')" 2>$null); Check 'node:sqlite' ($sqlite -eq 'ok') '内置 SQLite 可加载' }
$npm=Get-Command npm -ErrorAction SilentlyContinue; Check 'npm' ($null -ne $npm) 'npm 命令可用'
Check '源码目录' (Test-Path './src') '当前目录存在 src'
try { $package = Get-Content './package.json' -Raw | ConvertFrom-Json; Check 'package.json' ($null -ne $package.name) 'JSON 可以解析' } catch { Check 'package.json' $false 'JSON 无效或不在源码目录' }
Check '构建输出' (Test-Path './dist/index.js') 'dist/index.js 存在；先运行 npm run build'
$dsh=Get-Command dsh -ErrorAction SilentlyContinue; if ($dsh) { Check 'DSH CLI' $true '已找到 dsh；请运行 dsh --help 查看插件命令' } else { Unknown 'DSH CLI' '当前 PATH 没有 dsh；不能判断 Desktop profile 或插件 API' }
if (Test-Path './dsh-plugin.json') { Unknown 'manifest' '发现 dsh-plugin.json；请运行 npm run verify:manifest 验证 Schema，存在文件不等于通过验证' } else { Unknown 'manifest' '仓库没有 dsh-plugin.json，不能验证 DSH manifest' }
Write-Host ''
Write-Host '总结：脚本只读检查本机环境，不安装软件、不读取密钥、不修改配置。DSH Desktop 集成必须在 Windows 实机按官方文档验证。' -ForegroundColor Cyan
