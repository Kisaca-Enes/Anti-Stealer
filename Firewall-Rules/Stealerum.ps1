# ============================================
# Stealerium / Lamagrabber Containment v1
# Balanced FP / FN Strategy
# ============================================

Write-Host "[+] Starting Stealerium containment..." -ForegroundColor Cyan

# ---- IOC Definitions ----
$MalwareName = "Lamagrabber.exe"

$IOC_Domains = @(
    "raw.githubusercontent.com",
    "api.telegram.org"
)

$IOC_IPs = @(
    "185.199.110.133",
    "185.199.109.133",
    "185.199.108.133",
    "185.199.111.133"
)

# ---- 1️⃣ Process-Based Full Outbound Block ----
New-NetFirewallRule `
    -DisplayName "SOC-Stealerium-Block-Process-Outbound" `
    -Direction Outbound `
    -Program "*\$MalwareName" `
    -Action Block `
    -Protocol Any `
    -Profile Any `
    -Description "Blocks all outbound traffic from Lamagrabber.exe"

Write-Host "[+] Process outbound block created."

# ---- 2️⃣ Domain-Based Block (Only For Malware Process) ----
foreach ($domain in $IOC_Domains) {

    New-NetFirewallRule `
        -DisplayName "SOC-Stealerium-Block-$domain" `
        -Direction Outbound `
        -Program "*\$MalwareName" `
        -RemoteFqdn $domain `
        -Protocol TCP `
        -RemotePort 443 `
        -Action Block `
        -Profile Any `
        -Description "Blocks Stealerium access to $domain"
}

Write-Host "[+] IOC domain rules created."

# ---- 3️⃣ GitHub CDN IP Block (Process Scoped) ----
foreach ($ip in $IOC_IPs) {

    New-NetFirewallRule `
        -DisplayName "SOC-Stealerium-Block-IP-$ip" `
        -Direction Outbound `
        -Program "*\$MalwareName" `
        -RemoteAddress $ip `
        -Protocol TCP `
        -RemotePort 443 `
        -Action Block `
        -Profile Any `
        -Description "Blocks Stealerium access to GitHub CDN IP"
}

Write-Host "[+] IOC IP rules created."



# ---- 5️⃣ Enable Firewall Logging ----
Set-NetFirewallProfile `
    -Profile Domain,Public,Private `
    -LogBlocked True `
    -LogMaxSizeKilobytes 32768 `
    -LogFileName "C:\Windows\System32\LogFiles\Firewall\pfirewall.log"

Write-Host "[+] Firewall logging enabled."

Write-Host "[✓] Stealerium containment successfully applied." -ForegroundColor Green
