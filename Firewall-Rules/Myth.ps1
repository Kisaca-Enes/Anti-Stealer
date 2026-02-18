New-NetFirewallRule `
    -DisplayName "SOC-MythStealer-Block-login.monexic.com" `
    -Direction Outbound `
    -RemoteFqdn "login.monexic.com" `
    -Protocol TCP `
    -RemotePort 443,80 `
    -Action Block `
    -Profile Any `
    -Description "Blocks Myth Stealer C2 domain"
