# Import network monitoring module (Get-NetTCPConnection)
$interval = 10  # saniye başına kontrol
$threshold = 7  # aynı IP için domain eşiği

while ($true) {
    # Tüm TCP outbound bağlantıları al
    $connections = Get-NetTCPConnection -State Established -Direction Outbound
    
    # IP -> domain sayısı haritası
    $ipDomainMap = @{}

    foreach ($conn in $connections) {
        $remoteIP = $conn.RemoteAddress
        try {
            # Reverse DNS lookup
            $domain = ([System.Net.Dns]::GetHostEntry($remoteIP)).HostName
        } catch { $domain = $null }

        if ($domain) {
            if (-not $ipDomainMap.ContainsKey($remoteIP)) {
                $ipDomainMap[$remoteIP] = @()
            }
            if ($domain -and ($ipDomainMap[$remoteIP] -notcontains $domain)) {
                $ipDomainMap[$remoteIP] += $domain
            }
        }
    }

    # Eşikten fazla domain var mı kontrol et ve blokla
    foreach ($ip in $ipDomainMap.Keys) {
        if ($ipDomainMap[$ip].Count -ge $threshold) {
            if (-not (Get-NetFirewallRule -DisplayName "Auto Block Lumma IP $ip" -ErrorAction SilentlyContinue)) {
                Write-Host "Blocking IP: $ip (used by $($ipDomainMap[$ip].Count) domains)"
                New-NetFirewallRule -DisplayName "Auto Block Lumma IP $ip" `
                    -Direction Outbound -Action Block -RemoteAddress $ip -Protocol TCP
            }
        }
    }

    Start-Sleep -Seconds $interval
}
