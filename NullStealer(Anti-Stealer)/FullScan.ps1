#Requires -Version 7.0
#Requires -RunAsAdministrator
# ================================================================
#  Anti-Stealer  –  Full Scan Engine
#  PowerShell 7+ uyumlu | Tüm modüller zincirleme
#
#  Tarama sırası:
#   1. Config & Kural yükleme
#   2. Hash-Based Detection          (dosya SHA256 eşleşmesi)
#   3. Static Similarity             (dosya string benzerliği)
#   4. Memory Scan                   (process bellek taraması)
#   5. Network-Based Detection       (C2 IP/domain eşleşmesi)
#   6. Network Behavior Detection    (davranış tabanlı ağ analizi)
#   7. Behavior-Based Detection      (telemetri exact+jaccard)
#   8. Sonuçları birleştir & kaydet
# ================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "SilentlyContinue"

# ----------------------------------------------------------------
#  WIN32 API  (Memory Scan için gerekli)
# ----------------------------------------------------------------
$Win32Code = @"
using System;
using System.Runtime.InteropServices;

public class MemAPI {
    [DllImport("kernel32.dll")]
    public static extern IntPtr OpenProcess(int dwDesiredAccess, bool bInheritHandle, int dwProcessId);

    [DllImport("kernel32.dll")]
    public static extern bool ReadProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress,
        byte[] lpBuffer, int dwSize, out int lpNumberOfBytesRead);

    [DllImport("kernel32.dll")]
    public static extern int VirtualQueryEx(IntPtr hProcess, IntPtr lpAddress,
        out MEMORY_BASIC_INFORMATION lpBuffer, int dwLength);

    [DllImport("kernel32.dll")]
    public static extern bool CloseHandle(IntPtr hObject);

    [StructLayout(LayoutKind.Sequential)]
    public struct MEMORY_BASIC_INFORMATION {
        public IntPtr  BaseAddress;
        public IntPtr  AllocationBase;
        public uint    AllocationProtect;
        public UIntPtr RegionSize;
        public uint    State;
        public uint    Protect;
        public uint    Type;
    }
}
"@
if (-not ([System.Management.Automation.PSTypeName]"MemAPI").Type) {
    Add-Type -TypeDefinition $Win32Code -Language CSharp
}

# ================================================================
#  BÖLÜM 0  –  YAPILANDIRMA
# ================================================================
$AppBase   = "$env:APPDATA\Anti-Stealer"
$TelDir    = Join-Path $AppBase "Telemetry"
$TelExe    = Join-Path $AppBase "telemetry.exe"
$LogFolder = Join-Path $AppBase "Log"
$ReportFile= Join-Path $AppBase "FullScanReport.json"

foreach ($d in @($AppBase, $TelDir, $LogFolder)) {
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

# Stealer ailesi → hash listesi URL'leri
$SignatureSources_Hash = @{
    "Myth"   = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Myth.txt"
    "Lina"   = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Lina.txt"
    "Perion" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Perion.txt"
    "StealC" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/StealC.txt"
    "Vidar"  = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Vidar.txt"
    "Hade" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Hade-Stealer.txt"
}

# Stealer ailesi → string/signature URL'leri
$SignatureSources_Static = @(
    @{ Name = "Myth-Stealer";        Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Myth-Stealer.txt" }
    @{ Name = "Lina-Stealer";        Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Lina.txt" }
    @{ Name = "Era-Stealer";         Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Era-Stealer.txt" }
    @{ Name = "Ben10-Stealer";       Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Ben10.txt" }
)

# Memory signature URL'leri
$SignatureSources_Static = @(
    @{ Name = "Myth-Stealer";        Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Myth-Stealer.txt" }
    @{ Name = "Lina-Stealer";        Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Lina.txt" }
    @{ Name = "Era-Stealer";         Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Era-Stealer.txt" }
    @{ Name = "Ben10-Stealer";       Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Ben10.txt" }
)

# C2 IP/domain listeleri
$C2SignatureSources = @{
    "Myth"   = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/MythC2.txt"
    "Lina"   = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/LinaC2.txt"
    "Perion" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/PerionC2.txt"
    "StealC" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/StealC_C2.txt"
    "Vidar"  = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/VidarC2.txt"
}

# Behavior kuralı URL'leri
$BehaviorRuleSources = @{
    "Myth"     = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Rules/Myth-Stealer/1.json"
    "Myth-Stealer/variant(1)" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Rules/Myth-Stealer/2.json"
    "Myth-Stealer/variant(2)" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Rules/Myth-Stealer/3.json"
    "Hade-Stealer" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Rules/HadeStealer/1.json"
    "Hade-Stealer/variant(1)" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Rules/HadeStealer/2.json"
    "Nexus-Stealer" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Rules/Nexsus-Stealer/1.json"
    "RedLine" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Rules/RedLine/1.json"
    "Vidar" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Rules/Vidar/1.json"
    
    
}

# Taranacak dosya uzantıları
$TargetExtensions = @("*.exe", "*.dll", "*.jar", "*.zip")

# Taranacak kök dizinler
$ScanRoots = @("C:\Users", "C:\Windows\Temp", "$env:TEMP", "$env:APPDATA")

# ================================================================
#  BÖLÜM 1  –  YARDIMCI FONKSİYONLAR
# ================================================================

function Write-ScanLog {
    param([string]$Tag, [string]$Message, [string]$Color = "Cyan")
    $ts = Get-Date -Format "HH:mm:ss"
    Write-Host "[$ts][$Tag] $Message" -ForegroundColor $Color
}

function Get-JaccardScore {
    param([string[]]$SetA, [string[]]$SetB)
    if (-not $SetA -and -not $SetB) { return 0.0 }
    $hsA = [System.Collections.Generic.HashSet[string]]::new(
               [string[]]$SetA, [System.StringComparer]::OrdinalIgnoreCase)
    $hsB = [System.Collections.Generic.HashSet[string]]::new(
               [string[]]$SetB, [System.StringComparer]::OrdinalIgnoreCase)
    $inter = [System.Collections.Generic.HashSet[string]]::new($hsA)
    $inter.IntersectWith($hsB)
    $union = [System.Collections.Generic.HashSet[string]]::new($hsA)
    $union.UnionWith($hsB)
    if ($union.Count -eq 0) { return 0.0 }
    return [double]$inter.Count / [double]$union.Count
}

function Get-RiskLevel {
    param([double]$Similarity, [int]$MatchCount)
    switch ($true) {
        { $Similarity -gt 0.08 -or $MatchCount -gt 20 } { return "Potential-Stealer" }
        { $Similarity -gt 0.06 }                        { return "High" }
        { $Similarity -gt 0.03 }                        { return "Medium" }
        { $Similarity -gt 0.01 }                        { return "Low" }
        default                                          { return "Clean" }
    }
}

function Get-PrintableStrings {
    param([string]$FilePath, [int]$MinLength = 5)
    try   { $bytes = [System.IO.File]::ReadAllBytes($FilePath) }
    catch { return [System.Collections.Generic.HashSet[string]]::new() }

    $cur = ""
    $set = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($b in $bytes) {
        if ($b -ge 32 -and $b -le 126) { $cur += [char]$b }
        else {
            if ($cur.Length -ge $MinLength) { $set.Add($cur.ToLower()) | Out-Null }
            $cur = ""
        }
    }
    if ($cur.Length -ge $MinLength) { $set.Add($cur.ToLower()) | Out-Null }
    return $set
}

# ================================================================
#  BÖLÜM 2  –  HASH-BASED DETECTION
# ================================================================
function Invoke-HashBasedDetection {
    Write-ScanLog "HASH" "Hash tablosu yükleniyor..."

    $HashLookup = @{}
    foreach ($stealer in $SignatureSources_Hash.Keys) {
        $url = $SignatureSources_Hash[$stealer]
        if (-not $url) { continue }
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
            foreach ($line in ($resp.Content -split "`r?`n")) {
                $h = $line.Trim().ToLower()
                if ($h -match '^[a-f0-9]{64}$' -and -not $HashLookup.ContainsKey($h)) {
                    $HashLookup[$h] = $stealer
                }
            }
        }
        catch { Write-Warning "Hash listesi yüklenemedi: $stealer" }
    }

    Write-ScanLog "HASH" "Dosyalar taranıyor... ($($TargetExtensions -join ', '))"

    $RunningProcs = Get-Process
    $findings = [System.Collections.Generic.List[object]]::new()

    foreach ($root in $ScanRoots) {
        $files = Get-ChildItem -Path $root -Include $TargetExtensions -Recurse -File -ErrorAction SilentlyContinue
        foreach ($f in $files) {
            try {
                $sha = (Get-FileHash $f.FullName -Algorithm SHA256).Hash.ToLower()
                if ($HashLookup.ContainsKey($sha)) {
                    $running = [bool]($RunningProcs | Where-Object { $_.Path -eq $f.FullName })
                    $findings.Add([PSCustomObject]@{
                        Module  = "HashBased"
                        Stealer = $HashLookup[$sha]
                        SHA256  = $sha
                        Path    = $f.FullName
                        Running = $running
                        Risk    = "Confirmed"
                    })
                    Write-ScanLog "HASH" "EŞLEŞTİ  $($f.FullName)  [$($HashLookup[$sha])]" "Red"
                }
            }
            catch { continue }
        }
    }

    Write-ScanLog "HASH" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  BÖLÜM 3  –  STATIC SIMILARITY DETECTION
# ================================================================
function Invoke-StaticSimilarityDetection {
    Write-ScanLog "STATIC" "Signature tablosu yükleniyor..."

    $SignatureTable = @{}
    foreach ($source in $SignatureSources_Static) {
        if (-not $source.Url) { continue }
        try {
            $resp = Invoke-WebRequest -Uri $source.Url -UseBasicParsing -ErrorAction Stop
            foreach ($line in ($resp.Content -split "`n")) {
                $clean = $line.Trim().ToLower()
                if ($clean.Length -gt 4 -and -not $SignatureTable.ContainsKey($clean)) {
                    $SignatureTable[$clean] = @{ Family = $source.Name }
                }
            }
        }
        catch { Write-Warning "Static signature yüklenemedi: $($source.Name)" }
    }

    Write-ScanLog "STATIC" "Dosyalar taranıyor..."
    $findings = [System.Collections.Generic.List[object]]::new()

    foreach ($root in $ScanRoots) {
        $files = Get-ChildItem -Path $root -Include $TargetExtensions -Recurse -File -ErrorAction SilentlyContinue
        foreach ($f in $files) {
            $strings = Get-PrintableStrings -FilePath $f.FullName
            $matchCount = 0
            $familyCounter = @{}

            foreach ($s in $strings) {
                if ($SignatureTable.ContainsKey($s)) {
                    $matchCount++
                    $fam = $SignatureTable[$s].Family
                    if (-not $familyCounter.ContainsKey($fam)) { $familyCounter[$fam] = 0 }
                    $familyCounter[$fam]++
                }
            }

            $similarity = if ($SignatureTable.Count -gt 0) { $matchCount / $SignatureTable.Count } else { 0 }
            $risk = Get-RiskLevel -Similarity $similarity -MatchCount $matchCount

            if ($risk -ne "Clean") {
                $dominant = if ($familyCounter.Count -gt 0) {
                    ($familyCounter.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
                } else { "Unknown" }

                $findings.Add([PSCustomObject]@{
                    Module         = "StaticSimilarity"
                    Path           = $f.FullName
                    MatchCount     = $matchCount
                    Similarity     = [math]::Round($similarity, 4)
                    Risk           = $risk
                    DominantFamily = $dominant
                })
                Write-ScanLog "STATIC" "$risk  $($f.FullName)  [$dominant]" "Yellow"
            }
        }
    }

    Write-ScanLog "STATIC" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  BÖLÜM 4  –  MEMORY SCAN
# ================================================================
function Invoke-MemoryScan {
    Write-ScanLog "MEMORY" "Memory signature yükleniyor..."

    $SigTable   = @{}
    $FamTable   = @{}
    $TotalCount = 0

    foreach ($source in $SignatureSources_Memory) {
        if (-not $source.Url) { continue }
        try {
            $resp = Invoke-WebRequest -Uri $source.Url -UseBasicParsing -ErrorAction Stop
            foreach ($line in ($resp.Content -split "`n")) {
                $clean = $line.Trim().ToLower()
                if ($clean.Length -gt 4 -and -not $SigTable.ContainsKey($clean)) {
                    $SigTable[$clean] = @{ Family = $source.Name }
                    if (-not $FamTable.ContainsKey($source.Name)) {
                        $FamTable[$source.Name] = [System.Collections.Generic.HashSet[string]]::new()
                    }
                    $FamTable[$source.Name].Add($clean) | Out-Null
                    $TotalCount++
                }
            }
        }
        catch { Write-Warning "Memory signature yüklenemedi: $($source.Name)" }
    }

    Write-ScanLog "MEMORY" "Process bellek taraması başlıyor..."
    $findings = [System.Collections.Generic.List[object]]::new()

    $PROCESS_QUERY = 0x0400
    $PROCESS_READ  = 0x0010

    foreach ($proc in Get-Process) {
        if ($proc.Id -le 4) { continue }
        try {
            $handle = [MemAPI]::OpenProcess($PROCESS_QUERY -bor $PROCESS_READ, $false, $proc.Id)
            if ($handle -eq [IntPtr]::Zero) { continue }

            # Bellek bölgelerini topla
            $addr    = [IntPtr]::Zero
            $memInfo = New-Object MemAPI+MEMORY_BASIC_INFORMATION
            $infoSize = [System.Runtime.InteropServices.Marshal]::SizeOf($memInfo)
            $pidStrings = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

            while ([MemAPI]::VirtualQueryEx($handle, $addr, [ref]$memInfo, $infoSize) -ne 0) {
                $committed  = ($memInfo.State   -eq 0x1000)
                $readable   = (($memInfo.Protect -band 0x02) -or ($memInfo.Protect -band 0x04) -or
                               ($memInfo.Protect -band 0x20) -or ($memInfo.Protect -band 0x40))
                $guard      = ($memInfo.Protect  -band 0x100)
                $noAccess   = ($memInfo.Protect  -band 0x01)

                if ($committed -and $readable -and -not $guard -and -not $noAccess) {
                    # Chunk okuma
                    $chunkSize = 0x10000
                    $offset    = [uint64]0
                    $regionSize = $memInfo.RegionSize.ToUInt64()
                    $cur = ""

                    while ($offset -lt $regionSize) {
                        $remaining = $regionSize - $offset
                        $readSize  = [Math]::Min($chunkSize, $remaining)
                        $buffer    = New-Object byte[] $readSize
                        $bytesRead = 0

                        $ok = [MemAPI]::ReadProcessMemory(
                            $handle,
                            [IntPtr]($memInfo.BaseAddress.ToInt64() + [int64]$offset),
                            $buffer, $readSize, [ref]$bytesRead)

                        if ($ok -and $bytesRead -gt 0) {
                            foreach ($b in $buffer[0..($bytesRead - 1)]) {
                                if ($b -ge 32 -and $b -le 126) { $cur += [char]$b }
                                else {
                                    if ($cur.Length -ge 5) { $pidStrings.Add($cur.ToLower()) | Out-Null }
                                    $cur = ""
                                }
                            }
                        }
                        $offset += $readSize
                    }
                    if ($cur.Length -ge 5) { $pidStrings.Add($cur.ToLower()) | Out-Null }
                }

                $addr = [IntPtr]($memInfo.BaseAddress.ToInt64() + [int64]$memInfo.RegionSize.ToUInt64())
            }

            [MemAPI]::CloseHandle($handle) | Out-Null

            # Signature eşleştir
            $matchCount    = 0
            $familyCounter = @{}
            foreach ($s in $pidStrings) {
                if ($SigTable.ContainsKey($s)) {
                    $matchCount++
                    $fam = $SigTable[$s].Family
                    if (-not $familyCounter.ContainsKey($fam)) { $familyCounter[$fam] = 0 }
                    $familyCounter[$fam]++
                }
            }

            $similarity = if ($TotalCount -gt 0) { $matchCount / $TotalCount } else { 0 }
            $risk = Get-RiskLevel -Similarity $similarity -MatchCount $matchCount

            if ($risk -ne "Clean") {
                $dominant = if ($familyCounter.Count -gt 0) {
                    ($familyCounter.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
                } else { "Unknown" }

                $findings.Add([PSCustomObject]@{
                    Module         = "MemoryScan"
                    PID            = $proc.Id
                    ProcessName    = $proc.ProcessName
                    MatchCount     = $matchCount
                    Similarity     = [math]::Round($similarity, 4)
                    Risk           = $risk
                    DominantFamily = $dominant
                })
                Write-ScanLog "MEMORY" "$risk  PID $($proc.Id) ($($proc.ProcessName))  [$dominant]" "Yellow"
            }
        }
        catch { continue }
    }

    Write-ScanLog "MEMORY" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  BÖLÜM 5  –  NETWORK-BASED DETECTION (C2 IP/Domain)
# ================================================================
function Invoke-NetworkBasedDetection {
    Write-ScanLog "NET-C2" "C2 listesi yükleniyor..."

    $C2Lookup = @{}
    foreach ($stealer in $C2SignatureSources.Keys) {
        $url = $C2SignatureSources[$stealer]
        if (-not $url) { continue }
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
            foreach ($line in ($resp.Content -split "`r?`n")) {
                $clean = $line.Trim().ToLower()
                if ($clean -and -not $C2Lookup.ContainsKey($clean)) {
                    $C2Lookup[$clean] = $stealer
                }
            }
        }
        catch { Write-Warning "C2 listesi yüklenemedi: $stealer" }
    }

    Write-ScanLog "NET-C2" "Aktif bağlantılar kontrol ediliyor..."
    $findings = [System.Collections.Generic.List[object]]::new()

    $conns = Get-NetTCPConnection -State Established |
             Where-Object { $_.RemoteAddress -ne "127.0.0.1" }

    foreach ($conn in $conns) {
        $ip = $conn.RemoteAddress.ToLower()

        if ($C2Lookup.ContainsKey($ip)) {
            $findings.Add([PSCustomObject]@{
                Module        = "NetworkC2"
                DetectionType = "C2-IP"
                Stealer       = $C2Lookup[$ip]
                RemoteIP      = $ip
                RemotePort    = $conn.RemotePort
                LocalPort     = $conn.LocalPort
                Risk          = "Confirmed-C2"
            })
            Write-ScanLog "NET-C2" "C2 IP EŞLEŞTİ  $ip  [$($C2Lookup[$ip])]" "Red"
        }

        try {
            $dns    = [System.Net.Dns]::GetHostEntry($ip)
            $domain = $dns.HostName.ToLower()
            if ($C2Lookup.ContainsKey($domain)) {
                $findings.Add([PSCustomObject]@{
                    Module        = "NetworkC2"
                    DetectionType = "C2-Domain"
                    Stealer       = $C2Lookup[$domain]
                    RemoteIP      = $ip
                    Domain        = $domain
                    RemotePort    = $conn.RemotePort
                    LocalPort     = $conn.LocalPort
                    Risk          = "Confirmed-C2"
                })
                Write-ScanLog "NET-C2" "C2 Domain EŞLEŞTİ  $domain  [$($C2Lookup[$domain])]" "Red"
            }
        }
        catch { continue }
    }

    Write-ScanLog "NET-C2" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  BÖLÜM 6  –  NETWORK BEHAVIOR DETECTION
# ================================================================
function Invoke-NetworkBehaviorDetection {
    Write-ScanLog "NET-BEH" "Process bağlantı tablosu oluşturuluyor..."

    $ProcLookup   = @{}
    $ProcConns    = @{}

    foreach ($p in Get-Process) {
        try { $ProcLookup[$p.Id] = @{ Name = $p.ProcessName; Path = $p.Path } }
        catch { continue }
    }

    foreach ($pid in $ProcLookup.Keys) {
        $c = Get-NetTCPConnection -OwningProcess $pid -State Established -ErrorAction SilentlyContinue
        if ($c) { $ProcConns[$pid] = $c }
    }

    $BehaviorRules = @(
        @{
            Name     = "Suspicious TLD"
            Severity = "Medium"
            Check    = { param($conn, $pid, $connList)
                         $conn.RemoteAddress -match "\.(su|xyz|top|ru|tk)$" }
        },
        @{
            Name     = "Multiple Domains Same Process"
            Severity = "High"
            Check    = { param($conn, $pid, $connList)
                         ($connList | Select-Object -ExpandProperty RemoteAddress -Unique).Count -gt 3 }
        },
        @{
            Name     = "Non-Standard HTTPS Port"
            Severity = "Medium"
            Check    = { param($conn, $pid, $connList)
                         $conn.RemotePort -notin @(80,443,8080,8443) -and $conn.RemotePort -gt 1024 }
        },
        @{
            Name     = "Suspicious Process Name"
            Severity = "High"
            Check    = { param($conn, $pid, $connList)
                         $ProcLookup[$pid].Name -match "lumma|myth|steal|grab|loot|rat|loader" }
        }
    )

    $findings = [System.Collections.Generic.List[object]]::new()

    foreach ($pid in $ProcConns.Keys) {
        $connList = $ProcConns[$pid]
        $procInfo = $ProcLookup[$pid]

        foreach ($conn in $connList) {
            $triggered = @()
            foreach ($rule in $BehaviorRules) {
                try {
                    if (& $rule.Check $conn $pid $connList) { $triggered += $rule.Name }
                }
                catch { continue }
            }

            if ($triggered.Count -gt 0) {
                $findings.Add([PSCustomObject]@{
                    Module       = "NetworkBehavior"
                    PID          = $pid
                    ProcessName  = $procInfo.Name
                    RemoteIP     = $conn.RemoteAddress
                    RemotePort   = $conn.RemotePort
                    TriggeredRules = ($triggered -join " | ")
                    Risk         = if ($triggered.Count -ge 2) { "High" } else { "Medium" }
                })
                Write-ScanLog "NET-BEH" "PID $pid ($($procInfo.Name))  $($triggered -join ' | ')" "Yellow"
            }
        }
    }

    Write-ScanLog "NET-BEH" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  BÖLÜM 7  –  BEHAVIOR-BASED DETECTION (Exact + Jaccard)
# ================================================================
$BehaviorRulesTable  = [System.Collections.Generic.List[object]]::new()
$ProcessTelTable     = [System.Collections.Generic.List[hashtable]]::new()

function Get-BehaviorRules {
    foreach ($src in $BehaviorRuleSources.GetEnumerator()) {
        $url = $src.Value
        if (-not $url) { continue }
        try {
            $resp   = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
            $parsed = $resp.Content | ConvertFrom-Json
            $list   = if ($parsed -is [array]) { $parsed } else { @($parsed) }
            foreach ($r in $list) { $BehaviorRulesTable.Add($r) }
        }
        catch { Write-Warning "Behavior kuralı yüklenemedi: $($src.Key)" }
    }
}

function Get-ProcessTelemetry {
    $runningPids = Get-Process | Select-Object -ExpandProperty Id
    foreach ($pid in $runningPids) {
        try {
            if (Test-Path $TelExe) {
                Start-Process $TelExe -ArgumentList $pid -Wait -WindowStyle Hidden
            }

            $jsonFiles = Get-ChildItem $TelDir -Filter "$pid*.json" -File -ErrorAction SilentlyContinue
            if ($jsonFiles) {
                foreach ($jf in $jsonFiles) {
                    $raw = Get-Content $jf.FullName -Raw | ConvertFrom-Json
                    $ProcessTelTable.Add(@{
                        pid            = [int]$raw.pid
                        ProcessName    = [string]$raw.processname
                        CommandLine    = @($raw.commandlines)
                        WrittenFiles   = @($raw.writtenfiles)
                        RegistryWrites = @($raw.registry)
                        APIcalls       = @($raw.apicalls)
                        Network        = @($raw.network)
                        OpenFiles      = @($raw.openfiles)
                        ThreadName     = [string]$raw.threadname
                    })
                    Remove-Item $jf.FullName -Force
                }
            } else {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    $wmi = Get-CimInstance Win32_Process -Filter "ProcessId=$pid" -ErrorAction SilentlyContinue
                    $ProcessTelTable.Add(@{
                        pid            = $pid
                        ProcessName    = $proc.ProcessName
                        CommandLine    = if ($wmi.CommandLine) { @($wmi.CommandLine) } else { @() }
                        WrittenFiles   = @()
                        RegistryWrites = @()
                        APIcalls       = @()
                        Network        = @()
                        OpenFiles      = @()
                        ThreadName     = ""
                    })
                }
            }
        }
        catch { continue }
    }
}

function Invoke-BehaviorDetection {
    Write-ScanLog "BEHAV" "Behavior kuralları yükleniyor..."
    Get-BehaviorRules

    Write-ScanLog "BEHAV" "Process telemetrisi toplanıyor..."
    Get-ProcessTelemetry

    $findings = [System.Collections.Generic.List[object]]::new()

    # ---- Exact Match ----
    $ruleIndex = [System.Collections.Generic.List[hashtable]]::new()
    foreach ($rule in $BehaviorRulesTable) {
        $ruleIndex.Add(@{
            family       = $rule.family
            commandlines = [System.Collections.Generic.HashSet[string]]::new([string[]]@($rule.commandlines), [System.StringComparer]::OrdinalIgnoreCase)
            writtenfiles = [System.Collections.Generic.HashSet[string]]::new([string[]]@($rule.writtenfiles), [System.StringComparer]::OrdinalIgnoreCase)
            registry     = [System.Collections.Generic.HashSet[string]]::new([string[]]@($rule.registry),     [System.StringComparer]::OrdinalIgnoreCase)
            apicalls     = [System.Collections.Generic.HashSet[string]]::new([string[]]@($rule.apicalls),     [System.StringComparer]::OrdinalIgnoreCase)
            network      = $rule.network
        })
    }

    foreach ($tlm in $ProcessTelTable) {
        foreach ($ri in $ruleIndex) {
            $score = 0
            foreach ($cmd in $tlm.CommandLine)    { if ($ri.commandlines.Contains($cmd))  { $score++ } }
            foreach ($f   in $tlm.WrittenFiles)   { if ($ri.writtenfiles.Contains($f))    { $score++ } }
            foreach ($reg in $tlm.RegistryWrites) { if ($ri.registry.Contains($reg))      { $score++ } }
            foreach ($api in $tlm.APIcalls)        { if ($ri.apicalls.Contains($api))      { $score++ } }
            foreach ($nr in $ri.network) {
                foreach ($nt in $tlm.Network) {
                    if ($nr.host -eq $nt.host -and $nr.port -eq $nt.port) { $score++ }
                }
            }

            if ($score -ge 2) {
                $findings.Add([PSCustomObject]@{
                    Module        = "BehaviorExact"
                    PID           = $tlm.pid
                    ProcessName   = $tlm.ProcessName
                    MatchFamily   = $ri.family
                    Score         = $score
                    Risk          = if ($score -ge 4) { "High" } else { "Medium" }
                })
                Write-ScanLog "BEHAV" "EXACT  PID $($tlm.pid) ($($tlm.ProcessName))  $($ri.family)  [Skor:$score]" "Yellow"
            }
        }
    }

    # ---- Jaccard Similarity ----
    $weights = @{ CommandLine=0.25; WrittenFiles=0.15; RegistryWrites=0.15; APIcalls=0.25; OpenFiles=0.10; Network=0.10 }
    $threshold = 0.3

    foreach ($tlm in $ProcessTelTable) {
        foreach ($rule in $BehaviorRulesTable) {
            $scores = @{}
            $scores["CommandLine"]    = Get-JaccardScore -SetA @($tlm.CommandLine)    -SetB @($rule.commandlines)
            $scores["WrittenFiles"]   = Get-JaccardScore -SetA @($tlm.WrittenFiles)   -SetB @($rule.writtenfiles)
            $scores["RegistryWrites"] = Get-JaccardScore -SetA @($tlm.RegistryWrites) -SetB @($rule.registry)
            $scores["APIcalls"]       = Get-JaccardScore -SetA @($tlm.APIcalls)       -SetB @($rule.apicalls)
            $scores["OpenFiles"]      = Get-JaccardScore -SetA @($tlm.OpenFiles)      -SetB @()
            $scores["Network"]        = Get-JaccardScore `
                -SetA @($tlm.Network  | ForEach-Object { "$($_.host):$($_.port)" }) `
                -SetB @($rule.network | ForEach-Object { "$($_.host):$($_.port)" })

            $ws = 0.0
            foreach ($k in $scores.Keys) { $ws += $scores[$k] * $weights[$k] }

            if ($ws -ge $threshold) {
                $findings.Add([PSCustomObject]@{
                    Module       = "BehaviorJaccard"
                    PID          = $tlm.pid
                    ProcessName  = $tlm.ProcessName
                    MatchFamily  = $rule.family
                    JaccardScore = [math]::Round($ws, 3)
                    Risk         = if ($ws -ge 0.6) { "High" } else { "Medium" }
                })
                Write-ScanLog "BEHAV" "JACCARD  PID $($tlm.pid) ($($tlm.ProcessName))  $($rule.family)  [J:$([math]::Round($ws,3))]" "Yellow"
            }
        }
    }

    Write-ScanLog "BEHAV" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  BÖLÜM 8  –  RAPOR & KAYDET
# ================================================================
function Save-FullReport {
    param([System.Collections.Generic.List[object]]$AllFindings)

    if ($AllFindings.Count -eq 0) {
        Write-ScanLog "REPORT" "Hiç bulgu yok – temiz sistem." "Green"
        return
    }

    # Özet
    $summary = $AllFindings |
        Group-Object Module |
        ForEach-Object { [PSCustomObject]@{ Module = $_.Name; Count = $_.Count } }

    $report = [PSCustomObject]@{
        ScanTime = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        Total    = $AllFindings.Count
        Summary  = $summary
        Findings = $AllFindings
    }

    $report | ConvertTo-Json -Depth 8 | Out-File $ReportFile -Encoding UTF8
    Write-ScanLog "REPORT" "Rapor kaydedildi: $ReportFile" "Cyan"

    # Per-finding JSON log
    $i = 1
    foreach ($f in $AllFindings) {
        $fn = Join-Path $LogFolder "$i`_$($f.Module)_$($f.Risk).json"
        $f | ConvertTo-Json -Depth 6 | Out-File $fn -Encoding UTF8
        $i++
    }
}

# ================================================================
#  ANA AKIŞ  –  Full Scan
# ================================================================
function Start-FullScan {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║       Anti-Stealer  –  Full Scan Engine          ║" -ForegroundColor Magenta
    Write-Host "║       PowerShell 7+ | Tüm modüller aktif         ║" -ForegroundColor Magenta
    Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""

    $all = [System.Collections.Generic.List[object]]::new()

    $modules = @(
        @{ Name = "1/7  Hash-Based Detection";       Fn = { Invoke-HashBasedDetection } }
        @{ Name = "2/7  Static Similarity";          Fn = { Invoke-StaticSimilarityDetection } }
        @{ Name = "3/7  Memory Scan";                Fn = { Invoke-MemoryScan } }
        @{ Name = "4/7  Network C2 Detection";       Fn = { Invoke-NetworkBasedDetection } }
        @{ Name = "5/7  Network Behavior Detection"; Fn = { Invoke-NetworkBehaviorDetection } }
        @{ Name = "6/7  Behavior Detection";         Fn = { Invoke-BehaviorDetection } }
    )

    foreach ($mod in $modules) {
        Write-Host ""
        Write-Host "━━━  $($mod.Name)  ━━━" -ForegroundColor DarkCyan
        $results = & $mod.Fn
        foreach ($r in $results) { $all.Add($r) }
    }

    Write-Host ""
    Write-Host "━━━  7/7  Rapor Kaydediliyor  ━━━" -ForegroundColor DarkCyan
    Save-FullReport -AllFindings $all

    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║   TARAMA TAMAMLANDI                              ║" -ForegroundColor Magenta
    Write-Host "║   Toplam Bulgu : $($all.Count.ToString().PadRight(31))║" -ForegroundColor Magenta
    Write-Host "║   Rapor        : $($ReportFile.Substring(0,[Math]::Min($ReportFile.Length,31)).PadRight(31))║" -ForegroundColor Magenta
    Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Magenta
}

# ---- Başlat ----
Start-FullScan
