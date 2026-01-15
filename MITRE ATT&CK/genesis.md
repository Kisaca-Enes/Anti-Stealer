MITRE ATT&CK – Genesis Stealer
Overview

Genesis Stealer is an information-stealing malware targeting Windows systems.
It focuses on harvesting browser credentials, crypto wallets, Wi‑Fi passwords, gaming accounts, system reconnaissance data, and exfiltrating collected data via external services such as Discord webhooks and file‑hosting APIs.

Tactics & Techniques Mapping
🟦 Initial Access

Not directly observed
Genesis Stealer is typically delivered via loaders, cracked software, or malicious downloads.

🟧 Execution

T1059.007 – Command and Scripting Interpreter: JavaScript

Uses Node.js to execute malicious JavaScript code.

Relies on Node runtime to interact with filesystem, network, and OS commands.

🟨 Persistence

Not implemented
Genesis Stealer does not establish persistence by default.

🟥 Privilege Escalation

Not observed

🟪 Defense Evasion

T1036 – Masquerading

Uses legitimate process names such as node.exe.

T1057 – Process Discovery (Indirect)

Enumerates running processes to avoid conflicts with browsers.

🟩 Credential Access

T1555.003 – Credentials from Web Browsers

Extracts saved passwords, cookies, autofill data from Chromium-based browsers.

Decrypts credentials using Windows DPAPI and AES-GCM.

T1552.001 – Unsecured Credentials

Dumps Wi‑Fi passwords using:

netsh wlan show profile name="<SSID>" key=clear


T1555 – Credentials from Password Stores

Harvests browser-stored authentication data.

🟫 Discovery

T1082 – System Information Discovery

Collects OS version, architecture, uptime.

T1083 – File and Directory Discovery

Enumerates browser profiles and application directories.

T1124 – System Time Discovery

Uses system uptime and timestamps for reporting.

T1016 – Network Configuration Discovery

Enumerates network interfaces, IP addresses, MAC addresses.

T1518 – Software Discovery

Enumerates installed software via registry queries.

🟦 Collection

T1005 – Data from Local System

Collects:

Browser data

Crypto wallet files

Telegram session data

Minecraft & Lunar Client accounts

System and hardware information

T1114 – Email Collection (Indirect)

Via browser credential harvesting.

🟪 Exfiltration

T1041 – Exfiltration Over C2 Channel

Exfiltrates data via:

Discord webhooks

GoFile API uploads

T1567.002 – Exfiltration to Cloud Storage

Uses public file‑hosting services for payload and data transfer.

🟥 Command and Control

T1071.001 – Application Layer Protocol: Web Protocols

Uses HTTP/HTTPS for:

IP geolocation

Webhook communication

File uploads

Summary Table
Tactic	Technique ID	Technique Name
Execution	T1059.007	JavaScript
Credential Access	T1555.003	Browser Credentials
Credential Access	T1552.001	Cleartext Wi‑Fi Passwords
Discovery	T1082	System Info Discovery
Discovery	T1016	Network Discovery
Collection	T1005	Data from Local System
Exfiltration	T1041	Exfiltration Over C2
Exfiltration	T1567.002	Cloud Storage Exfiltration
C2	T1071.001	Web Protocols
Analyst Notes

Genesis Stealer is highly modular and focused on mass data theft rather than persistence.

Detection should prioritize:

NodeJS + browser database access

netsh key=clear

Discord webhook traffic from non-browser processes
