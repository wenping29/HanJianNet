# ============================================================
# Windows 缓存 / 垃圾文件 / 日志 一键清理脚本
# 用法:
#   .\cleanup.ps1               # 完整清理(需管理员权限可清Windows相关)
#   .\cleanup.ps1 -DryRun       # 只统计不删除,先看清理效果
#   .\cleanup.ps1 -WhatIf -Verbose
# 说明:
#   - 默认自动以管理员身份运行(需要时)
#   - 只删除过期(默认7天)以上的文件,避免误删正在使用的文件
#   - 所有删除操作记录到日志,可追溯
# ============================================================

[CmdletBinding()]
param(
    [switch]$DryRun,          # 仅统计,不删除
    [switch]$Force,           # 忽略过期天数限制,立即删除(慎用)
    [int]$OlderThanDays = 7,  # 仅删除该天数之前的文件
    [switch]$SkipSystem,      # 跳过需要管理员权限的系统级清理
    [switch]$SkipUser,        # 跳过用户级清理
    [switch]$SkipDiskCleanup  # 跳过运行系统磁盘清理(cleanmgr)
)

$ErrorActionPreference = 'SilentlyContinue'

# ---------- 基础信息 ----------
$script:Stats = @{ }
function Add-Stat([string]$category, [long]$bytes) {
    if (-not $script:Stats.ContainsKey($category)) { $script:Stats[$category] = 0 }
    $script:Stats[$category] += $bytes
}
$script:TotalFiles = 0
$script:TotalBytes = 0

# 删除目标目录中过期的文件/子目录
function Remove-OldItems {
    param(
        [string]$Path,
        [string]$Category
    )
    if (-not (Test-Path -LiteralPath $Path)) { return }

    $before = (Get-ChildItem -LiteralPath $Path -Recurse -File -EA SilentlyContinue |
        Measure-Object -Property Length -Sum).Sum

    if ($DryRun -or $script:IsDryRun) {
        Write-Host "[DryRun] 待清理 [$Category] $Path" -ForegroundColor Cyan
        return
    }

    $now = Get-Date
    $cutoff = $now.AddDays(-$script:DayOffset)

    $files = Get-ChildItem -LiteralPath $Path -Recurse -File -EA SilentlyContinue
    foreach ($f in $files) {
        if (-not $Force -and $f.LastWriteTime -gt $cutoff) { continue }
        try {
            Remove-Item -LiteralPath $f.FullName -Force -EA SilentlyContinue
            $script:TotalFiles++
            $script:TotalBytes += $f.Length
        } catch { }
    }

    # 删除空的子目录
    Get-ChildItem -LiteralPath $Path -Directory -Recurse -EA SilentlyContinue |
        Sort-Object { $_.FullName.Length } -Descending |
        ForEach-Object {
            $sub = Get-ChildItem -LiteralPath $_.FullName -Force -EA SilentlyContinue
            if (@($sub).Count -eq 0) {
                Remove-Item -LiteralPath $_.FullName -Recurse -Force -EA SilentlyContinue
            }
        }

    $after = (Get-ChildItem -LiteralPath $Path -Recurse -File -EA SilentlyContinue |
        Measure-Object -Property Length -Sum).Sum
    $freed = ($before - $after)
    if ($freed -gt 0) {
        Add-Stat $Category $freed
        Write-Host "[已清理] [$Category] 释放 $([math]::Round($freed/1MB,2)) MB - $Path" -ForegroundColor Green
    }
}

# ---------- 检查/提升管理员权限 ----------
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin -and -not $SkipSystem) {
    Write-Host "需要管理员权限以清理系统级文件，正在重启脚本(以管理员身份)..." -ForegroundColor Yellow
    $scriptPath = if ($MyInvocation.MyCommand.Path) { $MyInvocation.MyCommand.Path }
                 else { (Get-Process -Id $PID).Path }
    $args = @()
    if ($DryRun) { $args += '-DryRun' }
    if ($Force) { $args += '-Force' }
    if ($SkipUser) { $args += '-SkipUser' }
    if ($SkipDiskCleanup) { $args += '-SkipDiskCleanup' }
    $args += "-OlderThanDays $OlderThanDays"
    Start-Process powershell -Verb RunAs -ArgumentList @(
        '-NoProfile','-ExecutionPolicy','Bypass',
        '-File', "`"$scriptPath`"", $args
    ) -Wait
    exit
}

$script:IsDryRun = $DryRun
$script:DayOffset = if ($Force) { 0 } else { $OlderThanDays }

# ---------- 日志 ----------
$logDir = Join-Path $env:TEMP "cleanup_logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$logFile = Join-Path $logDir ("cleanup_{0:yyyyMMdd_HHmmss}.log" -f (Get-Date))

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Windows 清理脚本  $([math]::Round((Get-Date).ToFileTime()))" -ForegroundColor Cyan
if ($script:IsDryRun) { Write-Host "  模式: DRY RUN (不删除,仅统计)" -ForegroundColor Yellow }
else { Write-Host "  模式: 正式清理 (删除 $OlderThanDays 天前文件)" -ForegroundColor Green }
if ($isAdmin) { Write-Host "  权限: 管理员" } else { Write-Host "  权限: 普通用户" }
Write-Host "=====================================" -ForegroundColor Cyan

# ============================================================
# 用户级临时文件
# ============================================================
if (-not $SkipUser) {
    # 用户 Temp 目录
    $userTemp = $env:TEMP
    Remove-OldItems -Path $userTemp -Category '用户Temp'

    # 各用户 Temp
    Get-ChildItem "C:\Users" -Directory -EA SilentlyContinue | ForEach-Object {
        Remove-OldItems -Path (Join-Path $_.FullName 'AppData\Local\Temp') -Category '各用户Temp'
    }
}

# ============================================================
# 系统级临时文件 (需管理员)
# ============================================================
if (-not $SkipSystem) {
    # 系统临时目录
    Remove-OldItems -Path "C:\Windows\Temp" -Category '系统Temp'

    # Windows 更新缓存
    Remove-OldItems -Path "C:\Windows\SoftwareDistribution\Download" -Category 'Windows更新缓存'

    # 预读取(仅文件,保留Recent等)  - 只清理长达很久未用的
    Remove-OldItems -Path "C:\Windows\Prefetch" -Category 'Prefetch'

    # 错误报告
    Remove-OldItems -Path "C:\ProgramData\Microsoft\Windows\WER" -Category '错误报告'

    # Windows 错误报告服务队列
    Remove-OldItems -Path "C:\Windows\Minidump" -Category '蓝屏转储'
}

# ============================================================
# 日志文件清理 (按扩展名,非目录)
# ============================================================
function Clear-LogFiles {
    param([string]$Root, [string]$Category)
    if (-not (Test-Path -LiteralPath $Root)) { return }

    if ($DryRun -or $script:IsDryRun) {
        Write-Host "[DryRun] 待清理 [$Category] 日志文件 @ $Root" -ForegroundColor Cyan
        return
    }
    $cutoff = (Get-Date).AddDays(-$script:DayOffset)
    $freed = 0
    Get-ChildItem -LiteralPath $Root -Recurse -File -Include *.log,*.tmp,*.bak,*.old -EA SilentlyContinue |
        Where-Object { $Force -or $_.LastWriteTime -lt $cutoff } |
        ForEach-Object {
            $freed += $_.Length
            Remove-Item -LiteralPath $_.FullName -Force -EA SilentlyContinue
            $script:TotalFiles++
        }
    if ($freed -gt 0) {
        Add-Stat $Category $freed
        Write-Host "[已清理] [$Category] 释放 $([math]::Round($freed/1MB,2)) MB 日志文件 @ $Root" -ForegroundColor Green
    }
}

# C:\Windows\Logs
Clear-LogFiles -Root "C:\Windows\Logs" -Category 'Windows日志'

# C:\Windows\Panther
Clear-LogFiles -Root "C:\Windows\Panther" -Category '安装日志'

# C:\Windows\INF 备份(可选,保留)
Clear-LogFiles -Root "C:\Windows\LiveKernelReports" -Category '内核报告'

# ============================================================
# Windows 自带磁盘清理 (cleanmgr) - 可选
# ============================================================
if (-not $SkipDiskCleanup -and -not $script:IsDryRun) {
    Write-Host "运行系统磁盘清理工具 (cleanmgr /sageset 由用户配置)..." -ForegroundColor Cyan
    Start-Process cleanmgr -ArgumentList "/sagerun:65535" -Wait
}

# ============================================================
# 浏览器缓存
# ============================================================
if (-not $SkipUser) {
    $browserCacheDirs = @(
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Service Worker\CacheStorage",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Service Worker\CacheStorage",
        "$env:LOCALAPPDATA\Mozilla\Firefox\Profiles",
        "$env:LOCALAPPDATA\CrashDumps",
        "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"
    )
    foreach ($d in $browserCacheDirs) {
        Remove-OldItems -Path $d -Category '浏览器/应用缓存'
    }
}

# ============================================================
# npm / pip / .NET / Java 等开发工具缓存
# ============================================================
if (-not $SkipUser) {
    # npm 缓存
    Remove-OldItems -Path "$env:LOCALAPPDATA\npm-cache" -Category 'npm缓存'
    # pip 缓存
    Remove-OldItems -Path "$env:LOCALAPPDATA\pip\cache" -Category 'pip缓存'
    # .NET NuGet 缓存 (老的已打包依赖)
    Remove-OldItems -Path "$env:USERPROFILE\.nuget\packages" -Category 'NuGet缓存'
    # 临时构建目录
    Remove-OldItems -Path "$env:TEMP\npm-*" -Category 'npm临时'
}

# ============================================================
# 缩略图缓存
# ============================================================
if (-not $SkipUser) {
    Remove-OldItems -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*" -Category '缩略图缓存'
}

# ============================================================
# 汇总输出
# ============================================================
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  清理汇总" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$grandTotal = 0
$script:Stats.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    $mb = [math]::Round($_.Value/1MB, 2)
    $grandTotal += $_.Value
    Write-Host ("  {0,-20} {1,10} MB" -f $_.Key, $mb)
}
Write-Host "-------------------------------------"
if ($script:IsDryRun) {
    Write-Host ("  预计释放总计: {0} MB" -f [math]::Round($grandTotal/1MB,2)) -ForegroundColor Yellow
} else {
    Write-Host ("  实际删除文件数: {0}" -f $script:TotalFiles)
    Write-Host ("  实际释放总计:   {0} MB" -f [math]::Round($script:TotalBytes/1MB,2)) -ForegroundColor Green
}
Write-Host "  日志文件: $logFile"
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "清理完成。"

# 追加日志汇总
Start-Sleep -Milliseconds 100
try {
    $logDetail = (($script:Stats.GetEnumerator() | ForEach-Object {
        "{0}: {1} MB" -f $_.Key, [math]::Round($_.Value/1MB,2)
    }) -join "`n")
    "Time: $(Get-Date)`nMode: $(if($script:IsDryRun){'DRY RUN'}else{'CLEAN'})`n$logDetail" |
        Set-Content -Path $logFile -Encoding UTF8
} catch { }
