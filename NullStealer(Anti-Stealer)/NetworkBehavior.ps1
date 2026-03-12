#Requires -Version 5.1
<#
.SYNOPSIS
    Stealer Network Behavior Detection Engine

.DESCRIPTION
    Ağ davranışı tabanlı stealer tespiti.
    - Aktif TCP bağlantıları + DNS sorguları izlenir
    - GEO / ASN reputasyon kontrolü (ip-api.com)
    - Entropi ve payload boyut analizi
    - Process parent-child zinciri
    - Ağırlıklı kural motoru → risk skoru
    - Kural eşleşmesi = "SteelerNetworkBehavior" etiketi
    - Sonuç JSON olarak ./telemetery/network_YYYYMMDD_HHmmss.json kaydedilir

.PARAMETER OutputDir
    JSON çıktı klasörü. Varsayılan: .\telemetery

.PARAMETER MinScore
    Bu eşiğin altındaki bağlantılar rapora dahil edilmez. Varsayılan: 25

.PARAMETER DeepEntropy
    Tüm bağlantılara (sadece şüpheli porta değil) entropi ölçümü uygula.

.EXAMPLE
    .\network.ps1
    .\network.ps1 -OutputDir "C:\Logs" -MinScore 40 -DeepEntropy
#>

[CmdletBinding()]
param(
    [string] $OutputDir   = ".\telemetery",
    [int]    $MinScore    = 25,
    [switch] $DeepEntropy
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "SilentlyContinue"

# ── çıktı klasörü ─────────────────────────────────────────────────────────────
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# ── konsol yardımcıları ───────────────────────────────────────────────────────
function Write-Step  { param([string]$M) Write-Host "  [>] $M" -ForegroundColor Cyan    }
function Write-Good  { param([string]$M) Write-Host "  [+] $M" -ForegroundColor Green   }
function Write-Warn  { param([string]$M) Write-Host "  [!] $M" -ForegroundColor Yellow  }
function Write-Crit  { param([string]$M) Write-Host "  [X] $M" -ForegroundColor Red     }
function Write-Info  { param([string]$M) Write-Host "      $M" -ForegroundColor DarkGray }

# ═══════════════════════════════════════════════════════════════════════════════
#  KISIM 1 ── Bilinen kötü amaçlı ASN / Port / Domain listesi
# ═══════════════════════════════════════════════════════════════════════════════

# Bulletproof hosting ve C2 altyapısı olarak bilinen ASN'ler
$MaliciousASNs = [System.Collections.Generic.HashSet[string]]@(
    "AS200019","AS62282","AS49349","AS209103","AS34534",
    "AS57588","AS202425","AS48721","AS395954","AS60068",
    "AS59642","AS206728","AS267784","AS265080"
)

# Stealer C2 iletişiminde yaygın görülen non-standard portlar
$C2Ports = [System.Collections.Generic.HashSet[int]]@(
    1337, 3333, 4444, 5555, 6666, 7777, 8888, 9999,
    31337, 12345, 54321, 1234, 6543, 7654, 2222,
    4848, 8181, 9090, 55555
)

# DNS üzerinden C2 için kullanılan şüpheli TLD'ler
$SuspiciousTLDs = @("\.su$","\.xyz$","\.top$","\.tk$","\.pw$","\.cc$","\.biz$",
                    "\.work$","\.click$","\.link$","\.online$","\.site$","\.fun$")

# Bilinen meşru portlar (bu portlarda salt port kuralı tetiklenmez)
$LegitPorts = [System.Collections.Generic.HashSet[int]]@(
    80,443,8080,8443,8000,8008,8888,
    21,22,25,53,110,143,465,587,993,995,
    3306,5432,1433,27017,6379,
    3389,5900,1194,51820
)

# Bilinen stealer / RAT process adları
$SuspiciousProcessNames = @(
    "lumma","lummac","redline","racoon","raccoon","vidar","azorult","formbook",
    "agent","mytob","stealer","grabber","clipper","loader","dropper","injector",
    "rat","keylog","hvnc","remcos","njrat","asyncrat","dcrat","nanocore",
    "quasar","blackshades","darkcomet"
)

# ═══════════════════════════════════════════════════════════════════════════════
#  KISIM 2 ── Kural Tanımları
# ═══════════════════════════════════════════════════════════════════════════════
# Her kural: Name, Description, Category, Severity, Weight, Check (scriptblock)
# Check parametreleri: ($Conn, $Rep, $Entropy, $ProcChain, $AllConns)
# Check $true döndürürse kural tetiklenir ve Weight skora eklenir.

$Rules = @(

    # ─── Bağlantı / Port ───────────────────────────────────────────────────────
    @{
        Name        = "C2 Port Detected"
        Description = "Bilinen C2 portuna bağlantı (1337, 4444, 31337 vb.)"
        Category    = "Connection"
        Severity    = "High"
        Weight      = 50
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $script:C2Ports.Contains([int]$Conn.RemotePort)
        }
    },

    @{
        Name        = "Non-Standard Port"
        Description = "Bilinen portların dışında beklenmedik port kullanımı"
        Category    = "Connection"
        Severity    = "Medium"
        Weight      = 20
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            -not $script:LegitPorts.Contains([int]$Conn.RemotePort)
        }
    },

    @{
        Name        = "Suspicious TLD"
        Description = "C2 altyapısında yaygın görülen TLD (.su .xyz .top .tk vb.)"
        Category    = "Connection"
        Severity    = "Medium"
        Weight      = 25
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $addr = $Conn.RemoteAddress
            foreach ($tld in $script:SuspiciousTLDs) {
                if ($addr -match $tld) { return $true }
            }
            return $false
        }
    },

    @{
        Name        = "Multi-Host Fan-Out"
        Description = "Tek process 4'ten fazla farklı uzak adrese bağlanıyor (data exfil / botnet)"
        Category    = "Behavioral"
        Severity    = "High"
        Weight      = 40
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            ($AllConns | Select-Object -ExpandProperty RemoteAddress -Unique).Count -gt 4
        }
    },

    # ─── Process ───────────────────────────────────────────────────────────────
    @{
        Name        = "Known Stealer Process Name"
        Description = "Bilinen stealer / RAT process adı eşleşmesi"
        Category    = "Process"
        Severity    = "Critical"
        Weight      = 80
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $name = $Conn._ProcName.ToLower()
            foreach ($pat in $script:SuspiciousProcessNames) {
                if ($name -like "*$pat*") { return $true }
            }
            return $false
        }
    },

    @{
        Name        = "Suspicious Parent-Child Chain"
        Description = "Office / Browser → PowerShell / cmd → network process zinciri"
        Category    = "Process"
        Severity    = "High"
        Weight      = 55
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            if (-not $Chain -or $Chain.Depth -lt 2) { return $false }
            $Chain.IsSuspicious
        }
    },

    @{
        Name        = "Unsigned Process Binary"
        Description = "Ağ bağlantısı kuran process'in imzası doğrulanamıyor"
        Category    = "Process"
        Severity    = "Medium"
        Weight      = 30
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $path = $Conn._ProcPath
            if (-not $path -or -not (Test-Path $path)) { return $false }
            try {
                $sig = Get-AuthenticodeSignature -FilePath $path -ErrorAction Stop
                return ($sig.Status -ne "Valid")
            } catch { return $false }
        }
    },

    # ─── GEO / ASN Reputasyon ──────────────────────────────────────────────────
    @{
        Name        = "High-Risk Country"
        Description = "Bağlantı yüksek riskli coğrafyadan (KP, IR, RU, CN, NG, BY)"
        Category    = "Reputation"
        Severity    = "High"
        Weight      = 35
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $Rep -and ($Rep.CountryCode -in @("KP","IR","RU","CN","NG","BY","SY","CU"))
        }
    },

    @{
        Name        = "VPS / Hosting ASN"
        Description = "IP, datacenter / VPS altyapısında barınıyor (C2 sunucu göstergesi)"
        Category    = "Reputation"
        Severity    = "High"
        Weight      = 35
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $Rep -and $Rep.IsHosting
        }
    },

    @{
        Name        = "Known Malicious ASN"
        Description = "IP, bilinen bulletproof / kötü amaçlı ASN blokunda"
        Category    = "Reputation"
        Severity    = "Critical"
        Weight      = 75
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $Rep -and $Rep.IsMaliciousASN
        }
    },

    @{
        Name        = "Tor / Anonymous Proxy"
        Description = "Hedef IP, Tor çıkış düğümü veya anonim proxy"
        Category    = "Reputation"
        Severity    = "Critical"
        Weight      = 70
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $Rep -and ($Rep.IsProxy -or $Rep.IsTor)
        }
    },

    # ─── Entropi / Payload ─────────────────────────────────────────────────────
    @{
        Name        = "Beacon Heartbeat (Fixed Payload)"
        Description = "Sabit boyutlu küçük paket döngüsü — C2 check-in / heartbeat"
        Category    = "Entropy"
        Severity    = "High"
        Weight      = 55
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $Entropy -and $Entropy.IsFixedSize
        }
    },

    @{
        Name        = "High-Entropy Payload"
        Description = "Yüksek Shannon entropisi — şifreli / obfuscated veri gönderimi"
        Category    = "Entropy"
        Severity    = "High"
        Weight      = 50
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $Entropy -and ($Entropy.ShannonEntropy -gt 7.2)
        }
    },

    @{
        Name        = "Data Exfiltration Burst"
        Description = ">50 KB/s süregelen gönderim — aktif veri sızdırma şüphesi"
        Category    = "Entropy"
        Severity    = "Critical"
        Weight      = 80
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $Entropy -and ($Entropy.BurstBytesPerSec -gt 50000)
        }
    },

    # ─── DNS Davranış ──────────────────────────────────────────────────────────
    @{
        Name        = "DGA-Like DNS Query"
        Description = "Rastgele görünümlü hostname — Domain Generation Algorithm şüphesi"
        Category    = "DNS"
        Severity    = "High"
        Weight      = 60
        Check       = {
            param($Conn, $Rep, $Entropy, $Chain, $AllConns)
            $h = $Conn._ResolvedHost
            if (-not $h -or $h -eq $Conn.RemoteAddress) { return $false }
            # DGA tespiti: consonant cluster yüksekliği + uzunluk
            $stripped = ($h -split "\.")[0]
            $consonants = ($stripped -replace "[aeiou0-9\-]","").Length
            $ratio = if ($stripped.Length -gt 0) { $consonants / $stripped.Length } else { 0 }
            ($stripped.Length -gt 12 -and $ratio -gt 0.70)
        }
    }
)

# ═══════════════════════════════════════════════════════════════════════════════
#  KISIM 3 ── GEO / ASN Reputasyon
# ═══════════════════════════════════════════════════════════════════════════════
function Get-IPReputationBatch {
    param([string[]]$IPList)

    $map = @{}

    $targets = $IPList | Where-Object {
        $_ -and
        $_ -ne "0.0.0.0" -and
        $_ -notmatch "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|::1|fe80:)"
    } | Select-Object -Unique

    if (-not $targets) { return $map }

    Write-Step "GEO/ASN sorgulanıyor — $($targets.Count) public IP..."

    foreach ($ip in $targets) {
        try {
            $r = Invoke-RestMethod `
                    -Uri "http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,org,as,hosting,proxy,mobile" `
                    -TimeoutSec 6 `
                    -UseBasicParsing

            if ($r.status -ne "success") {
                $map[$ip] = [PSCustomObject]@{ IP=$ip; LookupOK=$false }
                continue
            }

            # "AS12345 Provider Name" → "AS12345"
            $asnCode = if ($r.as -match "^(AS\d+)") { $Matches[1] } else { $r.as }

            $isMalASN  = $script:MaliciousASNs.Contains($asnCode)
            $isTor     = [bool]$r.proxy -and ($r.org -match "Tor|tor-exit|torproject")
            $isHosting = [bool]$r.hosting
            $isProxy   = [bool]$r.proxy -and -not $isTor

            # Reputasyon puanı (0-100)
            $rep = 0
            if ($r.countryCode -in @("KP","IR","RU","CN","NG","BY","SY","CU")) { $rep += 30 }
            if ($isHosting)  { $rep += 25 }
            if ($isProxy)    { $rep += 30 }
            if ($isTor)      { $rep += 45 }
            if ($isMalASN)   { $rep += 40 }
            if ($r.org -match "Hosting|VPS|Datacenter|Dedicated|Lease|Bulletproof") { $rep += 15 }
            $rep = [Math]::Min($rep, 100)

            $map[$ip] = [PSCustomObject]@{
                IP              = $ip
                LookupOK        = $true
                Country         = $r.country
                CountryCode     = $r.countryCode
                Region          = $r.regionName
                City            = $r.city
                Org             = $r.org
                ASN             = $asnCode
                IsHosting       = $isHosting
                IsProxy         = $isProxy
                IsTor           = $isTor
                IsMobile        = [bool]$r.mobile
                IsMaliciousASN  = $isMalASN
                ReputationScore = $rep
            }

            $flag = if ($rep -ge 60) { "[HIGH-RISK]" } elseif ($rep -ge 30) { "[MEDIUM]" } else { "" }
            if ($flag) { Write-Warn "$ip → $($r.countryCode) / $asnCode $flag" }

        } catch {
            $map[$ip] = [PSCustomObject]@{ IP=$ip; LookupOK=$false; Error=$_.Exception.Message }
        }

        Start-Sleep -Milliseconds 150   # ip-api.com: 45 req/dk serbest
    }

    return $map
}

# ═══════════════════════════════════════════════════════════════════════════════
#  KISIM 4 ── Entropi / Payload Boyut Analizi
# ═══════════════════════════════════════════════════════════════════════════════
function Measure-ConnectionEntropy {
    param(
        [string] $RemoteAddress,
        [int]    $RemotePort,
        [int]    $ProcessId,
        [int]    $Samples    = 10,
        [int]    $IntervalMs = 400
    )

    $sentSamples = [System.Collections.Generic.List[long]]::new()
    $recvSamples = [System.Collections.Generic.List[long]]::new()
    $baseline    = $null

    for ($i = 0; $i -lt $Samples; $i++) {
        $c = Get-NetTCPConnection -OwningProcess $ProcessId `
                -RemoteAddress $RemoteAddress -RemotePort $RemotePort `
                -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($c) {
            $sentSamples.Add([long]$c.BytesSent)
            $recvSamples.Add([long]$c.BytesReceived)
            if ($null -eq $baseline) { $baseline = @{ S=$c.BytesSent; R=$c.BytesReceived } }
        }
        Start-Sleep -Milliseconds $IntervalMs
    }

    if ($sentSamples.Count -lt 3) {
        return [PSCustomObject]@{
            RemoteAddress=$RemoteAddress; RemotePort=$RemotePort; Measured=$false
        }
    }

    # Ardışık delta'lar
    $deltas = [System.Collections.Generic.List[long]]::new()
    for ($i = 1; $i -lt $sentSamples.Count; $i++) {
        $d = $sentSamples[$i] - $sentSamples[$i-1]
        if ($d -ge 0) { $deltas.Add($d) }
    }

    $avg      = if ($deltas.Count) { ($deltas | Measure-Object -Average).Average } else { 0 }
    $max      = if ($deltas.Count) { ($deltas | Measure-Object -Maximum).Maximum } else { 0 }
    $variance = 0
    if ($deltas.Count -gt 1 -and $avg -gt 0) {
        $variance = ($deltas | ForEach-Object { [Math]::Pow($_ - $avg, 2) } |
                     Measure-Object -Average).Average
    }

    $totalSent   = if ($baseline) { $sentSamples[-1] - $baseline.S } else { 0 }
    $totalRecv   = if ($baseline) { $recvSamples[-1] - $baseline.R } else { 0 }
    $windowSec   = ($Samples * $IntervalMs) / 1000.0
    $burstBps    = if ($windowSec -gt 0) { [Math]::Round($totalSent / $windowSec) } else { 0 }

    # Shannon entropisi tahmini (gerçek byte erişimi olmadan)
    # Düşük varyans + küçük paket = yüksek entropi tahmini (şifreli heartbeat)
    $shannon = if ($variance -lt 80 -and $avg -in 1..512) {
                   [Math]::Min(7.5 + [Math]::Log([Math]::Max($avg,1), 256) * 0.3, 8.0)
               } elseif ($avg -gt 4096) {
                   5.2
               } else { 3.8 }
    $shannon = [Math]::Round($shannon, 2)

    return [PSCustomObject]@{
        RemoteAddress    = $RemoteAddress
        RemotePort       = $RemotePort
        Measured         = $true
        AvgDeltaBytes    = [Math]::Round($avg)
        MaxDeltaBytes    = [Math]::Round($max)
        Variance         = [Math]::Round($variance, 1)
        TotalSentBytes   = $totalSent
        TotalRecvBytes   = $totalRecv
        BurstBytesPerSec = $burstBps
        ShannonEntropy   = $shannon
        # Sabit boyut → heartbeat / beacon
        IsFixedSize      = ($variance -lt 120 -and $avg -gt 0 -and $avg -lt 512)
        # Yüksek burst → exfil
        IsBurstUpload    = ($burstBps -gt 50000)
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
#  KISIM 5 ── Process Parent-Child Zinciri
# ═══════════════════════════════════════════════════════════════════════════════
$HighRiskParents = @(
    "winword.exe","excel.exe","powerpnt.exe","outlook.exe","onenote.exe",
    "chrome.exe","firefox.exe","msedge.exe","iexplore.exe","opera.exe",
    "brave.exe","explorer.exe","mshta.exe","wscript.exe","cscript.exe"
)
$HighRiskChildren = @(
    "powershell.exe","pwsh.exe","cmd.exe","wscript.exe","cscript.exe",
    "mshta.exe","rundll32.exe","regsvr32.exe","certutil.exe","bitsadmin.exe",
    "msiexec.exe","installutil.exe"
)

function Get-ProcessChain {
    param([int]$ProcessId)

    $chain  = [System.Collections.Generic.List[PSCustomObject]]::new()
    $cursor = $ProcessId
    $seen   = [System.Collections.Generic.HashSet[int]]::new()

    while ($cursor -gt 0 -and $seen.Add($cursor)) {
        $wmi = Get-CimInstance Win32_Process -Filter "ProcessId=$cursor" -ErrorAction SilentlyContinue
        if (-not $wmi) { break }

        $chain.Add([PSCustomObject]@{
            PID         = [int]$wmi.ProcessId
            Name        = $wmi.Name
            Path        = $wmi.ExecutablePath
            CommandLine = $wmi.CommandLine
            ParentPID   = [int]$wmi.ParentProcessId
        })
        $cursor = [int]$wmi.ParentProcessId
    }

    # Şüpheli zincir tespiti: yüksek riskli parent → yüksek riskli child
    $suspicious = $false
    if ($chain.Count -ge 2) {
        $child  = $chain[0].Name.ToLower()
        $parent = $chain[1].Name.ToLower()
        $suspicious = ($script:HighRiskParents -contains $parent) -and
                      ($script:HighRiskChildren -contains $child)
    }

    return [PSCustomObject]@{
        RootPID      = $ProcessId
        Depth        = $chain.Count
        Chain        = $chain.ToArray()
        ChainString  = ($chain | ForEach-Object { $_.Name }) -join " → "
        IsSuspicious = $suspicious
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
#  KISIM 6 ── DNS Sorgu İzleme
#  (netsh dns cache üzerinden — ETW gerektirmez)
# ═══════════════════════════════════════════════════════════════════════════════
function Get-DNSCacheSnapshot {
    $entries = @{}
    try {
        $raw = Get-DnsClientCache -ErrorAction Stop
        foreach ($e in $raw) {
            if ($e.Data -and $e.Entry) {
                $entries[$e.Data] = $e.Entry   # IP → hostname
            }
        }
    } catch {}
    return $entries
}

function Test-DGALikeDomain {
    param([string]$Domain)
    if (-not $Domain) { return $false }
    $label = ($Domain -split "\.")[0]
    if ($label.Length -lt 8) { return $false }
    $consonants = ($label -replace "[aeiouAEIOU0-9\-_]","").Length
    $ratio = $consonants / $label.Length
    # DGA genellikle sessiz harf oranı yüksek, uzun, anlamsız label
    return ($label.Length -gt 12 -and $ratio -gt 0.65)
}

# ═══════════════════════════════════════════════════════════════════════════════
#  KISIM 7 ── Risk Skoru Hesaplama
# ═══════════════════════════════════════════════════════════════════════════════
function Invoke-RuleEngine {
    param(
        [object]          $Conn,
        [PSCustomObject]  $Rep,
        [PSCustomObject]  $Entropy,
        [PSCustomObject]  $Chain,
        [object[]]        $AllConns
    )

    $totalScore    = 0
    $fired         = [System.Collections.Generic.List[PSCustomObject]]::new()

    foreach ($rule in $script:Rules) {
        $hit = $false
        try { $hit = [bool](& $rule.Check $Conn $Rep $Entropy $Chain $AllConns) }
        catch {}

        if ($hit) {
            $totalScore += $rule.Weight
            $fired.Add([PSCustomObject]@{
                Name        = $rule.Name
                Description = $rule.Description
                Category    = $rule.Category
                Severity    = $rule.Severity
                Weight      = $rule.Weight
            })
        }
    }

    $maxScore   = ($Rules | Measure-Object -Property Weight -Sum).Sum
    $confidence = [Math]::Min([Math]::Round(($totalScore / $maxScore) * 100), 100)

    $severity   = if ($totalScore -ge 150) { "Critical" }
                  elseif ($totalScore -ge 90) { "High"     }
                  elseif ($totalScore -ge 45) { "Medium"   }
                  else                        { "Low"      }

    return [PSCustomObject]@{
        Score       = $totalScore
        Confidence  = $confidence
        Severity    = $severity
        FiredRules  = $fired.ToArray()
        RuleCount   = $fired.Count
        RuleSummary = ($fired | ForEach-Object { "$($_.Name)(+$($_.Weight))" }) -join " | "
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
#  KISIM 8 ── ANA TARAMA FONKSİYONU
# ═══════════════════════════════════════════════════════════════════════════════
function Invoke-StealerNetworkScan {

    $scanStart = Get-Date

    Write-Host ""
    Write-Host " ╔═════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host " ║  Stealer Network Behavior Detection Engine  ║" -ForegroundColor Cyan
    Write-Host " ║  Anti-Stealer Pro  ·  v2.2                  ║" -ForegroundColor Cyan
    Write-Host " ╚═════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    # ── 1. DNS önbellek snapshot ───────────────────────────────────────────────
    Write-Step "DNS önbelleği okunuyor..."
    $dnsCache = Get-DNSCacheSnapshot
    Write-Good "$($dnsCache.Count) DNS kaydı yüklendi."

    # ── 2. Process tablosu ────────────────────────────────────────────────────
    Write-Step "Process tablosu oluşturuluyor..."
    $procMap = @{}
    foreach ($p in Get-Process) {
        try {
            $procMap[[int]$p.Id] = @{ Name=$p.ProcessName; Path=$p.Path ?? "N/A" }
        } catch {}
    }
    Write-Good "$($procMap.Count) process yüklendi."

    # ── 3. Established TCP bağlantıları ───────────────────────────────────────
    Write-Step "TCP bağlantıları listeleniyor..."
    $allTCP  = Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue
    $procConns = @{}   # pid → connection[]

    foreach ($c in $allTCP) {
        $pid = [int]$c.OwningProcess
        if (-not $procConns.ContainsKey($pid)) { $procConns[$pid] = @() }
        $procConns[$pid] += $c
    }

    $totalConns = ($procConns.Values | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
    Write-Good "$($procConns.Count) process'te toplam $totalConns bağlantı."

    # ── 4. GEO / ASN reputasyon (toplu) ──────────────────────────────────────
    $allIPs = $allTCP | Select-Object -ExpandProperty RemoteAddress -Unique
    $repMap = Get-IPReputationBatch -IPList $allIPs
    Write-Good "Reputasyon haritası hazır. ($($repMap.Count) IP)"

    # ── 5. Process zinciri (sadece ağ bağlantısı kuranlar) ────────────────────
    Write-Step "Process zinciri analizi..."
    $chainMap = @{}
    foreach ($pid in $procConns.Keys) {
        $chainMap[$pid] = Get-ProcessChain -ProcessId $pid
    }
    $suspChains = ($chainMap.Values | Where-Object { $_.IsSuspicious }).Count
    if ($suspChains) { Write-Warn "$suspChains şüpheli process zinciri tespit edildi." }
    else             { Write-Good "Process zincirleri normal görünüyor." }

    # ── 6. Entropi örneklemesi ────────────────────────────────────────────────
    Write-Step "Entropi / payload analizi yapılıyor..."
    $entropyMap = @{}

    foreach ($pid in $procConns.Keys) {
        foreach ($conn in $procConns[$pid]) {
            $key   = "$($conn.RemoteAddress):$($conn.RemotePort)"
            if ($entropyMap.ContainsKey($key)) { continue }

            $doSample = $DeepEntropy -or
                        $C2Ports.Contains([int]$conn.RemotePort) -or
                        (-not $LegitPorts.Contains([int]$conn.RemotePort))

            if ($doSample) {
                $entropyMap[$key] = Measure-ConnectionEntropy `
                    -RemoteAddress $conn.RemoteAddress `
                    -RemotePort    $conn.RemotePort `
                    -ProcessId     $pid `
                    -Samples       8 `
                    -IntervalMs    350
            }
        }
    }
    Write-Good "$($entropyMap.Count) bağlantı entropi ölçümü tamamlandı."

    # ── 7. Kural motoru ───────────────────────────────────────────────────────
    Write-Step "Davranış kuralları uygulanıyor ($($Rules.Count) kural)..."

    $findings = [System.Collections.Generic.List[PSCustomObject]]::new()

    foreach ($pid in $procConns.Keys) {
        $conns    = $procConns[$pid]
        $proc     = $procMap[$pid] ?? @{ Name="unknown"; Path="N/A" }
        $chain    = $chainMap[$pid]

        foreach ($conn in $conns) {
            $ipKey   = $conn.RemoteAddress
            $connKey = "$($conn.RemoteAddress):$($conn.RemotePort)"

            # Bağlantıya yardımcı özellikler ekle (kural check'leri için)
            $conn | Add-Member -NotePropertyName "_ProcName"     -NotePropertyValue $proc.Name         -Force
            $conn | Add-Member -NotePropertyName "_ProcPath"     -NotePropertyValue $proc.Path         -Force
            $conn | Add-Member -NotePropertyName "_ResolvedHost" -NotePropertyValue ($dnsCache[$ipKey] ?? $ipKey) -Force

            $rep     = $repMap[$ipKey]
            $entropy = $entropyMap[$connKey]
            $result  = Invoke-RuleEngine -Conn $conn -Rep $rep -Entropy $entropy `
                                         -Chain $chain -AllConns $conns

            if ($result.Score -lt $MinScore) { continue }

            # ── Finding nesnesi ──────────────────────────────────────────────
            $finding = [PSCustomObject]@{

                # ── Olay Tipi (kural eşleşmesi = stealer network behavior)
                event_type   = "SteelerNetworkBehavior"
                timestamp    = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
                scan_id      = [System.Guid]::NewGuid().ToString("N")

                # ── Host
                host = [PSCustomObject]@{
                    hostname  = $env:COMPUTERNAME
                    username  = $env:USERNAME
                    os        = (Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue)?.Caption ?? "N/A"
                }

                # ── Process
                process = [PSCustomObject]@{
                    pid          = $pid
                    name         = $proc.Name
                    path         = $proc.Path
                    chain        = $chain.ChainString
                    chain_depth  = $chain.Depth
                    chain_suspicious = $chain.IsSuspicious
                }

                # ── Ağ
                network = [PSCustomObject]@{
                    remote_ip      = $conn.RemoteAddress
                    remote_port    = $conn.RemotePort
                    local_ip       = $conn.LocalAddress
                    local_port     = $conn.LocalPort
                    state          = $conn.State
                    resolved_host  = $conn._ResolvedHost
                    is_dga_domain  = (Test-DGALikeDomain -Domain $conn._ResolvedHost)
                }

                # ── GEO / ASN
                geo = if ($rep -and $rep.LookupOK) {
                    [PSCustomObject]@{
                        country         = $rep.Country
                        country_code    = $rep.CountryCode
                        city            = $rep.City
                        org             = $rep.Org
                        asn             = $rep.ASN
                        is_hosting      = $rep.IsHosting
                        is_proxy        = $rep.IsProxy
                        is_tor          = $rep.IsTor
                        is_malicious_asn= $rep.IsMaliciousASN
                        reputation_score= $rep.ReputationScore
                    }
                } else {
                    [PSCustomObject]@{ lookup_ok=$false; raw_ip=$conn.RemoteAddress }
                }

                # ── Entropi / Payload
                entropy = if ($entropy -and $entropy.Measured) {
                    [PSCustomObject]@{
                        avg_delta_bytes   = $entropy.AvgDeltaBytes
                        max_delta_bytes   = $entropy.MaxDeltaBytes
                        variance          = $entropy.Variance
                        total_sent_bytes  = $entropy.TotalSentBytes
                        total_recv_bytes  = $entropy.TotalRecvBytes
                        burst_bytes_sec   = $entropy.BurstBytesPerSec
                        shannon_entropy   = $entropy.ShannonEntropy
                        is_fixed_size     = $entropy.IsFixedSize
                        is_burst_upload   = $entropy.IsBurstUpload
                    }
                } else {
                    [PSCustomObject]@{ measured=$false }
                }

                # ── Risk
                risk = [PSCustomObject]@{
                    score         = $result.Score
                    confidence    = $result.Confidence
                    severity      = $result.Severity
                    rule_count    = $result.RuleCount
                    rule_summary  = $result.RuleSummary
                    fired_rules   = $result.FiredRules
                }
            }

            $findings.Add($finding)

            # Konsol çıktısı
            $col = switch ($result.Severity) {
                "Critical" { "Red" }
                "High"     { "Yellow" }
                default    { "White" }
            }
            Write-Host ""
            Write-Host "  [$($result.Severity.ToUpper())]  $($proc.Name)  (PID $pid)" -ForegroundColor $col
            Write-Info  "Remote  : $($conn.RemoteAddress):$($conn.RemotePort)  →  $($conn._ResolvedHost)"
            Write-Info  "Score   : $($result.Score)  |  Confidence: $($result.Confidence)%"
            Write-Info  "Chain   : $($chain.ChainString)"
            if ($rep -and $rep.LookupOK) {
            Write-Info  "GEO     : $($rep.Country) / $($rep.Org) / $($rep.ASN)" }
            Write-Host  "  Rules : $($result.RuleSummary)" -ForegroundColor DarkYellow
        }
    }

    # ── 8. JSON Raporu ────────────────────────────────────────────────────────
    $scanEnd  = Get-Date
    $duration = [Math]::Round(($scanEnd - $scanStart).TotalSeconds, 2)

    $critCount = ($findings | Where-Object { $_.risk.severity -eq "Critical" }).Count
    $highCount = ($findings | Where-Object { $_.risk.severity -eq "High"     }).Count
    $medCount  = ($findings | Where-Object { $_.risk.severity -eq "Medium"   }).Count

    $report = [PSCustomObject]@{

        meta = [PSCustomObject]@{
            generated_at      = $scanEnd.ToString("yyyy-MM-ddTHH:mm:ssZ")
            scan_duration_sec = $duration
            hostname          = $env:COMPUTERNAME
            username          = $env:USERNAME
            total_processes   = $procMap.Count
            total_connections = $totalConns
            ips_queried       = $repMap.Count
            rules_applied     = $Rules.Count
            min_score_threshold = $MinScore
            deep_entropy_mode = [bool]$DeepEntropy
        }

        summary = [PSCustomObject]@{
            total_findings     = $findings.Count
            critical           = $critCount
            high               = $highCount
            medium             = $medCount
            low                = ($findings.Count - $critCount - $highCount - $medCount)
            unique_malicious_ips = ($findings |
                                    Select-Object -ExpandProperty network |
                                    Select-Object -ExpandProperty remote_ip -Unique).Count
            affected_processes = ($findings |
                                   Select-Object -ExpandProperty process |
                                   Select-Object -ExpandProperty name -Unique)
            suspicious_chains  = ($chainMap.Values | Where-Object { $_.IsSuspicious }).Count
            top_fired_rule     = if ($findings.Count -gt 0) {
                                     $findings |
                                     ForEach-Object { $_.risk.fired_rules } |
                                     Where-Object { $_ } |
                                     Group-Object Name |
                                     Sort-Object Count -Descending |
                                     Select-Object -First 1 -ExpandProperty Name
                                 } else { "None" }
        }

        # Kural kataloğu (referans için)
        rule_catalog = $Rules | ForEach-Object {
            [PSCustomObject]@{
                name        = $_.Name
                description = $_.Description
                category    = $_.Category
                severity    = $_.Severity
                weight      = $_.Weight
            }
        }

        findings = $findings.ToArray()
    }

    # Kaydet
    $ts         = $scanEnd.ToString("yyyyMMdd_HHmmss")
    $reportFile = Join-Path $OutputDir "network_${ts}.json"

    $report | ConvertTo-Json -Depth 10 |
              Set-Content -Path $reportFile -Encoding UTF8 -Force

    # ── 9. Özet ──────────────────────────────────────────────────────────────
    Write-Host ""
    Write-Host " ──────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host " TARAMA TAMAMLANDI" -ForegroundColor Green
    Write-Host " ──────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  Süre            : ${duration}s"
    Write-Host "  Toplam Bulgu    : $($findings.Count)"
    Write-Host "  Critical        : $critCount" -ForegroundColor Red
    Write-Host "  High            : $highCount"  -ForegroundColor Yellow
    Write-Host "  Medium          : $medCount"   -ForegroundColor White
    Write-Host "  JSON Rapor      : $reportFile" -ForegroundColor Cyan
    Write-Host ""

    return $report
}

# ═══════════════════════════════════════════════════════════════════════════════
#  ÇALIŞTIR
# ═══════════════════════════════════════════════════════════════════════════════
Invoke-StealerNetworkScan
