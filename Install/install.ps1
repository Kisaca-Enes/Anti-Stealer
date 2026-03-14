#Requires -Version 5.1
<#
  Setup-NullStealer.ps1
  Tek dosya PowerShell kurucusu.
  - PowerShell 7 yoksa -> otomatik indirip MSI ile kurmaya çalışır (admin gerekli)
  - Proje klasorunu olusturur
  - Ana dosyalari indirir
  - kural.txt icindeki raw github linklerini okuyup rules\ klasorune .yar indirir
  - Python kontrolu yapar; yoksa kullaniciyi yonlendirir ve kurulumu tamamlayana kadar bekler
  - Python bulunduysa pip -> flask, pywebview kurar
  - Launch_NullStealer.cmd ve Desktop .lnk olusturur
#>

$ErrorActionPreference = 'Stop'

### ---------- AYARLAR ----------
$AppName   = "NullStealer Anti-Stealer"
$AppDir    = Join-Path $env:USERPROFILE "Desktop\NullStealer-AntiStealer"
$RulesDir  = Join-Path $AppDir "rules"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KuralTxt  = Join-Path $ScriptDir "kural.txt"

# Repo base (raw)
$BaseRaw = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/NullStealer(Anti-Stealer)"

$MainFiles = @(
    "FullScan.ps1",
    "QuickScan.ps1",
    "UI.py",
    "app.py",
    "network.ps1",
    "YaraScan.ps1",
    "yara64.exe"
)

### ---------- YARDIMCI FONKSIYONLAR ----------
function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Ok($m){ Write-Host "[ OK ] $m" -ForegroundColor Green }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERR ] $m" -ForegroundColor Red }

function Convert-ToRawUrl {
    param([string]$InputUrl)
    if ([string]::IsNullOrWhiteSpace($InputUrl)) { return $null }
    $u = $InputUrl.Trim()
    if ($u -match '^https?://raw\.githubusercontent\.com/') { return $u }
    if ($u -match '^https?://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)$') {
        return "https://raw.githubusercontent.com/$($Matches[1])/$($Matches[2])/$($Matches[3])/$($Matches[4])"
    }
    if ($u -match '^https?://github\.com/([^/]+)/([^/]+)/raw/([^/]+)/(.+)$') {
        return "https://raw.githubusercontent.com/$($Matches[1])/$($Matches[2])/$($Matches[3])/$($Matches[4])"
    }
    return $u
}

function Ensure-Directory {
    param([string]$Path)
    try {
        if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }
        return (Test-Path $Path)
    } catch {
        Write-Err "Klasor olusturulamadi: $Path"
        return $false
    }
}

function Download-File {
    param([string]$Url, [string]$Destination)
    try {
        $raw = Convert-ToRawUrl $Url
        if (-not $raw) { throw "Gecersiz URL: $Url" }
        $parent = Split-Path -Parent $Destination
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        Write-Host "  -> $raw"
        try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
        Invoke-WebRequest -Uri $raw -OutFile $Destination -UseBasicParsing -ErrorAction Stop
        return $true
    } catch {
        Write-Err "Indirme hatasi: $Url"
        Write-Err $_.Exception.Message
        return $false
    }
}

function Get-SafeRuleName {
    param([string]$Url)
    try {
        $raw = Convert-ToRawUrl $Url
        $uri = [System.Uri]$raw
        $name = [System.IO.Path]::GetFileName($uri.AbsolutePath)
        if ([string]::IsNullOrWhiteSpace($name)) { $name = "rule_$([guid]::NewGuid().ToString()).yar" }
        return $name
    } catch {
        return "rule_$([guid]::NewGuid().ToString()).yar"
    }
}

function Download-MainFiles {
    Write-Info "Ana dosyalar indiriliyor..."
    foreach ($f in $MainFiles) {
        $u = "$BaseRaw/$f"
        $d = Join-Path $AppDir $f
        Write-Host " - $f"
        if (Download-File -Url $u -Destination $d) { Write-Ok "$f" } else { Write-Warn "$f indirilemedi" }
    }
}

function Download-RulesFromTxt {
    param([string]$TxtPath, [string]$Target)
    if (-not (Test-Path $TxtPath)) { Write-Warn "kural.txt bulunamadi: $TxtPath"; return }
    if (-not (Ensure-Directory $Target)) { Write-Err "rules klasoru olusturulamadi"; return }
    $lines = Get-Content -Path $TxtPath -Encoding UTF8
    $total=0; $ok=0
    Write-Info "kural.txt icindeki linkler isleniyor..."
    foreach ($line in $lines) {
        $l = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($l) -or $l.StartsWith('#') -or $l.StartsWith(';')) { continue }
        $raw = Convert-ToRawUrl $l
        try {
            $fn = Get-SafeRuleName $raw
            if ($fn -notmatch '\.(yar|yara)$') { Write-Warn "Atlandi (yar degil): $raw"; continue }
            $dest = Join-Path $Target $fn
            $total++
            Write-Host " - $fn"
            if (Download-File -Url $raw -Destination $dest) { $ok++; Write-Ok $fn } else { Write-Warn "$fn hatali" }
        } catch {
            Write-Warn "URL islenemedi: $l"
        }
    }
    Write-Info "Rules indirildi: Toplam $total, Basarili $ok"
}

function Find-PythonCommand {
    # py launcher onceligi
    try {
        Get-Command py -ErrorAction Stop | Out-Null
        & py -3.12 -c "import sys" *> $null; if ($LASTEXITCODE -eq 0) { return "py -3.12" }
        & py -3.11 -c "import sys" *> $null; if ($LASTEXITCODE -eq 0) { return "py -3.11" }
        & py -3 -c "import sys" *> $null; if ($LASTEXITCODE -eq 0) { return "py -3" }
    } catch {}
    try {
        Get-Command python -ErrorAction Stop | Out-Null
        & python -c "import sys" *> $null; if ($LASTEXITCODE -eq 0) { return "python" }
    } catch {}
    return $null
}

function Invoke-Python {
    param([string]$PyCmd, [string[]]$Args)
    $parts = $PyCmd -split '\s+'
    $exe = $parts[0]; $pre = @(); if ($parts.Count -gt 1) { $pre = $parts[1..($parts.Count-1)] }
    & $exe @pre @Args
    return $LASTEXITCODE
}

function Install-PythonPackages {
    param([string]$PyCmd)
    Write-Info "Paketler kuruluyor (flask, pywebview)..."
    Invoke-Python -PyCmd $PyCmd -Args @("-m","pip","--version") | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Info "pip eksik, ensurepip calisiyor..."
        Invoke-Python -PyCmd $PyCmd -Args @("-m","ensurepip","--upgrade") | Out-Null
    }
    Invoke-Python -PyCmd $PyCmd -Args @("-m","pip","install","--upgrade","pip") | Out-Null
    Invoke-Python -PyCmd $PyCmd -Args @("-m","pip","install","flask","pywebview") | Out-Null
    Write-Ok "Python paketleri kuruldu."
}

function Is-Administrator {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

### ---------- PowerShell 7 (pwsh) kontrol ve yukleme ----------
function Ensure-PowerShell7 {
    # Eger zaten pwsh var ve su an pwsh ile calisiyor isek true
    try {
        Get-Command pwsh -ErrorAction Stop | Out-Null
        Write-Info "pwsh (PowerShell 7) bulundu."
        return $true
    } catch {
        Write-Warn "pwsh (PowerShell 7) bulunamadi. Indirip kurulsun mu?"
        $ans = Read-Host "Devam edip PowerShell 7 yuklemek istiyor musunuz? (E/H)"
        if ($ans -notmatch '^(e|E|y|Y)$') { Write-Warn "pwsh yuklemesi atlandi."; return $false }

        # Fetch latest release from GitHub API
        try {
            Write-Info "PowerShell GitHub surumleri kontrol ediliyor..."
            $apiUrl = "https://api.github.com/repos/PowerShell/PowerShell/releases/latest"
            $hdr = @{ 'User-Agent' = 'NullStealer-Installer' }
            $rel = Invoke-RestMethod -Uri $apiUrl -Headers $hdr -ErrorAction Stop

            # Prefer win-x64.msi
            $asset = $rel.assets | Where-Object { $_.name -match 'win-x64.*\.msi$' } | Select-Object -First 1
            if (-not $asset) {
                # fallback any win-x64
                $asset = $rel.assets | Where-Object { $_.name -match 'win-x64' } | Select-Object -First 1
            }
            if (-not $asset) { throw "Uygun PowerShell 7 varligi bulunamadi (win-x64 msi)." }

            $downloadUrl = $asset.browser_download_url
            $msiPath = Join-Path $env:TEMP $asset.name

            Write-Info "PowerShell MSI indiriliyor: $($asset.name)"
            Invoke-WebRequest -Uri $downloadUrl -OutFile $msiPath -UseBasicParsing -Headers $hdr -ErrorAction Stop
            Write-Info "Indirme tamamlandi: $msiPath"

            # Kurulum icin admin gerekebilir
            if (-not (Is-Administrator)) {
                Write-Info "PowerShell kurulumu icin yonetici haklari gerekiyor. Yukseltme istegi gonderiliyor..."
                $args = "-NoProfile -ExecutionPolicy Bypass -Command `"Start-Process msiexec.exe -ArgumentList '/i `"$msiPath`" /qn /norestart' -Verb RunAs -Wait`""
                Start-Process -FilePath "powershell" -ArgumentList $args -Wait
            } else {
                Write-Info "msiexec ile kuruluyor..."
                Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$msiPath`" /qn /norestart" -Wait -NoNewWindow
            }

            Start-Sleep -Seconds 3

            # Kontrol
            try { Get-Command pwsh -ErrorAction Stop | Out-Null; Write-Ok "pwsh kuruldu."; return $true } catch { Write-Warn "pwsh kuruldu ama PATH'de gorunmuyor/hatali olabilir."; return $false }
        } catch {
            Write-Err "PowerShell 7 yuklemesi basarisiz: $($_.Exception.Message)"
            return $false
        }
    }
}

### ---------- Launcher & Shortcut ----------
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
    Set-Content -Path $launcherPath -Value $content -Encoding ASCII
    Write-Ok "Launcher olusturuldu: $launcherPath"
}

function Create-DesktopShortcut {
    $desktop = [Environment]::GetFolderPath("Desktop")
    $link = Join-Path $desktop "$AppName.lnk"
    $target = Join-Path $AppDir "Launch_NullStealer.cmd"
    if (-not (Test-Path $target)) { Write-Warn "Launcher bulunamadi: $target"; return }
    $ws = New-Object -ComObject WScript.Shell
    $sc = $ws.CreateShortcut($link)
    $sc.TargetPath = $target
    $sc.WorkingDirectory = $AppDir
    $sc.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
    $sc.Description = "$AppName Baslatici"
    $sc.Save()
    Write-Ok "Desktop kisayolu olusturuldu: $link"
}

### ---------- BASLANGIC AKISI ----------
Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host "  $AppName Kurulum Basladi" -ForegroundColor DarkCyan
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host ""
Write-Info "Script dizini: $ScriptDir"
Write-Info "Proje klasoru: $AppDir"
Write-Info "Rules klasoru: $RulesDir"
Write-Info "kural.txt yolu: $KuralTxt"
Write-Host ""

# 1) Ensure running under pwsh if possible - if pwsh missing, offer install and relaunch
$runningUnderPwsh = ($PSVersionTable.PSVersion.Major -ge 6)
if (-not $runningUnderPwsh) {
    Write-Warn "Bu oturum Windows PowerShell (5.x) veya benzeri. PowerShell 7 (pwsh) daha iyi calisir."
    $pwshPresent = Get-Command pwsh -ErrorAction SilentlyContinue
    if (-not $pwshPresent) {
        $installed = Ensure-PowerShell7
        if ($installed) {
            # Re-launch script under pwsh
            $scriptPath = $MyInvocation.MyCommand.Path
            Write-Info "Script pwsh ile yeniden baslatiliyor..."
            Start-Process -FilePath "pwsh" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
            Write-Host "Eski oturum kapanacak. Yeni pwsh oturumunda script devam edecek."
            exit 0
        } else {
            Write-Warn "pwsh yuklenemedi veya atlandi. Script Windows PowerShell ile devam edecek."
        }
    } else {
        Write-Info "pwsh bulundu, yeniden baslatiliyor..."
        $scriptPath = $MyInvocation.MyCommand.Path
        Start-Process -FilePath "pwsh" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
        exit 0
    }
}

# 2) Klasorleri olustur
if (-not (Ensure-Directory $AppDir)) { Write-Err "Proje klasoru olusturulamadi"; Read-Host "Cikis icin Enter"; exit 1 }
if (-not (Ensure-Directory $RulesDir)) { Write-Err "Rules klasoru olusturulamadi"; Read-Host "Cikis icin Enter"; exit 1 }
Write-Ok "Klasorler hazir."

# 3) Ana dosyalar indir
Download-MainFiles

# 4) Rules indir (kural.txt)
if (Test-Path $KuralTxt) {
    Write-Ok "kural.txt bulundu. Rules indiriliyor..."
    Download-RulesFromTxt -TxtPath $KuralTxt -Target $RulesDir
} else {
    Write-Warn "kural.txt bulunamadi: $KuralTxt. Rules atlandi."
}

# 5) Python kontrolu ve bekleme dongusu
Write-Info "Python kontrol ediliyor..."
$py = Find-PythonCommand
while ($null -eq $py) {
    Write-Warn "Python bulunamadi."
    Write-Host ""
    Write-Host "Lutfen Python 3.11 veya 3.12 indirin ve kurun."
    Write-Host "Python indirme sayfasi aciliyor..."
    Start-Process "https://www.python.org/downloads/"
    Read-Host "Python kurduktan sonra devam etmek icin Enter'a basiniz"
    Write-Info "Python tekrar kontrol ediliyor..."
    $py = Find-PythonCommand
}
Write-Ok "Python bulundu: $py"

# 6) Python paketleri kur
Install-PythonPackages -PyCmd $py

# 7) Launcher & shortcut
Create-Launcher
Create-DesktopShortcut

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Kurulum Tamamlandi" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proje klasoru: $AppDir"
Write-Host "Rules klasoru: $RulesDir"
Write-Host ""
Write-Host "Masausteki kisayol ile uygulamayi baslatabilirsiniz."
Write-Host ""

$run = Read-Host "Simdi baslatmak ister misiniz? (E/H)"
if ($run -match '^(e|E|y|Y)$') {
    $launcher = Join-Path $AppDir "Launch_NullStealer.cmd"
    if (Test-Path $launcher) { Start-Process -FilePath $launcher -WorkingDirectory $AppDir }
}

Read-Host "Cikis icin Enter"
