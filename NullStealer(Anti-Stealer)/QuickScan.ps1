#Requires -Version 7.0
#Requires -RunAsAdministrator
# ================================================================
#  Anti-Stealer  –  Quick Scan Engine
#  Sadece stealerların bilinen konumlarını tarar (hızlı mod)
#
#  Full Scan'dan farkı:
#   - Disk taraması tüm C:\ değil, stealer hotspot dizinleri
#   - Memory scan sadece şüpheli process adlarına
#   - Static similarity atlanır (yavaş)
#   - Network + Behavior modülleri korunur
#   - Hedef: ~30 sn içinde sonuç
# ================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "SilentlyContinue"

# ----------------------------------------------------------------
#  WIN32 API
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
#  CONFIG
# ================================================================
$AppBase    = "$env:APPDATA\Anti-Stealer"
$TelDir     = Join-Path $AppBase "Telemetry"
$TelExe     = Join-Path $AppBase "telemetry.exe"
$LogFolder  = Join-Path $AppBase "Log\Quick"
$ReportFile = Join-Path $AppBase "QuickScanReport.json"

foreach ($d in @($AppBase, $TelDir, $LogFolder)) {
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
}

# ---------- Signature URL'leri ----------
$SignatureSources_Hash = @{
    "Myth"   = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Myth.txt"
    "Lina"   = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Lina.txt"
    "Perion" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Perion.txt"
    "StealC" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/StealC.txt"
    "Vidar"  = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Vidar.txt"
    "Hade" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/Hade-Stealer.txt"
}

$SignatureSources_Memory = @(
    @{ Name = "Myth";        Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Myth-Stealer.txt" }
    @{ Name = "Lina";        Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Lina.txt" }
    @{ Name = "Era";         Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Era-Stealer.txt" }
    @{ Name = "Ben10";       Url = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Stealer-Strings/Ben10.txt" }
)

$C2SignatureSources = @{
    "Myth"   = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/MythC2.txt"
    "Lina"   = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/LinaC2.txt"
    "Perion" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/PerionC2.txt"
    "StealC" = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/StealC_C2.txt"
    "Vidar"  = "https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/refs/heads/main/Signature/VidarC2.txt"
}

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

# ---------- Taranacak uzantılar ----------
$TargetExtensions = @("*.exe", "*.dll", "*.jar")

# ================================================================
#  STEALER HOTSPOT DİZİNLERİ
#  Stealerların %95+ oranında yerleştiği/çalıştığı konumlar
# ================================================================
$QuickScanPaths = @(
    # --- Kullanıcı geçici / uygulama dizinleri ---
    $env:TEMP
    $env:TMP
    "$env:APPDATA"
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    "$env:LOCALAPPDATA\Temp"
    "$env:LOCALAPPDATA\Microsoft\Windows\INetCache"
    "$env:LOCALAPPDATA\Microsoft\Windows\History"

    # --- Tarayıcı profil dizinleri (cookie/şifre hırsızlığı) ---
    "$env:LOCALAPPDATA\Google\Chrome\User Data"
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data"
    "$env:APPDATA\Mozilla\Firefox\Profiles"
    "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\User Data"
    "$env:LOCALAPPDATA\Opera Software"
    "$env:APPDATA\Opera Software"

    # --- Kripto cüzdan dizinleri ---
    "$env:APPDATA\Exodus"
    "$env:APPDATA\Electrum\wallets"
    "$env:APPDATA\Ethereum"
    "$env:APPDATA\atomic"
    "$env:APPDATA\com.libertyx"
    "$env:LOCALAPPDATA\Coinbase"

    # --- Discord / iletişim uygulamaları ---
    "$env:APPDATA\discord\Local Storage"
    "$env:APPDATA\discordcanary\Local Storage"
    "$env:APPDATA\Telegram Desktop\tdata"

    # --- Ortak kötü amaçlı bırakma noktaları ---
    "C:\Windows\Temp"
    "C:\ProgramData"
    "$env:PUBLIC\Downloads"
    "$env:USERPROFILE\Downloads"
    "$env:USERPROFILE\Desktop"

    # --- Sistem başlangıç noktaları ---
    "C:\Windows\System32\Tasks"
    "C:\Windows\SysWOW64\Tasks"
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"   # registry - aşağıda ayrı işlenir
)

# Sadece gerçek disk yolları (registry hariç)
$DiskScanPaths = $QuickScanPaths | Where-Object { $_ -notmatch "^HK" } | Where-Object { Test-Path $_ }

# ================================================================
#  ŞÜPHELI PROCESS ADLARI  (memory scan'ı kısıtlamak için)
# ================================================================
$SuspiciousProcessPatterns = @(
    ".*stealer.*", ".*grabber.*", ".*loot.*", ".*rat.*",
    ".*loader.*",  ".*clipper.*", ".*logger.*",".*inject.*",
    ".*myth.*",    ".*lumma.*",   ".*vidar.*", ".*stealc.*",
    ".*perion.*",  ".*lina.*",    ".*aurora.*",".*redline.*",
    # genel şüpheli pattern
    "^[a-z]{1,5}$",        # çok kısa rastgele isimler
    ".*\d{4,}.*",           # içinde 4+ rakam olan isimler
    "svchost32", "csrss32", "lsass32"  # sahte sistem process isimleri
)

# ================================================================
#  YARDIMCI FONKSİYONLAR
# ================================================================
function Write-QLog {
    param([string]$Tag, [string]$Msg, [string]$Color = "Cyan")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')][$Tag] $Msg" -ForegroundColor $Color
}

function Get-JaccardScore {
    param([string[]]$SetA, [string[]]$SetB)
    if (-not $SetA -and -not $SetB) { return 0.0 }
    $hsA = [System.Collections.Generic.HashSet[string]]::new([string[]]$SetA, [System.StringComparer]::OrdinalIgnoreCase)
    $hsB = [System.Collections.Generic.HashSet[string]]::new([string[]]$SetB, [System.StringComparer]::OrdinalIgnoreCase)
    $inter = [System.Collections.Generic.HashSet[string]]::new($hsA); $inter.IntersectWith($hsB)
    $union = [System.Collections.Generic.HashSet[string]]::new($hsA); $union.UnionWith($hsB)
    if ($union.Count -eq 0) { return 0.0 }
    return [double]$inter.Count / [double]$union.Count
}

function Test-SuspiciousProcess {
    param([string]$Name)
    foreach ($pat in $SuspiciousProcessPatterns) {
        if ($Name -match $pat) { return $true }
    }
    return $false
}

# ================================================================
#  MODÜL 1  –  QUICK HASH-BASED DETECTION
#  Sadece hotspot dizinlerde hash kontrolü
# ================================================================
function Invoke-QuickHashDetection {
    Write-QLog "HASH" "Hash tablosu yükleniyor..."
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

    Write-QLog "HASH" "Hotspot dizinler taranıyor ($($DiskScanPaths.Count) konum)..."
    $RunningProcs = Get-Process
    $findings = [System.Collections.Generic.List[object]]::new()

    foreach ($path in $DiskScanPaths) {
        # Sadece 1 seviye derinlik — hız için
        $files = Get-ChildItem -Path $path -Include $TargetExtensions -File -ErrorAction SilentlyContinue
        foreach ($f in $files) {
            try {
                $sha = (Get-FileHash $f.FullName -Algorithm SHA256).Hash.ToLower()
                if ($HashLookup.ContainsKey($sha)) {
                    $running = [bool]($RunningProcs | Where-Object { $_.Path -eq $f.FullName })
                    $findings.Add([PSCustomObject]@{
                        Module  = "QuickHash"
                        Stealer = $HashLookup[$sha]
                        SHA256  = $sha
                        Path    = $f.FullName
                        Running = $running
                        Risk    = "Confirmed"
                    })
                    Write-QLog "HASH" "EŞLEŞTİ  $($f.FullName)  [$($HashLookup[$sha])]" "Red"
                }
            }
            catch { continue }
        }
    }

    Write-QLog "HASH" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  MODÜL 2  –  REGISTRY BAŞLANGIÇ NOKTALARI TARAMA
#  Stealerların persistence için kullandığı registry key'leri
# ================================================================
function Invoke-RegistryStartupScan {
    Write-QLog "REG" "Registry başlangıç noktaları kontrol ediliyor..."

    $RegPaths = @(
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce"
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run"
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce"
        "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
        "HKLM:\Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
        "HKCU:\Environment"   # UserInitMprLogonScript
    )

    # Şüpheli değer pattern'leri
    $SuspiciousValuePatterns = @(
        "temp", "tmp", "appdata", "roaming",
        "powershell", "cmd", "wscript", "cscript",
        "mshta", "regsvr32", "rundll32",
        "\.vbs$", "\.bat$", "\.cmd$", "\.ps1$",
        "http", "base64", "-enc", "-nop", "-w hidden"
    )

    $findings = [System.Collections.Generic.List[object]]::new()

    foreach ($regPath in $RegPaths) {
        try {
            $key = Get-ItemProperty -Path $regPath -ErrorAction Stop
            foreach ($prop in $key.PSObject.Properties) {
                if ($prop.Name -like "PS*") { continue }
                $val = [string]$prop.Value
                $suspicious = $false
                $matchedPattern = ""

                foreach ($pat in $SuspiciousValuePatterns) {
                    if ($val -match $pat) {
                        $suspicious = $true
                        $matchedPattern = $pat
                        break
                    }
                }

                if ($suspicious) {
                    $findings.Add([PSCustomObject]@{
                        Module         = "RegistryStartup"
                        RegistryPath   = $regPath
                        ValueName      = $prop.Name
                        ValueData      = $val
                        MatchedPattern = $matchedPattern
                        Risk           = "Suspicious"
                    })
                    Write-QLog "REG" "ŞÜPHELİ  $regPath\$($prop.Name)" "Yellow"
                }
            }
        }
        catch { continue }
    }

    # Scheduled Tasks kontrolü (stealer persistence)
    Write-QLog "REG" "Scheduled Tasks kontrol ediliyor..."
    try {
        $tasks = Get-ScheduledTask -ErrorAction SilentlyContinue |
                 Where-Object { $_.State -ne "Disabled" }

        foreach ($task in $tasks) {
            $actions = $task.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)" }
            foreach ($action in $actions) {
                foreach ($pat in $SuspiciousValuePatterns) {
                    if ($action -match $pat) {
                        $findings.Add([PSCustomObject]@{
                            Module       = "ScheduledTask"
                            TaskName     = $task.TaskName
                            TaskPath     = $task.TaskPath
                            Action       = $action
                            Risk         = "Suspicious"
                        })
                        Write-QLog "REG" "TASK ŞÜPHELİ  $($task.TaskName)" "Yellow"
                        break
                    }
                }
            }
        }
    }
    catch { Write-Warning "Scheduled Task taraması başarısız" }

    Write-QLog "REG" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  MODÜL 3  –  QUICK MEMORY SCAN
#  Sadece şüpheli isimdeki veya yüksek CPU/Memory processler
# ================================================================
function Invoke-QuickMemoryScan {
    Write-QLog "MEM" "Memory signature yükleniyor..."

    $SigTable   = @{}
    $TotalCount = 0

    foreach ($source in $SignatureSources_Memory) {
        if (-not $source.Url) { continue }
        try {
            $resp = Invoke-WebRequest -Uri $source.Url -UseBasicParsing -ErrorAction Stop
            foreach ($line in ($resp.Content -split "`n")) {
                $clean = $line.Trim().ToLower()
                if ($clean.Length -gt 4 -and -not $SigTable.ContainsKey($clean)) {
                    $SigTable[$clean] = $source.Name
                    $TotalCount++
                }
            }
        }
        catch { Write-Warning "Memory signature yüklenemedi: $($source.Name)" }
    }

    # Şüpheli process'leri filtrele
    $allProcs = Get-Process | Where-Object { $_.Id -gt 4 }
    $targetProcs = $allProcs | Where-Object {
        # 1) İsim pattern eşleşmesi
        (Test-SuspiciousProcess -Name $_.ProcessName) -or
        # 2) Bilinen tarayıcı/sistem dışı, imzasız, temp'ten çalışan
        ($_.Path -and $_.Path -match "\\Temp\\|\\tmp\\|\\AppData\\Roaming\\") -or
        # 3) Yüksek bellek tüketen bilinmeyen process (>200MB)
        ($_.WorkingSet64 -gt 200MB -and $_.Path -and $_.Path -notmatch "chrome|firefox|edge|msedge|explorer|svchost")
    }

    Write-QLog "MEM" "Hedef process sayısı: $($targetProcs.Count) (toplam: $($allProcs.Count))"
    $findings = [System.Collections.Generic.List[object]]::new()

    $PROCESS_QUERY = 0x0400
    $PROCESS_READ  = 0x0010

    foreach ($proc in $targetProcs) {
        try {
            $handle = [MemAPI]::OpenProcess($PROCESS_QUERY -bor $PROCESS_READ, $false, $proc.Id)
            if ($handle -eq [IntPtr]::Zero) { continue }

            $addr     = [IntPtr]::Zero
            $memInfo  = New-Object MemAPI+MEMORY_BASIC_INFORMATION
            $infoSize = [System.Runtime.InteropServices.Marshal]::SizeOf($memInfo)
            $pidStrings = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

            while ([MemAPI]::VirtualQueryEx($handle, $addr, [ref]$memInfo, $infoSize) -ne 0) {
                $committed = ($memInfo.State   -eq 0x1000)
                $readable  = (($memInfo.Protect -band 0x02) -or ($memInfo.Protect -band 0x04) -or
                              ($memInfo.Protect -band 0x20) -or ($memInfo.Protect -band 0x40))
                $guard     = ($memInfo.Protect  -band 0x100)
                $noAccess  = ($memInfo.Protect  -band 0x01)

                # Quick mod: sadece heap bölgeler (MEM_PRIVATE), stack değil
                $isPrivate = ($memInfo.Type -eq 0x20000)

                if ($committed -and $readable -and $isPrivate -and -not $guard -and -not $noAccess) {
                    $rSize = $memInfo.RegionSize.ToUInt64()
                    # Quick mod: bölge başına max 512KB oku
                    $readLimit = [Math]::Min($rSize, 512KB)
                    $buffer    = New-Object byte[] $readLimit
                    $bytesRead = 0

                    $ok = [MemAPI]::ReadProcessMemory($handle, $memInfo.BaseAddress, $buffer, $readLimit, [ref]$bytesRead)

                    if ($ok -and $bytesRead -gt 0) {
                        $cur = ""
                        foreach ($b in $buffer[0..($bytesRead - 1)]) {
                            if ($b -ge 32 -and $b -le 126) { $cur += [char]$b }
                            else {
                                if ($cur.Length -ge 5) { $pidStrings.Add($cur.ToLower()) | Out-Null }
                                $cur = ""
                            }
                        }
                        if ($cur.Length -ge 5) { $pidStrings.Add($cur.ToLower()) | Out-Null }
                    }
                }

                $addr = [IntPtr]($memInfo.BaseAddress.ToInt64() + [int64]$memInfo.RegionSize.ToUInt64())
            }

            [MemAPI]::CloseHandle($handle) | Out-Null

            $matchCount    = 0
            $familyCounter = @{}
            foreach ($s in $pidStrings) {
                if ($SigTable.ContainsKey($s)) {
                    $matchCount++
                    $fam = $SigTable[$s]
                    if (-not $familyCounter.ContainsKey($fam)) { $familyCounter[$fam] = 0 }
                    $familyCounter[$fam]++
                }
            }

            if ($matchCount -gt 0) {
                $similarity = if ($TotalCount -gt 0) { $matchCount / $TotalCount } else { 0 }
                $risk = switch ($true) {
                    { $similarity -gt 0.08 -or $matchCount -gt 20 } { "Potential-Stealer"; break }
                    { $similarity -gt 0.06 } { "High"; break }
                    { $similarity -gt 0.03 } { "Medium"; break }
                    default { "Low" }
                }
                $dominant = if ($familyCounter.Count -gt 0) {
                    ($familyCounter.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
                } else { "Unknown" }

                $findings.Add([PSCustomObject]@{
                    Module         = "QuickMemory"
                    PID            = $proc.Id
                    ProcessName    = $proc.ProcessName
                    Path           = $proc.Path
                    MatchCount     = $matchCount
                    Similarity     = [math]::Round($similarity, 4)
                    Risk           = $risk
                    DominantFamily = $dominant
                })
                Write-QLog "MEM" "$risk  PID $($proc.Id) ($($proc.ProcessName))  [$dominant]" "Yellow"
            }
        }
        catch { continue }
    }

    Write-QLog "MEM" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  MODÜL 4  –  NETWORK C2 DETECTION  (aynı, hızlı zaten)
# ================================================================
function Invoke-QuickNetworkC2 {
    Write-QLog "NET-C2" "C2 listesi yükleniyor..."
    $C2Lookup = @{}

    foreach ($stealer in $C2SignatureSources.Keys) {
        $url = $C2SignatureSources[$stealer]
        if (-not $url) { continue }
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
            foreach ($line in ($resp.Content -split "`r?`n")) {
                $clean = $line.Trim().ToLower()
                if ($clean -and -not $C2Lookup.ContainsKey($clean)) { $C2Lookup[$clean] = $stealer }
            }
        }
        catch { Write-Warning "C2 listesi yüklenemedi: $stealer" }
    }

    $findings = [System.Collections.Generic.List[object]]::new()
    $conns = Get-NetTCPConnection -State Established |
             Where-Object { $_.RemoteAddress -notin @("127.0.0.1","::1") }

    foreach ($conn in $conns) {
        $ip = $conn.RemoteAddress.ToLower()
        if ($C2Lookup.ContainsKey($ip)) {
            $findings.Add([PSCustomObject]@{
                Module        = "QuickNetC2"
                DetectionType = "C2-IP"
                Stealer       = $C2Lookup[$ip]
                RemoteIP      = $ip
                RemotePort    = $conn.RemotePort
                Risk          = "Confirmed-C2"
            })
            Write-QLog "NET-C2" "C2 IP  $ip  [$($C2Lookup[$ip])]" "Red"
        }
        try {
            $domain = ([System.Net.Dns]::GetHostEntry($ip)).HostName.ToLower()
            if ($C2Lookup.ContainsKey($domain)) {
                $findings.Add([PSCustomObject]@{
                    Module        = "QuickNetC2"
                    DetectionType = "C2-Domain"
                    Stealer       = $C2Lookup[$domain]
                    RemoteIP      = $ip
                    Domain        = $domain
                    RemotePort    = $conn.RemotePort
                    Risk          = "Confirmed-C2"
                })
                Write-QLog "NET-C2" "C2 Domain  $domain  [$($C2Lookup[$domain])]" "Red"
            }
        }
        catch { continue }
    }

    Write-QLog "NET-C2" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  MODÜL 5  –  NETWORK BEHAVIOR (hızlı, sadece şüpheli processler)
# ================================================================
function Invoke-QuickNetworkBehavior {
    Write-QLog "NET-BEH" "Ağ davranışı analiz ediliyor..."

    $ProcLookup = @{}
    foreach ($p in Get-Process) {
        try { $ProcLookup[$p.Id] = @{ Name = $p.ProcessName; Path = $p.Path } }
        catch { continue }
    }

    $BehaviorRules = @(
        @{ Name = "Suspicious TLD";           Check = { param($c,$pid,$cl) $c.RemoteAddress -match "\.(su|xyz|top|ru|tk|cc|pw)$" } }
        @{ Name = "Non-Standard Port";        Check = { param($c,$pid,$cl) $c.RemotePort -notin @(80,443,8080,8443,53,22) -and $c.RemotePort -gt 1024 } }
        @{ Name = "Multiple Connections";     Check = { param($c,$pid,$cl) ($cl | Select-Object -ExpandProperty RemoteAddress -Unique).Count -gt 5 } }
        @{ Name = "Suspicious Process Name";  Check = { param($c,$pid,$cl) Test-SuspiciousProcess -Name $ProcLookup[$pid].Name } }
        @{ Name = "Running From Temp";        Check = { param($c,$pid,$cl) $ProcLookup[$pid].Path -match "\\Temp\\|\\tmp\\|\\AppData\\Roaming\\" } }
    )

    $ProcConns = @{}
    foreach ($pid in $ProcLookup.Keys) {
        $c = Get-NetTCPConnection -OwningProcess $pid -State Established -ErrorAction SilentlyContinue
        if ($c) { $ProcConns[$pid] = $c }
    }

    $findings = [System.Collections.Generic.List[object]]::new()

    foreach ($pid in $ProcConns.Keys) {
        $connList = $ProcConns[$pid]
        $procInfo = $ProcLookup[$pid]

        foreach ($conn in $connList) {
            $triggered = @()
            foreach ($rule in $BehaviorRules) {
                try { if (& $rule.Check $conn $pid $connList) { $triggered += $rule.Name } }
                catch { continue }
            }
            if ($triggered.Count -ge 2) {   # Quick modda en az 2 kural tetiklenmeli
                $findings.Add([PSCustomObject]@{
                    Module         = "QuickNetBehavior"
                    PID            = $pid
                    ProcessName    = $procInfo.Name
                    Path           = $procInfo.Path
                    RemoteIP       = $conn.RemoteAddress
                    RemotePort     = $conn.RemotePort
                    TriggeredRules = ($triggered -join " | ")
                    Risk           = if ($triggered.Count -ge 3) { "High" } else { "Medium" }
                })
                Write-QLog "NET-BEH" "PID $pid ($($procInfo.Name))  $($triggered -join ' | ')" "Yellow"
            }
        }
    }

    Write-QLog "NET-BEH" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  MODÜL 6  –  QUICK BEHAVIOR (sadece çalışan şüpheli processler)
# ================================================================
$BehaviorRulesTable = [System.Collections.Generic.List[object]]::new()
$ProcessTelTable    = [System.Collections.Generic.List[hashtable]]::new()

function Invoke-QuickBehaviorDetection {
    Write-QLog "BEHAV" "Behavior kuralları yükleniyor..."

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

    Write-QLog "BEHAV" "Telemetri toplanıyor (şüpheli processler)..."

    # Sadece şüpheli veya temp'ten çalışan processler
    $targetPids = Get-Process | Where-Object {
        $_.Id -gt 4 -and (
            (Test-SuspiciousProcess -Name $_.ProcessName) -or
            ($_.Path -and $_.Path -match "\\Temp\\|\\AppData\\Roaming\\")
        )
    } | Select-Object -ExpandProperty Id

    foreach ($pid in $targetPids) {
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
                        WrittenFiles   = @(); RegistryWrites = @(); APIcalls = @()
                        Network        = @(); OpenFiles      = @(); ThreadName = ""
                    })
                }
            }
        }
        catch { continue }
    }

    $findings = [System.Collections.Generic.List[object]]::new()
    if ($BehaviorRulesTable.Count -eq 0 -or $ProcessTelTable.Count -eq 0) {
        Write-QLog "BEHAV" "Kural veya telemetri yok, atlanıyor." "DarkGray"
        return $findings
    }

    # Exact Match
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

            if ($score -ge 2) {
                $findings.Add([PSCustomObject]@{
                    Module      = "QuickBehavior"
                    PID         = $tlm.pid
                    ProcessName = $tlm.ProcessName
                    MatchFamily = $ri.family
                    Score       = $score
                    Risk        = if ($score -ge 4) { "High" } else { "Medium" }
                })
                Write-QLog "BEHAV" "EXACT  PID $($tlm.pid) ($($tlm.ProcessName))  $($ri.family)  [Skor:$score]" "Yellow"
            }
        }
    }

    Write-QLog "BEHAV" "Tamamlandı. Bulgu: $($findings.Count)" "Green"
    return $findings
}

# ================================================================
#  RAPOR
# ================================================================
function Save-QuickReport {
    param([System.Collections.Generic.List[object]]$AllFindings, [TimeSpan]$Elapsed)

    if ($AllFindings.Count -eq 0) {
        Write-QLog "REPORT" "Hiç bulgu yok – temiz görünüyor." "Green"
        return
    }

    $summary = $AllFindings | Group-Object Module |
               ForEach-Object { [PSCustomObject]@{ Module = $_.Name; Count = $_.Count } }

    $report = [PSCustomObject]@{
        ScanType  = "QuickScan"
        ScanTime  = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        Duration  = "$([math]::Round($Elapsed.TotalSeconds, 1)) saniye"
        Total     = $AllFindings.Count
        Summary   = $summary
        Findings  = $AllFindings
    }

    $report | ConvertTo-Json -Depth 8 | Out-File $ReportFile -Encoding UTF8
    Write-QLog "REPORT" "Rapor: $ReportFile" "Cyan"

    $i = 1
    foreach ($f in $AllFindings) {
        $fn = Join-Path $LogFolder "$i`_$($f.Module)_$($f.Risk).json"
        $f | ConvertTo-Json -Depth 5 | Out-File $fn -Encoding UTF8
        $i++
    }
}

# ================================================================
#  ANA AKIŞ
# ================================================================
function Start-QuickScan {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║    Anti-Stealer  –  Quick Scan                   ║" -ForegroundColor Cyan
    Write-Host "║    Stealer hotspot taraması  |  ~30 sn hedef     ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    $all = [System.Collections.Generic.List[object]]::new()

    $modules = @(
        @{ Name = "1/6  Hash Detection (Hotspot)";   Fn = { Invoke-QuickHashDetection } }
        @{ Name = "2/6  Registry & Task Startup";    Fn = { Invoke-RegistryStartupScan } }
        @{ Name = "3/6  Memory Scan (Şüpheli Proc)"; Fn = { Invoke-QuickMemoryScan } }
        @{ Name = "4/6  Network C2 Check";           Fn = { Invoke-QuickNetworkC2 } }
        @{ Name = "5/6  Network Behavior";           Fn = { Invoke-QuickNetworkBehavior } }
        @{ Name = "6/6  Behavior Detection";         Fn = { Invoke-QuickBehaviorDetection } }
    )

    foreach ($mod in $modules) {
        Write-Host ""
        Write-Host "━━━  $($mod.Name)  ━━━" -ForegroundColor DarkCyan
        $results = & $mod.Fn
        foreach ($r in $results) { $all.Add($r) }
        Write-Host "    Geçen süre: $([math]::Round($stopwatch.Elapsed.TotalSeconds,1))s" -ForegroundColor DarkGray
    }

    $stopwatch.Stop()

    Write-Host ""
    Write-Host "━━━  Rapor Kaydediliyor  ━━━" -ForegroundColor DarkCyan
    Save-QuickReport -AllFindings $all -Elapsed $stopwatch.Elapsed

    # Risk özeti
    $highRisk = $all | Where-Object { $_.Risk -in @("Confirmed","Confirmed-C2","Potential-Stealer","High") }

    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   QUICK SCAN TAMAMLANDI                          ║" -ForegroundColor Cyan
    Write-Host "║   Süre        : $("$([math]::Round($stopwatch.Elapsed.TotalSeconds,1))s".PadRight(33))║" -ForegroundColor Cyan
    Write-Host "║   Toplam Bulgu: $($all.Count.ToString().PadRight(33))║" -ForegroundColor $(if ($all.Count -gt 0) { "Yellow" } else { "Cyan" })
    Write-Host "║   Yüksek Risk : $($highRisk.Count.ToString().PadRight(33))║" -ForegroundColor $(if ($highRisk.Count -gt 0) { "Red" } else { "Cyan" })
    Write-Host "║   Rapor       : QuickScanReport.json             ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan

    if ($highRisk.Count -gt 0) {
        Write-Host ""
        Write-Host "  [!] Yüksek riskli bulgular:" -ForegroundColor Red
        foreach ($h in $highRisk) {
            $label = if ($h.Path) { $h.Path } elseif ($h.PID) { "PID $($h.PID) ($($h.ProcessName))" } else { $h.RemoteIP }
            Write-Host "      ► [$($h.Risk)]  $label" -ForegroundColor Red
        }
    }
}

# ---- Başlat ----
Start-QuickScan
