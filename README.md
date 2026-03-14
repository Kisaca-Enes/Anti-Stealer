# Anti-Stealer
# Anti-Stealer (NO-Stealer)

![Anti-Stealer Logo](https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/main/assets/logo.png)
**Anti-Stealer (NO-Stealer)** is a comprehensive PowerShell 7+ scanning engine designed to detect stealer-type malware on Windows systems. It classifies stealers by family, performs accurate analysis, contributes to AV/AM detection rules, and maintains an up-to-date signature and C2 database. The engine performs chained static, memory, and network behavioral analyses, collects telemetry, generates YARA / Sigma / JSON (NO-ST) rules, and produces detailed logs and reports.

Below is a detailed README explaining why it’s important, how to use it, and why it’s valuable for researchers.

---

# Contents

1. Project Overview
2. Why Use It? (Benefits)
3. Problems It Solves
4. Who Can Benefit? (Researchers, AV engineers, SOC teams)
5. Quick Start
6. How It Works (Module details + thresholds)
7. Step-by-Step Guide for Researchers
8. Configuration & Example Snippets
9. Understanding Reports
10. Best Practices & Security Recommendations
11. Ethical & Legal Notices
12. Contributing & Versioning
13. FAQ
14. Acknowledgements

---

# 1. Project Overview

Anti-Stealer provides tools for detecting and classifying stealer families (e.g., RedLine, Vidar, Perion, Myth) with multiple detection layers:

* Hash-based detection (SHA256)
* Static string / similarity analysis (complemented by YARA)
* Memory scanning of running processes
* C2 IP/domain detection
* Network behavior analysis (process connection patterns)
* Behavior-based detection (Exact match + Jaccard similarity)
* JSON-based NO-ST rules (API calls, registry, file operations telemetry)
* Reporting: JSON per finding + log files

---

![Ekran Görüntüsü](https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/main/assets/Ekran%20G%C3%B6r%C3%BCnt%C3%BCs%C3%BC_20260313_062925.png)
![Anti-Stealer Ekran Görüntüsü](https://raw.githubusercontent.com/Kisaca-Enes/Anti-Stealer/main/assets/Ekran%20G%C3%B6r%C3%BCnt%C3%BCs%C3%BC_20260314_055246-1.png)

# 2. Why Use It? (Benefits)

* **Family-based classification:** Determines stealer family based on behavior and signatures rather than only file hashes, reducing false positives and improving AV rule accuracy.
* **Multi-layer detection:** Combines hash, static string, memory, network, and behavior analysis to detect complex and polymorphic variants.
* **Research & sharing oriented:** Generate YARA / Sigma / NO-ST rules and contribute to AV/AM or open-source threat intelligence databases.
* **Up-to-date signatures & C2 database:** SHA and C2 tables allow fast detection and prevention (firewall rules).
* **Telemetry & forensics:** Provides detailed process, network, and memory telemetry for incident response and threat analysis.
* **Automated reporting:** All findings saved in JSON, easy to integrate into pipelines or dashboards.

---

# 3. Problems It Solves

* Correctly classifies stealer variants from the same codebase.
* Detects polymorphic or packed variants where hash-based detection fails.
* Finds malicious code hidden in memory but not on disk.
* Detects active C2 communications and suspicious network behavior.
* Captures low-frequency or complex attack patterns using behavior-based detection.

---

# 4. Who Can Benefit?

* **Malware researchers:** Reverse-engineering, writing and validating YARA/Sigma rules.
* **Threat intel teams:** Expanding C2 and signature databases, sharing intel.
* **AV/AM engineers:** Signature generation, validation, and test automation.
* **SOC / Incident Response teams:** Rapid scanning, telemetry collection, and prioritized alerts.
* **Academic researchers:** Behavioral analysis, ML dataset creation, pattern modeling.

---
# Installation Instructions

## 1. Download the necessary files
Download `install.ps1` and `kural.txt` and make sure they are in the **same folder**.

---

## 2. Open PowerShell
Run **PowerShell** as Administrator (recommended).

---

## 3. Bypass the execution policy for this session
Set-ExecutionPolicy -Scope Process Bypass

---

## 4. Run the installation script
Replace `C:\path\to\your\folder` with the folder path where `install.ps1` is located:

C:\path\to\your\folder\install.ps1

---

## 5. Run `2.ps1` the same way

C:\path\to\your\folder\2.ps1

---

## 6. Install Visual Studio C++ Build Tools
If you encounter a build error (commonly referenced in GitHub issues), open the link below and install the **“C++ build tools”** option:

https://visualstudio.microsoft.com/visual-cpp-build-tools/

After the build tools finish installing, **close and reopen PowerShell**.

---

## 7. Install `pywebview`

pip install pywebview

After this, the build process should complete successfully.

---

## Optional: Use the GUI version (PowerShell 7)

1. Open **PowerShell 7** as Administrator.
2. Bypass execution policy:

Set-ExecutionPolicy -Scope Process Bypass

3. Run the GUI script:

C:\path\to\your\folder\UI.ps1

---

## Windows Defender Warnings
Windows Defender (or other antivirus tools) may flag the scripts as malware — this is frequently a **false positive** for local scripts and small installers.

Recommended steps:
- Temporarily allow the specific script or folder in Defender (add an exclusion or allow the detection).
- Run the script(s) after you have allowed/whitelisted them.
- If you prefer, run an antivirus scan **after** completing installation to verify no unwanted changes.

---

## Notes & Troubleshooting

- Always replace `C:\path\to\your\folder` with the actual absolute path to the folder that contains the script files (for example `C:\Users\Enes\Downloads\myproject`).
- If PowerShell refuses to run the script despite `Set-ExecutionPolicy -Scope Process Bypass`, ensure:
  - You opened PowerShell **as Administrator**, and
  - You used the correct path and file name.
- If you see build errors when installing Python packages that require compilation, double-check that the **C++ build tools** are installed and that you restarted PowerShell after their installation.
- If you prefer not to use the GUI, the same steps for `install.ps1` and `2.ps1` (above) will run the headless/CLI installation.

---

# 6. How It Works (Module Details + Thresholds)

**Modules (executed sequentially):**

1. **Hash-Based Detection:** SHA256 exact match. Result: `Confirmed`.
2. **Static Similarity Detection:** Analyzes printable strings in the file against signature database.

   * Similarity = `matchCount / signatureCount`
   * Risk thresholds:

     * `Potential-Stealer`: similarity > 0.08 OR matchCount > 20
     * `High`: similarity > 0.06
     * `Medium`: similarity > 0.03
     * `Low`: similarity > 0.01
     * `Clean`: otherwise
3. **Memory Scan:** Scans memory regions of running processes, compares to memory signatures.
4. **Network C2 Detection:** Compares active TCP connections to known C2 IPs/domains. `Confirmed-C2` if matched.
5. **Network Behavior Detection:** Rule-based checks for TLDs, multiple domains, non-standard ports, suspicious process names.
6. **Behavior Detection:**

   * **Exact match:** ≥2 rule items match → finding.
   * **Jaccard similarity:** Weighted similarity across telemetry (commandline, files, registry, API calls, network).

     * Example weights: CommandLine=0.25, APIcalls=0.25, WrittenFiles=0.15, RegistryWrites=0.15, OpenFiles=0.10, Network=0.10
     * Threshold: ≥0.3 → finding; ≥0.6 → High risk

---

# 7. Step-by-Step Guide for Researchers

### A. Lab Setup

* Isolated VM (with snapshots) + host-only / controlled network
* Network monitoring: sinkhole or pcap collection (Wireshark, Zeek)
* Disk/registry/memory telemetry: snapshot & memory dump tools (e.g., procdump, volatility)

### B. Sample Collection & Preprocessing

1. Collect SHA256 / metadata (source, date, sample ID).
2. Static analysis: strings, PE header, imported functions.
3. Dynamic analysis: network URIs, created files, registry changes.
4. Memory dump: extract in-memory strings, injects, packed payloads.

### C. Rule Creation

* **YARA:** Target static strings and byte patterns. Test with `yarac`/`yara`.
* **Sigma:** Normalize behavior patterns for log-based detection.
* **NO-ST (JSON):** Store API calls, registry, open files, network telemetry; match via BehaviorBasedDetection.ps1.

### D. Rule Validation

* Validate on positive samples.
* Test against benign software to avoid false positives.
* Adjust Jaccard / similarity thresholds using ROC-style analysis for optimal detection.

### E. Automation & CI

* Run automatic tests per PR: known malicious + benign test corpus.
* Ensure new signatures produce expected findings in unit tests.

### F. Data Sharing

* Share C2, SHA, and rule metadata in anonymized, ethically compliant formats.
* Submit structured JSON/YARA/Sigma to AV vendors or open intel platforms.

---

# 8. Configuration & Example Snippets

### Example NO-ST Rule (JSON)

```json
{
  "id": "no-st-0001",
  "family": "RedLine",
  "apicalls": ["CreateFileA", "WriteFile", "RegSetValueExA"],
  "writtenfiles": ["C:\\Users\\%USERNAME%\\AppData\\Roaming\\*\\logs.dat"],
  "registry": ["HKCU\\Software\\*\\Config"],
  "openfiles": ["C:\\Users\\%USERNAME%\\AppData\\Roaming\\*\\cookies"],
  "notes": "Behavioral rule from memory-sample-2025-09-12"
}
```

### Example Behavior Rule (YAML)

```yaml
family: Myth
commandlines:
  - "-steal -exfil -cfg"
writtenfiles:
  - "%APPDATA%\\Myth\\cache.dat"
registry:
  - "HKCU\\Software\\MythSec\\*"
apicalls:
  - "InternetOpenUrlA"
network:
  - host: "malicious.example.com"
    port: 443
```

---

# 9. Understanding Reports

Each finding JSON object includes:

* `Module` — Detection module (HashBased, StaticSimilarity, MemoryScan, NetworkC2, NetworkBehavior, BehaviorExact, BehaviorJaccard)
* `Risk` — `Confirmed`, `Confirmed-C2`, `High`, `Medium`, `Low`, `Potential-Stealer`, `Clean`
* `Path`, `PID`, `ProcessName`, `MatchCount`, `Similarity/JaccardScore` — Detection details
* `DominantFamily` / `MatchFamily` — Family classification

**Recommendation:** Prioritize `Confirmed`/`Confirmed-C2`; investigate `Potential-Stealer` or `High` risk.

---

# 10. Best Practices & Security Recommendations

* **Isolated environment:** Run all analyses in VMs; protect host system.
* **Network control:** Use sinkhole or virtual networks; block real C2 connections.
* **Snapshot & rollback:** Take snapshots before experiments.
* **Versioning:** Track versions, sources, and references for samples and rules.
* **Test corpus:** Maintain extensive benign/malicious datasets to evaluate false positives.
* **Update & automate:** Periodically update signature/C2 lists and run CI tests.

---

# 11. Ethical & Legal Notices

* Use **only** for permitted research and analysis.
* Unauthorized use on live networks or third-party systems is illegal.
* Share IoC/C2 data in anonymized, legal-compliant ways.
* Respect privacy when sharing rules or telemetry.

---

# 12. Contributing & Versioning

* Fork → branch → make changes → PR
* Include sample metadata, test results, and references when adding new signatures/rules.
* Maintain a `CONTRIBUTING.md` with test instructions and ethical guidelines.

---

# 13. FAQ

**Q: How to reduce false positives?**
A: Narrow YARA/Sigma patterns, tune Jaccard weights and thresholds, require multiple NO-ST matches.

**Q: What to do with a new stealer sample?**
A: Analyze in isolated VM → write YARA/NO-ST rule → test → PR to repo → notify AV vendors if coordinated disclosure required.

**Q: What thresholds are recommended?**
A: Code defaults: Jaccard similarity ≥0.3 (behavior), static similarity thresholds: 0.01/0.03/0.06/0.08 (low→potential). Optimize for your dataset.

---

# 14. Acknowledgements

Thanks to all contributors and friends who assisted with analysis and reverse engineering. This project originates from stealer, cheat, and mod analyses and is shared for the benefit of the security research community.

---

