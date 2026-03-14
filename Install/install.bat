@echo off
setlocal EnableExtensions EnableDelayedExpansion
title NullStealer Anti-Stealer Setup

:: ============================================================
:: NullStealer Anti-Stealer Setup
:: - Ana dosyalari indirir
:: - kural.txt icindeki YARA linklerini okuyup rules\ klasorune indirir
:: - Python kontrol eder
:: - Gerekli pip paketlerini kurar
:: - Masaustu kisayolu olusturur
:: ============================================================

:: -----------------------------
:: Ayarlar
:: -----------------------------
set "APP_NAME=NullStealer Anti-Stealer"
set "APP_DIR=%USERPROFILE%\Desktop\NullStealer-AntiStealer"
set "RULES_DIR=%APP_DIR%\rules"
set "SCRIPT_DIR=%~dp0"
set "KURAL_TXT=%SCRIPT_DIR%kural.txt"

:: GitHub ana dosya base URL (raw)
set "BASE_RAW=https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/NullStealer(Anti-Stealer)"

:: Gecici PowerShell script
set "PS_TEMP=%TEMP%\ns_setup_%RANDOM%_%RANDOM%.ps1"

echo.
echo ============================================================
echo   %APP_NAME% Kurulum Basladi
echo ============================================================
echo.
echo Kurulum klasoru: %APP_DIR%
echo Rules klasoru  : %RULES_DIR%
echo kural.txt yolu : %KURAL_TXT%
echo.

:: -----------------------------
:: PowerShell kontrol
:: -----------------------------
where pwsh >nul 2>&1
if %errorlevel%==0 (
    set "PS_EXE=pwsh"
    echo [OK] PowerShell 7 bulundu: pwsh
) else (
    set "PS_EXE=powershell"
    echo [INFO] PowerShell 7 bulunamadi. Windows PowerShell kullanilacak.
)
echo.

:: -----------------------------
:: Klasorleri olustur
:: -----------------------------
if not exist "%APP_DIR%" (
    mkdir "%APP_DIR%" >nul 2>&1
)
if not exist "%RULES_DIR%" (
    mkdir "%RULES_DIR%" >nul 2>&1
)

if not exist "%APP_DIR%" (
    echo [HATA] Kurulum klasoru olusturulamadi: %APP_DIR%
    goto :END_FAIL
)

if not exist "%RULES_DIR%" (
    echo [HATA] rules klasoru olusturulamadi: %RULES_DIR%
    goto :END_FAIL
)

echo [OK] Klasorler hazir.
echo.

:: -----------------------------
:: PowerShell indirici script yaz
:: -----------------------------
call :WRITE_PS_SCRIPT
if not exist "%PS_TEMP%" (
    echo [HATA] Gecici PowerShell script olusturulamadi.
    goto :END_FAIL
)

:: -----------------------------
:: Ana dosyalari indir
:: -----------------------------
echo [1/5] Ana dosyalar indiriliyor...
call :DOWNLOAD_MAIN "FullScan.ps1"
call :DOWNLOAD_MAIN "QuickScan.ps1"
call :DOWNLOAD_MAIN "UI.py"
call :DOWNLOAD_MAIN "app.py"
call :DOWNLOAD_MAIN "network.ps1"
call :DOWNLOAD_MAIN "YaraScan.ps1"
call :DOWNLOAD_MAIN "yara64.exe"
echo.

:: -----------------------------
:: kural.txt kontrol
:: -----------------------------
echo [2/5] kural.txt kontrol ediliyor...
if not exist "%KURAL_TXT%" (
    echo [UYARI] kural.txt bulunamadi: %KURAL_TXT%
    echo [UYARI] Rules indirme atlandi.
) else (
    echo [OK] kural.txt bulundu.
    echo [3/5] kural.txt icindeki YARA kurallari indiriliyor...
    call :DOWNLOAD_RULES_FROM_TXT
)
echo.

:: -----------------------------
:: Python bul
:: -----------------------------
echo [4/5] Python kontrol ediliyor...
call :FIND_PYTHON

if not defined PY_CMD (
    echo [HATA] Python bulunamadi.
    echo Lutfen Python 3.11 veya 3.12 kur:
    echo https://www.python.org/downloads/
    echo Kurarken "Add Python to PATH" secenegini isaretle.
    goto :SHORTCUT_ONLY
)

echo [OK] Python bulundu: %PY_CMD%
echo.

:: -----------------------------
:: Pip ve paketler
:: -----------------------------
echo [5/5] Python paketleri kuruluyor...
%PY_CMD% -m pip --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] pip hazirlaniyor...
    %PY_CMD% -m ensurepip --upgrade >nul 2>&1
)

echo [INFO] pip guncelleniyor...
%PY_CMD% -m pip install --upgrade pip

echo [INFO] flask kuruluyor...
%PY_CMD% -m pip install flask

echo [INFO] pywebview kuruluyor...
%PY_CMD% -m pip install pywebview

echo.

:SHORTCUT_ONLY
:: -----------------------------
:: Baslatici .cmd olustur
:: -----------------------------
echo [INFO] Baslatici dosyasi olusturuluyor...
call :CREATE_LAUNCHER

:: -----------------------------
:: Masaustu kisayolu
:: -----------------------------
echo [INFO] Masaustu kisayolu olusturuluyor...
call :CREATE_SHORTCUT

echo.
echo ============================================================
echo   Kurulum Tamamlandi
echo ============================================================
echo.
echo Proje klasoru: %APP_DIR%
echo Kural klasoru: %RULES_DIR%
echo.
echo Masaustundeki "%APP_NAME%" kisayolunu kullanabilirsin.
echo.
choice /M "Simdi baslatmak ister misin"
if errorlevel 2 goto :CLEAN_EXIT
if errorlevel 1 (
    if exist "%APP_DIR%\Launch_NullStealer.cmd" (
        start "" "%APP_DIR%\Launch_NullStealer.cmd"
    )
)

goto :CLEAN_EXIT

:: ============================================================
:: Fonksiyonlar
:: ============================================================

:DOWNLOAD_MAIN
set "FILE_NAME=%~1"
set "URL=%BASE_RAW%/%FILE_NAME%"
set "DEST=%APP_DIR%\%FILE_NAME%"

echo    - %FILE_NAME%
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%PS_TEMP%" -Mode DownloadOne -Url "%URL%" -OutFile "%DEST%"
if errorlevel 1 (
    echo      [HATA] %FILE_NAME% indirilemedi.
) else (
    echo      [OK] %FILE_NAME%
)
exit /b

:DOWNLOAD_RULES_FROM_TXT
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%PS_TEMP%" -Mode DownloadRulesFromTxt -TxtPath "%KURAL_TXT%" -RulesDir "%RULES_DIR%"
if errorlevel 1 (
    echo [UYARI] Bazi rule dosyalari indirilemedi veya hic indirilemedi.
) else (
    echo [OK] Rule dosyalari indirildi.
)
exit /b

:FIND_PYTHON
set "PY_CMD="
where py >nul 2>&1
if %errorlevel%==0 (
    py -3.12 -c "import sys; print(sys.version)" >nul 2>&1
    if %errorlevel%==0 (
        set "PY_CMD=py -3.12"
        exit /b
    )
    py -3.11 -c "import sys; print(sys.version)" >nul 2>&1
    if %errorlevel%==0 (
        set "PY_CMD=py -3.11"
        exit /b
    )
    py -3 -c "import sys; print(sys.version)" >nul 2>&1
    if %errorlevel%==0 (
        set "PY_CMD=py -3"
        exit /b
    )
)

where python >nul 2>&1
if %errorlevel%==0 (
    python -c "import sys; print(sys.version)" >nul 2>&1
    if %errorlevel%==0 (
        set "PY_CMD=python"
        exit /b
    )
)

exit /b

:CREATE_LAUNCHER
set "LAUNCHER=%APP_DIR%\Launch_NullStealer.cmd"
(
    echo @echo off
    echo setlocal
    echo cd /d "%APP_DIR%"
    echo.
    echo where py ^>nul 2^>^&1
    echo if %%errorlevel%%==0 ^(
    echo     py -3.12 -c "import sys" ^>nul 2^>^&1 ^&^& goto RUN312
    echo     py -3.11 -c "import sys" ^>nul 2^>^&1 ^&^& goto RUN311
    echo     py -3 -c "import sys" ^>nul 2^>^&1 ^&^& goto RUN3
    echo ^)
    echo.
    echo where python ^>nul 2^>^&1
    echo if %%errorlevel%%==0 goto RUNPY
    echo.
    echo echo Python bulunamadi. Lutfen Python 3.11/3.12 kur.
    echo pause
    echo exit /b 1
    echo.
    echo :RUN312
    echo py -3.12 "%APP_DIR%\UI.py"
    echo goto END
    echo.
    echo :RUN311
    echo py -3.11 "%APP_DIR%\UI.py"
    echo goto END
    echo.
    echo :RUN3
    echo py -3 "%APP_DIR%\UI.py"
    echo goto END
    echo.
    echo :RUNPY
    echo python "%APP_DIR%\UI.py"
    echo.
    echo :END
) > "%LAUNCHER%"

if exist "%LAUNCHER%" (
    echo [OK] Launch_NullStealer.cmd olusturuldu.
) else (
    echo [UYARI] Launch_NullStealer.cmd olusturulamadi.
)
exit /b

:CREATE_SHORTCUT
set "SHORTCUT_PS=%TEMP%\ns_shortcut_%RANDOM%_%RANDOM%.ps1"
(
    echo $desktop = [Environment]::GetFolderPath('Desktop')
    echo $shortcutPath = Join-Path $desktop '%APP_NAME%.lnk'
    echo $targetPath = '%APP_DIR%\Launch_NullStealer.cmd'
    echo $workDir = '%APP_DIR%'
    echo $ws = New-Object -ComObject WScript.Shell
    echo $sc = $ws.CreateShortcut($shortcutPath)
    echo $sc.TargetPath = $targetPath
    echo $sc.WorkingDirectory = $workDir
    echo $sc.IconLocation = '%SystemRoot%\System32\shell32.dll,220'
    echo $sc.Description = 'NullStealer Anti-Stealer Baslatici'
    echo $sc.Save()
) > "%SHORTCUT_PS%"

"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%SHORTCUT_PS%" >nul 2>&1
del /f /q "%SHORTCUT_PS%" >nul 2>&1

if exist "%USERPROFILE%\Desktop\%APP_NAME%.lnk" (
    echo [OK] Masaustu kisayolu olusturuldu.
) else (
    echo [UYARI] Masaustu kisayolu olusturulamadi.
)
exit /b

:WRITE_PS_SCRIPT
(
echo param(
echo     [string]$Mode,
echo     [string]$Url,
echo     [string]$OutFile,
echo     [string]$TxtPath,
echo     [string]$RulesDir
echo )
echo.
echo $ErrorActionPreference = 'Stop'
echo.
echo function Convert-ToRawUrl {
echo     param([string]$InputUrl)
echo.
echo     if ([string]::IsNullOrWhiteSpace($InputUrl)) { return $null }
echo     $u = $InputUrl.Trim()
echo.
echo     if ($u -match '^https?://raw\.githubusercontent\.com/') {
echo         return $u
echo     }
echo.
echo     if ($u -match '^https?://github\.com/([^/]+)/([^/]+)/blob/([^/]+)/(.+)$') {
echo         $owner = $Matches[1]
echo         $repo  = $Matches[2]
echo         $branch = $Matches[3]
echo         $path = $Matches[4]
echo         return "https://raw.githubusercontent.com/$owner/$repo/$branch/$path"
echo     }
echo.
echo     if ($u -match '^https?://github\.com/([^/]+)/([^/]+)/raw/([^/]+)/(.+)$') {
echo         $owner = $Matches[1]
echo         $repo  = $Matches[2]
echo         $branch = $Matches[3]
echo         $path = $Matches[4]
echo         return "https://raw.githubusercontent.com/$owner/$repo/$branch/$path"
echo     }
echo.
echo     return $u
echo }
echo.
echo function Download-File {
echo     param(
echo         [Parameter(Mandatory=$true)][string]$SourceUrl,
echo         [Parameter(Mandatory=$true)][string]$Destination
echo     )
echo.
echo     $rawUrl = Convert-ToRawUrl $SourceUrl
echo.
echo     $parent = Split-Path -Parent $Destination
echo     if (-not (Test-Path $parent)) {
echo         New-Item -ItemType Directory -Path $parent -Force ^| Out-Null
echo     }
echo.
echo     try {
echo         Invoke-WebRequest -Uri $rawUrl -OutFile $Destination -UseBasicParsing
echo         if (-not (Test-Path $Destination)) {
echo             throw "Dosya olusmadi: $Destination"
echo         }
echo         return $true
echo     } catch {
echo         Write-Host "[PS HATA] Indirme basarisiz: $rawUrl"
echo         Write-Host $_.Exception.Message
echo         return $false
echo     }
echo }
echo.
echo function Get-SafeRuleName {
echo     param([string]$Url)
echo.
echo     try {
echo         $u = Convert-ToRawUrl $Url
echo         $uri = [System.Uri]$u
echo         $name = [System.IO.Path]::GetFileName($uri.AbsolutePath)
echo         if ([string]::IsNullOrWhiteSpace($name)) {
echo             $name = "rule_" + [guid]::NewGuid().ToString() + ".yar"
echo         }
echo         return $name
echo     } catch {
echo         return "rule_" + [guid]::NewGuid().ToString() + ".yar"
echo     }
echo }
echo.
echo switch ($Mode) {
echo     'DownloadOne' {
echo         if (-not $Url -or -not $OutFile) { exit 1 }
echo         $ok = Download-File -SourceUrl $Url -Destination $OutFile
echo         if ($ok) { exit 0 } else { exit 1 }
echo     }
echo.
echo     'DownloadRulesFromTxt' {
echo         if (-not (Test-Path $TxtPath)) {
echo             Write-Host "[PS HATA] kural.txt bulunamadi: $TxtPath"
echo             exit 1
echo         }
echo.
echo         if (-not (Test-Path $RulesDir)) {
echo             New-Item -ItemType Directory -Path $RulesDir -Force ^| Out-Null
echo         }
echo.
echo         $lines = Get-Content -Path $TxtPath -Encoding UTF8
echo         $total = 0
echo         $okCount = 0
echo.
echo         foreach ($line in $lines) {
echo             $l = $line.Trim()
echo.
echo             if ([string]::IsNullOrWhiteSpace($l)) { continue }
echo             if ($l.StartsWith('#')) { continue }
echo             if ($l.StartsWith(';')) { continue }
echo.
echo             $raw = Convert-ToRawUrl $l
echo             $fileName = Get-SafeRuleName $raw
echo.
echo             if ($fileName -notmatch '\.(yar|yara)$') {
echo                 Write-Host "[PS INFO] Atlandi (yar degil): $raw"
echo                 continue
echo             }
echo.
echo             $dest = Join-Path $RulesDir $fileName
echo             $total++
echo             Write-Host "[PS] Rule indiriliyor: $fileName"
echo.
echo             $ok = Download-File -SourceUrl $raw -Destination $dest
echo             if ($ok) { $okCount++ }
echo         }
echo.
echo         Write-Host "[PS] Toplam rule: $total / Basarili: $okCount"
echo.
echo         if ($total -gt 0 -and $okCount -gt 0) {
echo             exit 0
echo         } elseif ($total -eq 0) {
echo             exit 1
echo         } else {
echo             exit 1
echo         }
echo     }
echo.
echo     default {
echo         Write-Host "[PS HATA] Gecersiz mod."
echo         exit 1
echo     }
echo }
) > "%PS_TEMP%"
exit /b

:CLEAN_EXIT
if exist "%PS_TEMP%" del /f /q "%PS_TEMP%" >nul 2>&1
echo.
echo Cikis icin bir tusa basin...
pause >nul
endlocal
exit /b 0

:END_FAIL
if exist "%PS_TEMP%" del /f /q "%PS_TEMP%" >nul 2>&1
echo.
echo Kurulum basarisiz oldu.
echo Cikis icin bir tusa basin...
pause >nul
endlocal
exit /b 1
