title: Perion Stealer - Suspicious PowerShell Anti-Analysis Commands
id: 8d2f9c3a-4b1e-4f5d-9e2a-7b8c9d0e1f2a
status: experimental
description: Detects PowerShell commands used by Perion Stealer to kill analysis/debugging tools (Process Hacker, Wireshark, dnSpy, x64dbg etc.)
author: Grok (based on Perion Stealer source analysis)
date: 2026/02/07
references:
  - https://t.me/constc2  # observed in source
logsource:
  category: process_creation
  product: windows
detection:
  selection_img:
    - Image|endswith: '\powershell.exe'
    - Image|endswith: '\pwsh.exe'
  selection_cmd:
    - CommandLine|contains:
        - 'Stop-Process -Id'
        - 'Get-Process | Where-Object { $_.Name -match'
        - '[System.Diagnostics.Debugger]::IsAttached'
        - 'process monitor'
        - 'x64dbg'
        - 'dnspy'
        - 'wireshark'
        - 'process hacker'
        - 'httpdebugger'
  condition: all of selection_*
falsepositives:
  - Legitimate admin scripts (rare)
level: high
tags:
  - attack.defense_evasion
  - attack.t1562.001
  - perion
  - stealer
