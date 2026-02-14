# İzlenecek process
$targetProcess = "C:\Path\To\setup.exe"

# Threshold
$threshold = 3 # aynı anda 3 farklı .su domaini
$timeWindow = 30 # saniye

# DNS log tutma (örnek basit)
$dnsLog = @{}

while ($true) {
    # Burada Wireshark / tshark veya Get-DnsClientCache ile DNS sorgularını çekiyoruz
    $queries = Get-DnsClientCache | Where-Object {$_.Name -like "*.su"}
    
    foreach ($q in $queries) {
        $timestamp = Get-Date
        if (-not $dnsLog.ContainsKey($q.Name)) {
            $dnsLog[$q.Name] = @($timestamp)
        } else {
            $dnsLog[$q.Name] += $timestamp
        }
    }

    # Check threshold
    $recent = $dnsLog.GetEnumerator() | Where-Object {
        $_.Value | Where-Object { ($_ -gt (Get-Date).AddSeconds(-$timeWindow)) }
    }

    if ($recent.Count -ge $threshold) {
        # Firewall rule ekle
        New-NetFirewallRule -DisplayName "Dynamic Block $targetProcess" `
                            -Program $targetProcess `
                            -Direction Outbound `
                            -Action Block
        Write-Host "Dynamic block applied to $targetProcess due to multiple .su queries"
        break
    }

    Start-Sleep -Seconds 5
}
