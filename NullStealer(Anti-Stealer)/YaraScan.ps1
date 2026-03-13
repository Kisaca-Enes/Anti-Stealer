#Requires -Version 7.0
# ================================================================
#  YaraScan.ps1  –  YARA Kural Tarayıcı
#  Kullanım:  .\YaraScan.ps1 "C:\Taranacak\Dizin"
#
#  - Script'in yanındaki /rules klasöründen .yar dosyalarını alır
#  - Verilen yoldaki .exe .dll .jar .bat .ps1 .vbs dosyalarını tarar
#  - Eşleşenleri /ruleout klasörüne JSON olarak kaydeder
# ================================================================

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$TargetPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "SilentlyContinue"

# ================================================================
#  YOLLAR
# ================================================================
$ScriptDir  = $PSScriptRoot
$RulesDir   = Join-Path $ScriptDir "rules"
$OutputDir  = Join-Path $ScriptDir "ruleout"

if (!(Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }

# ================================================================
#  KONTROLLER
# ================================================================
if (!(Test-Path $TargetPath)) {
    Write-Host "[HATA] Hedef yol bulunamadı: $TargetPath" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $RulesDir)) {
    Write-Host "[HATA] /rules klasörü bulunamadı: $RulesDir" -ForegroundColor Red
    exit 1
}

$YaraFiles = Get-ChildItem -Path $RulesDir -Filter "*.yar" -File -Recurse
if ($YaraFiles.Count -eq 0) {
    Write-Host "[HATA] /rules klasöründe hiç .yar dosyası yok." -ForegroundColor Red
    exit 1
}

# ================================================================
#  YARA.EXE BUL  (script yanında veya PATH'te)
# ================================================================
$YaraExe = $null
$candidates = @(
    (Join-Path $ScriptDir "yara64.exe")
    (Join-Path $ScriptDir "yara32.exe")
    (Join-Path $ScriptDir "yara.exe")
    "yara64"
    "yara"
)
foreach ($c in $candidates) {
    if (Get-Command $c -ErrorAction SilentlyContinue) { $YaraExe = $c; break }
    if (Test-Path $c) { $YaraExe = $c; break }
}

if (-not $YaraExe) {
    Write-Host "[HATA] yara.exe bulunamadı." -ForegroundColor Red
    Write-Host "       yara64.exe'yi script ile aynı klasöre koy ya da PATH'e ekle." -ForegroundColor Yellow
    Write-Host "       İndir: https://github.com/VirusTotal/yara/releases" -ForegroundColor Yellow
    exit 1
}

Write-Host "[*] YARA binary : $YaraExe" -ForegroundColor DarkGray

# ================================================================
#  TARANACAK DOSYA UZANTILARI
# ================================================================
$TargetExtensions = @("*.exe","*.dll","*.jar","*.bat","*.ps1","*.vbs","*.cmd","*.com","*.scr")

# ================================================================
#  YARDIMCI
# ================================================================
function Write-Log {
    param([string]$Tag, [string]$Msg, [string]$Color = "Cyan")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')][$Tag] $Msg" -ForegroundColor $Color
}

# ================================================================
#  YARA KURALLARI PARSE  (.yar içinden rule adlarını çıkar)
#  YARA çıktısında hangi .yar dosyasından geldiğini bilmek için
# ================================================================
function Get-YaraRuleNames {
    param([string]$YarFilePath)
    $names = @()
    $content = Get-Content $YarFilePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { return $names }
    $matches = [regex]::Matches($content, '(?m)^\s*rule\s+(\w+)')
    foreach ($m in $matches) { $names += $m.Groups[1].Value }
    return $names
}

# ================================================================
#  TARAMA
# ================================================================
$sw = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║        YaraScan.ps1  –  YARA Tarayıcı        ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Log "INIT" "Kural dosyaları : $($YaraFiles.Count) adet"
Write-Log "INIT" "Hedef dizin     : $TargetPath"

# Hedef dosyaları topla
$TargetFiles = Get-ChildItem -Path $TargetPath -Include $TargetExtensions -Recurse -File -ErrorAction SilentlyContinue
Write-Log "INIT" "Taranacak dosya : $($TargetFiles.Count) adet"

if ($TargetFiles.Count -eq 0) {
    Write-Log "WARN" "Hedef dizinde taranacak dosya bulunamadı." "Yellow"
    exit 0
}

# Sonuç listesi
$AllFindings = [System.Collections.Generic.List[object]]::new()

# Kural meta tablosu (hangi .yar'da hangi rule var)
$RuleMeta = @{}
foreach ($yar in $YaraFiles) {
    $names = Get-YaraRuleNames -YarFilePath $yar.FullName
    foreach ($n in $names) {
        $RuleMeta[$n] = @{
            YarFile    = $yar.Name
            YarPath    = $yar.FullName
        }
    }
}
Write-Log "INIT" "Toplam kural adı : $($RuleMeta.Count) adet"
Write-Host ""

# Her .yar dosyası için tüm hedefleri tara
$yarCount  = 0
$fileCount = 0

foreach ($yar in $YaraFiles) {
    $yarCount++
    Write-Log "YARA" "[$yarCount/$($YaraFiles.Count)]  $($yar.Name)" "DarkCyan"

    foreach ($file in $TargetFiles) {
        try {
            # yara64.exe <kural.yar> <dosya> -s (string match dahil)
            $output = & $YaraExe $yar.FullName $file.FullName 2>$null

            if ($output) {
                foreach ($line in $output) {
                    $line = $line.Trim()
                    if (-not $line) { continue }

                    # YARA çıktı formatı:  RuleName /dosya/yolu
                    $parts    = $line -split '\s+', 2
                    $ruleName = $parts[0]
                    $filePath = if ($parts.Count -gt 1) { $parts[1] } else { $file.FullName }

                    $meta = $RuleMeta[$ruleName]

                    $finding = [PSCustomObject]@{
                        Timestamp   = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
                        RuleName    = $ruleName
                        YarFile     = if ($meta) { $meta.YarFile } else { $yar.Name }
                        FilePath    = $filePath
                        FileName    = [System.IO.Path]::GetFileName($filePath)
                        FileSize    = (Get-Item $filePath -ErrorAction SilentlyContinue)?.Length
                        SHA256      = (Get-FileHash $filePath -Algorithm SHA256 -ErrorAction SilentlyContinue)?.Hash
                        MD5         = (Get-FileHash $filePath -Algorithm MD5    -ErrorAction SilentlyContinue)?.Hash
                    }

                    $AllFindings.Add($finding)
                    Write-Log "HIT" "$ruleName  →  $([System.IO.Path]::GetFileName($filePath))" "Red"
                    $fileCount++
                }
            }
        }
        catch { continue }
    }
}

$sw.Stop()

# ================================================================
#  KAYDET
# ================================================================
Write-Host ""
Write-Log "SAVE" "Sonuçlar kaydediliyor..."

if ($AllFindings.Count -eq 0) {
    Write-Log "SAVE" "Eşleşme bulunamadı – temiz." "Green"
} else {
    # 1) Tek birleşik rapor
    $reportPath = Join-Path $OutputDir "yara_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    $report = [PSCustomObject]@{
        ScanTime     = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        Duration     = "$([math]::Round($sw.Elapsed.TotalSeconds,1))s"
        TargetPath   = $TargetPath
        RulesScanned = $YaraFiles.Count
        FilesScanned = $TargetFiles.Count
        TotalHits    = $AllFindings.Count
        Findings     = $AllFindings
    }
    $report | ConvertTo-Json -Depth 6 | Out-File $reportPath -Encoding UTF8
    Write-Log "SAVE" "Birleşik rapor  : $reportPath" "Cyan"

    # 2) Her tetiklenen kural için ayrı dosya
    $grouped = $AllFindings | Group-Object RuleName
    foreach ($grp in $grouped) {
        $safeName  = $grp.Name -replace '[\\/:*?"<>|]', '_'
        $ruleFile  = Join-Path $OutputDir "rule_$safeName.json"
        $grp.Group | ConvertTo-Json -Depth 5 | Out-File $ruleFile -Encoding UTF8
        Write-Log "SAVE" "Kural dosyası   : rule_$safeName.json  ($($grp.Count) eşleşme)" "DarkCyan"
    }
}

# ================================================================
#  ÖZET
# ================================================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   TARAMA TAMAMLANDI                          ║" -ForegroundColor Magenta
Write-Host "║   Süre          : $("$([math]::Round($sw.Elapsed.TotalSeconds,1))s".PadRight(25))║" -ForegroundColor Magenta
Write-Host "║   Taranan kural : $($YaraFiles.Count.ToString().PadRight(25))║" -ForegroundColor Magenta
Write-Host "║   Taranan dosya : $($TargetFiles.Count.ToString().PadRight(25))║" -ForegroundColor Magenta
Write-Host "║   Eşleşme      : $($AllFindings.Count.ToString().PadRight(25))║" -ForegroundColor $(if ($AllFindings.Count -gt 0) { "Red" } else { "Magenta" })
Write-Host "║   Çıktı         : /ruleout                  ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Magenta

if ($AllFindings.Count -gt 0) {
    Write-Host ""
    Write-Host "  Tetiklenen kurallar:" -ForegroundColor Yellow
    $AllFindings | Group-Object RuleName | Sort-Object Count -Descending | ForEach-Object {
        Write-Host "    [$($_.Count)x]  $($_.Name)" -ForegroundColor Yellow
    }
}
