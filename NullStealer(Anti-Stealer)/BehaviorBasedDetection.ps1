# ============================================================
#  BehaviorBasedDetection.ps1
#  Behavior-Based Malware Detection Engine
#  Temel algoritma: Exact Match + Jaccard Similarity Vectors
# ============================================================

# ---------- KURAL YAPISI (örnek şema) ----------
# Her kural GitHub Raw'dan JSON olarak çekilir.
# Beklenen JSON formatı:
# {
#   "family":       "mythstealer",
#   "threadname":   "optional",
#   "commandlines": ["..."],
#   "writtenfiles": ["..."],
#   "registry":     ["..."],
#   "apicalls":     ["..."],
#   "network":      [{ "host": "...", "port": 0, "packagecontent": "..." }]
# }
# -----------------------------------------------

$SignatureSources = @{
    "myth"     = "https://raw.githubusercontent.com/example/rules/main/myth.json"
    "ecilsoul" = "https://raw.githubusercontent.com/example/rules/main/ecilsoul.json"
}

# Uygulama dizinleri
$AppBase   = "$env:APPDATA\Anti-Stealer"
$TelDir    = Join-Path $AppBase "Telemetry"
$TelExe    = Join-Path $AppBase "telemetry.exe"
$LogFolder = Join-Path $AppBase "Log"

foreach ($d in @($AppBase, $TelDir, $LogFolder)) {
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

# ============================================================
#  GLOBAL TABLOLAR
# ============================================================
$RulesTable      = [System.Collections.Generic.List[object]]::new()
$ProcessTelTable = [System.Collections.Generic.List[hashtable]]::new()

# ============================================================
#  1. KURAL YÜKLEME  –  Get-Rule-Raw
# ============================================================
function Get-Rule-Raw {
    foreach ($src in $SignatureSources.GetEnumerator()) {
        try {
            Write-Host "[*] Kural indiriliyor: $($src.Key)  <-  $($src.Value)"
            $response = Invoke-WebRequest -Uri $src.Value -UseBasicParsing -ErrorAction Stop
            $parsed   = $response.Content | ConvertFrom-Json

            # Tekil nesne ya da dizi olabilir
            $ruleList = if ($parsed -is [array]) { $parsed } else { @($parsed) }

            foreach ($rule in $ruleList) {
                $RulesTable.Add($rule)
                Write-Host "    [+] Kural eklendi: $($rule.family)"
            }
        }
        catch {
            Write-Warning "Kural indirilemedi [$($src.Key)]: $_"
        }
    }
    Write-Host "[*] Toplam kural: $($RulesTable.Count)"
}

# ============================================================
#  2. TELEMETRİ TOPLAMA  –  Get-Telemetry
# ============================================================
function Get-Telemetry {
    Write-Host "[*] Telemetri toplanıyor..."

    $runningPids = Get-Process | Select-Object -ExpandProperty Id

    foreach ($pid in $runningPids) {
        try {
            # Harici telemetry.exe varsa çalıştır; yoksa WMI ile doldurmaya çalış
            if (Test-Path $TelExe) {
                Start-Process $TelExe -ArgumentList $pid -Wait -WindowStyle Hidden
            }

            # telemetry.exe çıktısını oku (varsa)
            $jsonFiles = Get-ChildItem $TelDir -Filter "$pid*.json" -File -ErrorAction SilentlyContinue
            if ($jsonFiles) {
                foreach ($jf in $jsonFiles) {
                    $raw = Get-Content $jf.FullName -Raw | ConvertFrom-Json
                    $entry = @{
                        pid            = [int]$raw.pid
                        ProcessName    = [string]$raw.processname
                        CommandLine    = @($raw.commandlines)
                        WrittenFiles   = @($raw.writtenfiles)
                        RegistryWrites = @($raw.registry)
                        APIcalls       = @($raw.apicalls)
                        Network        = @($raw.network)       # dizi: {host, port, packagecontent}
                        OpenFiles      = @($raw.openfiles)
                        ThreadName     = [string]$raw.threadname
                    }
                    $ProcessTelTable.Add($entry)
                    Remove-Item $jf.FullName -Force  # işlendikten sonra sil
                }
            }
            else {
                # Harici exe yoksa / çıktı yoksa: WMI ile temel bilgi doldur
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    $wmi = Get-CimInstance Win32_Process -Filter "ProcessId=$pid" -ErrorAction SilentlyContinue
                    $entry = @{
                        pid            = $pid
                        ProcessName    = $proc.ProcessName
                        CommandLine    = if ($wmi.CommandLine) { @($wmi.CommandLine) } else { @() }
                        WrittenFiles   = @()
                        RegistryWrites = @()
                        APIcalls       = @()
                        Network        = @()
                        OpenFiles      = @()
                        ThreadName     = ""
                    }
                    $ProcessTelTable.Add($entry)
                }
            }
        }
        catch {
            # Erişim izni olmayan PID'leri sessizce geç
        }
    }
    Write-Host "[*] Toplam telemetri girişi: $($ProcessTelTable.Count)"
}

# ============================================================
#  3. EXACT MATCH ANALİZİ  –  Invoke-ExactMatch
# ============================================================
function Invoke-ExactMatch {
    # Kuralları HashSet'e dönüştür (tek sefer)
    $ruleIndex = [System.Collections.Generic.List[hashtable]]::new()
    foreach ($rule in $RulesTable) {
        $ruleIndex.Add(@{
            family       = $rule.family
            threadname   = $rule.threadname
            commandlines = [System.Collections.Generic.HashSet[string]]::new(
                               [string[]]@($rule.commandlines), [System.StringComparer]::OrdinalIgnoreCase)
            writtenfiles = [System.Collections.Generic.HashSet[string]]::new(
                               [string[]]@($rule.writtenfiles), [System.StringComparer]::OrdinalIgnoreCase)
            registry     = [System.Collections.Generic.HashSet[string]]::new(
                               [string[]]@($rule.registry),     [System.StringComparer]::OrdinalIgnoreCase)
            apicalls     = [System.Collections.Generic.HashSet[string]]::new(
                               [string[]]@($rule.apicalls),     [System.StringComparer]::OrdinalIgnoreCase)
            network      = $rule.network   # dizi olarak tut; host+port karşılaştırması manuel
        })
    }

    $results = [System.Collections.Generic.List[hashtable]]::new()

    foreach ($tlm in $ProcessTelTable) {
        foreach ($ri in $ruleIndex) {
            $score = 0

            foreach ($cmd in $tlm.CommandLine)    { if ($ri.commandlines.Contains($cmd))  { $score++ } }
            foreach ($f   in $tlm.WrittenFiles)   { if ($ri.writtenfiles.Contains($f))    { $score++ } }
            foreach ($reg in $tlm.RegistryWrites) { if ($ri.registry.Contains($reg))      { $score++ } }
            foreach ($api in $tlm.APIcalls)        { if ($ri.apicalls.Contains($api))      { $score++ } }

            # Ağ eşleşmesi
            foreach ($netRule in $ri.network) {
                foreach ($netTlm in $tlm.Network) {
                    if ($netRule.host -eq $netTlm.host -and $netRule.port -eq $netTlm.port) {
                        $score++
                    }
                }
            }

            if ($score -ge 1) {
                Write-Host "[EXACT] PID $($tlm.pid) ($($tlm.ProcessName))  -->  $($ri.family)  [Skor: $score]"

                if ($score -ge 2) {
                    $results.Add(@{
                        pid         = $tlm.pid
                        ProcessName = $tlm.ProcessName
                        MatchFamily = $ri.family
                        Score       = $score
                        Telemetry   = $tlm
                    })
                }
            }
        }
    }

    return $results
}

# ============================================================
#  4. JACCARD BENZERLİK VEKTÖRLERİ  –  Invoke-SimilarityVectors
# ============================================================
function Get-JaccardScore {
    param(
        [string[]]$SetA,
        [string[]]$SetB
    )
    if (-not $SetA -and -not $SetB) { return 0.0 }

    $hsA = [System.Collections.Generic.HashSet[string]]::new(
               [string[]]$SetA, [System.StringComparer]::OrdinalIgnoreCase)
    $hsB = [System.Collections.Generic.HashSet[string]]::new(
               [string[]]$SetB, [System.StringComparer]::OrdinalIgnoreCase)

    $intersection = [System.Collections.Generic.HashSet[string]]::new($hsA)
    $intersection.IntersectWith($hsB)

    $union = [System.Collections.Generic.HashSet[string]]::new($hsA)
    $union.UnionWith($hsB)

    if ($union.Count -eq 0) { return 0.0 }
    return [double]$intersection.Count / [double]$union.Count
}

function Invoke-SimilarityVectors {
    param(
        [double]$Threshold = 0.3    # 0.0 – 1.0 arası; yükseltilince daha katı
    )

    $Fields = @("CommandLine","WrittenFiles","RegistryWrites","APIcalls","OpenFiles")
    $simResults = [System.Collections.Generic.List[hashtable]]::new()

    foreach ($tlm in $ProcessTelTable) {
        foreach ($rule in $RulesTable) {

            $scores = @{}

            foreach ($field in $Fields) {
                # Kural tarafındaki alan adı (bazıları farklı isimle gelebilir)
                $ruleField = switch ($field) {
                    "WrittenFiles"   { "writtenfiles" }
                    "RegistryWrites" { "registry" }
                    "APIcalls"       { "apicalls" }
                    default          { $field.ToLower() }
                }

                $tlmValues  = @($tlm[$field])
                $ruleValues = @($rule.$ruleField)

                $scores[$field] = Get-JaccardScore -SetA $tlmValues -SetB $ruleValues
            }

            # Ağ benzerliği: host string listesi karşılaştır
            $tlmHosts  = @($tlm.Network  | ForEach-Object { "$($_.host):$($_.port)" })
            $ruleHosts = @($rule.network | ForEach-Object { "$($_.host):$($_.port)" })
            $scores["Network"] = Get-JaccardScore -SetA $tlmHosts -SetB $ruleHosts

            # Ağırlıklı ortalama (CommandLine ve APIcalls daha önemli)
            $weights = @{
                CommandLine    = 0.25
                WrittenFiles   = 0.15
                RegistryWrites = 0.15
                APIcalls       = 0.25
                OpenFiles      = 0.10
                Network        = 0.10
            }
            $weightedSum = 0.0
            foreach ($k in $scores.Keys) { $weightedSum += $scores[$k] * $weights[$k] }

            if ($weightedSum -ge $Threshold) {
                Write-Host "[SIM]   PID $($tlm.pid) ($($tlm.ProcessName))  -->  $($rule.family)  [Jaccard: $([math]::Round($weightedSum,3))]"

                $simResults.Add(@{
                    pid           = $tlm.pid
                    ProcessName   = $tlm.ProcessName
                    MatchFamily   = $rule.family
                    JaccardScore  = $weightedSum
                    FieldScores   = $scores
                    Telemetry     = $tlm
                })
            }
        }
    }

    return $simResults
}

# ============================================================
#  5. SONUÇLARI KAYDET  –  Save-Results
# ============================================================
function Save-Results {
    param(
        [System.Collections.Generic.List[hashtable]]$ExactResults,
        [System.Collections.Generic.List[hashtable]]$SimResults
    )

    $allResults = [System.Collections.Generic.List[hashtable]]::new()
    foreach ($r in $ExactResults) { $r["DetectionType"] = "ExactMatch";   $allResults.Add($r) }
    foreach ($r in $SimResults)   { $r["DetectionType"] = "Similarity";   $allResults.Add($r) }

    if ($allResults.Count -eq 0) {
        Write-Host "[*] Tespit yok – log oluşturulmadı."
        return
    }

    $i = 1
    foreach ($entry in $allResults) {
        # Telemetry alanındaki iç hashtable'ı temizle (döngüsel referansları önle)
        $safe = $entry.Clone()
        $safe.Remove("Telemetry")

        $json = $safe | ConvertTo-Json -Depth 6
        $outFile = Join-Path $LogFolder "$i`_$($entry.ProcessName)_$($entry.MatchFamily).json"
        $json | Out-File $outFile -Encoding UTF8
        Write-Host "[LOG] $outFile"
        $i++
    }
}

# ============================================================
#  6. ANA AKIŞ
# ============================================================
function Start-Detection {
    param(
        [double]$SimilarityThreshold = 0.3
    )

    Write-Host "=== BehaviorBasedDetection Engine Başlatılıyor ==="

    # Adım 1 – Kuralları indir
    Get-Rule-Raw

    if ($RulesTable.Count -eq 0) {
        Write-Warning "Hiç kural yüklenemedi. Çıkılıyor."
        return
    }

    # Adım 2 – Telemetri topla
    Get-Telemetry

    if ($ProcessTelTable.Count -eq 0) {
        Write-Warning "Telemetri verisi yok. Çıkılıyor."
        return
    }

    # Adım 3 – Exact Match
    Write-Host "`n--- Exact Match Analizi ---"
    $exactHits = Invoke-ExactMatch

    # Adım 4 – Jaccard Similarity Vectors
    Write-Host "`n--- Jaccard Similarity Analizi (eşik: $SimilarityThreshold) ---"
    $simHits = Invoke-SimilarityVectors -Threshold $SimilarityThreshold

    # Adım 5 – Kaydet
    Write-Host "`n--- Sonuçlar Kaydediliyor ---"
    Save-Results -ExactResults $exactHits -SimResults $simHits

    Write-Host "`n=== Tarama Tamamlandı ==="
    Write-Host "   Exact eşleşme : $($exactHits.Count)"
    Write-Host "   Similarity hit : $($simHits.Count)"
    Write-Host "   Log klasörü   : $LogFolder"
}

# ---- Çalıştır ----
Start-Detection -SimilarityThreshold 0.3
