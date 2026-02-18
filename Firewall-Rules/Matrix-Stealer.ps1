$SuspiciousExe = "C:\Users\*\AppData\Roaming\GameLoader\update.exe"

New-NetFirewallRule `
    -DisplayName "SOC-Block-Specific-Suspicious-Exe" `
    -Direction Outbound `
    -Action Block `
    -Program $SuspiciousExe `
    -Protocol Any `
    -Profile Any
