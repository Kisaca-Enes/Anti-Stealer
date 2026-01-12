title: Era Stealer Discord Backup Codes Harvesting
id: a9f5c2b4-2d91-4e3c-bc5a-era-backup
status: experimental
description: Detects access to Discord backup codes indicating MFA bypass attempt
author: No-Stealer Project
date: 2026-01-12
confidence: critical
logsource:
  category: file_event
  product: windows

detection:
  selection:
    FileName|contains:
      - "discord_backup_codes"

  condition: selection

falsepositives:
  - User manually opening Discord backup codes file (rare)

level: critical
tags:
  - attack.credential_access
  - attack.t1552.001
