# EvilSoul Stealer – Old Variant

This directory contains detection rules and technical notes for the **old EvilSoul stealer**, a JavaScript-based infostealer targeting Windows systems.

The malware abuses **Chromium internals, Discord injection, and browser remote debugging** to extract credentials, sessions, and sensitive user data.

---

## 🔍 Malware Overview

**EvilSoul (old variant)** is a multi-stage infostealer written in JavaScript / Node.js.  
It is commonly distributed via:

- Fake game installers
- Cracked software
- Cheat / mod loaders

Primary goals:
- Account takeover
- Session hijacking
- Credential and financial data theft

---

## 🧠 Key Capabilities

### Browser & Credential Theft
- Chromium `Local State` DPAPI master key extraction
- AES-256-GCM decryption of:
  - Saved passwords
  - Cookies
  - Credit cards
  - Autofill data
  - Browser history

### Browser Takeover
- Forced browser termination (`taskkill`)
- Relaunch using:
  - `--remote-debugging-port`
  - `--headless`
  - `--no-sandbox`
- Cookie extraction via Chrome DevTools Protocol:
  - `Network.getAllCookies`

### Session Hijacking
- Instagram (private mobile API)
- TikTok web session abuse
- Spotify authenticated profile access

### Discord Abuse
- Token discovery (LevelDB)
- Discord client JavaScript injection
- Webhook-based exfiltration

### Game Account Theft
- Steam (`loginusers.vdf`)
- Minecraft and third-party launchers
  - Lunar
  - Feather
  - PolyMC
  - TLauncher
  - Badlion
  - Rise / Novoline

### Data Staging & Exfiltration
- Temporary data staging in `%TEMP%`
- ZIP archive creation (`AdmZip`)
- Exfiltration via:
  - Discord webhooks
  - Cloud upload endpoints

---

## 🎯 Detection Coverage

This directory includes **YARA rules** designed to detect:

- Browser remote debugging abuse
- Chromium credential database theft
- Cookie-based session hijacking
- Game launcher account exfiltration
- ZIP-based data staging for exfiltration

Rules are written to:
- Minimize false positives
- Focus on behavioral and structural indicators
- Avoid hard-coded C2 values

---

## ⚠️ Disclaimer

This repository is intended **strictly for defensive, educational, and research purposes**.

- No live malware binaries are distributed
- No C2 infrastructure is provided
- Rules are designed to support:
  - SOC teams
  - Incident response
  - Threat hunting
  - Malware research

Misuse of this information for malicious purposes is not endorsed.

---

## 📚 References

- MITRE ATT&CK:
  - TA0006 – Credential Access
  - TA0009 – Collection
  - TA0011 – Command and Control
- Chromium DevTools Protocol
- Discord client internals

---

**No-Stealer Project**

