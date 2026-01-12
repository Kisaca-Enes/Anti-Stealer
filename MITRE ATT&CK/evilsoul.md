# MITRE ATT&CK Mapping — EvilSoul Stealer (Postmortem)

> **Status:** Decommissioned
>
> **Purpose:** Defensive analysis and detection enablement. This document maps observed behaviors to the MITRE ATT&CK framework to support blue teams, SOCs, and detection engineering. No operational guidance is provided.

---

## Executive Summary

EvilSoul exhibited a classic commodity-stealer profile with Node.js-based execution, browser data access, credential decryption via OS-protected APIs, persistence through user startup artifacts, and exfiltration via webhooks/file hosts. The overlap with multiple known families resulted in rapid signature convergence (Sigma/YARA), accelerating decommissioning.

---

## ATT&CK Tactics & Techniques

### Initial Access (TA0001)

* **T1204.002 – User Execution: Malicious File**
  Relied on social engineering to induce execution of a packaged binary.

---

### Execution (TA0002)

* **T1059.007 – Command and Scripting Interpreter: JavaScript**
  Node.js runtime used for primary logic.
* **T1106 – Native API**
  Invoked OS APIs for cryptographic operations and process control.

---

### Persistence (TA0003)

* **T1547.001 – Boot or Logon Autostart Execution: Registry/Startup Folder**
  Created user-level startup artifacts to re-execute on logon.

---

### Privilege Escalation (TA0004)

* **Not Observed**
  Operated primarily at user context.

---

### Defense Evasion (TA0005)

* **T1027 – Obfuscated/Compressed Files and Information**
  Bundled/packed resources to reduce casual inspection.
* **T1070.004 – Indicator Removal on Host: File Deletion**
  Temporary artifacts cleaned post-execution.

---

### Credential Access (TA0006)

* **T1555.003 – Credentials from Web Browsers**
  Accessed stored browser credentials and cookies.
* **T1552.001 – Unsecured Credentials: Credentials in Files**
  Searched for locally stored recovery/backup codes.
* **T1003 – OS Credential Dumping (User Context)**
  Leveraged OS-protected decryption mechanisms where available.

---

### Discovery (TA0007)

* **T1082 – System Information Discovery**
  Collected OS, hardware, and environment metadata.
* **T1012 – Query Registry**
  Inspected application locations and profiles.

---

### Collection (TA0009)

* **T1114 – Email Collection (Indirect Indicators)**
  Derived account-related metadata via session artifacts.
* **T1056 – Input Capture (Not Observed)**
  No keylogging observed.

---

### Command and Control (TA0011)

* **T1071.001 – Application Layer Protocol: Web Protocols**
  HTTPS used for outbound communication.
* **T1102 – Web Service**
  Leveraged third-party web services for message delivery and file hosting.

---

### Exfiltration (TA0010)

* **T1041 – Exfiltration Over C2 Channel**
  Data sent over established web channels.
* **T1567.002 – Exfiltration to Cloud Storage**
  Temporary uploads to public file-hosting services.

---

## Detection Opportunities

### Host-Based

* Creation/modification of user startup artifacts.
* Access patterns to browser credential stores outside normal browser processes.
* Invocation of OS-protected decryption APIs by non-browser executables.

### Network-Based

* Webhook-style POST bursts containing structured embeds.
* Uploads to public file hosts immediately following local archive creation.

---

## Mitigations

* Application allowlisting for script runtimes.
* Browser hardening and credential store protections.
* EDR rules for startup persistence creation.
* Network controls for known webhook/file-hosting abuse patterns.

---

## Conclusion

EvilSoul’s lifecycle ended due to heavy technique reuse and weak operational differentiation. Mapping these behaviors to ATT&CK highlights why generic detections were sufficient to neutralize the family.

**EvilSoul is closed.**
