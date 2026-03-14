#Requires -Version 5.1
# ================================================================
#  Anti-Stealer Pro  -  Terminal Arayüzü
#  Kullanım: .\TerminalUI.ps1
#  Not: UI.py çalışmazsa bu scripti kullanın
# ================================================================

Set-ExecutionPolicy -Scope Process Bypass -Force
$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Anti-Stealer Pro - Terminal"

# ── Renkler ───────────────────────────────────────────────────
function Write-Teal  { param([string]$M) Write-Host $M -ForegroundColor Cyan }
function Write-Green { param([string]$M) Write-Host $M -ForegroundColor Green }
function Write-Red   { param([string]$M) Write-Host $M -ForegroundColor Red }
function Write-Amber { param([string]$M) Write-Host $M -ForegroundColor Yellow }
function Write-Blue  { param([string]$M) Write-Host $M -ForegroundColor Blue }
function Write-Gray  { param([string]$M) Write-Host $M -ForegroundColor DarkGray }
function Write-Bold  { param([string]$M) Write-Host $M -ForegroundColor White }

# ── Yollar ────────────────────────────────────────────────────
$ScriptDir   = $PSScriptRoot
$AppBase     = "$env:APPDATA\Anti-Stealer"
$LogFolder   = Join-Path $AppBase "Log"
$TelDir      = Join-Path $ScriptDir "telemetery"
$RulesDir    = Join-Path $ScriptDir "rules"
$RuleOut     = Join-Path $ScriptDir "ruleout"

foreach ($d in @($AppBase,$LogFolder,$TelDir,$RulesDir,$RuleOut)) {
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

# ================================================================
#  ASCII SAMURAI
# ================================================================
function Show-Samurai {
    Clear-Host
    Write-Teal "                    |"
    Write-Teal "                   /|\"
    Write-Teal "                  / | \"
    Write-Teal "                 /  |  \"
    Write-Teal "        ________|   |   |________"
    Write-Teal "       |  ______|   |   |______  |"
    Write-Teal "       | |      \   |   /      | |"
    Write-Teal "       | |       \  |  /       | |"
    Write-Teal "       | |        \ | /        | |"
    Write-Host ""
    Write-Teal "              (  ಠ_ಠ  )"
    Write-Teal "             /|       |\"
    Write-Teal "            / |  ___  | \"
    Write-Teal "           /  | |   | |  \"
    Write-Teal "          /   | |___| |   \"
    Write-Teal "         / ___| |   | |___ \"
    Write-Teal "        |_|    |_|   |_|    |_|"
    Write-Teal "              |   |   |"
    Write-Teal "             /|   |   |\"
    Write-Teal "            / |   |   | \"
    Write-Teal "           /  |___|___|  \"
    Write-Teal "          /_______________\"
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║        A N T I - S T E A L E R   P R O          ║" -ForegroundColor Cyan
    Write-Host "  ║        Terminal Arayüzü  |  Defense v3.0         ║" -ForegroundColor Cyan
    Write-Host "  ║        github.com/Kisaca-Enes/Anti-Stealer        ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# ================================================================
#  ANA MENÜ
# ================================================================
function Show-MainMenu {
    Write-Host ""
    Write-Host "  ┌─────────────────────────────────────────────────┐" -ForegroundColor DarkCyan
    Write-Host "  │                   ANA MENÜ                      │" -ForegroundColor DarkCyan
    Write-Host "  ├─────────────────────────────────────────────────┤" -ForegroundColor DarkCyan
    Write-Host "  │                                                  │" -ForegroundColor DarkCyan
    Write-Host "  │   TARAMA                                         │" -ForegroundColor DarkCyan
    Write-Host "  │    [1]  Hızlı Tarama       (QuickScan.ps1)       │" -ForegroundColor White
    Write-Host "  │    [2]  Tam Tarama          (FullScan.ps1)        │" -ForegroundColor White
    Write-Host "  │    [3]  YARA Taraması       (YaraScan.ps1)        │" -ForegroundColor White
    Write-Host "  │    [4]  Ağ Taraması         (network.ps1)         │" -ForegroundColor White
    Write-Host "  │                                                  │" -ForegroundColor DarkCyan
    Write-Host "  │   İZLEME                                         │" -ForegroundColor DarkCyan
    Write-Host "  │    [5]  Windows Log İzleyici                     │" -ForegroundColor White
    Write-Host "  │    [6]  PowerShell Komut İzleyici                │" -ForegroundColor White
    Write-Host "  │                                                  │" -ForegroundColor DarkCyan
    Write-Host "  │   SONUÇLAR                                       │" -ForegroundColor DarkCyan
    Write-Host "  │    [7]  Son Tarama Sonuçları                     │" -ForegroundColor White
    Write-Host "  │    [8]  Log Dosyalarını Göster                   │" -ForegroundColor White
    Write-Host "  │                                                  │" -ForegroundColor DarkCyan
    Write-Host "  │    [9]  Flask UI'yi Başlat  (UI.py)              │" -ForegroundColor Yellow
    Write-Host "  │    [0]  Çıkış                                    │" -ForegroundColor DarkGray
    Write-Host "  │                                                  │" -ForegroundColor DarkCyan
    Write-Host "  └─────────────────────────────────────────────────┘" -ForegroundColor DarkCyan
    Write-Host ""
    Write-Host "  Seçiminiz: " -NoNewline -ForegroundColor Cyan
}

# ================================================================
#  TARAMA ÇALIŞTIRICI
# ================================================================
function Invoke-Scan {
    param(
        [string]$ScriptName,
        [string]$DisplayName,
        [string[]]$ExtraArgs = @()
    )

    $scriptPath = Join-Path $ScriptDir $ScriptName
    if (!(Test-Path $scriptPath)) {
        Write-Red "  [X] Script bulunamadı: $scriptPath"
        Write-Amber "      Lütfen Setup.bat ile kurulumu tamamlayın."
        Read-Host "`n  Devam etmek için Enter'a basın"
        return
    }

    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  $($DisplayName.PadRight(49))║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Amber "  Tarama başlatılıyor... Durdurmak için Ctrl+C"
    Write-Gray  "  Script: $scriptPath"
    Write-Host ""
    Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        $allArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $scriptPath) + $ExtraArgs
        $proc = Start-Process pwsh -ArgumentList $allArgs -NoNewWindow -PassThru -Wait 2>$null
        if (!$proc) {
            # pwsh yoksa powershell dene
            $allArgs = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $scriptPath) + $ExtraArgs
            Start-Process powershell -ArgumentList $allArgs -NoNewWindow -Wait
        }
    }
    catch {
        Write-Red "  [X] Tarama başlatılamadı: $_"
    }

    $sw.Stop()
    Write-Host ""
    Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Green "  [+] Tamamlandı  |  Süre: $([math]::Round($sw.Elapsed.TotalSeconds,1))s"
    Read-Host "`n  Ana menüye dönmek için Enter'a basın"
}

# ================================================================
#  YARA TARAMA (hedef seçimi ile)
# ================================================================
function Invoke-YaraScan {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  YARA MOTOR TARAMASI                             ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    # Kural listesi
    $yarFiles = Get-ChildItem $RulesDir -Filter "*.yar" -File -ErrorAction SilentlyContinue
    if ($yarFiles.Count -eq 0) {
        Write-Amber "  [!] ./rules/ klasöründe .yar dosyası bulunamadı."
        Write-Gray  "      kural.txt varsa önce kural güncellemesi yapın."
        Read-Host "`n  Devam etmek için Enter'a basın"
        return
    }

    Write-Teal "  Mevcut YARA Kuralları ($($yarFiles.Count) adet):"
    foreach ($f in $yarFiles) { Write-Gray "    • $($f.Name)" }
    Write-Host ""

    Write-Host "  Taranacak klasör yolu (Enter = C:\Users): " -NoNewline -ForegroundColor Cyan
    $target = Read-Host
    if (!$target) { $target = "C:\Users" }

    if (!(Test-Path $target)) {
        Write-Red "  [X] Yol bulunamadı: $target"
        Read-Host "`n  Devam etmek için Enter'a basın"
        return
    }

    Invoke-Scan -ScriptName "YaraScan.ps1" -DisplayName "YARA TARAMASI: $target" -ExtraArgs @($target)
}

# ================================================================
#  AĞ TARAMA (parametre seçimi ile)
# ================================================================
function Invoke-NetworkScan {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  AĞ DAVRANIŞI TARAMASI                          ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "  Minimum risk skoru (Enter = 25): " -NoNewline -ForegroundColor Cyan
    $minScore = Read-Host
    if (!$minScore) { $minScore = "25" }

    Write-Host "  Derin entropi analizi? (E/H, Enter = H): " -NoNewline -ForegroundColor Cyan
    $deep = Read-Host

    $extraArgs = @("-MinScore", $minScore)
    if ($deep -ieq "E") { $extraArgs += "-DeepEntropy" }

    Invoke-Scan -ScriptName "network.ps1" -DisplayName "AĞ TARAMASI (MinScore: $minScore)" -ExtraArgs $extraArgs
}

# ================================================================
#  WINDOWS LOG İZLEYİCİ
# ================================================================
function Show-WindowsLogs {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  WINDOWS LOG İZLEYİCİ                           ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Kaynak seçin:" -ForegroundColor DarkCyan
    Write-Host "   [1]  System"           -ForegroundColor White
    Write-Host "   [2]  Security"         -ForegroundColor White
    Write-Host "   [3]  Application"      -ForegroundColor White
    Write-Host "   [4]  PowerShell Operational" -ForegroundColor White
    Write-Host ""
    Write-Host "  Seçim: " -NoNewline -ForegroundColor Cyan
    $choice = Read-Host

    $logName = switch ($choice) {
        "1" { "System" }
        "2" { "Security" }
        "3" { "Application" }
        "4" { "Microsoft-Windows-PowerShell/Operational" }
        default { "System" }
    }

    Write-Host ""
    Write-Host "  Gösterilecek kayıt sayısı (Enter = 50): " -NoNewline -ForegroundColor Cyan
    $cnt = Read-Host
    if (!$cnt) { $cnt = "50" }

    Write-Host ""
    Write-Teal "  [$logName] son $cnt kayıt yükleniyor..."
    Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""

    try {
        $events = Get-WinEvent -LogName $logName -MaxEvents ([int]$cnt) -ErrorAction Stop |
                  Sort-Object TimeCreated

        $shown = 0
        foreach ($ev in $events) {
            $time = $ev.TimeCreated.ToString("dd.MM.yyyy HH:mm:ss")
            $msg  = ($ev.Message -replace "`r?`n", " " -replace "  ", " ")
            if ($msg.Length -gt 120) { $msg = $msg.Substring(0,120) + "..." }

            $prefix = "  [INFO] "
            $color  = "Gray"
            switch ($ev.Level) {
                1 { $prefix = "  [CRIT] "; $color = "Red" }
                2 { $prefix = "  [ERR]  "; $color = "Red" }
                3 { $prefix = "  [WARN] "; $color = "Yellow" }
                4 { $prefix = "  [INFO] "; $color = "DarkGray" }
            }

            Write-Host "$prefix" -NoNewline -ForegroundColor $color
            Write-Host "$time  " -NoNewline -ForegroundColor DarkGray
            Write-Host "EV$($ev.Id)  " -NoNewline -ForegroundColor DarkCyan
            Write-Host $msg -ForegroundColor White
            $shown++
        }

        Write-Host ""
        Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray
        Write-Green "  [+] $shown kayıt gösterildi."
    }
    catch {
        Write-Red "  [X] Log okunamadı: $_"
        Write-Amber "      Yönetici yetkisi gerekebilir (Security logu için)."
    }

    Read-Host "`n  Ana menüye dönmek için Enter'a basın"
}

# ================================================================
#  POWERSHELL KOMUT İZLEYİCİ
# ================================================================
function Show-PSCommandMonitor {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  POWERSHELL KOMUT İZLEYİCİ                      ║" -ForegroundColor Cyan
    Write-Host "  ║  Kaynak: PS/Operational  (Olay 4103 / 4104)      ║" -ForegroundColor DarkGray
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "  Son kaç olay? (Enter = 100): " -NoNewline -ForegroundColor Cyan
    $cnt = Read-Host
    if (!$cnt) { $cnt = "100" }

    # Şüpheli pattern listesi
    $patterns = @(
        "IEX\s*\(", "Invoke-Expression", "DownloadString", "Net\.WebClient",
        "-EncodedCommand", "FromBase64String", "Invoke-Mimikatz",
        "AmsiUtils", "amsiInitFailed", "BypassUAC",
        "sc\.exe\s+create", "reg\s+add.*Run",
        "powershell\s+-w\s+hidden", "Start-Process.*Hidden",
        "Get-Credential", "ConvertTo-SecureString.*AsPlainText",
        "certutil.*-decode", "mshta\s+http",
        "Invoke-WmiMethod", "schtasks.*\/create"
    )

    Write-Host ""
    Write-Teal "  PS/Operational olayları taranıyor ($cnt kayıt)..."
    Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""

    $totalScanned = 0
    $totalHits    = 0

    try {
        $events = Get-WinEvent `
            -LogName "Microsoft-Windows-PowerShell/Operational" `
            -MaxEvents ([int]$cnt) `
            -ErrorAction Stop |
            Where-Object { $_.Id -in @(4103, 4104) }

        foreach ($ev in $events) {
            $totalScanned++
            $msg  = $ev.Message -replace "`r?`n", " "
            $time = $ev.TimeCreated.ToString("dd.MM.yyyy HH:mm:ss")

            $matchedPats = @()
            foreach ($pat in $patterns) {
                if ($msg -match $pat) { $matchedPats += $pat }
            }

            if ($matchedPats.Count -gt 0) {
                $totalHits++
                Write-Host ""
                Write-Red   "  ┌─ [ŞÜPHELI]  Olay $($ev.Id)  ·  $time"
                Write-Amber "  │  Kalıp : $($matchedPats -join ' | ')"
                $ctx = $msg.Substring(0, [Math]::Min(200, $msg.Length))
                Write-Gray  "  │  İçerik: $ctx"
                Write-Red   "  └──────────────────────────────────────────────"
            }
        }

        Write-Host ""
        Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray
        Write-Host "  Taranan : $totalScanned olay" -ForegroundColor DarkGray
        if ($totalHits -gt 0) {
            Write-Red   "  Şüpheli : $totalHits eşleşme bulundu!"
        } else {
            Write-Green "  Şüpheli : Kötü amaçlı kalıp tespit edilmedi."
        }
    }
    catch {
        Write-Red "  [X] PS/Operational log okunamadı: $_"
        Write-Amber "      Bu log varsayılan olarak kapalı olabilir."
        Write-Gray  "      Etkinleştirmek için:"
        Write-Gray  '      wevtutil sl "Microsoft-Windows-PowerShell/Operational" /e:true'
    }

    Read-Host "`n  Ana menüye dönmek için Enter'a basın"
}

# ================================================================
#  SON TARAMA SONUÇLARI
# ================================================================
function Show-LastResults {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  SON TARAMA SONUÇLARI                            ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    # FullScan / QuickScan JSON logları
    $jsonFiles = @()
    foreach ($base in @($LogFolder, (Join-Path $LogFolder "Quick"))) {
        $jsonFiles += Get-ChildItem $base -Filter "*.json" -File -ErrorAction SilentlyContinue |
                      Sort-Object LastWriteTime -Descending | Select-Object -First 5
    }

    # Network sonuçları
    $netFiles = Get-ChildItem $TelDir -Filter "network_*.json" -File -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending | Select-Object -First 1

    # YARA sonuçları
    $yaraFiles = Get-ChildItem $RuleOut -Filter "yara_report_*.json" -File -ErrorAction SilentlyContinue |
                 Sort-Object LastWriteTime -Descending | Select-Object -First 1

    # ── Behavior sonuçları ────────────────────────────────────
    if ($jsonFiles.Count -gt 0) {
        Write-Teal "  Behavior / Hash / Memory Bulgular:"
        Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray
        $shownCount = 0
        foreach ($jf in $jsonFiles) {
            try {
                $data = Get-Content $jf.FullName -Raw | ConvertFrom-Json
                $items = if ($data -is [array]) { $data } else { @($data) }
                foreach ($item in $items) {
                    $mod    = $item.Module    ?? "?"
                    $name   = $item.ProcessName ?? $item.FileName ?? $item.Path ?? "?"
                    $risk   = $item.Risk       ?? "?"
                    $family = $item.MatchFamily ?? $item.DominantFamily ?? $item.Stealer ?? "?"
                    $score  = $item.Score ?? $item.JaccardScore ?? ""

                    $color = switch ($risk) {
                        { $_ -in "Confirmed","Potential-Stealer" } { "Red" }
                        "High"   { "Yellow" }
                        "Medium" { "Cyan" }
                        default  { "DarkGray" }
                    }

                    Write-Host "  " -NoNewline
                    Write-Host "[$mod]" -NoNewline -ForegroundColor Blue
                    Write-Host " $name" -NoNewline -ForegroundColor White
                    Write-Host "  →  $family" -NoNewline -ForegroundColor Cyan
                    Write-Host "  [$risk]" -ForegroundColor $color
                    $shownCount++
                }
            } catch { continue }
        }
        if ($shownCount -eq 0) { Write-Gray "  Kayıt bulunamadı." }
        Write-Host ""
    }

    # ── Ağ sonuçları ──────────────────────────────────────────
    if ($netFiles) {
        Write-Teal "  Ağ Tarama Sonucu: $($netFiles.Name)"
        Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray
        try {
            $net = Get-Content $netFiles.FullName -Raw | ConvertFrom-Json
            $sum = $net.summary
            Write-Host "  Toplam Bulgu  : " -NoNewline -ForegroundColor DarkGray
            Write-Host $sum.total_findings -ForegroundColor White
            Write-Host "  Critical      : " -NoNewline -ForegroundColor DarkGray
            Write-Host $sum.critical -ForegroundColor Red
            Write-Host "  High          : " -NoNewline -ForegroundColor DarkGray
            Write-Host $sum.high -ForegroundColor Yellow
            Write-Host "  Top Kural     : " -NoNewline -ForegroundColor DarkGray
            Write-Host $sum.top_fired_rule -ForegroundColor Cyan

            $findings = $net.findings | Select-Object -First 5
            foreach ($f in $findings) {
                $sev = $f.risk.severity
                $col = if ($sev -eq "Critical") { "Red" } elseif ($sev -eq "High") { "Yellow" } else { "Cyan" }
                Write-Host "  → " -NoNewline -ForegroundColor DarkGray
                Write-Host "$($f.process.name) (PID $($f.process.pid))" -NoNewline -ForegroundColor White
                Write-Host "  $($f.network.remote_ip):$($f.network.remote_port)" -NoNewline -ForegroundColor DarkGray
                Write-Host "  [$sev]" -ForegroundColor $col
            }
        } catch { Write-Gray "  Ağ sonucu okunamadı." }
        Write-Host ""
    }

    # ── YARA sonuçları ────────────────────────────────────────
    if ($yaraFiles) {
        Write-Teal "  YARA Eşleşmeleri: $($yaraFiles.Name)"
        Write-Host "  ─────────────────────────────────────────────────" -ForegroundColor DarkGray
        try {
            $yara = Get-Content $yaraFiles.FullName -Raw | ConvertFrom-Json
            $hits = if ($yara.Findings) { $yara.Findings } else { $yara }
            if ($hits -is [array]) {
                Write-Host "  Toplam eşleşme: $($hits.Count)" -ForegroundColor White
                foreach ($h in ($hits | Select-Object -First 5)) {
                    Write-Host "  → " -NoNewline -ForegroundColor DarkGray
                    Write-Host "$($h.RuleName)" -NoNewline -ForegroundColor Red
                    Write-Host "  $($h.FileName)" -ForegroundColor DarkGray
                }
            }
        } catch { Write-Gray "  YARA sonucu okunamadı." }
        Write-Host ""
    }

    if (!$jsonFiles -and !$netFiles -and !$yaraFiles) {
        Write-Amber "  Henüz hiç tarama sonucu bulunamadı."
        Write-Gray  "  Bir tarama çalıştırın."
    }

    Read-Host "`n  Ana menüye dönmek için Enter'a basın"
}

# ================================================================
#  LOG DOSYALARINI GÖSTER
# ================================================================
function Show-LogFiles {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  LOG DOSYALARI                                   ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    $allLogs = @()
    foreach ($dir in @($LogFolder, (Join-Path $LogFolder "Quick"), $TelDir, $RuleOut)) {
        $allLogs += Get-ChildItem $dir -File -ErrorAction SilentlyContinue |
                    Where-Object { $_.Extension -in @(".log",".json") } |
                    Sort-Object LastWriteTime -Descending | Select-Object -First 10
    }

    if ($allLogs.Count -eq 0) {
        Write-Amber "  Log dosyası bulunamadı."
        Read-Host "`n  Enter'a basın"
        return
    }

    $idx = 1
    $map = @{}
    foreach ($f in $allLogs) {
        $size = if ($f.Length -ge 1KB) { "$([math]::Round($f.Length/1KB,1)) KB" } else { "$($f.Length) B" }
        $date = $f.LastWriteTime.ToString("dd.MM HH:mm")
        Write-Host "  [$idx] " -NoNewline -ForegroundColor Cyan
        Write-Host "$($f.Name.PadRight(45))" -NoNewline -ForegroundColor White
        Write-Host "$date  $size" -ForegroundColor DarkGray
        $map[$idx] = $f.FullName
        $idx++
    }

    Write-Host ""
    Write-Host "  Görüntülemek için numara (Enter = geri): " -NoNewline -ForegroundColor Cyan
    $sel = Read-Host
    if (!$sel -or !$map[[int]$sel]) {
        return
    }

    $chosen = $map[[int]$sel]
    Write-Host ""
    Write-Teal "  ─── $([System.IO.Path]::GetFileName($chosen)) ───"
    Write-Host ""

    try {
        $content = Get-Content $chosen -Raw -ErrorAction Stop
        if ($chosen.EndsWith(".json")) {
            try {
                $parsed = $content | ConvertFrom-Json
                $content = $parsed | ConvertTo-Json -Depth 6
            } catch {}
        }
        # Sayfalı gösterim (40 satır)
        $lines = $content -split "`n"
        $page = 0
        $pageSize = 40
        do {
            $start = $page * $pageSize
            $end   = [Math]::Min($start + $pageSize, $lines.Count) - 1
            $lines[$start..$end] | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
            Write-Host ""
            if ($end -lt $lines.Count - 1) {
                Write-Host "  [Enter = devam, Q = çık]: " -NoNewline -ForegroundColor Cyan
                $key = Read-Host
                if ($key -ieq "Q") { break }
                $page++
            } else { break }
        } while ($true)
    }
    catch { Write-Red "  Dosya okunamadı: $_" }

    Read-Host "`n  Ana menüye dönmek için Enter'a basın"
}

# ================================================================
#  FLASK UI BAŞLATICI
# ================================================================
function Start-FlaskUI {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "  ║  FLASK ARAYÜZÜ BAŞLATILIYOR                     ║" -ForegroundColor Yellow
    Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""

    $uiPath = Join-Path $ScriptDir "UI.py"
    if (!(Test-Path $uiPath)) {
        Write-Red   "  [X] UI.py bulunamadı: $uiPath"
        Write-Amber "      Setup.bat ile kurulumu tamamlayın."
        Read-Host "`n  Enter'a basın"
        return
    }

    # Python bul
    $pyCmd = $null
    foreach ($c in @("python","python3","py")) {
        try {
            $ver = & $c --version 2>&1
            if ($ver -match "3\.(1[0-9]|[89])") { $pyCmd = $c; break }
        } catch {}
    }

    if (!$pyCmd) {
        Write-Red   "  [X] Python 3.10+ bulunamadı."
        Write-Amber "      PATH'te python olduğundan emin olun."
        Read-Host "`n  Enter'a basın"
        return
    }

    Write-Green "  [+] Python: $pyCmd"
    Write-Green "  [+] Script: $uiPath"
    Write-Teal  "  [*] Flask başlatılıyor → http://localhost:5000"
    Write-Gray  "      Durdurmak için bu pencereyi kapatın veya Ctrl+C"
    Write-Host ""

    Start-Process $pyCmd -ArgumentList $uiPath -WorkingDirectory $ScriptDir

    Start-Sleep -Seconds 2

    # Tarayıcıyı aç
    Start-Process "http://localhost:5000"

    Read-Host "  Flask arka planda çalışıyor. Ana menüye dönmek için Enter'a basın"
}

# ================================================================
#  ANA DÖNGÜ
# ================================================================
Show-Samurai

while ($true) {
    Show-MainMenu
    $choice = Read-Host

    switch ($choice) {
        "1" { Invoke-Scan -ScriptName "QuickScan.ps1" -DisplayName "HIZLI TARAMA" }
        "2" { Invoke-Scan -ScriptName "FullScan.ps1"  -DisplayName "TAM KORUMA TARAMASI" }
        "3" { Invoke-YaraScan }
        "4" { Invoke-NetworkScan }
        "5" { Show-WindowsLogs }
        "6" { Show-PSCommandMonitor }
        "7" { Show-LastResults }
        "8" { Show-LogFiles }
        "9" { Start-FlaskUI }
        "0" {
            Clear-Host
            Write-Teal "`n  Güle güle. Sisteminiz korumalı.`n"
            exit 0
        }
        default {
            Write-Amber "`n  Geçersiz seçim. Lütfen 0-9 arası bir sayı girin."
            Start-Sleep -Seconds 1
        }
    }

    Show-Samurai
}
