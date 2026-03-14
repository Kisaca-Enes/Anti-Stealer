#Requires -Version 5.1
<#
    NullStealer Anti-Stealer Setup (PowerShell Only)
    - Ana dosyalari indirir
    - kural.txt icindeki YARA linklerini okuyup rules\ klasorune indirir
    - Python kontrol eder
    - Gerekli pip paketlerini kurar
    - Launcher (.cmd) olusturur
    - Masaustu kisayolu (.lnk) olusturur
#>

$ErrorActionPreference = 'Continue'

# ============================================================
# AYARLAR
# ============================================================
$AppName   = "NullStealer Anti-Stealer"
$AppDir    = Join-Path $env:USERPROFILE "Desktop\NullStealer-AntiStealer"
$RulesDir  = Join-Path $AppDir "rules"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KuralTxt  = Join-Path $ScriptDir "kural.txt"

# Raw base URL
$BaseRaw = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/NullStealer(Anti-Stealer)"

# Ana dosyalar
$MainFiles = @(
    "FullScan.ps1",
    "QuickScan.ps1",
    "UI.py",
    "app.py",
    "network.ps1",
    "YaraScan.ps1",
    "yara64.exe"
)

# ============================================================
# YARDIMCI FONKSIYONLAR
# ============================================================

function Write-Info($msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
    Write-Host "[OK]   $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Write-Err($msg) {
    Write-Host "[ERR]  $msg" -ForegroundColor Red
}

function Convert-ToRawUrl {
    param(
        [Parameter(Mandatory = $true)]
        [string]$InputUrl
    )

    if ([string]::IsNullOrWhiteSpace($InputUrl)) {
        return $null
    }

    $u = $InputUrl.Trim()

    # Zaten raw ise
    if ($u -match '^https?://raw\.githubusercontent\.com/') {
        return $u
    }

    # github.com/.../blob/... -> raw
    if ($u -match '^https?://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)$') {
        $owner  = $Matches[1]
        $repo   = $Matches[2]
        $branch = $Matches[3]
        $path   = $Matches[4]
        return "https://raw.githubusercontent.com/$owner/$repo/$branch/$path"
    }

    # github.com/.../raw/... -> raw
    if ($u -match '^https?://github\.com/([^/]+)/([^/]+)/raw/([^/]+)/(.+)$') {
        $owner  = $Matches[1]
        $repo   = $Matches[2]
        $branch = $Matches[3]
        $path   = $Matches[4]
        return "https://raw.githubusercontent.com/$owner/$repo/$branch/$path"
    }

    return $u
}

function Ensure-Directory {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    try {
        if (-not (Test-Path $Path)) {
            New-Item -ItemType Directory -Path $Path -Force | Out-Null
        }

        if (Test-Path $Path) {
            return $true
        }

        return $false
    }
    catch {
        Write-Err "Klasor olusturulamadi: $Path"
        Write-Err $_.Exception.Message
        return $false
    }
}

function Download-File {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourceUrl,

        [Parameter(Mandatory = $true)]
        [string]$Destination
    )

    try {
        $rawUrl = Convert-ToRawUrl $SourceUrl

        $parent = Split-Path -Parent $Destination
        if (-not (Test-Path $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }

        Write-Host "      -> $rawUrl"

        # TLS iyilestirme
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        } catch {}

        Invoke-WebRequest -Uri $rawUrl -OutFile $Destination -UseBasicParsing

        if (Test-Path $Destination) {
            return $true
        }
        else {
            Write-Err "Dosya olusmadi: $Destination"
            return $false
        }
    }
    catch {
        Write-Err "Indirme basarisiz: $SourceUrl"
        Write-Err $_.Exception.Message
        return $false
    }
}

function Get-SafeRuleName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    try {
        $raw = Convert-ToRawUrl $Url
        $uri = [System.Uri]$raw
        $name = [System.IO.Path]::GetFileName($uri.AbsolutePath)

        if ([string]::IsNullOrWhiteSpace($name)) {
            $name = "rule_$([guid]::NewGuid().ToString()).yar"
        }

        return $name
    }
    catch {
        return "rule_$([guid]::NewGuid().ToString()).yar"
    }
}

function Download-MainFiles {
    Write-Info "Ana dosyalar indiriliyor..."

    foreach ($file in $MainFiles) {
        $url  = "$BaseRaw/$file"
        $dest = Join-Path $AppDir $file

        Write-Host "   - $file" -ForegroundColor White
        $ok = Download-File -SourceUrl $url -Destination $dest

        if ($ok) {
            Write-Ok "$file indirildi"
        }
        else {
            Write-Warn "$file indirilemedi"
        }
    }
}

function Download-RulesFromTxt {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TxtPath,

        [Parameter(Mandatory = $true)]
        [string]$TargetRulesDir
    )

    if (-not (Test-Path $TxtPath)) {
        Write-Warn "kural.txt bulunamadi: $TxtPath"
        return
    }

    if (-not (Ensure-Directory $TargetRulesDir)) {
        Write-Err "rules klasoru olusturulamadi: $TargetRulesDir"
        return
    }

    Write-Info "kural.txt icindeki YARA kurallari indiriliyor..."

    $lines = Get-Content -Path $TxtPath -Encoding UTF8
    $total = 0
    $okCount = 0

    foreach ($line in $lines) {
        $l = $line.Trim()

        if ([string]::IsNullOrWhiteSpace($l)) { continue }
        if ($l.StartsWith('#')) { continue }
        if ($l.StartsWith(';')) { continue }

        $raw = Convert-ToRawUrl $l
        $fileName = Get-SafeRuleName $raw

        if ($fileName -notmatch '\.(yar|yara)$') {
            Write-Warn "Atlandi (YARA degil): $raw"
            continue
        }

        $dest = Join-Path $TargetRulesDir $fileName

        $total++
        Write-Host "   - $fileName" -ForegroundColor White

        $ok = Download-File -SourceUrl $raw -Destination $dest
        if ($ok) {
            $okCount++
            Write-Ok "$fileName indirildi"
        }
        else {
            Write-Warn "$fileName indirilemedi"
        }
    }

    Write-Host ""
    Write-Info "Toplam rule: $total | Basarili: $okCount"
}

function Find-PythonCommand {
    # py launcher varsa 3.12 > 3.11 > 3
    try {
        $null = Get-Command py -ErrorAction Stop

        & py -3.12 -c "import sys; print(sys.version)" *> $null
        if ($LASTEXITCODE -eq 0) { return "py -3.12" }

        & py -3.11 -c "import sys; print(sys.version)" *> $null
        if ($LASTEXITCODE -eq 0) { return "py -3.11" }

        & py -3 -c "import sys; print(sys.version)" *> $null
        if ($LASTEXITCODE -eq 0) { return "py -3" }
    }
    catch {}

    # python.exe varsa
    try {
        $null = Get-Command python -ErrorAction Stop
        & python -c "import sys; print(sys.version)" *> $null
        if ($LASTEXITCODE -eq 0) { return "python" }
    }
    catch {}

    return $null
}

function Invoke-PythonCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PyCmd,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    # "py -3.11" gibi string'i guvenli parse et
    $parts = $PyCmd -split '\s+'
    $exe = $parts[0]
    $preArgs = @()

    if ($parts.Count -gt 1) {
        $preArgs = $parts[1..($parts.Count - 1)]
    }

    & $exe @preArgs @Arguments
    return $LASTEXITCODE
}

function Install-PythonPackages {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PyCmd
    )

    Write-Info "Python paketleri kuruluyor..."

    # pip var mi?
    Invoke-PythonCommand -PyCmd $PyCmd -Arguments @("-m", "pip", "--version") | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Info "pip hazirlaniyor..."
        Invoke-PythonCommand -PyCmd $PyCmd -Arguments @("-m", "ensurepip", "--upgrade") | Out-Null
    }

    Write-Info "pip guncelleniyor..."
    Invoke-PythonCommand -PyCmd $PyCmd -Arguments @("-m", "pip", "install", "--upgrade", "pip") | Out-Null

    Write-Info "flask kuruluyor..."
    Invoke-PythonCommand -PyCmd $PyCmd -Arguments @("-m", "pip", "install", "flask") | Out-Null

    Write-Info "pywebview kuruluyor..."
    Invoke-PythonCommand -PyCmd $PyCmd -Arguments @("-m", "pip", "install", "pywebview") | Out-Null

    Write-Ok "Python paket kurulumu tamamlandi"
}

function Create-Launcher {
    $launcherPath = Join-Path $AppDir "Launch_NullStealer.cmd"

    $content = @"
@echo off
setlocal
cd /d "$AppDir"

where py >nul 2>&1
if %errorlevel%==0 (
    py -3.12 -c "import sys" >nul 2>&1 && goto RUN312
    py -3.11 -c "import sys" >nul 2>&1 && goto RUN311
    py -3 -c "import sys" >nul 2>&1 && goto RUN3
)

where python >nul 2>&1
if %errorlevel%==0 goto RUNPY

echo Python bulunamadi. Lutfen Python 3.11 veya 3.12 kur.
pause
exit /b 1

:RUN312
py -3.12 "$AppDir\UI.py"
goto END

:RUN311
py -3.11 "$AppDir\UI.py"
goto END

:RUN3
py -3 "$AppDir\UI.py"
goto END

:RUNPY
python "$AppDir\UI.py"

:END
endlocal
"@

    try {
        Set-Content -Path $launcherPath -Value $content -Encoding ASCII
        if (Test-Path $launcherPath) {
            Write-Ok "Launcher olusturuldu: $launcherPath"
        }
        else {
            Write-Warn "Launcher olusturulamadi"
        }
    }
    catch {
        Write-Err "Launcher olusturma hatasi"
        Write-Err $_.Exception.Message
    }
}

function Create-DesktopShortcut {
    $desktop = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktop "$AppName.lnk"
    $targetPath = Join-Path $AppDir "Launch_NullStealer.cmd"

    if (-not (Test-Path $targetPath)) {
        Write-Warn "Launcher bulunamadi, kisayol olusturulamadi: $targetPath"
        return
    }

    try {
        $ws = New-Object -ComObject WScript.Shell
        $sc = $ws.CreateShortcut($shortcutPath)
        $sc.TargetPath = $targetPath
        $sc.WorkingDirectory = $AppDir
        $sc.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
        $sc.Description = "NullStealer Anti-Stealer Baslatici"
        $sc.Save()

        if (Test-Path $shortcutPath) {
            Write-Ok "Masaustu kisayolu olusturuldu: $shortcutPath"
        }
        else {
            Write-Warn "Masaustu kisayolu olusturulamadi"
        }
    }
    catch {
        Write-Err "Kisayol olusturma hatasi"
        Write-Err $_.Exception.Message
    }
}

function Start-AppPrompt {
    $launcher = Join-Path $AppDir "Launch_NullStealer.cmd"

    if (-not (Test-Path $launcher)) {
        return
    }

    $answer = Read-Host "Simdi baslatmak ister misin? (E/H)"
    if ($answer -match '^(e|E|y|Y)$') {
        Start-Process -FilePath $launcher -WorkingDirectory $AppDir
    }
}

# ============================================================
# BASLANGIC
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host "  $AppName Kurulum Basladi" -ForegroundColor DarkCyan
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host ""

Write-Host "Kurulum klasoru: $AppDir"
Write-Host "Rules klasoru  : $RulesDir"
Write-Host "kural.txt yolu : $KuralTxt"
Write-Host ""

# Klasorleri olustur
if (-not (Ensure-Directory $AppDir)) {
    Write-Err "Kurulum klasoru hazirlanamadi."
    Read-Host "Cikis icin Enter"
    exit 1
}

if (-not (Ensure-Directory $RulesDir)) {
    Write-Err "rules klasoru hazirlanamadi."
    Read-Host "Cikis icin Enter"
    exit 1
}

Write-Ok "Klasorler hazir"
Write-Host ""

# 1) Ana dosyalar
Download-MainFiles
Write-Host ""

# 2) Rules
if (Test-Path $KuralTxt) {
    Write-Ok "kural.txt bulundu"
    Download-RulesFromTxt -TxtPath $KuralTxt -TargetRulesDir $RulesDir
}
else {
    Write-Warn "kural.txt bulunamadi, rules indirme atlandi"
}
Write-Host ""

# 3) Python
Write-Info "Python kontrol ediliyor..."
$PyCmd = Find-PythonCommand

if ($null -eq $PyCmd) {
    Write-Warn "Python bulunamadi."
    Write-Host "Lutfen Python 3.11 veya 3.12 kur:"
    Write-Host "https://www.python.org/downloads/"
    Write-Host "Kurarken 'Add Python to PATH' secenegini isaretle."
}
else {
    Write-Ok "Python bulundu: $PyCmd"
    Write-Host ""

    # 4) Paketler
    Install-PythonPackages -PyCmd $PyCmd
}
Write-Host ""

# 5) Launcher
Create-Launcher

# 6) Shortcut
Create-DesktopShortcut

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Kurulum Tamamlandi" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proje klasoru: $AppDir"
Write-Host "Kural klasoru: $RulesDir"
Write-Host ""
Write-Host "Masaustundeki '$AppName' kisayolunu kullanabilirsin."
Write-Host ""

Start-AppPrompt

Write-Host ""
Read-Host "Cikis icin Enter"
