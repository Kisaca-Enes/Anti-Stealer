# -------- Config ---------
$SignatureSources = @{
     "Myth"   = ""
     "Lina"   = ""
     "Perion" = ""
     "StealC" = ""
     "Vidar"  = ""
}

$TargetExtensions = "*.exe","*.jar","*.zip"

# -------- Hash-Based Detection --------
function HashBasedDetection {

    # 1️⃣ Hash Lookup oluştur
    $HashLookup = @{}

    foreach ($stealer in $SignatureSources.Keys) {

        try {
            # 2️⃣ Raw GitHub içeriğini çek
            $hashes = Invoke-WebRequest -Uri $SignatureSources[$stealer] -UseBasicParsing

            # 3️⃣ Satırlara böl
            $hashList = $hashes.Content -split "`r?`n"

            foreach ($h in $hashList) {

                $cleanHash = $h.Trim().ToLower()

                # 4️⃣ Sadece geçerli SHA256 ekle
                if ($cleanHash -match '^[a-f0-9]{64}$' -and
                    -not $HashLookup.ContainsKey($cleanHash)) {

                    $HashLookup[$cleanHash] = $stealer
                }
            }
        }
        catch {
            Write-Warning "Signature yüklenemedi: $stealer"
        }
    }

    # 5️⃣ Dosyaları bul
    $Files = Get-ChildItem -Path C:\ `
                           -Include $TargetExtensions `
                           -Recurse `
                           -File `
                           -ErrorAction SilentlyContinue

    # 6️⃣ Çalışan processleri bir kere al (performans için)
    $RunningProcesses = Get-Process

    $Findings = @()

    foreach ($file in $Files) {
        try {
            $hash = (Get-FileHash $file.FullName -Algorithm SHA256).Hash.ToLower()

            if ($HashLookup.ContainsKey($hash)) {

                $stealerType = $HashLookup[$hash]

                $isRunning = $RunningProcesses | Where-Object {
                    $_.Path -eq $file.FullName
                }

                $result = [PSCustomObject]@{
                    Stealer = $stealerType
                    SHA256  = $hash
                    Path    = $file.FullName
                    Running = [bool]$isRunning
                }

                $Findings += $result
            }
        }
        catch {
            continue
        }
    }

    return $Findings
}
