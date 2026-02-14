# TLD listesi (anormal)
$badTLDs = @(".su", ".pics", ".mom")

# Threshold
$threshold = 3
$timeWindow = 30 # saniye
$dnsLog = @{}

while ($true) {
    # Wireshark / tshark veya Get-DnsClientCache kullan
    $queries = Get-DnsClientCache | Where-Object {
        $tld = ($_ .Name).Split('.')[-1]
        $badTLDs -contains ".$tld"
    }

    foreach ($q in $queries) {
        $timestamp = Get-Date
        if (-not $dnsLog.ContainsKey($q.Name)) {
            $dnsLog[$q.Name] = @($timestamp)
        } else {
            $dnsLog[$q.Name] += $timestamp
        }
    }

    # Threshold check
    $recent = $dnsLog.GetEnumerator() | Where-Object {
        $_.Value | Where-Object { ($_ -gt (Get-Date).AddSeconds(-$timeWindow)) }
    }

    if ($recent.Count -ge $threshold) {
        foreach ($domain in $recent.Keys) {
            $ips = [System.Net.Dns]::GetHostAddresses($domain) | ForEach-Object { $_.IPAddressToString }
            foreach ($ip in $ips) {
                # Firewall rule ekle
                New-NetFirewallRule -DisplayName "Block $domain ($ip)" `
                                    -RemoteAddress $ip `
                                    -Direction Outbound `
                                    -Action Block
            }
        }
        Write-Host "Dynamic block applied for suspicious TLD activity"
        break
    }

    Start-Sleep -Seconds 5
}
