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
function Write-Info([string]$m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Ok([string]$m){ Write-Host "[ OK ] $m" -ForegroundColor Green }
function Write-Warn([string]$m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err([string]$m){ Write-Host "[ERR ] $m" -ForegroundColor Red }

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

### ---------- PYTHON TESPIT, PATH, PIP & PAKET KURULUMU ----------

function Try-RemoveAppPathStub {
    param([string[]]$Aliases)
    foreach ($a in $Aliases) {
        $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\$a"
        try {
            if (Test-Path $regPath) {
                Write-Info "Bulundu (App Paths): $regPath — temizleniyor..."
                try { Remove-ItemProperty -Path $regPath -Name "(default)" -ErrorAction SilentlyContinue } catch {}
                try { if ((Get-Item $regPath).Property.Count -eq 0) { Remove-Item -Path $regPath -Force -ErrorAction SilentlyContinue } } catch {}
                Write-Ok "App Path stub'u temizlendi (varsa): $a"
            }
        } catch {
            Write-Warn "Reg temizleme atlandi: $($_.Exception.Message)"
        }
    }
}

function Prepend-ToUserPath {
    param([string]$Dir1,[string]$Dir2)
    $cur = [System.Environment]::GetEnvironmentVariable("Path","User")
    if (-not $cur) { $cur = "" }
    $parts = $cur -split ';' | Where-Object { $_ -ne "" }
    $resolved = @()
    foreach ($p in $parts) {
        try { $resolved += (Resolve-Path -LiteralPath $p -ErrorAction SilentlyContinue).ProviderPath } catch {}
    }
    $dir1r = $null; $dir2r = $null
    try { $dir1r = (Resolve-Path -LiteralPath $Dir1 -ErrorAction SilentlyContinue).ProviderPath } catch {}
    if ($Dir2) { try { $dir2r = (Resolve-Path -LiteralPath $Dir2 -ErrorAction SilentlyContinue).ProviderPath } catch {} }

    $newlist = @()
    $changed = $false
    if ($dir1r -and ($resolved -notcontains $dir1r)) { $newlist += $dir1r; $changed = $true }
    if ($dir2r -and ($resolved -notcontains $dir2r)) { $newlist += $dir2r; $changed = $true }

    foreach ($p in $resolved) {
        if ($p -ne $dir1r -and $p -ne $dir2r) { $newlist += $p }
    }

    if ($changed) {
        $newPath = ($newlist -join ';')
        [System.Environment]::SetEnvironmentVariable("Path",$newPath,"User")
        return $true
    }
    return $false
}

function Get-BestPythonExe {
    # Öncelik: py launcher (py -0p) -> where python
    $candidates = @()
    if (Get-Command py -ErrorAction SilentlyContinue) {
        try {
            $out = & py -0p 2>&1
            $lines = $out -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
            foreach ($line in $lines) {
                # satır örneği: "-3.14-64        C:\...\python.exe"
                if ($line -match '([0-9]+\.[0-9]+(?:\.[0-9]+)?)\D+([A-Za-z]:\\.+python\.exe)') {
                    try {
                        $v = [version]$Matches[1]
                        $p = $Matches[2]
                        $candidates += [pscustomobject]@{ Version = $v; Path = $p }
                    } catch {}
                }
            }
        } catch { Write-Warn "py -0p çalıştırılamadı: $($_.Exception.Message)" }
    } else {
        Write-Info "py launcher bulunamadi."
    }

    # where python ile ek kontrol
    try {
        $whereOut = (& where.exe python 2>$null)
        if ($whereOut) {
            $paths = $whereOut -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
            foreach ($p in $paths) {
                if (Test-Path $p) {
                    try {
                        $verOut = & "$p" --version 2>&1
                        $verText = ($verOut -replace 'Python','').Trim()
                        $v = [version]$verText
                        $candidates += [pscustomobject]@{ Version = $v; Path = $p }
                    } catch {}
                }
            }
        }
    } catch { Write-Warn "where.exe python hatasi: $($_.Exception.Message)" }

    if ($candidates.Count -eq 0) { return $null }

    # Öncelikli filtre: Python 3.14+ varsa onu tercih et
    $minVer = [version]"3.14"
    $valid = $candidates | Where-Object { $_.Version -ge $minVer }
    if ($valid.Count -gt 0) {
        $best = $valid | Sort-Object Version -Descending | Select-Object -First 1
        return $best.Path
    }

    # Yoksa en yüksek 3.x sürümünü döndür
    $fallback = $candidates | Where-Object { $_.Version.Major -eq 3 } | Sort-Object Version -Descending | Select-Object -First 1
    if ($fallback) { return $fallback.Path }

    return $null
}

function Ensure-Pip-And-Install {
    param([string]$PythonExe, [string[]]$Packages)

    Write-Info "pip kontrol ediliyor..."
    $pipOk = $false
    try { & $PythonExe -m pip --version > $null 2>&1; $pipOk = $true } catch { $pipOk = $false }

    if (-not $pipOk) {
        Write-Info "pip yok; ensurepip çalıştırılıyor..."
        try {
            & $PythonExe -m ensurepip --upgrade 2>&1 | ForEach-Object { Write-Host $_ }
            & $PythonExe -m pip install --upgrade pip 2>&1 | ForEach-Object { Write-Host $_ }
            $pipOk = $true
            Write-Ok "pip sağlandı/güncellendi."
        } catch {
            Write-Warn "ensurepip veya pip update başarısız: $($_.Exception.Message)"
            $pipOk = $false
        }
    }

    if (-not $pipOk) { Write-Warn "pip mevcut değil; paket kurulumu atlanacak."; return $false }

    $allOk = $true
    foreach ($pkg in $Packages) {
        Write-Info "Kuruluyor: $pkg"
        try {
            & $PythonExe -m pip install --upgrade $pkg 2>&1 | ForEach-Object { Write-Host $_ }
            Write-Ok "$pkg yüklendi."
        } catch {
            Write-Warn "Global kurulum başarısız: $($_.Exception.Message) — --user ile denenecek"
            try {
                & $PythonExe -m pip install --user --upgrade $pkg 2>&1 | ForEach-Object { Write-Host $_ }
                Write-Ok "$pkg --user ile kuruldu."
            } catch {
                Write-Err "$pkg kurulamadı: $($_.Exception.Message)"
                $allOk = $false
            }
        }
    }
    return $allOk
}

### ---------- Diğer mevcut fonksiyonlar (Is-Administrator, Ensure-PowerShell7, Create-Launcher, Create-DesktopShortcut) ----------
function Is-Administrator {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Ensure-PowerShell7 {
    try {
        Get-Command pwsh -ErrorAction Stop | Out-Null
        Write-Info "pwsh (PowerShell 7) bulundu."
        return $true
    } catch {
        Write-Warn "pwsh (PowerShell 7) bulunamadi. Indirip kurulsun mu?"
        $ans = Read-Host "Devam edip PowerShell 7 yuklemek istiyor musunuz? (E/H)"
        if ($ans -notmatch '^(e|E|y|Y)$') { Write-Warn "pwsh yuklemesi atlandi."; return $false }
        try {
            Write-Info "PowerShell GitHub surumleri kontrol ediliyor..."
            $apiUrl = "https://api.github.com/repos/PowerShell/PowerShell/releases/latest"
            $hdr = @{ 'User-Agent' = 'NullStealer-Installer' }
            $rel = Invoke-RestMethod -Uri $apiUrl -Headers $hdr -ErrorAction Stop
            $asset = $rel.assets | Where-Object { $_.name -match 'win-x64.*\.msi$' } | Select-Object -First 1
            if (-not $asset) { $asset = $rel.assets | Where-Object { $_.name -match 'win-x64' } | Select-Object -First 1 }
            if (-not $asset) { throw "Uygun PowerShell 7 varligi bulunamadi (win-x64 msi)." }
            $downloadUrl = $asset.browser_download_url
            $msiPath = Join-Path $env:TEMP $asset.name
            Write-Info "PowerShell MSI indiriliyor: $($asset.name)"
            Invoke-WebRequest -Uri $downloadUrl -OutFile $msiPath -UseBasicParsing -Headers $hdr -ErrorAction Stop
            Write-Info "Indirme tamamlandi: $msiPath"
            if (-not (Is-Administrator)) {
                Write-Info "PowerShell kurulumu icin yonetici haklari gerekiyor. Yukseltme istegi gonderiliyor..."
                $args = "-NoProfile -ExecutionPolicy Bypass -Command `"Start-Process msiexec.exe -ArgumentList '/i `"$msiPath`" /qn /norestart' -Verb RunAs -Wait`""
                Start-Process -FilePath "powershell" -ArgumentList $args -Wait
            } else {
                Write-Info "msiexec ile kuruluyor..."
                Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$msiPath`" /qn /norestart" -Wait -NoNewWindow
            }
            Start-Sleep -Seconds 3
            try { Get-Command pwsh -ErrorAction Stop | Out-Null; Write-Ok "pwsh kuruldu."; return $true } catch { Write-Warn "pwsh kuruldu ama PATH'de gorunmuyor/hatali olabilir."; return $false }
        } catch {
            Write-Err "PowerShell 7 yuklemesi basarisiz: $($_.Exception.Message)"
            return $false
        }
    }
}

function Create-Launcher {
    $launcherPath = Join-Path $AppDir "Launch_NullStealer.cmd"
    $content = @"
@echo off
setlocal
cd /d "$AppDir"

where py >nul 2>&1
if %errorlevel%==0 (
    py -3.14 -c "import sys" >nul 2>&1 && goto RUN314
    py -3.12 -c "import sys" >nul 2>&1 && goto RUN312
    py -3.11 -c "import sys" >nul 2>&1 && goto RUN311
    py -3 -c "import sys" >nul 2>&1 && goto RUN3
)

where python >nul 2>&1
if %errorlevel%==0 goto RUNPY

echo Python bulunamadi. Lutfen Python 3.14 veya ustunu kurun.
pause
exit /b 1

:RUN314
py -3.14 "%AppDir%\UI.py"
goto END

:RUN312
py -3.12 "%AppDir%\UI.py"
goto END

:RUN311
py -3.11 "%AppDir%\UI.py"
goto END

:RUN3
py -3 "%AppDir%\UI.py"
goto END

:RUNPY
python "%AppDir%\UI.py"

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

# 5) PYTHON kontrolu ve bekleme dongusu (3.14+ tercih)
Write-Info "Python 3.14+ kontrol ediliyor..."
# İlk stub temizleme denemesi
Try-RemoveAppPathStub -Aliases @("python.exe","python3.exe")

$pyExe = Get-BestPythonExe
while (-not $pyExe) {
    Write-Warn "Python 3.14+ bulunamadi."
    Write-Host ""
    Write-Host "Lütfen Python 3.14 veya daha yeni bir sürümü indirin ve kurun."
    Write-Host "Python indirme sayfasi aciliyor..."
    Start-Process "https://www.python.org/downloads/"
    Read-Host "Python kurduktan sonra devam etmek icin Enter'a basiniz"
    Write-Info "Python tekrar kontrol ediliyor..."
    # Tekrar deneyelim (kullanıcı python kurup PATH eklediğini varsayıyoruz)
    $pyExe = Get-BestPythonExe
}

Write-Ok "Python bulundu: $pyExe"

# 5b) PATH'e python ve scripts klasörlerini öne ekle
try {
    $pythonDir = Split-Path -Parent $pyExe
    $scriptsDir = Join-Path $pythonDir "Scripts"
    $updated = Prepend-ToUserPath -Dir1 $pythonDir -Dir2 $scriptsDir
    if ($updated) { Write-Ok "Kullanıcı PATH'i güncellendi (Python yolları öne alındı)." }
    else { Write-Info "Kullanıcı PATH zaten uygun." }
} catch {
    Write-Warn "PATH güncellemesi sırasında hata: $($_.Exception.Message)"
}

# 6) Python paketleri kur
try {
    $packages = @("flask","pywebview")
    $ok = Ensure-Pip-And-Install -PythonExe $pyExe -Packages $packages
    if ($ok) {
        Write-Ok "Python paketleri kurulumu tamamlandi."
    } else {
        Write-Warn "Bazı paketler kurulamadı; manuel kontrol gerekebilir."
    }
} catch {
    Write-Warn "Paket kurulumu sırasında hata: $($_.Exception.Message)"
}

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
