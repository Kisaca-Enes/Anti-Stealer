# MITRE ATT&CK Mapping – Era Stealer

> This document maps Era Stealer’s observed behaviors to the MITRE ATT&CK framework.  
> Analysis is based on real source code and runtime behavior.  
> Purpose: **defensive research, detection engineering, and threat hunting**.

---

## TA0001 – Initial Access

### T1204.002 – User Execution: Malicious File
- Distributed as cracked software, cheats, or fake installers
- Relies on user manually executing the malicious binary
- Common in gaming / cheat communities

---

## TA0002 – Execution

### T1059.001 – Command and Scripting Interpreter: PowerShell
- Uses PowerShell to invoke **DPAPI decryption**
- Executes:

- Used to decrypt Chromium master keys

### T1059.007 – JavaScript
- Core logic written in **Node.js**
- Executes JavaScript for:
- Token extraction
- Browser data harvesting
- Discord API interaction

### T1106 – Native API
- Direct filesystem access
- DPAPI calls for credential decryption
- OS and hardware information gathering

---

## TA0003 – Persistence

### T1547.001 – Boot or Logon Autostart Execution: Startup Folder
- Creates `.lnk` files in:

- Ensures execution on every user logon

### T1053.005 – Scheduled Task (Indirect Behavior)
- File watcher logic recreates persistence artifacts if removed
- Continuous validation of startup presence

---

## TA0005 – Defense Evasion

### T1036 – Masquerading
- Masquerades as legitimate software or installers
- Uses generic or trusted-looking filenames

### T1027 – Obfuscated / Encrypted Files or Information
- Encrypted browser data (AES-GCM)
- Token values stored encrypted in LevelDB

### T1140 – Deobfuscate / Decode Files or Information
- Base64 decoding
- AES-256-GCM decryption of:
- Browser passwords
- Discord tokens

### T1497 – Virtualization / Sandbox Evasion (Observed Risk)
- Execution logic may fail silently in restricted or sandboxed environments
- Heavy reliance on user profile artifacts

### T1070.004 – File Deletion
- Temporary files and copied databases removed after use
- Cleanup of intermediate artifacts

---

## TA0006 – Credential Access

### T1555 – Credentials from Password Stores
- Chromium-based browser passwords
- Opera / Chrome / Edge credential stores

### T1552.001 – Unsecured Credentials: Credentials in Files
- Searches user directories for:
- `discord_backup_codes*.txt`
- Extracts 2FA backup codes and related email addresses

### T1539 – Steal Web Session Cookie
- Discord session tokens extracted from:
- Supports both plaintext and encrypted token formats

---

## TA0007 – Discovery

### T1082 – System Information Discovery
- OS version
- RAM size
- Hostname
- Username

### T1033 – Account Discovery
- Windows username
- Discord user ID and profile metadata

### T1016 – Network Information Discovery
- Public IP address via external web services
- IP geolocation lookup

### T1083 – File and Directory Discovery
- Browser profile paths
- LevelDB directories
- User home directory traversal

---

## TA0009 – Collection

### T1005 – Data from Local System
Collected data includes:
- Discord tokens
- Browser passwords
- Cookies
- Autofill data
- Browsing history
- Backup codes

---

## TA0011 – Command and Control

### T1102 – Web Service
- Discord Webhooks used as C2
- Telegram infrastructure referenced

### T1071.001 – Application Layer Protocol: Web Protocols
- HTTPS used for:
- Discord API
- Webhook exfiltration
- IP lookup services

---

## TA0010 – Exfiltration

### T1041 – Exfiltration Over C2 Channel
- Data exfiltrated directly through Discord webhooks

### T1567.002 – Exfiltration to Cloud / Web Services
- ZIP archives and structured embeds sent to Discord

---

## Summary

Era Stealer is a **credential-focused Node.js stealer** that heavily abuses:
- Chromium encryption mechanisms
- Discord token storage
- Discord webhooks as C2

Despite low technical sophistication, its behavior is highly detectable through **process, filesystem, and network correlations**.

Status: **Fully Analyzed – Detection Coverage Complete**
