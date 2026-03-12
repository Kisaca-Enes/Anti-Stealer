# ----------------------------
# 🔹 Memory Scan + Signature Matching
# ----------------------------

# 1️⃣ Signature Yükleme (RAW veya lokal)
function Load-MemorySignatures {
    param([array]$SignatureSources)

    $SignatureTable = @{}
    $FamilyTable    = @{}
    $TotalCount     = 0

    foreach ($source in $SignatureSources) {
        try {
            $response = Invoke-WebRequest $source.Url -UseBasicParsing
            $lines = $response.Content -split "`n"

            foreach ($line in $lines) {
                $clean = $line.Trim().ToLower()
                if ($clean.Length -gt 4 -and -not $SignatureTable.ContainsKey($clean)) {
                    $SignatureTable[$clean] = @{ Family = $source.Name }

                    if (-not $FamilyTable.ContainsKey($source.Name)) {
                        $FamilyTable[$source.Name] = New-Object System.Collections.Generic.HashSet[string]
                    }
                    $FamilyTable[$source.Name].Add($clean) | Out-Null
                    $TotalCount++
                }
            }
        }
        catch { Write-Warning "Signature yüklenemedi: $($source.Name)" }
    }

    return [PSCustomObject]@{
        SignatureTable = $SignatureTable
        FamilyTable    = $FamilyTable
        TotalCount     = $TotalCount
    }
}

# Örnek signature listeleri
$SignatureSources = @(
    @{ Name="Myth"; Url="https://raw.githubusercontent.com/username/repo/main/myth.txt" },
    @{ Name="Lina"; Url="https://raw.githubusercontent.com/username/repo/main/lina.txt" },
    @{ Name="Era"; Url="https://raw.githubusercontent.com/username/repo/main/era.txt" },
    @{ Name="Stealkerium"; Url="https://raw.githubusercontent.com/username/repo/main/stealkerium.txt" }
)

$Signatures = Load-MemorySignatures -SignatureSources $SignatureSources

# 2️⃣ Tarama yapılabilecek processleri al
function Get-ScannableProcesses {
    $PROCESS_QUERY_INFORMATION = 0x0400
    $PROCESS_VM_READ = 0x0010
    $scannable = @()

    foreach ($proc in Get-Process) {
        if ($proc.Id -le 4) { continue }

        try {
            $handle = [MemAPI]::OpenProcess(
                $PROCESS_QUERY_INFORMATION -bor $PROCESS_VM_READ,
                $false,
                $proc.Id
            )
            if ($handle -ne [IntPtr]::Zero) {
                $scannable += [PSCustomObject]@{
                    Name   = $proc.ProcessName
                    PID    = $proc.Id
                    Handle = $handle
                }
            }
        }
        catch { continue }
    }

    return $scannable
}

# 3️⃣ Memory bölgelerini al
function Get-ReadableMemoryRegions {
    param([IntPtr]$ProcessHandle)

    $regions = @()
    $addr = [IntPtr]::Zero
    $memInfo = New-Object MemAPI+MEMORY_BASIC_INFORMATION
    $size = [System.Runtime.InteropServices.Marshal]::SizeOf($memInfo)

    while ([MemAPI]::VirtualQueryEx($ProcessHandle, $addr, [ref]$memInfo, $size) -ne 0) {
        $isCommitted = ($memInfo.State -eq 0x1000)
        $isReadable =
            ($memInfo.Protect -band 0x02) -or
            ($memInfo.Protect -band 0x04) -or
            ($memInfo.Protect -band 0x20) -or
            ($memInfo.Protect -band 0x40)
        $isGuard = ($memInfo.Protect -band 0x100)
        $isNoAccess = ($memInfo.Protect -band 0x01)

        if ($isCommitted -and $isReadable -and -not $isGuard -and -not $isNoAccess) {
            $regions += [PSCustomObject]@{
                BaseAddress = $memInfo.BaseAddress
                RegionSize  = $memInfo.RegionSize
                Protect     = $memInfo.Protect
            }
        }

        $addr = [IntPtr]($memInfo.BaseAddress.ToInt64() + $memInfo.RegionSize.ToUInt64())
    }

    return $regions
}

# 4️⃣ Memory’den bytes oku
function Read-MemoryRegionBytes {
    param(
        [IntPtr]$ProcessHandle,
        [IntPtr]$BaseAddress,
        [UInt64]$RegionSize
    )

    $chunkSize = 0x10000
    $offset = 0
    $allBytes = New-Object System.Collections.Generic.List[byte]

    while ($offset -lt $RegionSize) {
        $remaining = $RegionSize - $offset
        $readSize = [Math]::Min($chunkSize, $remaining)
        $buffer = New-Object byte[] $readSize
        $bytesRead = 0

        $success = [MemAPI]::ReadProcessMemory(
            $ProcessHandle,
            [IntPtr]($BaseAddress.ToInt64() + $offset),
            $buffer,
            $readSize,
            [ref]$bytesRead
        )

        if ($success -and $bytesRead -gt 0) {
            $allBytes.AddRange($buffer[0..($bytesRead - 1)])
        }

        $offset += $readSize
    }

    return $allBytes.ToArray()
}

# 5️⃣ ASCII stringleri çıkar
function Extract-PrintableMemoryStrings {
    param(
        [IntPtr]$ProcessHandle,
        [IntPtr]$BaseAddress,
        [UInt64]$RegionSize,
        [int]$MinLength = 5
    )

    $bytes = Read-MemoryRegionBytes -ProcessHandle $ProcessHandle -BaseAddress $BaseAddress -RegionSize $RegionSize
    $currentString = ""
    $stringsFound = New-Object System.Collections.Generic.HashSet[string]

    foreach ($b in $bytes) {
        if ($b -ge 32 -and $b -le 126) {
            $currentString += [char]$b
        } else {
            if ($currentString.Length -ge $MinLength) {
                $stringsFound.Add($currentString.ToLower()) | Out-Null
            }
            $currentString = ""
        }
    }

    if ($currentString.Length -ge $MinLength) {
        $stringsFound.Add($currentString.ToLower()) | Out-Null
    }

    return $stringsFound
}

# 6️⃣ Heap Memory Scan ve Signature Matching
function Scan-ProcessesMemory {
    param([PSCustomObject]$Signatures)

    $results = @()
    $processes = Get-ScannableProcesses

    foreach ($proc in $processes) {
        $regions = Get-ReadableMemoryRegions -ProcessHandle $proc.Handle
        $pidStrings = New-Object System.Collections.Generic.HashSet[string]

        foreach ($region in $regions) {
            $regionStrings = Extract-PrintableMemoryStrings -ProcessHandle $proc.Handle `
                                                           -BaseAddress $region.BaseAddress `
                                                           -RegionSize $region.RegionSize
            foreach ($s in $regionStrings) { $pidStrings.Add($s) | Out-Null }
        }

        # Signature ile karşılaştır
        $matchCount = 0
        $familyCounter = @{}
        foreach ($s in $pidStrings) {
            if ($Signatures.SignatureTable.ContainsKey($s)) {
                $matchCount++
                $family = $Signatures.SignatureTable[$s].Family
                if (-not $familyCounter.ContainsKey($family)) { $familyCounter[$family] = 0 }
                $familyCounter[$family]++
            }
        }

        $similarity = if ($Signatures.TotalCount -gt 0) { $matchCount / $Signatures.TotalCount } else { 0 }
        $dominantFamily = if ($familyCounter.Count -gt 0) {
            ($familyCounter.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key
        } else { $null }

        # Risk level hesapla
        $risk = switch ($true) {
            { $similarity -gt 0.08 -or $matchCount -gt 20 } { "Potential-Stealer"; break }
            { $similarity -gt 0.06 } { "High"; break }
            { $similarity -gt 0.03 } { "Medium"; break }
            { $similarity -gt 0.01 } { "Low"; break }
            default { "Clean" }
        }

        $results += [PSCustomObject]@{
            PID           = $proc.PID
            ProcessName   = $proc.Name
            MatchCount    = $matchCount
            Similarity    = [math]::Round($similarity,4)
            RiskLevel     = $risk
            DominantFamily= $dominantFamily
            StringsFound  = $pidStrings
        }
    }

    return $results
}

# ----------------------------
# 🔹 Kullanım
# ----------------------------
$ScanResults = Scan-ProcessesMemory -Signatures $Signatures
$ScanResults | Format-Table -AutoSize
