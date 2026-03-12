"""
Anti-Stealer Pro  –  Flask backend
"""
from flask import Flask, render_template_string, jsonify, request, send_from_directory
import subprocess, json, os, glob, uuid, time, re, threading, math
from datetime import datetime
from pathlib import Path

app = Flask(__name__)

BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
TELEMETRY_PATH  = os.path.join(BASE_DIR, "telemetery")
LOGS_PATH       = os.path.join(TELEMETRY_PATH, "logs")
QUARANTINE_PATH = os.path.join(TELEMETRY_PATH, "quarantine")
YARA_DIR        = os.path.join(BASE_DIR, "yaras")
STATIC_PATH     = os.path.join(BASE_DIR, "static")
NETWORK_JSON    = os.path.join(TELEMETRY_PATH, "network.json")

for d in [TELEMETRY_PATH, LOGS_PATH, QUARANTINE_PATH, YARA_DIR, STATIC_PATH]:
    os.makedirs(d, exist_ok=True)

# ── process registry ──────────────────────────────────────────────────────────
processes: dict = {}   # job_id -> {proc, script, start, log, scan_type, meta}
START_TIME = time.time()

# ── known malicious PS patterns ───────────────────────────────────────────────
MALICIOUS_PS_PATTERNS = [
    r"IEX\s*\(", r"Invoke-Expression", r"DownloadString",
    r"Net\.WebClient", r"-EncodedCommand", r"FromBase64String",
    r"Invoke-Mimikatz", r"Invoke-ReflectivePEInjection",
    r"AmsiUtils", r"amsiInitFailed", r"BypassUAC",
    r"sc\.exe\s+create", r"reg\s+add.*Run",
    r"powershell\s+-w\s+hidden", r"Start-Process.*-WindowStyle\s+Hidden",
    r"Get-Credential", r"ConvertTo-SecureString.*AsPlainText",
    r"Invoke-WmiMethod", r"Get-WmiObject.*Win32_Process",
    r"tasklist\s*/FI", r"net\s+user\s+.*\/add",
    r"netsh\s+advfirewall", r"schtasks.*\/create",
    r"certutil.*-decode", r"mshta\s+http",
]

# ── estimated durations (seconds) per scan type ───────────────────────────────
SCAN_DURATIONS = {
    "quick_scan":   45,
    "full_scan":    300,
    "scan_yara":    120,
    "scan_network": 60,
    "custom_scan":  90,
}

ALLOWED_SCRIPTS = {
    "quick_scan":   "program.ps1",
    "full_scan":    "full.ps1",
    "scan_yara":    "yara_scan.ps1",
    "scan_network": "network.ps1",
    "custom_scan":  "custom.ps1",
}

# ═══════════════════════════════════════════════════════════════════════════════
#  HTML TEMPLATE
# ═══════════════════════════════════════════════════════════════════════════════
HTML = r"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Anti-Stealer Pro</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
:root{
  --bg:#09090c;--bg2:#0f1014;--bg3:#14161c;--surf:#1a1d25;--surf2:#1f2230;
  --border:rgba(255,255,255,.07);--teal:#00e5c3;--teal2:rgba(0,229,195,.12);
  --red:#ff4455;--red2:rgba(255,68,85,.13);--amber:#ffaa00;--amb2:rgba(255,170,0,.12);
  --blue:#4da6ff;--blu2:rgba(77,166,255,.12);--purple:#a855f7;--pur2:rgba(168,85,247,.12);
  --text:#dde3ef;--muted:#505878;--sw:220px;--r:9px;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Syne',sans-serif;background:var(--bg);color:var(--text);display:flex;height:100vh;overflow:hidden}

/* ── sidebar ── */
.sb{width:var(--sw);background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;z-index:20}
.sb-logo{padding:18px 16px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)}
.sb-logo-icon{width:32px;height:32px;background:var(--teal2);border:1px solid rgba(0,229,195,.3);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--teal);font-size:.9rem}
.sb-logo-text{font-size:.95rem;font-weight:800;color:var(--teal);letter-spacing:.3px}
.sb-logo-sub{font-size:.62rem;color:var(--muted);font-family:'JetBrains Mono',monospace}
.sb-sec{padding:14px 12px 3px;font-size:.62rem;font-weight:700;color:var(--muted);letter-spacing:1.8px;text-transform:uppercase;font-family:'JetBrains Mono',monospace}
.ni{margin:1px 6px;padding:9px 10px;border-radius:6px;display:flex;align-items:center;gap:9px;font-size:.82rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all .15s;white-space:nowrap}
.ni i{width:16px;text-align:center;font-size:.8rem;flex-shrink:0}
.ni:hover{background:rgba(255,255,255,.04);color:var(--text)}
.ni.active{background:var(--teal2);color:var(--teal)}
.ni .bdg{margin-left:auto;background:var(--red);color:#fff;font-size:.6rem;font-weight:700;padding:2px 5px;border-radius:20px;font-family:'JetBrains Mono',monospace}
.sb-foot{padding:12px 14px;border-top:1px solid var(--border);font-size:.68rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:auto}
.sb-foot b{color:var(--teal)}

/* ── main ── */
.main{flex:1;overflow-y:auto;padding:20px 26px 40px;display:flex;flex-direction:column;gap:16px;min-width:0}

/* ── topbar ── */
.topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.tb-title{font-size:1.2rem;font-weight:800}
.tb-sub{font-size:.72rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:2px}
.tb-right{display:flex;gap:8px;align-items:center}
.btn{padding:8px 14px;border-radius:6px;border:1px solid var(--border);background:var(--surf);color:var(--text);font-family:'Syne',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn:hover{border-color:rgba(255,255,255,.15);background:var(--surf2)}
.btn.primary{background:var(--teal);color:#000;border-color:var(--teal)}
.btn.primary:hover{background:#00c9ab}
.btn.danger{background:var(--red2);border-color:var(--red);color:var(--red)}
.btn.sm{padding:5px 10px;font-size:.72rem}

/* ── hero ── */
.hero{background:linear-gradient(135deg,#0c1e1c 0%,#0f1014 70%,#09090c 100%);border:1px solid rgba(0,229,195,.15);border-radius:var(--r);padding:26px 200px 26px 26px;position:relative;overflow:hidden;min-height:130px}
.hero::before{content:'';position:absolute;top:-50px;right:130px;width:200px;height:200px;background:radial-gradient(circle,rgba(0,229,195,.06) 0%,transparent 70%);pointer-events:none}
.hero-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,229,195,.08);border:1px solid rgba(0,229,195,.2);border-radius:20px;padding:4px 10px;font-size:.68rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
.hero-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite}
.hero h1{font-size:1.5rem;font-weight:800;margin-bottom:6px}
.hero p{font-size:.82rem;color:var(--muted);line-height:1.5}
.samurai{position:absolute;right:0;top:0;bottom:0;width:185px;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;filter:drop-shadow(0 0 18px rgba(0,229,195,.18))}
.samurai img{height:130px;object-fit:contain}

@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,195,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,195,0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes scan-line{0%{transform:translateY(-100%)}100%{transform:translateY(400px)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes ripple{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.5);opacity:0}}
@keyframes network-pulse{0%{r:6;opacity:1}100%{r:18;opacity:0}}

/* ── stat cards ── */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.sc{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;position:relative;overflow:hidden;min-width:0}
.sc-ico{font-size:1rem;margin-bottom:8px;color:var(--teal)}
.sc-val{font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sc-lbl{font-size:.72rem;color:var(--muted);margin-top:3px;font-weight:600}
.sc.red .sc-ico,.sc.red .sc-val{color:var(--red)}
.sc.amb .sc-ico,.sc.amb .sc-val{color:var(--amber)}
.sc.blue .sc-ico,.sc.blue .sc-val{color:var(--blue)}
.sc-bar{position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--teal2)}
.sc-bar-f{height:100%;background:var(--teal);border-radius:2px;transition:width .6s ease}
.sc.red .sc-bar{background:var(--red2)}.sc.red .sc-bar-f{background:var(--red)}
.sc.amb .sc-bar{background:var(--amb2)}.sc.amb .sc-bar-f{background:var(--amber)}
.sc.blue .sc-bar{background:var(--blu2)}.sc.blue .sc-bar-f{background:var(--blue)}

/* ── section header ── */
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.sh h3{font-size:.88rem;font-weight:700;display:flex;align-items:center;gap:7px}
.sh h3 i{color:var(--teal);font-size:.8rem}

/* ── action cards grid ── */
.ag{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}
.ac{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:14px;cursor:pointer;transition:all .18s;min-width:0}
.ac:hover{border-color:var(--teal);background:var(--surf2);transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.4)}
.ac-ico{width:34px;height:34px;border-radius:7px;background:var(--teal2);color:var(--teal);display:flex;align-items:center;justify-content:center;font-size:.9rem;margin-bottom:10px}
.ac h4{font-size:.82rem;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ac p{font-size:.72rem;color:var(--muted);line-height:1.35}

/* ── table ── */
.tw{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.tw-scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse}
thead th{background:rgba(255,255,255,.02);padding:10px 14px;text-align:left;font-size:.65rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-family:'JetBrains Mono',monospace;white-space:nowrap}
tbody td{padding:10px 14px;font-size:.8rem;border-top:1px solid var(--border);vertical-align:middle}
tbody tr:hover{background:rgba(255,255,255,.02)}
.tag{display:inline-block;padding:2px 7px;border-radius:3px;font-size:.67rem;font-weight:700;background:var(--red2);color:var(--red);font-family:'JetBrains Mono',monospace}
.tag.g{background:rgba(0,229,195,.1);color:var(--teal)}
.tag.a{background:var(--amb2);color:var(--amber)}
.tag.b{background:var(--blu2);color:var(--blue)}
.tag.p{background:var(--pur2);color:var(--purple)}

/* ── log viewer ── */
.logv{background:#07080b;border:1px solid var(--border);border-radius:var(--r);font-family:'JetBrains Mono',monospace;font-size:.72rem;color:#6fcfa0;padding:12px 14px;height:180px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;line-height:1.55}
.logv .le{color:var(--red)}.logv .lw{color:var(--amber)}.logv .li{color:var(--blue)}

/* ══════════════════════════════════════
   SCAN PAGES  (per-scan UI)
══════════════════════════════════════ */
.scan-page{animation:fadeIn .3s ease}
.scan-layout{display:grid;grid-template-columns:360px 1fr;gap:16px;align-items:start}
.scan-config{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.scan-config-head{padding:16px 18px 12px;border-bottom:1px solid var(--border)}
.scan-config-head h3{font-size:.95rem;font-weight:800;display:flex;align-items:center;gap:8px}
.scan-config-head h3 i{color:var(--teal)}
.scan-config-head p{font-size:.75rem;color:var(--muted);margin-top:3px}
.scan-config-body{padding:16px 18px}

.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:.75rem;font-weight:700;color:var(--muted);margin-bottom:6px;letter-spacing:.3px}
.form-group .inp{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:9px 12px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:.8rem;transition:border .15s}
.form-group .inp:focus{outline:none;border-color:rgba(0,229,195,.4)}
.form-group .inp::placeholder{color:var(--muted)}
.form-group select.inp{cursor:pointer}

.file-pick{display:flex;gap:8px}
.file-pick .inp{flex:1}
.yara-list{max-height:140px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;background:var(--bg3)}
.yara-item{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-bottom:1px solid var(--border);font-size:.75rem;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:background .1s}
.yara-item:last-child{border-bottom:none}
.yara-item:hover{background:rgba(255,255,255,.03)}
.yara-item.sel{background:var(--teal2);color:var(--teal)}
.yara-item .yara-ico{color:var(--teal);font-size:.7rem}

/* ── scan progress panel ── */
.scan-panel{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.scan-panel-head{padding:16px 18px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.scan-panel-head h3{font-size:.9rem;font-weight:800}
.scan-status-badge{display:inline-flex;align-items:center;gap:6px;font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:20px;background:var(--teal2);color:var(--teal)}
.scan-status-badge.running{animation:blink 1.5s infinite}
.scan-status-badge.idle{background:rgba(255,255,255,.05);color:var(--muted)}
.scan-status-badge.error{background:var(--red2);color:var(--red)}
.scan-panel-body{padding:16px 18px}

/* progress bar */
.prog-wrap{margin-bottom:12px}
.prog-track{height:8px;background:rgba(255,255,255,.04);border-radius:10px;overflow:hidden;position:relative}
.prog-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--teal),#00aaff);border-radius:10px;transition:width .4s ease;position:relative}
.prog-fill::after{content:'';position:absolute;top:0;right:0;bottom:0;width:40px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3));animation:blink 1s infinite}
.prog-meta{display:flex;justify-content:space-between;font-size:.7rem;color:var(--muted);margin-top:5px;font-family:'JetBrains Mono',monospace}

/* time estimate */
.time-row{display:flex;gap:10px;margin-bottom:12px}
.time-box{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 10px;text-align:center}
.time-box .tv{font-size:1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--teal)}
.time-box .tl{font-size:.62rem;color:var(--muted);margin-top:2px}

/* yara results */
.yara-results{margin-top:12px}
.yara-match{background:var(--bg3);border:1px solid var(--red);border-radius:6px;padding:10px 12px;margin-bottom:8px;animation:fadeIn .3s ease}
.yara-match-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.yara-match-rule{font-size:.78rem;font-weight:700;color:var(--red);font-family:'JetBrains Mono',monospace}
.yara-match-file{font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono',monospace}
.yara-strings{margin-top:6px}
.yara-string{font-size:.68rem;font-family:'JetBrains Mono',monospace;color:var(--amber);background:rgba(255,170,0,.07);padding:2px 6px;border-radius:3px;display:inline-block;margin:2px}

/* network animation */
.net-anim{position:relative;width:100%;height:200px;background:var(--bg3);border-radius:var(--r);overflow:hidden;margin-bottom:12px}
.net-anim svg{width:100%;height:100%}
.net-label{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:.7rem;color:var(--teal);font-family:'JetBrains Mono',monospace;animation:blink 1.5s infinite;white-space:nowrap}

/* c2 results */
.c2-item{background:var(--bg3);border:1px solid var(--red);border-radius:6px;padding:10px 12px;margin-bottom:8px;animation:fadeIn .3s ease}
.c2-item.warn{border-color:var(--amber)}
.c2-ip{font-size:.82rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--red)}
.c2-item.warn .c2-ip{color:var(--amber)}
.c2-meta{font-size:.7rem;color:var(--muted);margin-top:3px;font-family:'JetBrains Mono',monospace}

/* full scan animation */
.full-anim{position:relative;width:100%;height:160px;background:var(--bg3);border-radius:var(--r);overflow:hidden;margin-bottom:12px;display:flex;align-items:center;justify-content:center}
.full-rings{position:relative;width:100px;height:100px}
.full-ring{position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:var(--teal)}
.full-ring:nth-child(1){animation:spin .9s linear infinite}
.full-ring:nth-child(2){inset:12px;border-top-color:rgba(0,229,195,.5);animation:spin 1.4s linear infinite reverse}
.full-ring:nth-child(3){inset:24px;border-top-color:rgba(0,229,195,.25);animation:spin 2s linear infinite}
.full-ring-core{position:absolute;inset:36px;background:var(--teal2);border-radius:50%;border:1px solid rgba(0,229,195,.3);display:flex;align-items:center;justify-content:center;font-size:.8rem;color:var(--teal)}
.full-scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--teal),transparent);opacity:.6;animation:scan-line 2s linear infinite}

/* quick scan animation */
.quick-anim{position:relative;width:100%;height:120px;background:var(--bg3);border-radius:var(--r);overflow:hidden;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:12px}
.quick-bar-wrap{display:flex;gap:4px;align-items:flex-end;height:60px}
.q-bar{width:8px;background:var(--teal);border-radius:3px 3px 0 0;opacity:.7}
.q-bar:nth-child(1){animation:qbar 1.1s ease infinite .0s}
.q-bar:nth-child(2){animation:qbar 1.1s ease infinite .1s}
.q-bar:nth-child(3){animation:qbar 1.1s ease infinite .2s}
.q-bar:nth-child(4){animation:qbar 1.1s ease infinite .3s}
.q-bar:nth-child(5){animation:qbar 1.1s ease infinite .4s}
.q-bar:nth-child(6){animation:qbar 1.1s ease infinite .5s}
@keyframes qbar{0%,100%{height:10px;opacity:.4}50%{height:50px;opacity:1}}

/* windows logs */
.wlog-item{background:var(--bg3);border-left:3px solid var(--border);border-radius:0 6px 6px 0;padding:9px 12px;margin-bottom:7px;animation:fadeIn .25s ease}
.wlog-item.crit{border-left-color:var(--red);background:rgba(255,68,85,.04)}
.wlog-item.warn{border-left-color:var(--amber);background:rgba(255,170,0,.04)}
.wlog-item.info{border-left-color:var(--blue);background:rgba(77,166,255,.04)}
.wlog-head{display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap}
.wlog-evid{font-size:.67rem;font-family:'JetBrains Mono',monospace;color:var(--muted)}
.wlog-time{font-size:.67rem;font-family:'JetBrains Mono',monospace;color:var(--muted);margin-left:auto}
.wlog-msg{font-size:.78rem;line-height:1.4;color:var(--text)}
.wlog-src{font-size:.67rem;color:var(--muted);margin-top:3px}

/* malicious PS comparison */
.ps-match{background:var(--bg3);border:1px solid rgba(255,170,0,.3);border-radius:6px;padding:10px 12px;margin-bottom:8px;animation:fadeIn .3s ease}
.ps-match-pat{font-size:.73rem;font-weight:700;color:var(--amber);font-family:'JetBrains Mono',monospace}
.ps-match-ctx{font-size:.7rem;color:var(--muted);margin-top:4px;font-family:'JetBrains Mono',monospace;word-break:break-all}
.ps-match-line{font-size:.65rem;color:var(--muted);margin-top:2px}

/* empty state */
.empty{text-align:center;padding:50px 20px;color:var(--muted)}
.empty i{font-size:2rem;color:var(--teal);display:block;margin-bottom:12px;opacity:.6}
.empty h4{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:5px}
.empty p{font-size:.8rem;line-height:1.4}

/* scrollbar */
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#1e2130;border-radius:10px}

/* responsive */
@media(max-width:1200px){.scan-layout{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.ag{grid-template-columns:repeat(3,1fr)}}
@media(max-width:860px){.sb{display:none}.body{overflow:auto}.stats{grid-template-columns:repeat(2,1fr)}.ag{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>

<!-- ═══ SIDEBAR ═══ -->
<aside class="sb">
  <div class="sb-logo">
    <div class="sb-logo-icon"><i class="fas fa-user-ninja"></i></div>
    <div>
      <div class="sb-logo-text">ANTI-STEALER</div>
      <div class="sb-logo-sub">Defense Pro v2.1</div>
    </div>
  </div>

  <div class="sb-sec">Genel</div>
  <div class="ni {% if page=='home' %}active{% endif %}" onclick="nav('/')"><i class="fas fa-th-large"></i> Genel Bakış</div>
  <div class="ni {% if page=='threats' %}active{% endif %}" onclick="nav('/threats')"><i class="fas fa-skull-crossbones"></i> Tehdit Merkezi{% if threat_count %}<span class="bdg">{{threat_count}}</span>{% endif %}</div>
  <div class="ni {% if page=='logs' %}active{% endif %}" onclick="nav('/logs')"><i class="fas fa-terminal"></i> Log İzleyici</div>
  <div class="ni {% if page=='winlogs' %}active{% endif %}" onclick="nav('/winlogs')"><i class="fas fa-windows"></i> Windows Logları</div>
  <div class="ni {% if page=='psscan' %}active{% endif %}" onclick="nav('/psscan')"><i class="fas fa-code"></i> PS Analizi</div>

  <div class="sb-sec">Tarama</div>
  <div class="ni {% if page=='quick' %}active{% endif %}" onclick="nav('/scan/quick')"><i class="fas fa-bolt-lightning"></i> Hızlı Tarama</div>
  <div class="ni {% if page=='yara' %}active{% endif %}" onclick="nav('/scan/yara')"><i class="fas fa-microchip"></i> YARA Motoru</div>
  <div class="ni {% if page=='network' %}active{% endif %}" onclick="nav('/scan/network')"><i class="fas fa-network-wired"></i> Ağ Taraması</div>
  <div class="ni {% if page=='full' %}active{% endif %}" onclick="nav('/scan/full')"><i class="fas fa-shield-heart"></i> Tam Koruma</div>
  <div class="ni {% if page=='custom' %}active{% endif %}" onclick="nav('/scan/custom')"><i class="fas fa-bullseye"></i> Özel Tarama</div>

  <div class="sb-foot"><b>{{db_date}}</b> · DB güncel</div>
</aside>

<!-- ═══ MAIN ═══ -->
<main class="main">

{% if page == 'home' %}
<!-- ════ HOME ════ -->
<div class="topbar">
  <div><div class="tb-title">Genel Bakış</div><div class="tb-sub">{{now}}</div></div>
  <div class="tb-right">
    <button class="btn" onclick="location.reload()"><i class="fas fa-rotate"></i> Yenile</button>
    <button class="btn primary" onclick="nav('/scan/quick')"><i class="fas fa-bolt-lightning"></i> Hızlı Tara</button>
  </div>
</div>

<div class="hero">
  <div class="hero-badge"><div class="dot"></div>Korumalı</div>
  <h1>Sistem Güvende</h1>
  <p>Samuray koruması aktif. Tüm modüller çalışıyor.</p>
  <div class="samurai"><img src="{{samurai_url}}" alt="Samurai"></div>
</div>

<div class="stats">
  <div class="sc"><div class="sc-ico"><i class="fas fa-shield-check"></i></div><div class="sc-val">{{stats.scans_today}}</div><div class="sc-lbl">Bugünkü Tarama</div><div class="sc-bar"><div class="sc-bar-f" style="width:{{[stats.scans_today*10,100]|min}}%"></div></div></div>
  <div class="sc red"><div class="sc-ico"><i class="fas fa-bug"></i></div><div class="sc-val">{{stats.threats}}</div><div class="sc-lbl">Tespit Edilen</div><div class="sc-bar"><div class="sc-bar-f" style="width:{{[stats.threats*5,100]|min}}%"></div></div></div>
  <div class="sc amb"><div class="sc-ico"><i class="fas fa-box-archive"></i></div><div class="sc-val">{{stats.quarantine}}</div><div class="sc-lbl">Karantina</div><div class="sc-bar"><div class="sc-bar-f" style="width:{{[stats.quarantine*10,100]|min}}%"></div></div></div>
  <div class="sc blue"><div class="sc-ico"><i class="fas fa-clock"></i></div><div class="sc-val">{{stats.uptime}}</div><div class="sc-lbl">Çalışma Süresi</div><div class="sc-bar"><div class="sc-bar-f" style="width:70%"></div></div></div>
</div>

<div>
  <div class="sh"><h3><i class="fas fa-bolt"></i> Tarama Modülleri</h3></div>
  <div class="ag">
    <div class="ac" onclick="nav('/scan/quick')"><div class="ac-ico"><i class="fas fa-gauge-high"></i></div><h4>Hızlı Tarama</h4><p>Kritik süreçleri analiz eder</p></div>
    <div class="ac" onclick="nav('/scan/yara')"><div class="ac-ico"><i class="fas fa-microchip"></i></div><h4>YARA Motoru</h4><p>Kural tabanlı tespit</p></div>
    <div class="ac" onclick="nav('/scan/network')"><div class="ac-ico"><i class="fas fa-network-wired"></i></div><h4>Ağ Analizi</h4><p>C2 & şüpheli bağlantı</p></div>
    <div class="ac" onclick="nav('/scan/full')"><div class="ac-ico"><i class="fas fa-shield-heart"></i></div><h4>Tam Koruma</h4><p>Derinlemesine tarama</p></div>
    <div class="ac" onclick="nav('/winlogs')"><div class="ac-ico"><i class="fas fa-windows"></i></div><h4>Win Logları</h4><p>Olay günlüğü analizi</p></div>
    <div class="ac" onclick="nav('/psscan')"><div class="ac-ico"><i class="fas fa-code"></i></div><h4>PS Analizi</h4><p>Kötü amaçlı komut tespiti</p></div>
  </div>
</div>

{% elif page == 'quick' %}
<!-- ════ QUICK SCAN ════ -->
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-bolt-lightning" style="color:var(--teal);margin-right:8px"></i>Hızlı Tarama</div><div class="tb-sub">Kritik sistem alanlarını hızlıca analiz eder</div></div>
  <div class="tb-right"><button class="btn" onclick="nav('/')"><i class="fas fa-arrow-left"></i> Geri</button></div>
</div>
<div class="scan-page">
<div class="scan-layout">
  <div class="scan-config">
    <div class="scan-config-head">
      <h3><i class="fas fa-sliders"></i> Tarama Ayarları</h3>
      <p>Hızlı analiz parametrelerini yapılandırın</p>
    </div>
    <div class="scan-config-body">
      <div class="form-group">
        <label>TARAMA HEDEFİ</label>
        <select class="inp" id="qTarget">
          <option value="processes">Aktif Süreçler</option>
          <option value="startup">Başlangıç Öğeleri</option>
          <option value="services">Windows Servisleri</option>
          <option value="all" selected>Tümü</option>
        </select>
      </div>
      <div class="form-group">
        <label>TARAMA DERİNLİĞİ</label>
        <select class="inp" id="qDepth">
          <option value="light">Hafif (15-20s)</option>
          <option value="normal" selected>Normal (30-50s)</option>
          <option value="deep">Derin (60-90s)</option>
        </select>
      </div>
      <div class="form-group">
        <label>ÇIKTI FORMATÜ</label>
        <select class="inp" id="qOutput">
          <option value="json">JSON (Telemetry)</option>
          <option value="txt">Plain Text</option>
        </select>
      </div>
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:6px" onclick="startScan('quick_scan','quick')">
        <i class="fas fa-play"></i> Taramayı Başlat
      </button>
    </div>
  </div>

  <div class="scan-panel">
    <div class="scan-panel-head">
      <h3>Tarama Durumu</h3>
      <span class="scan-status-badge idle" id="quick-badge"><i class="fas fa-circle"></i> Bekliyor</span>
    </div>
    <div class="scan-panel-body">
      <div class="quick-anim" id="quick-anim" style="display:none">
        <div class="quick-bar-wrap">
          <div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div>
          <div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div>
        </div>
        <div style="font-size:.75rem;color:var(--teal);font-family:'JetBrains Mono',monospace;animation:blink 1s infinite">Analiz ediliyor...</div>
      </div>
      <div class="time-row" id="quick-times" style="display:none">
        <div class="time-box"><div class="tv" id="q-elapsed">00:00</div><div class="tl">Geçen</div></div>
        <div class="time-box"><div class="tv" id="q-remain">--:--</div><div class="tl">Kalan (tahmini)</div></div>
        <div class="time-box"><div class="tv" id="q-eta">--:--</div><div class="tl">Bitiş ETA</div></div>
      </div>
      <div class="prog-wrap" id="quick-prog" style="display:none">
        <div class="prog-track"><div class="prog-fill" id="quick-fill"></div></div>
        <div class="prog-meta"><span id="quick-msg">—</span><span id="quick-pct">0%</span></div>
      </div>
      <div class="logv" id="quick-log" style="display:none"></div>
      <div id="quick-results"></div>
    </div>
  </div>
</div>
</div>

{% elif page == 'yara' %}
<!-- ════ YARA SCAN ════ -->
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-microchip" style="color:var(--teal);margin-right:8px"></i>YARA Motoru</div><div class="tb-sub">Kural tabanlı kötü amaçlı yazılım tespiti</div></div>
  <div class="tb-right"><button class="btn" onclick="nav('/')"><i class="fas fa-arrow-left"></i> Geri</button></div>
</div>
<div class="scan-page">
<div class="scan-layout">
  <div class="scan-config">
    <div class="scan-config-head">
      <h3><i class="fas fa-folder-open"></i> Tarama Yapılandırması</h3>
      <p>Klasör ve YARA kurallarını seçin</p>
    </div>
    <div class="scan-config-body">
      <div class="form-group">
        <label>TARANACAK KLASÖR</label>
        <div class="file-pick">
          <input type="text" class="inp" id="yaraTargetDir" placeholder="C:\Users\..." value="C:\Users">
          <button class="btn sm" onclick="browseFolder('yaraTargetDir')"><i class="fas fa-folder"></i></button>
        </div>
      </div>
      <div class="form-group">
        <label>YARA KURALLARI <span style="color:var(--muted);font-weight:400">(./yaras/*.yar)</span></label>
        <div class="yara-list" id="yaraRuleList">
          {% for yar in yara_rules %}
          <div class="yara-item" onclick="toggleYara(this,'{{yar}}')" data-rule="{{yar}}">
            <span><i class="fas fa-file-code yara-ico"></i> {{yar}}</span>
            <span class="tag g" style="display:none"><i class="fas fa-check"></i></span>
          </div>
          {% endfor %}
          {% if not yara_rules %}
          <div style="padding:12px;font-size:.75rem;color:var(--muted);text-align:center">./yaras/ klasöründe .yar dosyası bulunamadı</div>
          {% endif %}
        </div>
        <div style="margin-top:6px;font-size:.7rem;color:var(--muted)">Seçili: <b id="yaraSelCount" style="color:var(--teal)">0</b> kural</div>
      </div>
      <div class="form-group">
        <label>DOSYA UZANTILARI</label>
        <input type="text" class="inp" id="yaraExts" placeholder=".exe .dll .ps1 .bat" value=".exe .dll .ps1">
      </div>
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:4px" onclick="startScan('scan_yara','yara')">
        <i class="fas fa-play"></i> YARA Taramasını Başlat
      </button>
    </div>
  </div>

  <div class="scan-panel">
    <div class="scan-panel-head">
      <h3>YARA Tarama Durumu</h3>
      <span class="scan-status-badge idle" id="yara-badge"><i class="fas fa-circle"></i> Bekliyor</span>
    </div>
    <div class="scan-panel-body">
      <div class="time-row" id="yara-times" style="display:none">
        <div class="time-box"><div class="tv" id="y-elapsed">00:00</div><div class="tl">Geçen</div></div>
        <div class="time-box"><div class="tv" id="y-remain">--:--</div><div class="tl">Kalan (tahmini)</div></div>
        <div class="time-box"><div class="tv" id="y-cur-rule" style="font-size:.75rem">—</div><div class="tl">Mevcut Kural</div></div>
      </div>
      <div class="prog-wrap" id="yara-prog" style="display:none">
        <div class="prog-track"><div class="prog-fill" id="yara-fill"></div></div>
        <div class="prog-meta"><span id="yara-msg">—</span><span id="yara-pct">0%</span></div>
      </div>
      <div class="logv" id="yara-log" style="display:none"></div>
      <div id="yara-results">
        <div class="empty"><i class="fas fa-microchip"></i><h4>Henüz tarama yapılmadı</h4><p>Sol panelden klasör ve kuralları seçip taramayı başlatın.</p></div>
      </div>
    </div>
  </div>
</div>
</div>

{% elif page == 'network' %}
<!-- ════ NETWORK SCAN ════ -->
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-network-wired" style="color:var(--teal);margin-right:8px"></i>Ağ Taraması</div><div class="tb-sub">Aktif bağlantıları ve C2 sunucularını tespit eder</div></div>
  <div class="tb-right"><button class="btn" onclick="nav('/')"><i class="fas fa-arrow-left"></i> Geri</button></div>
</div>
<div class="scan-page">
<div class="scan-layout">
  <div class="scan-config">
    <div class="scan-config-head">
      <h3><i class="fas fa-satellite-dish"></i> Ağ Tarama Ayarları</h3>
      <p>Bağlantı analizi parametrelerini ayarlayın</p>
    </div>
    <div class="scan-config-body">
      <div class="form-group">
        <label>TARAMA MODU</label>
        <select class="inp" id="netMode">
          <option value="connections">Aktif Bağlantılar</option>
          <option value="dns">DNS Sorguları</option>
          <option value="full" selected>Tam Ağ Analizi</option>
        </select>
      </div>
      <div class="form-group">
        <label>C2 VERİTABANI</label>
        <select class="inp" id="netC2db">
          <option value="local" selected>Yerel Liste</option>
          <option value="threatfox">ThreatFox (çevrimiçi)</option>
        </select>
      </div>
      <div class="form-group">
        <label>ZAMAN AŞIMI (saniye)</label>
        <input type="number" class="inp" id="netTimeout" value="30" min="10" max="120">
      </div>
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:6px" onclick="startScan('scan_network','network')">
        <i class="fas fa-play"></i> Ağ Taramasını Başlat
      </button>
      {% if network_results %}
      <div style="margin-top:10px;padding:8px 10px;background:var(--bg3);border-radius:6px;font-size:.72rem;color:var(--muted);font-family:'JetBrains Mono',monospace">
        Son tarama: <b style="color:var(--teal)">{{network_results.scan_time}}</b>
      </div>
      {% endif %}
    </div>
  </div>

  <div class="scan-panel">
    <div class="scan-panel-head">
      <h3>Ağ Tarama Durumu</h3>
      <span class="scan-status-badge idle" id="network-badge"><i class="fas fa-circle"></i> Bekliyor</span>
    </div>
    <div class="scan-panel-body">
      <div class="net-anim" id="net-anim" style="display:none">
        <svg id="netSvg" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet"></svg>
        <div class="net-label">Ağ taranıyor — bağlantılar analiz ediliyor...</div>
      </div>
      <div class="time-row" id="network-times" style="display:none">
        <div class="time-box"><div class="tv" id="n-elapsed">00:00</div><div class="tl">Geçen</div></div>
        <div class="time-box"><div class="tv" id="n-remain">--:--</div><div class="tl">Kalan</div></div>
        <div class="time-box"><div class="tv" id="n-conns">0</div><div class="tl">Bağlantı</div></div>
      </div>
      <div class="prog-wrap" id="network-prog" style="display:none">
        <div class="prog-track"><div class="prog-fill" id="network-fill"></div></div>
        <div class="prog-meta"><span id="network-msg">—</span><span id="network-pct">0%</span></div>
      </div>
      <div class="logv" id="network-log" style="display:none"></div>
      <div id="network-results">
        {% if network_results and network_results.c2_hits %}
          <div class="sh" style="margin-top:8px"><h3><i class="fas fa-skull-crossbones" style="color:var(--red)"></i> Tespit Edilen C2 Bağlantıları</h3></div>
          {% for c in network_results.c2_hits %}
          <div class="c2-item"><div class="c2-ip">{{c.ip}} : {{c.port}}</div><div class="c2-meta">{{c.process}} · {{c.country}} · {{c.threat}}</div></div>
          {% endfor %}
        {% elif network_results %}
          <div class="empty"><i class="fas fa-shield-check"></i><h4>C2 Bağlantısı Bulunamadı</h4><p>Son tarama temiz çıktı.</p></div>
        {% else %}
          <div class="empty"><i class="fas fa-network-wired"></i><h4>Henüz tarama yapılmadı</h4><p>Ağ taramasını başlatın.</p></div>
        {% endif %}
      </div>
    </div>
  </div>
</div>
</div>

{% elif page == 'full' %}
<!-- ════ FULL SCAN ════ -->
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-shield-heart" style="color:var(--teal);margin-right:8px"></i>Tam Koruma</div><div class="tb-sub">Sistemi derinlemesine analiz eder</div></div>
  <div class="tb-right"><button class="btn" onclick="nav('/')"><i class="fas fa-arrow-left"></i> Geri</button></div>
</div>
<div class="scan-page">
<div class="scan-layout">
  <div class="scan-config">
    <div class="scan-config-head">
      <h3><i class="fas fa-shield-heart"></i> Tam Tarama Ayarları</h3>
      <p>Kapsamlı sistem analizini yapılandırın</p>
    </div>
    <div class="scan-config-body">
      <div class="form-group">
        <label>TARAMA KAPSAMİ</label>
        <select class="inp" id="fullScope" multiple style="height:100px">
          <option value="processes" selected>Süreçler</option>
          <option value="files" selected>Dosya Sistemi</option>
          <option value="registry" selected>Registry</option>
          <option value="network" selected>Ağ Bağlantıları</option>
          <option value="services" selected>Servisler</option>
        </select>
      </div>
      <div class="form-group">
        <label>TAHMİNİ SÜRE</label>
        <div style="background:var(--bg3);border-radius:6px;padding:10px;font-family:'JetBrains Mono',monospace;font-size:.78rem">
          <span style="color:var(--teal)">~4-6 dakika</span> <span style="color:var(--muted)">(sisteme göre değişir)</span>
        </div>
      </div>
      <div class="form-group">
        <label>ÇIKTI</label>
        <select class="inp" id="fullOutput">
          <option value="json" selected>JSON (./telemetery/)</option>
          <option value="html">HTML Rapor</option>
        </select>
      </div>
      <button class="btn primary" style="width:100%;justify-content:center;margin-top:6px" onclick="startScan('full_scan','full')">
        <i class="fas fa-play"></i> Tam Taramayı Başlat
      </button>
    </div>
  </div>

  <div class="scan-panel">
    <div class="scan-panel-head">
      <h3>Tam Tarama Durumu</h3>
      <span class="scan-status-badge idle" id="full-badge"><i class="fas fa-circle"></i> Bekliyor</span>
    </div>
    <div class="scan-panel-body">
      <div class="full-anim" id="full-anim" style="display:none">
        <div class="full-scan-line"></div>
        <div class="full-rings">
          <div class="full-ring"></div>
          <div class="full-ring"></div>
          <div class="full-ring"></div>
          <div class="full-ring-core"><i class="fas fa-shield"></i></div>
        </div>
      </div>
      <div class="time-row" id="full-times" style="display:none">
        <div class="time-box"><div class="tv" id="f-elapsed">00:00</div><div class="tl">Geçen</div></div>
        <div class="time-box"><div class="tv" id="f-remain">--:--</div><div class="tl">Kalan (tahmini)</div></div>
        <div class="time-box"><div class="tv" id="f-eta">--:--</div><div class="tl">Bitiş ETA</div></div>
      </div>
      <div class="prog-wrap" id="full-prog" style="display:none">
        <div class="prog-track"><div class="prog-fill" id="full-fill"></div></div>
        <div class="prog-meta"><span id="full-msg">—</span><span id="full-pct">0%</span></div>
      </div>
      <div style="margin-bottom:8px">
        <div id="full-phase-label" style="font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono',monospace;display:none"></div>
      </div>
      <div class="logv" id="full-log" style="display:none"></div>
    </div>
  </div>
</div>
</div>

{% elif page == 'winlogs' %}
<!-- ════ WINDOWS LOGS ════ -->
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-windows" style="color:var(--blue);margin-right:8px"></i>Windows Olay Günlüğü</div><div class="tb-sub">Son sistem olaylarını teknik özetle gösterir</div></div>
  <div class="tb-right">
    <select class="btn" id="wlogSource" onchange="loadWinLogs()" style="cursor:pointer">
      <option value="System">System</option>
      <option value="Security">Security</option>
      <option value="Application">Application</option>
      <option value="Microsoft-Windows-PowerShell/Operational">PowerShell</option>
    </select>
    <button class="btn primary" onclick="loadWinLogs()"><i class="fas fa-rotate"></i> Yükle</button>
  </div>
</div>

<div class="tw" style="margin-bottom:12px">
  <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;font-size:.75rem;color:var(--muted)">
    <i class="fas fa-filter" style="color:var(--teal)"></i>
    <span>Filtre:</span>
    <select class="btn sm" id="wlogLevel" style="border:none;background:transparent;cursor:pointer" onchange="filterWinLogs()">
      <option value="all">Tümü</option>
      <option value="crit">Kritik</option>
      <option value="warn">Uyarı</option>
      <option value="info">Bilgi</option>
    </select>
    <span id="wlogCount" style="margin-left:auto;font-family:'JetBrains Mono',monospace">0 olay</span>
  </div>
</div>

<div id="wlogContainer">
  <div class="empty"><i class="fas fa-windows"></i><h4>Windows Logları</h4><p>Kaynak seçin ve "Yükle" butonuna tıklayın.</p></div>
</div>

{% elif page == 'psscan' %}
<!-- ════ PS ANALYSIS ════ -->
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-code" style="color:var(--amber);margin-right:8px"></i>PowerShell Analizi</div><div class="tb-sub">Çalıştırılan PS komutlarını kötü amaçlı kalıplarla karşılaştırır</div></div>
  <div class="tb-right">
    <button class="btn" onclick="nav('/')"><i class="fas fa-arrow-left"></i> Geri</button>
    <button class="btn primary" onclick="runPsScan()"><i class="fas fa-search"></i> Analiz Et</button>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
  <div>
    <div class="sh"><h3><i class="fas fa-terminal"></i> PS Log Kaynakları</h3></div>
    <div class="scan-config" style="margin-bottom:12px">
      <div class="scan-config-body">
        <div class="form-group">
          <label>KAYNAK</label>
          <select class="inp" id="psSource">
            <option value="eventlog">Windows Olay Günlüğü (PS/Operational)</option>
            <option value="logfiles">./telemetery/logs/*.log</option>
            <option value="both" selected>Her İkisi</option>
          </select>
        </div>
        <div class="form-group">
          <label>SON KAYIT SAYISI</label>
          <input type="number" class="inp" id="psCount" value="500" min="50" max="5000">
        </div>
        <button class="btn primary" style="width:100%;justify-content:center" onclick="runPsScan()">
          <i class="fas fa-play"></i> Analizi Başlat
        </button>
      </div>
    </div>

    <div class="sh"><h3><i class="fas fa-list-check" style="color:var(--amber)"></i> Kötü Amaçlı Kalıplar</h3></div>
    <div class="tw"><div class="tw-scroll"><table>
      <thead><tr><th>#</th><th>Kalıp / Pattern</th><th>Risk</th></tr></thead>
      <tbody>
        {% for i, p in malicious_patterns %}
        <tr><td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--muted)">{{i+1}}</td>
            <td style="font-family:'JetBrains Mono',monospace;font-size:.72rem;color:var(--amber)">{{p}}</td>
            <td><span class="tag a">Yüksek</span></td></tr>
        {% endfor %}
      </tbody>
    </table></div></div>
  </div>

  <div>
    <div class="sh"><h3><i class="fas fa-triangle-exclamation" style="color:var(--red)"></i> Tespit Sonuçları</h3></div>
    <div id="psResults">
      <div class="empty"><i class="fas fa-code"></i><h4>Henüz analiz yapılmadı</h4><p>Sol panelden analizi başlatın.</p></div>
    </div>
  </div>
</div>

{% elif page == 'threats' %}
<!-- ════ THREATS ════ -->
<div class="topbar">
  <div><div class="tb-title">Tehdit Merkezi</div><div class="tb-sub">{{now}}</div></div>
  <div class="tb-right"><button class="btn" onclick="location.reload()"><i class="fas fa-rotate"></i> Yenile</button></div>
</div>
{% if threats %}
<div class="tw"><div class="tw-scroll"><table>
  <thead><tr><th>Dosya / Nesne</th><th>Tehdit Tipi</th><th>Tarih</th><th>Durum</th><th style="text-align:right">İşlem</th></tr></thead>
  <tbody>
    {% for t in threats %}<tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.75rem"><i class="far fa-file-code" style="color:var(--muted);margin-right:6px"></i>{{t.filename}}</td>
      <td><span class="tag">{{t.type}}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--muted)">{{t.date}}</td>
      <td><span class="tag g">Karantina</span></td>
      <td style="text-align:right"><button class="btn danger sm" onclick="delThreat('{{t.source}}')"><i class="fas fa-trash"></i> Sil</button></td>
    </tr>{% endfor %}
  </tbody>
</table></div></div>
{% else %}
<div class="empty"><i class="fas fa-shield-check"></i><h4>Tehdit Bulunamadı</h4><p>Tüm sistemler temiz.</p></div>
{% endif %}

{% elif page == 'logs' %}
<!-- ════ LOGS ════ -->
<div class="topbar">
  <div><div class="tb-title">Log İzleyici</div><div class="tb-sub">{{now}}</div></div>
  <div class="tb-right"><button class="btn" onclick="location.reload()"><i class="fas fa-rotate"></i> Yenile</button></div>
</div>
<div class="tw" style="margin-bottom:14px"><div class="tw-scroll"><table>
  <thead><tr><th>Log Dosyası</th><th>Tarih</th><th>Boyut</th><th style="text-align:right">Görüntüle</th></tr></thead>
  <tbody>
    {% for l in logs %}<tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.75rem"><i class="fas fa-file-lines" style="color:var(--muted);margin-right:6px"></i>{{l.name}}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--muted)">{{l.date}}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--muted)">{{l.size}}</td>
      <td style="text-align:right"><button class="btn sm" onclick="viewLog('{{l.path}}')"><i class="fas fa-eye"></i> Aç</button></td>
    </tr>{% endfor %}
  </tbody>
</table></div></div>
<div id="logPreviewWrap" style="display:none">
  <div class="sh"><h3><i class="fas fa-terminal"></i> <span id="logPreviewName"></span></h3></div>
  <div class="logv" id="logPreview" style="height:300px"></div>
</div>
{% endif %}

</main>

<script>
// ── utils ──────────────────────────────────────────────────────────────────
function nav(u){location.href=u}
function fmtTime(s){const m=Math.floor(s/60);return String(m).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0')}
function nowHHMM(){const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0')}

// ── active job state ───────────────────────────────────────────────────────
let activeJob=null, pollTimer=null, scanStartedAt=0, scanType='', estimatedDuration=45;

function startScan(action, uiKey){
  if(activeJob){alert('Zaten bir tarama çalışıyor.');return;}
  fetch('/api/run/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})})
    .then(r=>r.json())
    .then(d=>{
      if(d.success){
        activeJob=d.job_id;
        scanType=uiKey;
        scanStartedAt=Date.now();
        estimatedDuration=d.estimated||45;
        showScanUI(uiKey);
        pollTimer=setInterval(()=>poll(d.job_id,uiKey),900);
      } else alert('Başlatılamadı: '+(d.error||'?'));
    }).catch(e=>alert('Hata: '+e));
}

function showScanUI(k){
  const show=id=>{const el=document.getElementById(id);if(el)el.style.display='block'};
  const flex=id=>{const el=document.getElementById(id);if(el)el.style.display='flex'};
  setBadge(k,'running','Çalışıyor');
  if(k==='quick'){show('quick-anim');show('quick-times');show('quick-prog');show('quick-log')}
  if(k==='yara'){show('yara-times');show('yara-prog');show('yara-log');document.getElementById('yara-results').innerHTML=''}
  if(k==='network'){flex('net-anim');initNetAnim();show('network-times');show('network-prog');show('network-log');document.getElementById('network-results').innerHTML=''}
  if(k==='full'){flex('full-anim');show('full-times');show('full-prog');show('full-log');show('full-phase-label')}
}

function setBadge(k,state,txt){
  const el=document.getElementById(k+'-badge');
  if(!el)return;
  el.className='scan-status-badge '+state;
  el.innerHTML=(state==='running'?'<i class="fas fa-circle-notch fa-spin"></i> ':'<i class="fas fa-circle"></i> ')+txt;
}

function poll(jobId,uiKey){
  fetch('/api/status/'+jobId).then(r=>r.json()).then(j=>{
    const elapsed=(Date.now()-scanStartedAt)/1000;
    const remain=Math.max(0,estimatedDuration-elapsed);
    const pct=Math.min(97,Math.round((elapsed/estimatedDuration)*100));

    // update progress
    setPct(uiKey,j.running?pct:100);
    setMsg(uiKey,j.msg||'Çalışıyor...');

    // update time boxes
    setTime(uiKey,elapsed,remain);

    // append log
    if(j.log_tail)j.log_tail.forEach(l=>appendLog(uiKey,l));

    // YARA special: rule name
    if(uiKey==='yara'&&j.current_rule){
      const el=document.getElementById('y-cur-rule');
      if(el)el.textContent=j.current_rule;
    }

    // full scan phases
    if(uiKey==='full'){
      const phases=['Süreçler analiz ediliyor...','Registry taranıyor...','Dosya sistemi kontrol ediliyor...','Ağ bağlantıları inceleniyor...','Servisler kontrol ediliyor...','Rapor oluşturuluyor...'];
      const phaseIdx=Math.min(Math.floor((elapsed/estimatedDuration)*phases.length),phases.length-1);
      const el=document.getElementById('full-phase-label');
      if(el)el.textContent='▶ '+phases[phaseIdx];
    }

    if(!j.running){
      clearInterval(pollTimer);pollTimer=null;activeJob=null;
      setPct(uiKey,100);
      const ok=j.exit_code===0;
      setBadge(uiKey,ok?'idle':'error',ok?'Tamamlandı':'Hata');
      if(uiKey==='quick'||uiKey==='full'){const a=document.getElementById(uiKey+'-anim');if(a)a.style.display='none';}
      if(uiKey==='network'){const a=document.getElementById('net-anim');if(a)a.style.display='none';loadNetResults();}
      if(uiKey==='yara')loadYaraResults();
    }
  }).catch(e=>console.error(e));
}

function setPct(k,p){
  const f=document.getElementById(k+'-fill'),t=document.getElementById(k+'-pct');
  if(f)f.style.width=p+'%';if(t)t.textContent=p+'%';
}
function setMsg(k,m){const el=document.getElementById(k+'-msg');if(el)el.textContent=m;}
function setTime(k,el,rm){
  const pfx={quick:'q',yara:'y',network:'n',full:'f'}[k]||k[0];
  const e=document.getElementById(pfx+'-elapsed'),r=document.getElementById(pfx+'-remain');
  if(e)e.textContent=fmtTime(el);
  if(r)r.textContent=rm>0?fmtTime(rm):'00:00';
  const eta=document.getElementById(pfx+'-eta');
  if(eta){const d=new Date(Date.now()+rm*1000);eta.textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
}
function appendLog(k,line){
  const el=document.getElementById(k+'-log');
  if(!el)return;
  const cls=line.match(/error|hata|fail/i)?'le':line.match(/warn|uyar/i)?'lw':line.match(/info|\[i\]/i)?'li':'';
  el.innerHTML+=`<span class="${cls}">${escHtml(line)}</span>\n`;
  el.scrollTop=el.scrollHeight;
}
function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

// ── YARA UI ────────────────────────────────────────────────────────────────
let selectedYaraRules=[];
function toggleYara(el,rule){
  const idx=selectedYaraRules.indexOf(rule);
  if(idx>=0){selectedYaraRules.splice(idx,1);el.classList.remove('sel');el.querySelector('.tag').style.display='none';}
  else{selectedYaraRules.push(rule);el.classList.add('sel');el.querySelector('.tag').style.display='inline-block';}
  document.getElementById('yaraSelCount').textContent=selectedYaraRules.length;
}
function loadYaraResults(){
  fetch('/api/yara_results').then(r=>r.json()).then(d=>{
    const c=document.getElementById('yara-results');
    if(!d.matches||!d.matches.length){c.innerHTML='<div class="empty"><i class="fas fa-shield-check"></i><h4>Eşleşme Bulunamadı</h4><p>Tarama temiz çıktı.</p></div>';return;}
    c.innerHTML=`<div class="sh"><h3><i class="fas fa-exclamation-triangle" style="color:var(--red)"></i> ${d.matches.length} Eşleşme Bulundu</h3></div>`;
    d.matches.forEach(m=>{
      c.innerHTML+=`<div class="yara-match">
        <div class="yara-match-head">
          <span class="yara-match-rule"><i class="fas fa-bug"></i> ${escHtml(m.rule)}</span>
          <span class="tag">Kötü Amaçlı</span>
        </div>
        <div class="yara-match-file">${escHtml(m.file)}</div>
        <div class="yara-strings">${(m.strings||[]).map(s=>`<span class="yara-string">${escHtml(s)}</span>`).join('')}</div>
      </div>`;
    });
  });
}

// ── Network animation ──────────────────────────────────────────────────────
function initNetAnim(){
  const svg=document.getElementById('netSvg');
  if(!svg)return;
  svg.innerHTML='';
  const nodes=[{x:300,y:100,r:8,c:'#00e5c3',lbl:'HOST'}];
  for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2,r=70+Math.random()*30;nodes.push({x:300+Math.cos(a)*r*2.5,y:100+Math.sin(a)*r,r:4+Math.random()*3,c:Math.random()>.7?'#ff4455':'#4da6ff',lbl:''})}
  nodes.slice(1).forEach(n=>{
    const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
    ln.setAttribute('x1',300);ln.setAttribute('y1',100);ln.setAttribute('x2',n.x);ln.setAttribute('y2',n.y);
    ln.setAttribute('stroke','rgba(255,255,255,0.08)');ln.setAttribute('stroke-width','1');
    svg.appendChild(ln);
  });
  nodes.forEach((n,i)=>{
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    if(i===0){
      const pulse=document.createElementNS('http://www.w3.org/2000/svg','circle');
      pulse.setAttribute('cx',n.x);pulse.setAttribute('cy',n.y);pulse.setAttribute('r',n.r);
      pulse.setAttribute('fill','none');pulse.setAttribute('stroke',n.c);pulse.setAttribute('stroke-width','1.5');
      pulse.style.animation='network-pulse 1.5s ease-out infinite';
      g.appendChild(pulse);
    }
    const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',n.r);c.setAttribute('fill',n.c);c.setAttribute('opacity','0.85');
    g.appendChild(c);
    if(n.lbl){const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',n.x);t.setAttribute('y',n.y-12);t.setAttribute('text-anchor','middle');t.setAttribute('fill',n.c);t.setAttribute('font-size','8');t.setAttribute('font-family','JetBrains Mono,monospace');t.textContent=n.lbl;g.appendChild(t);}
    svg.appendChild(g);
  });
  // animate packets
  setInterval(()=>{
    const t=nodes[1+Math.floor(Math.random()*(nodes.length-1))];
    const p=document.createElementNS('http://www.w3.org/2000/svg','circle');
    p.setAttribute('cx',300);p.setAttribute('cy',100);p.setAttribute('r',2);p.setAttribute('fill','#00e5c3');p.setAttribute('opacity','0.8');
    svg.appendChild(p);
    let prog=0;const anim=setInterval(()=>{
      prog+=0.05;p.setAttribute('cx',300+(t.x-300)*prog);p.setAttribute('cy',100+(t.y-100)*prog);p.setAttribute('opacity',1-prog);
      if(prog>=1){clearInterval(anim);svg.removeChild(p);}
    },16);
  },300);
}

function loadNetResults(){
  fetch('/api/network_results').then(r=>r.json()).then(d=>{
    const c=document.getElementById('network-results');
    if(!d.c2_hits||!d.c2_hits.length){
      document.getElementById('n-conns').textContent=d.total_connections||0;
      c.innerHTML='<div class="empty"><i class="fas fa-shield-check"></i><h4>C2 Bağlantısı Bulunamadı</h4><p>Tüm bağlantılar temiz görünüyor.</p></div>';return;
    }
    c.innerHTML=`<div class="sh"><h3><i class="fas fa-skull-crossbones" style="color:var(--red)"></i> ${d.c2_hits.length} C2 Bağlantısı Tespit Edildi</h3></div>`;
    d.c2_hits.forEach(h=>{
      c.innerHTML+=`<div class="c2-item"><div class="c2-ip">${escHtml(h.ip)}:${escHtml(String(h.port))}</div><div class="c2-meta">${escHtml(h.process||'')} · ${escHtml(h.country||'')} · ${escHtml(h.threat||'')}</div></div>`;
    });
  });
}

// ── Windows logs ───────────────────────────────────────────────────────────
let allWinLogs=[];
function loadWinLogs(){
  const src=document.getElementById('wlogSource').value;
  document.getElementById('wlogContainer').innerHTML='<div class="empty"><i class="fas fa-spinner fa-spin"></i><h4>Yükleniyor...</h4></div>';
  fetch('/api/winlogs?source='+encodeURIComponent(src)).then(r=>r.json()).then(d=>{
    allWinLogs=d.logs||[];
    document.getElementById('wlogCount').textContent=allWinLogs.length+' olay';
    renderWinLogs(allWinLogs);
  }).catch(()=>{document.getElementById('wlogContainer').innerHTML='<div class="empty"><i class="fas fa-exclamation-triangle" style="color:var(--red)"></i><h4>Yüklenemedi</h4><p>Windows üzerinde çalıştığınızdan emin olun.</p></div>';});
}
function filterWinLogs(){
  const f=document.getElementById('wlogLevel').value;
  renderWinLogs(f==='all'?allWinLogs:allWinLogs.filter(l=>l.level===f));
}
function renderWinLogs(logs){
  const c=document.getElementById('wlogContainer');
  if(!logs.length){c.innerHTML='<div class="empty"><i class="fas fa-check"></i><h4>Kayıt Bulunamadı</h4></div>';return;}
  c.innerHTML=logs.slice(0,100).map(l=>`
    <div class="wlog-item ${l.level}">
      <div class="wlog-head">
        <span class="tag ${l.level==='crit'?'':'l'==='warn'?'a':'b'}">${l.level.toUpperCase()}</span>
        <span class="wlog-evid">Olay ${l.event_id}</span>
        <span style="font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${l.source}</span>
        <span class="wlog-time">${l.time}</span>
      </div>
      <div class="wlog-msg">${escHtml(l.message)}</div>
    </div>`).join('');
}

// ── PS analysis ─────────────────────────────────────────────────────────────
function runPsScan(){
  const src=document.getElementById('psSource').value;
  const cnt=document.getElementById('psCount').value;
  document.getElementById('psResults').innerHTML='<div class="empty"><i class="fas fa-spinner fa-spin"></i><h4>Analiz ediliyor...</h4></div>';
  fetch('/api/ps_analyze?source='+src+'&count='+cnt).then(r=>r.json()).then(d=>{
    const c=document.getElementById('psResults');
    if(!d.matches||!d.matches.length){c.innerHTML='<div class="empty"><i class="fas fa-shield-check"></i><h4>Kötü Amaçlı Kalıp Bulunamadı</h4><p>Analiz edilen loglar temiz görünüyor.</p></div>';return;}
    c.innerHTML=`<div class="sh"><h3><i class="fas fa-triangle-exclamation" style="color:var(--red)"></i> ${d.matches.length} Şüpheli Kalıp Tespit Edildi</h3></div>`;
    d.matches.forEach(m=>{
      c.innerHTML+=`<div class="ps-match">
        <div class="ps-match-pat"><i class="fas fa-exclamation-triangle"></i> ${escHtml(m.pattern)}</div>
        <div class="ps-match-ctx">${escHtml(m.context)}</div>
        <div class="ps-match-line">Kaynak: ${escHtml(m.source)} · Satır ${m.line}</div>
      </div>`;
    });
  });
}

// ── Threats & logs ──────────────────────────────────────────────────────────
function delThreat(src){
  if(!confirm('Bu tehdidi silmek istiyor musunuz?'))return;
  fetch('/api/delete_threat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:src})}).then(r=>r.json()).then(j=>{if(j.success)location.reload();else alert('Silinemedi: '+(j.error||'?'));});
}
function viewLog(path){
  fetch('/api/log_content?path='+encodeURIComponent(path)).then(r=>r.json()).then(j=>{
    const w=document.getElementById('logPreviewWrap'),p=document.getElementById('logPreview'),n=document.getElementById('logPreviewName');
    if(j.content!==undefined){p.textContent=j.content||'(boş)';w.style.display='block';n.textContent=path.split(/[\\/]/).pop();w.scrollIntoView({behavior:'smooth'});}
  });
}
function browseFolder(id){
  const p=prompt('Klasör yolunu girin:',document.getElementById(id).value||'C:\\');
  if(p)document.getElementById(id).value=p;
}
</script>
</body>
</html>
"""

# ═══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ═══════════════════════════════════════════════════════════════════════════════
def uptime_str():
    s = int(time.time() - START_TIME)
    h, m = divmod(s // 60, 60)
    return f"{h:02d}:{m:02d}"

def load_threats():
    out = []
    for fp in sorted(glob.glob(os.path.join(TELEMETRY_PATH, "*.json")), reverse=True):
        try:
            with open(fp, encoding="utf-8") as f:
                data = json.load(f)
            rows = data if isinstance(data, list) else [data]
            for item in rows:
                if isinstance(item, dict):
                    out.append({"filename": item.get("filename") or item.get("file") or os.path.basename(fp),
                                "type": item.get("type") or item.get("threat") or "Bilinmiyor",
                                "date": item.get("date") or datetime.utcfromtimestamp(os.path.getmtime(fp)).strftime("%d.%m.%Y %H:%M"),
                                "source": fp})
        except Exception:
            pass
    return out

def load_logs():
    out = []
    for fp in sorted(glob.glob(os.path.join(LOGS_PATH, "*.log")), reverse=True)[:50]:
        size = os.path.getsize(fp)
        out.append({"name": os.path.basename(fp),
                    "date": datetime.utcfromtimestamp(os.path.getmtime(fp)).strftime("%d.%m.%Y %H:%M"),
                    "size": f"{size/1024:.1f} KB" if size >= 1024 else f"{size} B",
                    "path": fp})
    return out

def load_yara_rules():
    return [os.path.basename(f) for f in glob.glob(os.path.join(YARA_DIR, "*.yar"))]

def load_network_results():
    if not os.path.exists(NETWORK_JSON):
        return None
    try:
        with open(NETWORK_JSON, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def render(page, **kw):
    threats = load_threats()
    common = dict(
        page=page,
        samurai_url="/static/samurai.png",
        threats=threats,
        threat_count=len(threats),
        logs=load_logs(),
        yara_rules=load_yara_rules(),
        network_results=load_network_results(),
        db_date=datetime.utcnow().strftime("%d.%m.%Y"),
        now=datetime.utcnow().strftime("%d.%m.%Y %H:%M:%S UTC"),
        malicious_patterns=list(enumerate(MALICIOUS_PS_PATTERNS)),
        stats=dict(
            scans_today=len([f for f in glob.glob(os.path.join(LOGS_PATH, "*.log"))
                             if datetime.utcfromtimestamp(os.path.getmtime(f)).date() == datetime.utcnow().date()]),
            threats=len(threats),
            quarantine=len(glob.glob(os.path.join(QUARANTINE_PATH, "*"))),
            uptime=uptime_str(),
        ),
    )
    common.update(kw)
    return render_template_string(HTML, **common)

# ═══════════════════════════════════════════════════════════════════════════════
#  Page routes
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/")
def index(): return render("home")

@app.route("/threats")
def view_threats(): return render("threats")

@app.route("/logs")
def view_logs(): return render("logs")

@app.route("/winlogs")
def view_winlogs(): return render("winlogs")

@app.route("/psscan")
def view_psscan(): return render("psscan")

@app.route("/scan/quick")
def scan_quick(): return render("quick")

@app.route("/scan/yara")
def scan_yara(): return render("yara")

@app.route("/scan/network")
def scan_network(): return render("network")

@app.route("/scan/full")
def scan_full(): return render("full")

@app.route("/scan/custom")
def scan_custom(): return render("custom")

# ═══════════════════════════════════════════════════════════════════════════════
#  API: run scan
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/run/<action>", methods=["POST"])
def api_run(action: str):
    script_name = ALLOWED_SCRIPTS.get(action)
    if not script_name:
        return jsonify(success=False, error="Geçersiz aksiyon")
    script_path = os.path.abspath(os.path.join(BASE_DIR, script_name))
    if not os.path.exists(script_path):
        return jsonify(success=False, error=f"Script bulunamadı: {script_name}")

    job_id    = str(uuid.uuid4())
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    log_file  = os.path.join(LOGS_PATH, f"{action}_{timestamp}_{job_id[:8]}.log")

    try:
        with open(log_file, "wb") as lf:
            proc = subprocess.Popen(
                ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script_path],
                stdout=lf, stderr=subprocess.STDOUT, shell=False,
            )
        processes[job_id] = dict(proc=proc, script=script_name, start=time.time(),
                                  log=log_file, scan_type=action)
        return jsonify(success=True, job_id=job_id, script=script_name,
                       estimated=SCAN_DURATIONS.get(action, 60))
    except Exception as e:
        return jsonify(success=False, error=str(e))

# ═══════════════════════════════════════════════════════════════════════════════
#  API: job status
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/status/<job_id>")
def api_status(job_id: str):
    info = processes.get(job_id)
    if not info:
        return jsonify(running=False, msg="Tamamlandı.", pct=100, exit_code=0)

    proc    = info["proc"]
    ret     = proc.poll()
    running = ret is None
    elapsed = time.time() - info["start"]
    est     = SCAN_DURATIONS.get(info["scan_type"], 60)
    pct     = int(min(97, (elapsed / est) * 100)) if running else 100
    msg     = f"Çalışıyor — {int(elapsed)}s" if running else f"Tamamlandı (çıkış: {ret})"

    # read last 8 lines of log
    log_tail = []
    try:
        with open(info["log"], "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
            log_tail = [l.rstrip() for l in lines[-8:]]
    except Exception:
        pass

    # try to detect current YARA rule from log
    current_rule = None
    if info["scan_type"] == "scan_yara" and log_tail:
        for line in reversed(log_tail):
            m = re.search(r"rule[:\s]+(\w+)", line, re.IGNORECASE)
            if m:
                current_rule = m.group(1)
                break

    if not running:
        try: del processes[job_id]
        except KeyError: pass

    return jsonify(running=running, pct=pct, msg=msg, exit_code=ret,
                   log_tail=log_tail, current_rule=current_rule)

# ═══════════════════════════════════════════════════════════════════════════════
#  API: kill
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/kill/<job_id>", methods=["POST"])
def api_kill(job_id: str):
    info = processes.get(job_id)
    if not info:
        return jsonify(success=False, error="İş bulunamadı.")
    try:
        info["proc"].terminate()
        time.sleep(0.3)
        if info["proc"].poll() is None: info["proc"].kill()
        del processes[job_id]
        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, error=str(e))

# ═══════════════════════════════════════════════════════════════════════════════
#  API: YARA results
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/yara_results")
def api_yara_results():
    matches = []
    for fp in sorted(glob.glob(os.path.join(TELEMETRY_PATH, "yara_*.json")), reverse=True)[:1]:
        try:
            with open(fp, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list): matches = data
            elif isinstance(data, dict): matches = data.get("matches", [])
        except Exception:
            pass
    return jsonify(matches=matches)

# ═══════════════════════════════════════════════════════════════════════════════
#  API: network results
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/network_results")
def api_network_results():
    data = load_network_results() or {}
    return jsonify(
        c2_hits=data.get("c2_hits", data.get("detections", [])),
        total_connections=data.get("total_connections", 0),
        scan_time=data.get("scan_time", "—"),
    )

# ═══════════════════════════════════════════════════════════════════════════════
#  API: Windows event logs  (uses PowerShell Get-WinEvent)
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/winlogs")
def api_winlogs():
    source  = request.args.get("source", "System")
    max_cnt = 150

    # Only allow known sources
    allowed_sources = ["System", "Security", "Application",
                       "Microsoft-Windows-PowerShell/Operational"]
    if source not in allowed_sources:
        return jsonify(logs=[], error="Geçersiz kaynak")

    ps_cmd = f"""
Get-WinEvent -LogName '{source}' -MaxEvents {max_cnt} -ErrorAction SilentlyContinue |
ForEach-Object {{
    $level = switch($_.Level){{1{{'crit'}}; 2{{'crit'}}; 3{{'warn'}}; default{{'info'}}}}
    [PSCustomObject]@{{
        event_id = $_.Id
        time     = $_.TimeCreated.ToString('dd.MM.yyyy HH:mm:ss')
        level    = $level
        source   = $_.ProviderName
        message  = ($_.Message -replace '\\r?\\n',' ' -replace '  ',' ').Substring(0, [Math]::Min(200, ($_.Message).Length))
    }}
}} | ConvertTo-Json -Depth 2
""".strip()

    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_cmd],
            capture_output=True, text=True, timeout=20
        )
        raw = result.stdout.strip()
        if not raw:
            return jsonify(logs=[], error="Çıktı boş")
        data = json.loads(raw)
        if isinstance(data, dict): data = [data]
        logs = []
        for item in data:
            logs.append({
                "event_id": item.get("event_id", ""),
                "time":     item.get("time", ""),
                "level":    item.get("level", "info"),
                "source":   item.get("source", ""),
                "message":  item.get("message", ""),
            })
        return jsonify(logs=logs)
    except subprocess.TimeoutExpired:
        return jsonify(logs=[], error="Zaman aşımı")
    except Exception as e:
        return jsonify(logs=[], error=str(e))

# ═══════════════════════════════════════════════════════════════════════════════
#  API: PS log analysis
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/ps_analyze")
def api_ps_analyze():
    source = request.args.get("source", "both")
    count  = min(int(request.args.get("count", 500)), 5000)
    lines  = []

    # 1) collect from local log files
    if source in ("logfiles", "both"):
        for fp in glob.glob(os.path.join(LOGS_PATH, "*.log")):
            try:
                with open(fp, "r", encoding="utf-8", errors="replace") as f:
                    for i, line in enumerate(f):
                        lines.append({"text": line.strip(), "source": os.path.basename(fp), "line": i+1})
            except Exception:
                pass

    # 2) collect from PS operational event log via powershell
    if source in ("eventlog", "both"):
        ps_cmd = f"""
Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' -MaxEvents {count} -ErrorAction SilentlyContinue |
Where-Object {{$_.Id -in 4103,4104}} |
Select-Object -ExpandProperty Message |
ForEach-Object {{ $_ -replace '\\r?\\n',' ' }} |
ConvertTo-Json
""".strip()
        try:
            r = subprocess.run(
                ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_cmd],
                capture_output=True, text=True, timeout=25
            )
            raw = r.stdout.strip()
            if raw:
                data = json.loads(raw)
                if isinstance(data, str): data = [data]
                for i, msg in enumerate(data):
                    lines.append({"text": msg, "source": "PS/Operational", "line": i+1})
        except Exception:
            pass

    # 3) compare against malicious patterns
    matches = []
    for entry in lines:
        for pat in MALICIOUS_PS_PATTERNS:
            if re.search(pat, entry["text"], re.IGNORECASE):
                ctx = entry["text"][:200]
                matches.append({
                    "pattern": pat,
                    "context": ctx,
                    "source":  entry["source"],
                    "line":    entry["line"],
                })
    return jsonify(matches=matches, total_scanned=len(lines))

# ═══════════════════════════════════════════════════════════════════════════════
#  API: delete threat, log content
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/delete_threat", methods=["POST"])
def api_delete_threat():
    data   = request.get_json(force=True) or {}
    source = os.path.abspath(data.get("source", ""))
    if not source.startswith(os.path.abspath(TELEMETRY_PATH)):
        return jsonify(success=False, error="Geçersiz yol")
    try:
        os.remove(source)
        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, error=str(e))

@app.route("/api/log_content")
def api_log_content():
    path = os.path.abspath(request.args.get("path", ""))
    if not path.startswith(os.path.abspath(LOGS_PATH)):
        return jsonify(error="Geçersiz yol"), 400
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(80 * 1024)
        return jsonify(content=content)
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

# ═══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
