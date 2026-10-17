$ErrorActionPreference='Stop'
function Result($name,$state,$detail){Write-Host "$state`t$name`t$detail"}
if($env:OS -ne 'Windows_NT'){Result 'OS' 'BLOCKED' '仅可在 Windows 执行';exit 2}
$node=Get-Command node -ErrorAction SilentlyContinue;if(-not $node){Result 'Node' 'FAIL' '未找到 node';exit 1}
Result 'Node' 'PASS' (node --version)
if(-not (Test-Path '.\dsh-plugin.json')){Result 'Manifest' 'FAIL' '当前目录没有 dsh-plugin.json';exit 1};Result 'Manifest' 'PASS' '文件存在；请运行 npm run verify:manifest'
$package=Get-ChildItem '.\artifacts\everlasting-ally-*.tgz' -ErrorAction SilentlyContinue|Select-Object -First 1;if($package){$hash=(Get-FileHash $package.FullName -Algorithm SHA256).Hash.ToLower();Result 'Package' 'PASS' "$($package.Name) SHA256=$hash"}else{Result 'Package' 'BLOCKED' '先运行 npm run verify:package'}
$dsh=Get-Command dsh -ErrorAction SilentlyContinue;if($dsh){Result 'DSH CLI' 'UNKNOWN' '已找到；请只使用该版本官方帮助中的 profile/插件命令'}else{Result 'DSH CLI' 'NOT_VERIFIED' '未找到 dsh；不能猜测 Desktop 安装命令'}
Write-Host '';Write-Host '下一步：使用 docs/verification/windows-desktop-acceptance.md，在独立 profile 中手动记录 PASS/FAIL/BLOCKED/NOT_VERIFIED。脚本不修改 profile、不禁用插件、不删除数据库、不读取凭证。'
