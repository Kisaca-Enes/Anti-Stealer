
# Lina Stealer – MITRE ATT&CK Mapping

## Overview

**Lina Stealer** is a multi-stage information stealer targeting Discord accounts, browser data, wallets, and messaging applications.
It abuses Chromium-based browser storage, Discord client internals, DPAPI decryption, malicious browser extensions, and process manipulation to exfiltrate sensitive data.

This document maps Lina Stealer techniques to the **MITRE ATT&CK Enterprise Framework**.

---

## Initial Access

### 🟡 T1204.002 – User Execution: Malicious File

* Lina is typically delivered as a **malicious executable or script** requiring user execution.
* Often disguised as cracked software, cheats, or utilities.

---

## Execution

### 🔴 T1059.007 – Command and Scripting Interpreter: JavaScript

* Written primarily in **Node.js / JavaScript**
* Executes system commands via `exec`, `execSync`, and child processes.

### 🔴 T1059.003 – Command and Scripting Interpreter: Windows Command Shell

* Uses `taskkill`, `tasklist`, and PowerShell commands for process control and DPAPI abuse.

---

## Persistence

### 🔴 T1554 – Compromise Client Software Binary

* Injects malicious code into:

  * `discord_desktop_core/index.js`
  * `BetterDiscord.asar`
  * Electron wallet apps (Exodus, Atomic)
* Overwrites legitimate application resources to maintain execution.

---

## Privilege Escalation

❌ *Not explicitly required*
Lina primarily operates in **user context** and abuses user-accessible secrets.

---

## Defense Evasion

### 🔴 T1562.001 – Impair Defenses: Disable or Modify Tools

* Terminates Discord processes to:

  * Unlock token databases
  * Bypass file locks
* Deletes `.log` and `.ldb` files after token extraction.

### 🔴 T1036 – Masquerading

* Uses legitimate application paths and filenames.
* Disguises malicious Chrome extensions as system components.

---

## Credential Access

### 🔴 T1555 – Credentials from Password Stores

* Extracts encryption keys from Chromium **Local State**
* Decrypts credentials using:

  * DPAPI
  * AES-GCM

### 🔴 T1555.003 – Credentials from Web Browsers

* Steals:

  * Discord tokens
  * Cookies
  * Saved sessions
* Targets Chrome, Edge, Brave, Opera, Vivaldi, Firefox.

### 🔴 T1003 – OS Credential Dumping (User Context)

* Uses DPAPI via **PowerShell fallback** to decrypt protected data.

---

## Discovery

### 🟡 T1082 – System Information Discovery

* Collects:

  * OS version
  * Username
  * Installed applications
  * Browser profiles

### 🟡 T1518.001 – Software Discovery

* Searches for:

  * Discord variants
  * Browsers
  * Wallet applications
  * Messaging clients (Telegram, WhatsApp)

---

## Collection

### 🔴 T1114.001 – Email Collection: Local Email Collection

* Extracts Discord backup codes from local files.

### 🔴 T1005 – Data from Local System

* Collects:

  * Wallet files
  * Browser cookies
  * Application session data
  * Telegram `tdata`

### 🔴 T1056 – Input Capture (Browser Abuse)

* Uses **malicious Chrome extensions** to capture cookies directly via browser APIs.

---

## Command and Control

### 🔴 T1071.001 – Application Layer Protocol: Web Protocols

* Communicates with C2 servers over **HTTPS**
* Uploads stolen data via HTTP POST requests.

### 🔴 T1105 – Ingress Tool Transfer

* Downloads:

  * Injection payloads
  * Replacement ASAR files
  * Remote scripts

---

## Exfiltration

### 🔴 T1041 – Exfiltration Over C2 Channel

* Sends stolen data (tokens, wallets, cookies) directly to attacker-controlled servers.

---

## Impact

### 🟡 T1531 – Account Access Removal

* Hijacks Discord accounts by stealing valid authentication tokens.
* Enables full account takeover without password change.

---

## Summary

**Lina Stealer** demonstrates:

* Advanced **browser abuse**
* Discord-specific **token lifecycle exploitation**
* Persistent **client-side application injection**
* Low-noise but high-impact credential theft

It should be classified as a **high-confidence information stealer** with **account takeover capability**.

---
