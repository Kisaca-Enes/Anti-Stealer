@echo off
setlocal EnableExtensions
title NullStealer Anti-Stealer Setup

set "APP_NAME=NullStealer Anti-Stealer"
set "SCRIPT_DIR=%~dp0"
set "PS_FILE=%TEMP%\NullStealer_Installer_%RANDOM%_%RANDOM%.ps1"

echo.
echo ============================================================
echo   %APP_NAME% Setup
echo ============================================================
echo.
echo [INFO] PowerShell installer hazirlaniyor...
echo.

> "%PS_FILE%" (
    echo param(
    echo     [string]$BaseDir
    echo )
    echo.
    echo $ErrorActionPreference = 'Stop'
    echo.
    echo function Write-Info($msg^) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
    echo function Write-Ok($msg^)   { Write-Host "[ OK ] $msg" -ForegroundColor Green }
    echo function Write-Warn($msg^) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
    echo function Write-Err($msg^)  { Write-Host "[ERR ] $msg" -ForegroundColor Red }
    echo.
    echo $AppName   = 'NullStealer Anti-Stealer'
    echo $AppDir    = Join-Path $env:USERPROFILE 'Desktop\NullStealer-AntiStealer'
    echo $RulesDir  = Join-Path $AppDir 'rules'
    echo $KuralTxt  = Join-Path $BaseDir 'kural.txt'
    echo $Launcher  = Join-Path $AppDir 'Launch_NullStealer.cmd'
    echo.
    echo $MainFiles = @(
    echo     'FullScan.ps1',
    echo     'QuickScan.ps1',
    echo     'UI.py',
    echo     'app.py',
    echo     'network.ps1',
    echo     'YaraScan.ps1',
    echo     'yara64.exe'
    echo ^)
    echo.
    echo $BaseRaw = 'https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/NullStealer(Anti-Stealer)'
    echo.
    echo function Convert-ToRawUrl {
    echo     param([string]$InputUrl^)
    echo.
    echo     if ([string]::IsNullOrWhiteSpace($InputUrl^)^) { return $null }
    echo     $u = $InputUrl.Trim(^)
    echo.
    echo     if ($u -match '^https?://raw\.githubusercontent\.com/'^) {
    echo         return $u
    echo     }
    echo.
    echo     if ($u -match '^https?://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)$'^) {
    echo         $owner  = $Matches[1]
    echo         $repo   = $Matches[2]
    echo         $branch = $Matches[3]
    echo         $path   = $Matches[4]
    echo         return "https://raw.githubusercontent.com/$owner/$repo/$branch/$path"
    echo     }
    echo.
    echo     if ($u -match '^https?://github\.com/([^/]+)/([^/]+)/raw/([^/]+)/(.+)$'^) {
    echo         $owner  = $Matches[1]
    echo         $repo   = $Matches[2]
    echo         $branch = $Matches[3]
    echo         $path   = $Matches[4]
    echo         return "https://raw.githubusercontent.com/$owner/$repo/$branch/$path"
    echo     }
    echo.
    echo     return $u
    echo }
    echo.
    echo function Ensure-Dir {
    echo     param([string]$Path^)
    echo     if (-not (Test-Path $Path^)^) {
    echo         New-Item -ItemType Directory -Path $Path -Force ^| Out-Null
    echo     }
    echo }
    echo.
    echo function Download-File {
    echo     param(
    echo         [Parameter(Mandatory=$true^)][string]$Url,
    echo         [Parameter(Mandatory=$true^)][string]$Destination
    echo     ^)
    echo.
    echo     try {
    echo         $raw = Convert-ToRawUrl $Url
    echo         $parent = Split-Path -Parent $Destination
    echo         Ensure-Dir $parent
    echo.
    echo         Invoke-WebRequest -Uri $raw -OutFile $Destination -UseBasicParsing
    echo.
    echo         if (-not (Test-Path $Destination^)^) {
    echo             throw "Dosya olusmadi: $Destination"
    echo         }
    echo.
    echo         return $true
    echo     } catch {
    echo         Write-Err "Indirme basarisiz: $Url"
    echo         Write-Host $_.Exception.Message -ForegroundColor DarkRed
    echo         return $false
    echo     }
    echo }
    echo.
    echo function Find-Python {
    echo     $candidates = @(
    echo         @{ Name = 'py -3.12'; Exe = 'py'; Args = @('-3.12','-c','import sys; print(sys.executable)') },
    echo         @{ Name = 'py -3.11'; Exe = 'py'; Args = @('-3.11','-c','import sys; print(sys.executable)') },
    echo         @{ Name = 'py -3';    Exe = 'py'; Args = @('-3','-c','import sys; print(sys.executable)') },
    echo         @{ Name = 'python';   Exe = 'python'; Args = @('-c','import sys; print(sys.executable)') }
    echo     ^)
    echo.
    echo     foreach ($c in $candidates^) {
    echo         try {
    echo             $null = Get-Command $c.Exe -ErrorAction Stop
    echo             $out = ^& $c.Exe @($c.Args^) 2^>^&1
    echo             if ($LASTEXITCODE -eq 0 -and $out^) {
    echo                 return $c
    echo             }
    echo         } catch { }
    echo     }
    echo.
    echo     return $null
    echo }
    echo.
    echo function Install-PythonPackages {
    echo     param($PyCmd^)
    echo.
    echo     Write-Info "pip kontrol ediliyor..."
    echo     try {
    echo         if ($PyCmd.Name -eq 'python'^) {
    echo             ^& python -m pip --version ^> $null 2^>^&1
    echo             if ($LASTEXITCODE -ne 0^) { ^& python -m ensurepip --upgrade }
    echo             ^& python -m pip install --upgrade pip
    echo             ^& python -m pip install flask pywebview
    echo         } else {
    echo             $parts = $PyCmd.Name.Split(' '^)
    echo             $exe = $parts[0]
    echo             $ver = $parts[1]
    echo             ^& $exe $ver -m pip --version ^> $null 2^>^&1
    echo             if ($LASTEXITCODE -ne 0^) { ^& $exe $ver -m ensurepip --upgrade }
    echo             ^& $exe $ver -m pip install --upgrade pip
    echo             ^& $exe $ver -m pip install flask pywebview
    echo         }
    echo         return $true
    echo     } catch {
    echo         Write-Err "Python paket kurulumu basarisiz."
    echo         return $false
    echo     }
    echo }
    echo.
    echo function Create-Launcher {
    echo     param($PyCmd^)
    echo.
    echo     $content = @"
    echo @echo off
    echo setlocal
    echo cd /d "$AppDir"
    echo.
    echo if exist "%AppDir%\UI.py" ^(
    echo     REM Otomatik Python secimi
    echo     where py ^>nul 2^>^&1
    echo     if %%errorlevel%%==0 ^(
    echo         py -3.12 -c "import sys" ^>nul 2^>^&1 ^&^& goto RUN312
    echo         py -3.11 -c "import sys" ^>nul 2^>^&1 ^&^& goto RUN311
    echo         py -3 -c "import sys" ^>nul 2^>^&1 ^&^& goto RUN3
    echo     ^)
    echo.
    echo     where python ^>nul 2^>^&1
    echo     if %%errorlevel%%==0 goto RUNPY
    echo.
    echo     echo Python bulunamadi. Lutfen Python 3.11 veya 3.12 kur.
    echo     pause
    echo     exit /b 1
    echo ^) else ^(
    echo     echo UI.py bulunamadi: %AppDir%\UI.py
    echo     pause
    echo     exit /b 1
    echo ^)
    echo.
    echo :RUN312
    echo py -3.12 "%AppDir%\UI.py"
    echo goto END
    echo.
    echo :RUN311
    echo py -3.11 "%AppDir%\UI.py"
    echo goto END
    echo.
    echo :RUN3
    echo py -3 "%AppDir%\UI.py"
    echo goto END
    echo.
    echo :RUNPY
    echo python "%AppDir%\UI.py"
    echo.
    echo :END
    echo "@
    echo.
    echo     Set-Content -Path $Launcher -Value $content -Encoding ASCII
    echo }
    echo.
    echo function Create-Shortcut {
    echo     $desktop = [Environment]::GetFolderPath('Desktop'^)
    echo     $shortcutPath = Join-Path $desktop "$AppName.lnk"
    echo     $ws = New-Object -ComObject WScript.Shell
    echo     $sc = $ws.CreateShortcut($shortcutPath^)
    echo     $sc.TargetPath = $Launcher
    echo     $sc.WorkingDirectory = $AppDir
    echo     $sc.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
    echo     $sc.Description = 'NullStealer Anti-Stealer Baslatici'
    echo     $sc.Save(^)
    echo }
    echo.
    echo try {
    echo     Write-Host ''
    echo     Write-Host '============================================================' -ForegroundColor DarkCyan
    echo     Write-Host '  NullStealer Anti-Stealer Kurulum Basladi' -ForegroundColor DarkCyan
    echo     Write-Host '============================================================' -ForegroundColor DarkCyan
    echo     Write-Host ''
    echo.
    echo     Write-Info "Kurulum klasorleri hazirlaniyor..."
    echo     Ensure-Dir $AppDir
    echo     Ensure-Dir $RulesDir
    echo     Write-Ok "Klasorler hazir: $AppDir"
    echo.
    echo     Write-Info "Ana dosyalar indiriliyor..."
    echo     foreach ($file in $MainFiles^) {
    echo         $url = "$BaseRaw/$file"
    echo         $dest = Join-Path $AppDir $file
    echo         Write-Host "  - $file"
    echo         $ok = Download-File -Url $url -Destination $dest
    echo         if ($ok^) { Write-Ok "Indirildi: $file" } else { Write-Warn "Atlandi/Hata: $file" }
    echo     }
    echo.
    echo     if (Test-Path $KuralTxt^) {
    echo         Write-Info "kural.txt bulundu. Rules indiriliyor..."
    echo         $lines = Get-Content -Path $KuralTxt -Encoding UTF8
    echo         $total = 0
    echo         $okCount = 0
    echo.
    echo         foreach ($line in $lines^) {
    echo             $l = $line.Trim(^)
    echo             if ([string]::IsNullOrWhiteSpace($l^)^) { continue }
    echo             if ($l.StartsWith('#'^)^) { continue }
    echo             if ($l.StartsWith(';'^)^) { continue }
    echo.
    echo             $raw = Convert-ToRawUrl $l
    echo             try {
    echo                 $uri = [System.Uri]$raw
    echo                 $fileName = [System.IO.Path]::GetFileName($uri.AbsolutePath^)
    echo             } catch {
    echo                 Write-Warn "Gecersiz URL atlandi: $l"
    echo                 continue
    echo             }
    echo.
    echo             if ($fileName -notmatch '\.(yar|yara)$'^) {
    echo                 Write-Warn "YARA degil, atlandi: $fileName"
    echo                 continue
    echo             }
    echo.
    echo             $dest = Join-Path $RulesDir $fileName
    echo             $total++
    echo             Write-Host "  - Rule: $fileName"
    echo             $ok = Download-File -Url $raw -Destination $dest
    echo             if ($ok^) { $okCount++ }
    echo         }
    echo.
    echo         Write-Ok "Rules tamamlandi. Toplam: $total / Basarili: $okCount"
    echo     } else {
    echo         Write-Warn "kural.txt bulunamadi: $KuralTxt"
    echo         Write-Warn "Rules indirme atlandi."
    echo     }
    echo.
    echo     Write-Info "Python kontrol ediliyor..."
    echo     $py = Find-Python
    echo     if ($null -eq $py^) {
    echo         Write-Warn "Python bulunamadi. Python 3.11 / 3.12 kurman gerekiyor."
    echo         Write-Warn "https://www.python.org/downloads/"
    echo     } else {
    echo         Write-Ok "Python bulundu: $($py.Name^)"
    echo         Write-Info "flask + pywebview kuruluyor..."
    echo         [void](Install-PythonPackages -PyCmd $py^)
    echo     }
    echo.
    echo     Write-Info "Launcher olusturuluyor..."
    echo     Create-Launcher -PyCmd $py
    echo     Write-Ok "Launcher hazir."
    echo.
    echo     Write-Info "Masaustu kisayolu olusturuluyor..."
    echo     Create-Shortcut
    echo     Write-Ok "Kisayol olusturuldu."
    echo.
    echo     Write-Host ''
    echo     Write-Host '============================================================' -ForegroundColor Green
    echo     Write-Host '  Kurulum Tamamlandi' -ForegroundColor Green
    echo     Write-Host '============================================================' -ForegroundColor Green
    echo     Write-Host ''
    echo     Write-Host "Proje klasoru : $AppDir"
    echo     Write-Host "Rules klasoru : $RulesDir"
    echo     Write-Host ''
    echo.
    echo     $ans = Read-Host 'Simdi baslatmak ister misin? (E/H)'
    echo     if ($ans -match '^(e|E|y|Y)^'^) {
    echo         if (Test-Path $Launcher^) {
    echo             Start-Process -FilePath $Launcher
    echo         }
    echo     }
    echo } catch {
    echo     Write-Err "Kurulum sirasinda hata olustu."
    echo     Write-Host $_.Exception.Message -ForegroundColor DarkRed
    echo }
    echo.
    echo Write-Host ''
    echo Read-Host 'Cikis icin Enter bas'
)

where pwsh >nul 2>&1
if %errorlevel%==0 (
    echo [INFO] PowerShell 7 ile calistiriliyor...
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%PS_FILE%" -BaseDir "%SCRIPT_DIR%"
) else (
    echo [INFO] Windows PowerShell ile calistiriliyor...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_FILE%" -BaseDir "%SCRIPT_DIR%"
)

del /f /q "%PS_FILE%" >nul 2>&1

endlocal
exit /b 0
