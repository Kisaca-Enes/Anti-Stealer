"""
Anti-Stealer Pro  –  Flask Backend v3.0
Tüm PS script çıktılarıyla tam uyumlu
"""
from flask import Flask, render_template_string, jsonify, request, send_from_directory
import subprocess, json, os, glob, uuid, time, re, threading
from datetime import datetime
from pathlib import Path

app = Flask(__name__)

BASE_DIR        = os.path.dirname(os.path.abspath(__file__))

# ── PS Script'lerinin beklediği/yazdığı yollar (orijinal scriptlerle birebir) ──
TELEMETRY_PATH  = os.path.join(BASE_DIR, "telemetery")          # network(2).ps1 buraya yazar
LOGS_PATH       = os.path.join(TELEMETRY_PATH, "logs")          # quick/full/behavior logları
QUARANTINE_PATH = os.path.join(TELEMETRY_PATH, "quarantine")
YARA_RULES_DIR  = os.path.join(BASE_DIR, "rules")               # YaraScan.ps1 ./rules/*.yar
YARA_OUT_DIR    = os.path.join(BASE_DIR, "ruleout")             # YaraScan.ps1 ./ruleout/
APPDATA_DIR     = os.path.join(os.environ.get("APPDATA",""), "Anti-Stealer")
AS_LOG_DIR      = os.path.join(APPDATA_DIR, "Log")              # FullScan / QuickScan logları
STATIC_PATH     = os.path.join(BASE_DIR, "static")

for d in [TELEMETRY_PATH, LOGS_PATH, QUARANTINE_PATH, YARA_RULES_DIR,
          YARA_OUT_DIR, STATIC_PATH]:
    os.makedirs(d, exist_ok=True)

# ── Process registry ──────────────────────────────────────────────────────────
processes: dict = {}
START_TIME = time.time()

# ── PS Script adları (BASE_DIR altında) ──────────────────────────────────────
ALLOWED_SCRIPTS = {
    "quick_scan":   "QuickScan.ps1",
    "full_scan":    "FullScan.ps1",
    "scan_yara":    "YaraScan.ps1",
    "scan_network": "network.ps1",
}

SCAN_DURATIONS = {
    "quick_scan":   45,
    "full_scan":    300,
    "scan_yara":    120,
    "scan_network": 90,
}

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

# ═══════════════════════════════════════════════════════════════════════════════
#  DATA LOADERS  –  her PS script'in gerçek çıktısını okur
# ═══════════════════════════════════════════════════════════════════════════════

def load_network_findings():
    """network(2).ps1 → ./telemetery/network_YYYYMMDD_HHmmss.json"""
    results = []
    pattern = os.path.join(TELEMETRY_PATH, "network_*.json")
    files = sorted(glob.glob(pattern), reverse=True)
    for fp in files[:3]:
        try:
            with open(fp, encoding="utf-8") as f:
                data = json.load(f)
            results.append({"file": os.path.basename(fp), "data": data})
        except Exception:
            pass
    return results

def load_yara_findings():
    """YaraScan.ps1 → ./ruleout/yara_report_*.json  ve  rule_*.json"""
    matches = []
    # birleşik raporu önce dene
    for fp in sorted(glob.glob(os.path.join(YARA_OUT_DIR, "yara_report_*.json")), reverse=True)[:1]:
        try:
            with open(fp, encoding="utf-8") as f:
                data = json.load(f)
            raw = data.get("Findings", data) if isinstance(data, dict) else data
            if isinstance(raw, list):
                matches = raw
        except Exception:
            pass
    # yoksa tekil kural dosyalarından derle
    if not matches:
        for fp in glob.glob(os.path.join(YARA_OUT_DIR, "rule_*.json")):
            try:
                with open(fp, encoding="utf-8") as f:
                    items = json.load(f)
                if isinstance(items, list):
                    matches.extend(items)
                elif isinstance(items, dict):
                    matches.append(items)
            except Exception:
                pass
    return matches

def load_behavior_findings():
    """FullScan.ps1 / QuickScan.ps1 → %APPDATA%\Anti-Stealer\Log\*.json"""
    findings = []
    for base in [AS_LOG_DIR, os.path.join(AS_LOG_DIR, "Quick")]:
        for fp in sorted(glob.glob(os.path.join(base, "*.json")), reverse=True)[:20]:
            try:
                with open(fp, encoding="utf-8") as f:
                    d = json.load(f)
                if isinstance(d, dict):
                    findings.append(d)
            except Exception:
                pass
    return findings

def load_all_logs():
    """Tüm log dosyalarını listele"""
    out = []
    for base in [LOGS_PATH, AS_LOG_DIR, YARA_OUT_DIR]:
        for fp in sorted(glob.glob(os.path.join(base, "*.log")) +
                         glob.glob(os.path.join(base, "*.json")), reverse=True)[:30]:
            size = os.path.getsize(fp)
            out.append({
                "name": os.path.basename(fp),
                "date": datetime.fromtimestamp(os.path.getmtime(fp)).strftime("%d.%m.%Y %H:%M"),
                "size": f"{size/1024:.1f} KB" if size >= 1024 else f"{size} B",
                "path": fp,
                "type": "json" if fp.endswith(".json") else "log"
            })
    return out[:50]

def load_yara_rules():
    return [os.path.basename(f) for f in glob.glob(os.path.join(YARA_RULES_DIR, "*.yar"))]

def uptime_str():
    s = int(time.time() - START_TIME)
    h, m = divmod(s // 60, 60)
    return f"{h:02d}:{m:02d}"

def get_stats():
    net_findings  = load_network_findings()
    yara_findings = load_yara_findings()
    beh_findings  = load_behavior_findings()
    total = len(yara_findings) + len(beh_findings) + sum(
        len(n["data"].get("findings", [])) for n in net_findings if isinstance(n.get("data"), dict)
    )
    return {
        "scans_today": len([f for f in glob.glob(os.path.join(LOGS_PATH, "*.log"))
                            if datetime.fromtimestamp(os.path.getmtime(f)).date() == datetime.now().date()]),
        "threats":     total,
        "quarantine":  len(glob.glob(os.path.join(QUARANTINE_PATH, "*"))),
        "uptime":      uptime_str(),
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
.sb{width:var(--sw);background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;z-index:20;overflow-y:auto}
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
.tb-right{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btn{padding:8px 14px;border-radius:6px;border:1px solid var(--border);background:var(--surf);color:var(--text);font-family:'Syne',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn:hover{border-color:rgba(255,255,255,.15);background:var(--surf2)}
.btn.primary{background:var(--teal);color:#000;border-color:var(--teal)}
.btn.primary:hover{background:#00c9ab}
.btn.danger{background:var(--red2);border-color:var(--red);color:var(--red)}
.btn.sm{padding:5px 10px;font-size:.72rem}
.btn:disabled{opacity:.4;cursor:not-allowed}

/* ── hero ── */
.hero{background:linear-gradient(135deg,#0c1e1c 0%,#0f1014 70%,#09090c 100%);border:1px solid rgba(0,229,195,.15);border-radius:var(--r);padding:26px 200px 26px 26px;position:relative;overflow:hidden;min-height:130px}
.hero-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,229,195,.08);border:1px solid rgba(0,229,195,.2);border-radius:20px;padding:4px 10px;font-size:.68rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
.hero-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite}
.hero h1{font-size:1.5rem;font-weight:800;margin-bottom:6px}
.hero p{font-size:.82rem;color:var(--muted);line-height:1.5}
.samurai{position:absolute;right:0;top:0;bottom:0;width:185px;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;filter:drop-shadow(0 0 18px rgba(0,229,195,.18))}
.samurai img{height:130px;object-fit:contain}

/* ── stat cards ── */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.sc{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;position:relative;overflow:hidden}
.sc-ico{font-size:1rem;margin-bottom:8px;color:var(--teal)}
.sc-val{font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;line-height:1}
.sc-lbl{font-size:.72rem;color:var(--muted);margin-top:3px;font-weight:600}
.sc.red .sc-ico,.sc.red .sc-val{color:var(--red)}
.sc.amb .sc-ico,.sc.amb .sc-val{color:var(--amber)}
.sc.blue .sc-ico,.sc.blue .sc-val{color:var(--blue)}
.sc-bar{position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--teal2)}
.sc-bar-f{height:100%;background:var(--teal);border-radius:2px;transition:width .6s}
.sc.red .sc-bar{background:var(--red2)}.sc.red .sc-bar-f{background:var(--red)}
.sc.amb .sc-bar{background:var(--amb2)}.sc.amb .sc-bar-f{background:var(--amber)}
.sc.blue .sc-bar{background:var(--blu2)}.sc.blue .sc-bar-f{background:var(--blue)}

/* ── action cards ── */
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.sh h3{font-size:.88rem;font-weight:700;display:flex;align-items:center;gap:7px}
.sh h3 i{color:var(--teal);font-size:.8rem}
.ag{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.ac{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:14px;cursor:pointer;transition:all .18s}
.ac:hover{border-color:var(--teal);background:var(--surf2);transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.4)}
.ac-ico{width:34px;height:34px;border-radius:7px;background:var(--teal2);color:var(--teal);display:flex;align-items:center;justify-content:center;font-size:.9rem;margin-bottom:10px}
.ac h4{font-size:.82rem;margin-bottom:3px}
.ac p{font-size:.72rem;color:var(--muted);line-height:1.35}

/* ── tables ── */
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
.logv{background:#07080b;border:1px solid var(--border);border-radius:var(--r);font-family:'JetBrains Mono',monospace;font-size:.72rem;color:#6fcfa0;padding:12px 14px;height:200px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;line-height:1.55}
.logv .le{color:var(--red)}.logv .lw{color:var(--amber)}.logv .li{color:var(--blue)}

/* ── scan page layout ── */
.scan-page{animation:fadeIn .3s ease}
.scan-layout{display:grid;grid-template-columns:340px 1fr;gap:16px;align-items:start}
.scan-config{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.scan-config-head{padding:16px 18px 12px;border-bottom:1px solid var(--border)}
.scan-config-head h3{font-size:.95rem;font-weight:800;display:flex;align-items:center;gap:8px}
.scan-config-head h3 i{color:var(--teal)}
.scan-config-head p{font-size:.75rem;color:var(--muted);margin-top:3px}
.scan-config-body{padding:16px 18px}
.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:.75rem;font-weight:700;color:var(--muted);margin-bottom:6px;letter-spacing:.3px}
.inp{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:9px 12px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:.8rem;transition:border .15s}
.inp:focus{outline:none;border-color:rgba(0,229,195,.4)}
.inp::placeholder{color:var(--muted)}
.yara-list{max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;background:var(--bg3)}
.yara-item{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--border);font-size:.75rem;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:background .1s;gap:6px}
.yara-item:last-child{border-bottom:none}
.yara-item:hover{background:rgba(255,255,255,.03)}
.yara-item.sel{background:var(--teal2);color:var(--teal)}

/* ── scan panel ── */
.scan-panel{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.scan-panel-head{padding:14px 18px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.scan-panel-head h3{font-size:.9rem;font-weight:800}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:.7rem;font-weight:700;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,.05);color:var(--muted)}
.badge.running{background:var(--teal2);color:var(--teal);animation:blink 1.5s infinite}
.badge.done{background:rgba(0,229,195,.1);color:var(--teal)}
.badge.error{background:var(--red2);color:var(--red)}
.scan-panel-body{padding:16px 18px}

/* ── progress ── */
.prog-wrap{margin-bottom:12px}
.prog-track{height:6px;background:rgba(255,255,255,.04);border-radius:10px;overflow:hidden}
.prog-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--teal),#00aaff);border-radius:10px;transition:width .4s ease}
.prog-meta{display:flex;justify-content:space-between;font-size:.7rem;color:var(--muted);margin-top:5px;font-family:'JetBrains Mono',monospace}
.time-row{display:flex;gap:10px;margin-bottom:12px}
.time-box{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 10px;text-align:center}
.time-box .tv{font-size:1rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--teal)}
.time-box .tl{font-size:.62rem;color:var(--muted);margin-top:2px}

/* ── result cards ── */
.result-card{background:var(--bg3);border-radius:6px;padding:10px 12px;margin-bottom:8px;animation:fadeIn .3s ease;border-left:3px solid var(--border)}
.result-card.critical{border-left-color:var(--red);background:rgba(255,68,85,.04)}
.result-card.high{border-left-color:var(--amber);background:rgba(255,170,0,.04)}
.result-card.medium{border-left-color:var(--blue);background:rgba(77,166,255,.04)}
.result-card.confirmed{border-left-color:var(--red);background:rgba(255,68,85,.06)}
.result-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:4px}
.result-title{font-size:.8rem;font-weight:700;font-family:'JetBrains Mono',monospace}
.result-meta{font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono',monospace;margin-top:3px;line-height:1.5}
.result-rules{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.rule-chip{font-size:.65rem;padding:2px 7px;border-radius:3px;background:rgba(255,170,0,.1);color:var(--amber);font-family:'JetBrains Mono',monospace}

/* ── network animation ── */
.net-anim{position:relative;width:100%;height:160px;background:var(--bg3);border-radius:var(--r);overflow:hidden;margin-bottom:12px}
.net-anim svg{width:100%;height:100%}
.net-label{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:.7rem;color:var(--teal);font-family:'JetBrains Mono',monospace;animation:blink 1.5s infinite;white-space:nowrap}

/* ── full scan rings ── */
.full-anim{position:relative;width:100%;height:140px;background:var(--bg3);border-radius:var(--r);overflow:hidden;margin-bottom:12px;display:flex;align-items:center;justify-content:center}
.full-rings{position:relative;width:90px;height:90px}
.full-ring{position:absolute;inset:0;border-radius:50%;border:2px solid transparent;border-top-color:var(--teal)}
.full-ring:nth-child(1){animation:spin .9s linear infinite}
.full-ring:nth-child(2){inset:12px;border-top-color:rgba(0,229,195,.5);animation:spin 1.4s linear infinite reverse}
.full-ring:nth-child(3){inset:24px;border-top-color:rgba(0,229,195,.25);animation:spin 2s linear infinite}
.full-ring-core{position:absolute;inset:34px;background:var(--teal2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;color:var(--teal)}
.scan-line-anim{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--teal),transparent);opacity:.5;animation:scan-line 2s linear infinite}

/* ── quick bars ── */
.quick-anim{width:100%;height:100px;background:var(--bg3);border-radius:var(--r);margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:16px}
.quick-bar-wrap{display:flex;gap:4px;align-items:flex-end;height:50px}
.q-bar{width:7px;background:var(--teal);border-radius:3px 3px 0 0;opacity:.7}
.q-bar:nth-child(1){animation:qbar 1.1s ease infinite 0s}
.q-bar:nth-child(2){animation:qbar 1.1s ease infinite .1s}
.q-bar:nth-child(3){animation:qbar 1.1s ease infinite .2s}
.q-bar:nth-child(4){animation:qbar 1.1s ease infinite .3s}
.q-bar:nth-child(5){animation:qbar 1.1s ease infinite .4s}
.q-bar:nth-child(6){animation:qbar 1.1s ease infinite .5s}

/* ── windows logs ── */
.wlog-item{background:var(--bg3);border-left:3px solid var(--border);border-radius:0 6px 6px 0;padding:9px 12px;margin-bottom:7px;animation:fadeIn .25s}
.wlog-item.crit{border-left-color:var(--red);background:rgba(255,68,85,.04)}
.wlog-item.warn{border-left-color:var(--amber);background:rgba(255,170,0,.04)}
.wlog-item.info{border-left-color:var(--blue);background:rgba(77,166,255,.04)}
.wlog-head{display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap}
.wlog-time{font-size:.67rem;font-family:'JetBrains Mono',monospace;color:var(--muted);margin-left:auto}
.wlog-msg{font-size:.78rem;line-height:1.4;color:var(--text)}

/* ── ps match ── */
.ps-match{background:var(--bg3);border:1px solid rgba(255,170,0,.3);border-radius:6px;padding:10px 12px;margin-bottom:8px;animation:fadeIn .3s}
.ps-match-pat{font-size:.73rem;font-weight:700;color:var(--amber);font-family:'JetBrains Mono',monospace}
.ps-match-ctx{font-size:.7rem;color:var(--muted);margin-top:4px;font-family:'JetBrains Mono',monospace;word-break:break-all}

/* ── empty ── */
.empty{text-align:center;padding:40px 20px;color:var(--muted)}
.empty i{font-size:2rem;color:var(--teal);display:block;margin-bottom:12px;opacity:.5}
.empty h4{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:5px}
.empty p{font-size:.8rem;line-height:1.4}

/* ── geo badge ── */
.geo-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:5px}
.geo-chip{font-size:.65rem;padding:2px 7px;border-radius:3px;background:rgba(77,166,255,.1);color:var(--blue);font-family:'JetBrains Mono',monospace}
.geo-chip.bad{background:var(--red2);color:var(--red)}

/* ── animations ── */
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,195,.4)}50%{box-shadow:0 0 0 5px rgba(0,229,195,0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes scan-line{0%{transform:translateY(-100%)}100%{transform:translateY(400px)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes qbar{0%,100%{height:8px;opacity:.4}50%{height:44px;opacity:1}}
@keyframes network-pulse{0%{r:6;opacity:1}100%{r:18;opacity:0}}

::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#1e2130;border-radius:10px}
@media(max-width:1100px){.scan-layout{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.ag{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>

<!-- SIDEBAR -->
<aside class="sb">
  <div class="sb-logo">
    <div class="sb-logo-icon"><i class="fas fa-user-ninja"></i></div>
    <div>
      <div class="sb-logo-text">ANTI-STEALER</div>
      <div class="sb-logo-sub">Defense Pro v3.0</div>
    </div>
  </div>
  <div class="sb-sec">Genel</div>
  <div class="ni {% if page=='home' %}active{% endif %}" onclick="go('/')"><i class="fas fa-th-large"></i> Genel Bakış</div>
  <div class="ni {% if page=='threats' %}active{% endif %}" onclick="go('/threats')"><i class="fas fa-skull-crossbones"></i> Tehdit Merkezi {% if stats.threats %}<span class="bdg">{{stats.threats}}</span>{% endif %}</div>
  <div class="ni {% if page=='network_results' %}active{% endif %}" onclick="go('/results/network')"><i class="fas fa-satellite-dish"></i> Ağ Sonuçları</div>
  <div class="ni {% if page=='yara_results' %}active{% endif %}" onclick="go('/results/yara')"><i class="fas fa-bug"></i> YARA Sonuçları</div>
  <div class="ni {% if page=='logs' %}active{% endif %}" onclick="go('/logs')"><i class="fas fa-terminal"></i> Log İzleyici</div>
  <div class="ni {% if page=='winlogs' %}active{% endif %}" onclick="go('/winlogs')"><i class="fas fa-windows"></i> Windows Logları</div>
  <div class="ni {% if page=='psscan' %}active{% endif %}" onclick="go('/psscan')"><i class="fas fa-code"></i> PS Analizi</div>
  <div class="sb-sec">Tarama</div>
  <div class="ni {% if page=='quick' %}active{% endif %}" onclick="go('/scan/quick')"><i class="fas fa-bolt-lightning"></i> Hızlı Tarama</div>
  <div class="ni {% if page=='yara' %}active{% endif %}" onclick="go('/scan/yara')"><i class="fas fa-microchip"></i> YARA Motoru</div>
  <div class="ni {% if page=='network' %}active{% endif %}" onclick="go('/scan/network')"><i class="fas fa-network-wired"></i> Ağ Taraması</div>
  <div class="ni {% if page=='full' %}active{% endif %}" onclick="go('/scan/full')"><i class="fas fa-shield-heart"></i> Tam Koruma</div>
  <div class="sb-foot"><b>{{db_date}}</b> · Anti-Stealer Pro</div>
</aside>

<!-- MAIN -->
<main class="main">

{% if page == 'home' %}
<div class="topbar">
  <div><div class="tb-title">Genel Bakış</div><div class="tb-sub">{{now}}</div></div>
  <div class="tb-right">
    <button class="btn" onclick="location.reload()"><i class="fas fa-rotate"></i> Yenile</button>
    <button class="btn primary" onclick="go('/scan/quick')"><i class="fas fa-bolt-lightning"></i> Hızlı Tara</button>
  </div>
</div>
<div class="hero">
  <div class="hero-badge"><div class="dot"></div>Korumalı</div>
  <h1>Anti-Stealer Pro</h1>
  <p>Behavior · YARA · Network · Memory · Hash — tüm modüller aktif.</p>
  <div class="samurai"><img src="/static/samurai.png" alt=""></div>
</div>
<div class="stats">
  <div class="sc"><div class="sc-ico"><i class="fas fa-shield-check"></i></div><div class="sc-val">{{stats.scans_today}}</div><div class="sc-lbl">Bugünkü Tarama</div><div class="sc-bar"><div class="sc-bar-f" style="width:{{[stats.scans_today*10,100]|min}}%"></div></div></div>
  <div class="sc red"><div class="sc-ico"><i class="fas fa-bug"></i></div><div class="sc-val">{{stats.threats}}</div><div class="sc-lbl">Toplam Bulgu</div><div class="sc-bar"><div class="sc-bar-f" style="width:{{[stats.threats*5,100]|min}}%"></div></div></div>
  <div class="sc amb"><div class="sc-ico"><i class="fas fa-box-archive"></i></div><div class="sc-val">{{stats.quarantine}}</div><div class="sc-lbl">Karantina</div><div class="sc-bar"><div class="sc-bar-f" style="width:{{[stats.quarantine*10,100]|min}}%"></div></div></div>
  <div class="sc blue"><div class="sc-ico"><i class="fas fa-clock"></i></div><div class="sc-val">{{stats.uptime}}</div><div class="sc-lbl">Çalışma Süresi</div><div class="sc-bar"><div class="sc-bar-f" style="width:70%"></div></div></div>
</div>
<div><div class="sh"><h3><i class="fas fa-bolt"></i> Modüller</h3></div>
<div class="ag">
  <div class="ac" onclick="go('/scan/quick')"><div class="ac-ico"><i class="fas fa-gauge-high"></i></div><h4>Hızlı Tarama</h4><p>QuickScan.ps1 · hotspot analizi</p></div>
  <div class="ac" onclick="go('/scan/full')"><div class="ac-ico"><i class="fas fa-shield-heart"></i></div><h4>Tam Koruma</h4><p>FullScan.ps1 · derinlemesine</p></div>
  <div class="ac" onclick="go('/scan/yara')"><div class="ac-ico"><i class="fas fa-microchip"></i></div><h4>YARA Motoru</h4><p>YaraScan.ps1 · ./rules/*.yar</p></div>
  <div class="ac" onclick="go('/scan/network')"><div class="ac-ico"><i class="fas fa-network-wired"></i></div><h4>Ağ Taraması</h4><p>network.ps1 · C2 / davranış</p></div>
</div></div>

{% elif page == 'quick' %}
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-bolt-lightning" style="color:var(--teal);margin-right:8px"></i>Hızlı Tarama</div>
  <div class="tb-sub">QuickScan.ps1 → %APPDATA%\Anti-Stealer\Log\Quick\</div></div>
  <div class="tb-right"><button class="btn" onclick="go('/')"><i class="fas fa-arrow-left"></i> Geri</button></div>
</div>
<div class="scan-page"><div class="scan-layout">
  <div class="scan-config">
    <div class="scan-config-head"><h3><i class="fas fa-sliders"></i> Tarama Ayarları</h3><p>Hotspot konumları ve şüpheli processler</p></div>
    <div class="scan-config-body">
      <div class="form-group"><label>YÜRÜTÜLECEK SCRIPT</label>
        <div class="inp" style="cursor:default;color:var(--teal)">QuickScan.ps1</div></div>
      <div class="form-group"><label>JACCARD EŞİĞİ</label>
        <input type="number" class="inp" id="qThreshold" value="0.3" min="0.1" max="1" step="0.05"></div>
      <div class="form-group"><label>ÇIKTI KLASÖRÜ</label>
        <div class="inp" style="cursor:default;color:var(--muted);font-size:.72rem">%APPDATA%\Anti-Stealer\Log\</div></div>
      <button class="btn primary" style="width:100%;justify-content:center" id="btn-quick" onclick="startScan('quick_scan','quick')">
        <i class="fas fa-play"></i> Taramayı Başlat</button>
    </div>
  </div>
  <div class="scan-panel">
    <div class="scan-panel-head"><h3>Durum</h3><span class="badge" id="quick-badge"><i class="fas fa-circle"></i> Bekliyor</span></div>
    <div class="scan-panel-body">
      <div class="quick-anim" id="quick-anim" style="display:none">
        <div class="quick-bar-wrap"><div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div><div class="q-bar"></div></div>
        <span style="font-size:.75rem;color:var(--teal);font-family:'JetBrains Mono',monospace;animation:blink 1s infinite">Hotspot taranıyor...</span>
      </div>
      <div class="time-row" id="quick-times" style="display:none">
        <div class="time-box"><div class="tv" id="q-elapsed">00:00</div><div class="tl">Geçen</div></div>
        <div class="time-box"><div class="tv" id="q-remain">--:--</div><div class="tl">Kalan</div></div>
        <div class="time-box"><div class="tv" id="q-pct-box">0%</div><div class="tl">İlerleme</div></div>
      </div>
      <div class="prog-wrap" id="quick-prog" style="display:none">
        <div class="prog-track"><div class="prog-fill" id="quick-fill"></div></div>
        <div class="prog-meta"><span id="quick-msg">—</span><span id="quick-pct">0%</span></div>
      </div>
      <div class="logv" id="quick-log" style="display:none;height:160px"></div>
      <div id="quick-results"></div>
    </div>
  </div>
</div></div>

{% elif page == 'full' %}
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-shield-heart" style="color:var(--teal);margin-right:8px"></i>Tam Koruma</div>
  <div class="tb-sub">FullScan.ps1 → %APPDATA%\Anti-Stealer\Log\</div></div>
  <div class="tb-right"><button class="btn" onclick="go('/')"><i class="fas fa-arrow-left"></i> Geri</button></div>
</div>
<div class="scan-page"><div class="scan-layout">
  <div class="scan-config">
    <div class="scan-config-head"><h3><i class="fas fa-shield-heart"></i> Tam Tarama</h3><p>7 modül zincirleme — Hash · Static · Memory · Net · Behavior</p></div>
    <div class="scan-config-body">
      <div class="form-group"><label>YÜRÜTÜLECEK SCRIPT</label>
        <div class="inp" style="cursor:default;color:var(--teal)">FullScan.ps1</div></div>
      <div class="form-group"><label>TAHMİNİ SÜRE</label>
        <div class="inp" style="cursor:default;color:var(--muted)">~4-6 dakika (sisteme göre değişir)</div></div>
      <div class="form-group"><label>ÇIKTI</label>
        <div class="inp" style="cursor:default;color:var(--muted);font-size:.72rem">%APPDATA%\Anti-Stealer\Log\ + QuickScanReport.json</div></div>
      <button class="btn primary" style="width:100%;justify-content:center" id="btn-full" onclick="startScan('full_scan','full')">
        <i class="fas fa-play"></i> Tam Taramayı Başlat</button>
    </div>
  </div>
  <div class="scan-panel">
    <div class="scan-panel-head"><h3>Durum</h3><span class="badge" id="full-badge"><i class="fas fa-circle"></i> Bekliyor</span></div>
    <div class="scan-panel-body">
      <div class="full-anim" id="full-anim" style="display:none">
        <div class="scan-line-anim"></div>
        <div class="full-rings"><div class="full-ring"></div><div class="full-ring"></div><div class="full-ring"></div>
          <div class="full-ring-core"><i class="fas fa-shield"></i></div></div>
      </div>
      <div id="full-phase" style="display:none;font-size:.72rem;color:var(--teal);font-family:'JetBrains Mono',monospace;margin-bottom:10px;animation:blink 1.5s infinite"></div>
      <div class="time-row" id="full-times" style="display:none">
        <div class="time-box"><div class="tv" id="f-elapsed">00:00</div><div class="tl">Geçen</div></div>
        <div class="time-box"><div class="tv" id="f-remain">--:--</div><div class="tl">Kalan</div></div>
        <div class="time-box"><div class="tv" id="f-pct-box">0%</div><div class="tl">İlerleme</div></div>
      </div>
      <div class="prog-wrap" id="full-prog" style="display:none">
        <div class="prog-track"><div class="prog-fill" id="full-fill"></div></div>
        <div class="prog-meta"><span id="full-msg">—</span><span id="full-pct">0%</span></div>
      </div>
      <div class="logv" id="full-log" style="display:none;height:180px"></div>
    </div>
  </div>
</div></div>

{% elif page == 'yara' %}
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-microchip" style="color:var(--teal);margin-right:8px"></i>YARA Motoru</div>
  <div class="tb-sub">YaraScan.ps1  ·  ./rules/*.yar  →  ./ruleout/</div></div>
  <div class="tb-right"><button class="btn" onclick="go('/')"><i class="fas fa-arrow-left"></i> Geri</button></div>
</div>
<div class="scan-page"><div class="scan-layout">
  <div class="scan-config">
    <div class="scan-config-head"><h3><i class="fas fa-folder-open"></i> Yapılandırma</h3><p>Hedef klasör ve kural seçimi</p></div>
    <div class="scan-config-body">
      <div class="form-group"><label>TARANACAK KLASÖR</label>
        <input type="text" class="inp" id="yaraTarget" placeholder="C:\Users\..." value="C:\Users"></div>
      <div class="form-group">
        <label>YARA KURALLARI <span style="color:var(--muted);font-weight:400">(./rules/*.yar)</span></label>
        <div class="yara-list" id="yaraList">
          {% for r in yara_rules %}
          <div class="yara-item" onclick="toggleYara(this,'{{r}}')" data-rule="{{r}}">
            <span><i class="fas fa-file-code" style="color:var(--teal);margin-right:6px"></i>{{r}}</span>
            <span class="tag g" style="display:none"><i class="fas fa-check"></i></span>
          </div>
          {% endfor %}
          {% if not yara_rules %}
          <div style="padding:12px;text-align:center;font-size:.75rem;color:var(--muted)">./rules/ klasöründe .yar dosyası yok</div>
          {% endif %}
        </div>
        <div style="margin-top:5px;font-size:.7rem;color:var(--muted)">Seçili: <b id="yaraCount" style="color:var(--teal)">0</b> kural</div>
      </div>
      <div class="form-group"><label>SCRIPT ARGÜMANI</label>
        <input type="text" class="inp" id="yaraArgLine" placeholder="Opsiyonel ek argüman"></div>
      <button class="btn primary" style="width:100%;justify-content:center" id="btn-yara" onclick="startScan('scan_yara','yara')">
        <i class="fas fa-play"></i> YARA Taramasını Başlat</button>
    </div>
  </div>
  <div class="scan-panel">
    <div class="scan-panel-head"><h3>YARA Tarama Durumu</h3><span class="badge" id="yara-badge"><i class="fas fa-circle"></i> Bekliyor</span></div>
    <div class="scan-panel-body">
      <div class="time-row" id="yara-times" style="display:none">
        <div class="time-box"><div class="tv" id="y-elapsed">00:00</div><div class="tl">Geçen</div></div>
        <div class="time-box"><div class="tv" id="y-remain">--:--</div><div class="tl">Kalan</div></div>
        <div class="time-box"><div class="tv" id="y-rule" style="font-size:.7rem">—</div><div class="tl">Mevcut Kural</div></div>
      </div>
      <div class="prog-wrap" id="yara-prog" style="display:none">
        <div class="prog-track"><div class="prog-fill" id="yara-fill"></div></div>
        <div class="prog-meta"><span id="yara-msg">—</span><span id="yara-pct">0%</span></div>
      </div>
      <div class="logv" id="yara-log" style="display:none;height:150px"></div>
      <div id="yara-results"><div class="empty"><i class="fas fa-microchip"></i><h4>Henüz tarama yapılmadı</h4><p>Sol panelden klasör ve kuralları seçin.</p></div></div>
    </div>
  </div>
</div></div>

{% elif page == 'network' %}
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-network-wired" style="color:var(--teal);margin-right:8px"></i>Ağ Taraması</div>
  <div class="tb-sub">network.ps1  ·  Çıktı: ./telemetery/network_*.json</div></div>
  <div class="tb-right"><button class="btn" onclick="go('/')"><i class="fas fa-arrow-left"></i> Geri</button></div>
</div>
<div class="scan-page"><div class="scan-layout">
  <div class="scan-config">
    <div class="scan-config-head"><h3><i class="fas fa-satellite-dish"></i> Ağ Tarama Ayarları</h3>
    <p>GEO/ASN · Entropi · Davranış · 14 kural motoru</p></div>
    <div class="scan-config-body">
      <div class="form-group"><label>MİNİMUM RİSK SKORU</label>
        <input type="number" class="inp" id="netMinScore" value="25" min="10" max="150"></div>
      <div class="form-group"><label>DERİN ENTROPİ</label>
        <select class="inp" id="netDeep">
          <option value="">Kapalı (sadece şüpheli portlar)</option>
          <option value="-DeepEntropy">Açık (tüm bağlantılar)</option>
        </select>
      </div>
      <div class="form-group"><label>ÇIKTI KLASÖRÜ</label>
        <div class="inp" style="cursor:default;color:var(--muted);font-size:.72rem">./telemetery/network_YYYYMMDD_HHmmss.json</div></div>
      <button class="btn primary" style="width:100%;justify-content:center" id="btn-net" onclick="startScan('scan_network','network')">
        <i class="fas fa-play"></i> Ağ Taramasını Başlat</button>
    </div>
  </div>
  <div class="scan-panel">
    <div class="scan-panel-head"><h3>Ağ Tarama Durumu</h3><span class="badge" id="network-badge"><i class="fas fa-circle"></i> Bekliyor</span></div>
    <div class="scan-panel-body">
      <div class="net-anim" id="net-anim" style="display:none">
        <svg id="netSvg" viewBox="0 0 600 160"></svg>
        <div class="net-label">TCP bağlantıları analiz ediliyor...</div>
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
      <div class="logv" id="network-log" style="display:none;height:150px"></div>
      <div id="network-results"></div>
    </div>
  </div>
</div></div>

{% elif page == 'network_results' %}
<!-- Ağ Sonuçları – network(2).ps1 çıktısı -->
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-satellite-dish" style="color:var(--teal);margin-right:8px"></i>Ağ Tarama Sonuçları</div>
  <div class="tb-sub">./telemetery/network_*.json → {{net_files|length}} rapor dosyası</div></div>
  <div class="tb-right">
    <button class="btn" onclick="location.reload()"><i class="fas fa-rotate"></i> Yenile</button>
    <button class="btn primary" onclick="go('/scan/network')"><i class="fas fa-play"></i> Yeni Tarama</button>
  </div>
</div>
{% if net_files %}
  {% for nf in net_files %}
  {% set d = nf.data %}
  {% set meta = d.get('meta', {}) %}
  {% set summary = d.get('summary', {}) %}
  <div class="tw" style="margin-bottom:14px">
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div>
        <span style="font-size:.85rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--teal)">{{nf.file}}</span>
        <span style="font-size:.72rem;color:var(--muted);margin-left:10px">{{meta.get('generated_at','')}}  ·  {{meta.get('scan_duration_sec','')}}s  ·  {{meta.get('total_connections',0)}} bağlantı</span>
      </div>
      <div style="display:flex;gap:6px">
        {% if summary.get('critical',0) %}<span class="tag">Critical: {{summary.critical}}</span>{% endif %}
        {% if summary.get('high',0) %}<span class="tag a">High: {{summary.high}}</span>{% endif %}
        {% if summary.get('medium',0) %}<span class="tag b">Medium: {{summary.medium}}</span>{% endif %}
        <span class="tag g">Toplam: {{summary.get('total_findings',0)}}</span>
      </div>
    </div>
    {% set findings = d.get('findings', []) %}
    {% if findings %}
    <div class="tw-scroll"><table>
      <thead><tr><th>Process</th><th>Remote IP:Port</th><th>GEO/ASN</th><th>Skor</th><th>Severity</th><th>Tetiklenen Kurallar</th></tr></thead>
      <tbody>
      {% for f in findings %}
      <tr>
        <td style="font-family:'JetBrains Mono',monospace;font-size:.75rem">
          {{f.get('process',{}).get('name','?')}} <span style="color:var(--muted)">({{f.get('process',{}).get('pid','?')}})</span>
          {% if f.get('process',{}).get('chain_suspicious') %}<span class="tag a" style="margin-left:4px">⚠ Chain</span>{% endif %}
        </td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:.75rem">
          {{f.get('network',{}).get('remote_ip','?')}}:{{f.get('network',{}).get('remote_port','?')}}
          {% if f.get('network',{}).get('is_dga_domain') %}<span class="tag" style="margin-left:4px">DGA</span>{% endif %}
        </td>
        <td style="font-size:.72rem">
          {% set geo = f.get('geo',{}) %}
          {% if geo.get('lookup_ok') != false %}
            <span style="font-family:'JetBrains Mono',monospace">{{geo.get('country_code','?')}} / {{geo.get('asn','?')}}</span>
            {% if geo.get('is_tor') %}<span class="tag" style="margin-left:4px">TOR</span>{% endif %}
            {% if geo.get('is_hosting') %}<span class="tag a" style="margin-left:4px">VPS</span>{% endif %}
          {% else %}-{% endif %}
        </td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:var(--teal)">{{f.get('risk',{}).get('score','?')}}</td>
        <td>
          {% set sev = f.get('risk',{}).get('severity','?') %}
          <span class="tag {% if sev=='Critical' %}{% elif sev=='High' %}a{% elif sev=='Medium' %}b{% else %}g{% endif %}">{{sev}}</span>
        </td>
        <td style="font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono',monospace;max-width:300px;word-break:break-word">
          {{f.get('risk',{}).get('rule_summary','')}}
        </td>
      </tr>
      {% endfor %}
      </tbody>
    </table></div>
    {% else %}
    <div class="empty" style="padding:20px"><i class="fas fa-shield-check"></i><h4>Bu raporda bulgu yok</h4></div>
    {% endif %}
  </div>
  {% endfor %}
{% else %}
<div class="empty"><i class="fas fa-network-wired"></i><h4>Henüz ağ tarama sonucu yok</h4><p>Ağ taramasını çalıştırın — sonuçlar ./telemetery/network_*.json olarak kaydedilir.</p></div>
{% endif %}

{% elif page == 'yara_results' %}
<!-- YARA Sonuçları – YaraScan.ps1 çıktısı -->
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-bug" style="color:var(--red);margin-right:8px"></i>YARA Eşleşme Sonuçları</div>
  <div class="tb-sub">./ruleout/ → {{yara_matches|length}} eşleşme</div></div>
  <div class="tb-right">
    <button class="btn" onclick="location.reload()"><i class="fas fa-rotate"></i> Yenile</button>
    <button class="btn primary" onclick="go('/scan/yara')"><i class="fas fa-play"></i> Yeni Tarama</button>
  </div>
</div>
{% if yara_matches %}
<div class="tw"><div class="tw-scroll"><table>
  <thead><tr><th>Kural Adı</th><th>.yar Dosyası</th><th>Eşleşen Dosya</th><th>SHA256</th><th>Boyut</th><th>Tarih</th></tr></thead>
  <tbody>
  {% for m in yara_matches %}
  <tr>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.75rem;color:var(--red)">{{m.get('RuleName','?')}}</td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.72rem;color:var(--amber)">{{m.get('YarFile','?')}}</td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.72rem">{{m.get('FileName','?')}}<br><span style="color:var(--muted);font-size:.65rem">{{m.get('FilePath','?')}}</span></td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.65rem;color:var(--muted);max-width:120px;word-break:break-all">{{(m.get('SHA256') or '')[:16]}}...</td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.72rem;color:var(--muted)">{{m.get('FileSize','?')}}</td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--muted)">{{m.get('Timestamp','?')}}</td>
  </tr>
  {% endfor %}
  </tbody>
</table></div></div>
{% else %}
<div class="empty"><i class="fas fa-microchip"></i><h4>YARA sonucu bulunamadı</h4><p>YaraScan.ps1 çalıştırın — sonuçlar ./ruleout/yara_report_*.json olarak kaydedilir.</p></div>
{% endif %}

{% elif page == 'threats' %}
<div class="topbar">
  <div><div class="tb-title">Tehdit Merkezi</div><div class="tb-sub">Tüm modüllerin bulguları</div></div>
  <div class="tb-right"><button class="btn" onclick="location.reload()"><i class="fas fa-rotate"></i> Yenile</button></div>
</div>
{% if behavior_findings %}
<div class="sh"><h3><i class="fas fa-bug"></i> Behavior / Hash / Memory Bulgular</h3></div>
<div class="tw" style="margin-bottom:14px"><div class="tw-scroll"><table>
  <thead><tr><th>Modül</th><th>Process / Dosya</th><th>Aile</th><th>Risk</th><th>Skor</th></tr></thead>
  <tbody>
  {% for f in behavior_findings %}
  <tr>
    <td><span class="tag b">{{f.get('Module','?')}}</span></td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.75rem">{{f.get('ProcessName') or f.get('FileName') or f.get('Path','?')}}</td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.75rem;color:var(--teal)">{{f.get('MatchFamily') or f.get('DominantFamily') or f.get('Stealer','?')}}</td>
    <td><span class="tag {% if f.get('Risk') in ['Confirmed','Potential-Stealer','High'] %}{% elif f.get('Risk')=='Medium' %}b{% else %}g{% endif %}">{{f.get('Risk','?')}}</span></td>
    <td style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:var(--teal)">{{f.get('Score') or f.get('JaccardScore') or '—'}}</td>
  </tr>
  {% endfor %}
  </tbody>
</table></div></div>
{% endif %}
{% if not behavior_findings %}
<div class="empty"><i class="fas fa-shield-check"></i><h4>Tehdit Bulunamadı</h4><p>Tarama çalıştırın — bulgular burada görünecek.</p></div>
{% endif %}

{% elif page == 'logs' %}
<div class="topbar">
  <div><div class="tb-title">Log İzleyici</div><div class="tb-sub">Tüm script çıktıları</div></div>
  <div class="tb-right"><button class="btn" onclick="location.reload()"><i class="fas fa-rotate"></i> Yenile</button></div>
</div>
<div class="tw" style="margin-bottom:14px"><div class="tw-scroll"><table>
  <thead><tr><th>Dosya</th><th>Tarih</th><th>Boyut</th><th>Tür</th><th style="text-align:right">Görüntüle</th></tr></thead>
  <tbody>
    {% for l in all_logs %}
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.75rem"><i class="fas fa-file-lines" style="color:var(--muted);margin-right:6px"></i>{{l.name}}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--muted)">{{l.date}}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--muted)">{{l.size}}</td>
      <td><span class="tag {% if l.type=='json' %}b{% else %}g{% endif %}">{{l.type}}</span></td>
      <td style="text-align:right"><button class="btn sm" onclick="viewLog('{{l.path|e}}')"><i class="fas fa-eye"></i> Aç</button></td>
    </tr>
    {% endfor %}
  </tbody>
</table></div></div>
<div id="logPreview" style="display:none">
  <div class="sh"><h3><i class="fas fa-terminal"></i> <span id="logPreviewName"></span></h3></div>
  <div class="logv" id="logContent" style="height:320px"></div>
</div>

{% elif page == 'winlogs' %}
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-windows" style="color:var(--blue);margin-right:8px"></i>Windows Olay Günlüğü</div></div>
  <div class="tb-right">
    <select class="btn" id="wlogSrc" onchange="loadWinLogs()">
      <option value="System">System</option>
      <option value="Security">Security</option>
      <option value="Application">Application</option>
      <option value="Microsoft-Windows-PowerShell/Operational">PowerShell</option>
    </select>
    <button class="btn primary" onclick="loadWinLogs()"><i class="fas fa-rotate"></i> Yükle</button>
    <select class="btn" id="wlogLvl" onchange="filterWinLogs()">
      <option value="all">Tümü</option><option value="crit">Kritik</option>
      <option value="warn">Uyarı</option><option value="info">Bilgi</option>
    </select>
  </div>
</div>
<div id="wlogContainer"><div class="empty"><i class="fas fa-windows"></i><h4>Kaynak seçin ve Yükle'ye tıklayın</h4></div></div>

{% elif page == 'psscan' %}
<div class="topbar">
  <div><div class="tb-title"><i class="fas fa-code" style="color:var(--amber);margin-right:8px"></i>PowerShell Analizi</div></div>
  <div class="tb-right">
    <button class="btn" onclick="go('/')"><i class="fas fa-arrow-left"></i> Geri</button>
    <button class="btn primary" onclick="runPsScan()"><i class="fas fa-search"></i> Analiz Et</button>
  </div>
</div>
<div style="display:grid;grid-template-columns:300px 1fr;gap:14px">
  <div>
    <div class="scan-config">
      <div class="scan-config-head"><h3><i class="fas fa-sliders"></i> Ayarlar</h3></div>
      <div class="scan-config-body">
        <div class="form-group"><label>KAYNAK</label>
          <select class="inp" id="psSrc">
            <option value="eventlog">Windows Olay Günlüğü</option>
            <option value="logfiles">./telemetery/logs/</option>
            <option value="both" selected>Her İkisi</option>
          </select>
        </div>
        <div class="form-group"><label>KAYIT SAYISI</label>
          <input type="number" class="inp" id="psCnt" value="500" min="50" max="5000"></div>
        <button class="btn primary" style="width:100%;justify-content:center" onclick="runPsScan()">
          <i class="fas fa-play"></i> Analizi Başlat</button>
      </div>
    </div>
  </div>
  <div>
    <div class="sh"><h3><i class="fas fa-triangle-exclamation" style="color:var(--red)"></i> Tespit Sonuçları</h3></div>
    <div id="psResults"><div class="empty"><i class="fas fa-code"></i><h4>Analiz bekleniyor</h4></div></div>
  </div>
</div>
{% endif %}

</main>

<script>
// ── navigation ─────────────────────────────────────────────────────────────
function go(u){location.href=u}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmt(s){const m=Math.floor(s/60);return String(m).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0')}

// ── active scan state ──────────────────────────────────────────────────────
let job=null, timer=null, started=0, estDur=60;

function startScan(action, ui){
  if(job){alert('Zaten bir tarama çalışıyor.');return;}
  const btn=document.getElementById('btn-'+ui);
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Çalışıyor...';}

  // Extra args for network scan
  let extra={};
  if(ui==='network'){
    extra.min_score=document.getElementById('netMinScore')?.value||25;
    extra.deep=document.getElementById('netDeep')?.value||'';
  }
  if(ui==='yara'){
    extra.target=document.getElementById('yaraTarget')?.value||'C:\\Users';
  }

  fetch('/api/run/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(extra)})
    .then(r=>r.json()).then(d=>{
      if(d.success){
        job=d.job_id; started=Date.now(); estDur=d.estimated||60;
        showUI(ui);
        timer=setInterval(()=>poll(d.job_id,ui),1000);
      } else {
        if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-play"></i> Başlat';}
        alert('Hata: '+(d.error||'?'));
      }
    }).catch(e=>{if(btn){btn.disabled=false;}alert('Bağlantı hatası: '+e)});
}

function showUI(k){
  setBadge(k,'running','Çalışıyor');
  show('quick-anim','quick'===k);
  show('full-anim','full'===k);
  show('net-anim','network'===k);
  ['times','prog','log'].forEach(s=>{const el=document.getElementById(k+'-'+s);if(el)el.style.display='block';});
  if(k==='full'){show('full-phase',true);}
  if(k==='network'){initNetAnim();}
  if(k==='yara'){document.getElementById('yara-results').innerHTML='';}
  if(k==='network'){document.getElementById('network-results').innerHTML='';}
}

function show(id,vis){const el=document.getElementById(id);if(el)el.style.display=vis?'block':'none';}

function setBadge(k,state,txt){
  const el=document.getElementById(k+'-badge');if(!el)return;
  el.className='badge '+state;
  const ico=state==='running'?'<i class="fas fa-circle-notch fa-spin"></i>':'<i class="fas fa-circle"></i>';
  el.innerHTML=ico+' '+txt;
}

function poll(jobId,ui){
  const elapsed=(Date.now()-started)/1000;
  const remain=Math.max(0,estDur-elapsed);
  const pct=Math.min(97,Math.round((elapsed/estDur)*100));
  setPct(ui,pct); setTimes(ui,elapsed,remain);

  fetch('/api/status/'+jobId).then(r=>r.json()).then(j=>{
    if(j.msg)setMsg(ui,j.msg);
    if(j.log_tail)j.log_tail.forEach(l=>appendLog(ui,l));
    if(ui==='yara'&&j.current_rule){const el=document.getElementById('y-rule');if(el)el.textContent=j.current_rule;}
    if(ui==='network'&&j.conn_count){const el=document.getElementById('n-conns');if(el)el.textContent=j.conn_count;}
    if(ui==='full'){
      const phases=['Hash taraması...','Static analiz...','Bellek taraması...','Ağ kontrolü...','Davranış analizi...','Rapor oluşturuluyor...'];
      const idx=Math.min(Math.floor((elapsed/estDur)*phases.length),phases.length-1);
      const el=document.getElementById('full-phase');if(el)el.textContent='▶ '+phases[idx];
    }

    if(!j.running){
      clearInterval(timer);timer=null;job=null;
      setPct(ui,100);
      setBadge(ui,j.exit_code===0?'done':'error',j.exit_code===0?'Tamamlandı':'Hata');
      show(ui+'-anim',false);
      show('full-phase',false);
      show('net-anim',false);
      const btn=document.getElementById('btn-'+ui);
      if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-play"></i> Başlat';}
      if(ui==='network')fetchNetResults();
      if(ui==='yara')fetchYaraResults();
      if(ui==='quick'||ui==='full')fetchBehaviorResults(ui);
    }
  }).catch(e=>console.error(e));
}

function setPct(k,p){
  const f=document.getElementById(k+'-fill'),t=document.getElementById(k+'-pct'),b=document.getElementById(k[0]+'-pct-box')||(k==='network'?document.getElementById('n-conns'):null);
  if(f)f.style.width=p+'%';if(t)t.textContent=p+'%';
  const pb=document.getElementById(k[0]+'-pct-box');if(pb&&k!=='network')pb.textContent=p+'%';
}
function setMsg(k,m){const el=document.getElementById(k+'-msg');if(el)el.textContent=m;}
function setTimes(k,el,rm){
  const pfx={quick:'q',full:'f',yara:'y',network:'n'}[k];
  const e=document.getElementById(pfx+'-elapsed'),r=document.getElementById(pfx+'-remain');
  if(e)e.textContent=fmt(el);if(r)r.textContent=rm>0?fmt(rm):'00:00';
}
function appendLog(k,line){
  const el=document.getElementById(k+'-log');if(!el)return;
  const cls=line.match(/error|hata|fail/i)?'le':line.match(/warn|uyar/i)?'lw':line.match(/\[i\]|info/i)?'li':'';
  el.innerHTML+=`<span class="${cls}">${esc(line)}</span>\n`;
  el.scrollTop=el.scrollHeight;
}

// ── YARA rule selection ────────────────────────────────────────────────────
let selRules=[];
function toggleYara(el,r){
  const i=selRules.indexOf(r);
  if(i>=0){selRules.splice(i,1);el.classList.remove('sel');el.querySelector('.tag').style.display='none';}
  else{selRules.push(r);el.classList.add('sel');el.querySelector('.tag').style.display='inline-block';}
  document.getElementById('yaraCount').textContent=selRules.length;
}

// ── Result renderers ───────────────────────────────────────────────────────
function fetchNetResults(){
  fetch('/api/network_results').then(r=>r.json()).then(d=>{
    const c=document.getElementById('network-results');if(!c)return;
    if(!d.findings||!d.findings.length){
      c.innerHTML='<div class="empty"><i class="fas fa-shield-check"></i><h4>C2/Şüpheli Bağlantı Bulunamadı</h4></div>';return;
    }
    c.innerHTML=`<div class="sh"><h3><i class="fas fa-skull-crossbones" style="color:var(--red)"></i> ${d.findings.length} Bulgu  <span style="font-size:.7rem;color:var(--muted)">Detaylar için Ağ Sonuçları sayfasına gidin</span></h3></div>`;
    d.findings.slice(0,5).forEach(f=>{
      const sev=(f.risk||{}).severity||'?';
      const cls={Critical:'critical',High:'high',Medium:'medium'}[sev]||'';
      c.innerHTML+=`<div class="result-card ${cls}">
        <div class="result-card-head">
          <span class="result-title">${esc((f.process||{}).name||'?')} (PID ${esc(String((f.process||{}).pid||'?'))})</span>
          <span class="tag ${sev==='Critical'?'':sev==='High'?'a':'b'}">${sev}</span>
        </div>
        <div class="result-meta">${esc((f.network||{}).remote_ip||'')}:${esc(String((f.network||{}).remote_port||''))}  ·  Skor: ${esc(String((f.risk||{}).score||'?'))}</div>
        <div class="result-meta" style="color:var(--muted)">${esc((f.risk||{}).rule_summary||'')}</div>
      </div>`;
    });
    if(d.findings.length>5)c.innerHTML+=`<div style="text-align:center;padding:8px"><button class="btn sm" onclick="go('/results/network')">Tümünü Gör (${d.findings.length})</button></div>`;
  });
}

function fetchYaraResults(){
  fetch('/api/yara_results').then(r=>r.json()).then(d=>{
    const c=document.getElementById('yara-results');if(!c)return;
    if(!d.matches||!d.matches.length){
      c.innerHTML='<div class="empty"><i class="fas fa-shield-check"></i><h4>Eşleşme Bulunamadı</h4><p>Tüm tarama temiz çıktı.</p></div>';return;
    }
    c.innerHTML=`<div class="sh"><h3><i class="fas fa-bug" style="color:var(--red)"></i> ${d.matches.length} Eşleşme Bulundu</h3></div>`;
    d.matches.forEach(m=>{
      c.innerHTML+=`<div class="result-card confirmed">
        <div class="result-card-head">
          <span class="result-title" style="color:var(--red)">${esc(m.RuleName||'?')}</span>
          <span class="tag">Kural Eşleşti</span>
        </div>
        <div class="result-meta">${esc(m.FileName||m.FilePath||'?')}</div>
        <div class="result-meta" style="color:var(--amber)">${esc(m.YarFile||'')}  ·  SHA256: ${esc((m.SHA256||'').substring(0,16))}...</div>
      </div>`;
    });
  });
}

function fetchBehaviorResults(ui){
  fetch('/api/behavior_results').then(r=>r.json()).then(d=>{
    const c=document.getElementById(ui+'-results');if(!c||!d.findings||!d.findings.length)return;
    c.innerHTML=`<div class="sh"><h3><i class="fas fa-triangle-exclamation" style="color:var(--amber)"></i> ${d.findings.length} Davranış Bulgusu</h3></div>`;
    d.findings.slice(0,8).forEach(f=>{
      const risk=f.Risk||'?';
      const cls={Confirmed:'confirmed','Potential-Stealer':'critical',High:'high',Medium:'medium'}[risk]||'';
      c.innerHTML+=`<div class="result-card ${cls}">
        <div class="result-card-head">
          <span class="result-title">${esc(f.ProcessName||f.FileName||f.Path||'?')}</span>
          <span class="tag ${risk==='Confirmed'||risk==='Potential-Stealer'?'':risk==='High'?'a':'b'}">${esc(risk)}</span>
        </div>
        <div class="result-meta">Modül: ${esc(f.Module||'?')}  ·  Aile: ${esc(f.MatchFamily||f.DominantFamily||f.Stealer||'?')}</div>
        ${f.TriggeredRules?`<div class="result-meta" style="color:var(--amber)">${esc(f.TriggeredRules)}</div>`:''}
      </div>`;
    });
  });
}

// ── Network SVG animation ──────────────────────────────────────────────────
function initNetAnim(){
  const svg=document.getElementById('netSvg');if(!svg)return;svg.innerHTML='';
  const cx=300,cy=80,nodes=[{x:cx,y:cy,r:7,c:'#00e5c3'}];
  for(let i=0;i<7;i++){const a=(i/7)*Math.PI*2;nodes.push({x:cx+Math.cos(a)*160,y:cy+Math.sin(a)*55,r:4,c:Math.random()>.65?'#ff4455':'#4da6ff'});}
  nodes.slice(1).forEach(n=>{const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',cx);l.setAttribute('y1',cy);l.setAttribute('x2',n.x);l.setAttribute('y2',n.y);l.setAttribute('stroke','rgba(255,255,255,.07)');l.setAttribute('stroke-width','1');svg.appendChild(l);});
  nodes.forEach(n=>{const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',n.r);c.setAttribute('fill',n.c);c.setAttribute('opacity','.85');svg.appendChild(c);});
  setInterval(()=>{
    const t=nodes[1+Math.floor(Math.random()*(nodes.length-1))];
    const p=document.createElementNS('http://www.w3.org/2000/svg','circle');
    p.setAttribute('cx',cx);p.setAttribute('cy',cy);p.setAttribute('r',2);p.setAttribute('fill','#00e5c3');svg.appendChild(p);
    let pr=0;const a=setInterval(()=>{pr+=0.06;p.setAttribute('cx',cx+(t.x-cx)*pr);p.setAttribute('cy',cy+(t.y-cy)*pr);p.setAttribute('opacity',1-pr);if(pr>=1){clearInterval(a);try{svg.removeChild(p);}catch(e){}}},16);
  },400);
}

// ── Windows logs ───────────────────────────────────────────────────────────
let wlogs=[];
function loadWinLogs(){
  const src=document.getElementById('wlogSrc').value;
  document.getElementById('wlogContainer').innerHTML='<div class="empty"><i class="fas fa-spinner fa-spin"></i><h4>Yükleniyor...</h4></div>';
  fetch('/api/winlogs?source='+encodeURIComponent(src)).then(r=>r.json()).then(d=>{
    wlogs=d.logs||[];renderWinLogs(wlogs);
  }).catch(()=>{document.getElementById('wlogContainer').innerHTML='<div class="empty"><i class="fas fa-exclamation-triangle" style="color:var(--red)"></i><h4>Yüklenemedi</h4></div>';});
}
function filterWinLogs(){const f=document.getElementById('wlogLvl').value;renderWinLogs(f==='all'?wlogs:wlogs.filter(l=>l.level===f));}
function renderWinLogs(logs){
  const c=document.getElementById('wlogContainer');
  if(!logs.length){c.innerHTML='<div class="empty"><i class="fas fa-check"></i><h4>Kayıt Bulunamadı</h4></div>';return;}
  c.innerHTML=logs.slice(0,100).map(l=>`
    <div class="wlog-item ${l.level}">
      <div class="wlog-head"><span class="tag ${l.level==='crit'?'':l.level==='warn'?'a':'b'}">${l.level.toUpperCase()}</span>
        <span style="font-size:.7rem;color:var(--muted);font-family:'JetBrains Mono',monospace">Olay ${esc(String(l.event_id))}  ·  ${esc(l.source)}</span>
        <span class="wlog-time">${esc(l.time)}</span></div>
      <div class="wlog-msg">${esc(l.message)}</div>
    </div>`).join('');
}

// ── PS analysis ────────────────────────────────────────────────────────────
function runPsScan(){
  const src=document.getElementById('psSrc').value,cnt=document.getElementById('psCnt').value;
  document.getElementById('psResults').innerHTML='<div class="empty"><i class="fas fa-spinner fa-spin"></i><h4>Analiz ediliyor...</h4></div>';
  fetch('/api/ps_analyze?source='+src+'&count='+cnt).then(r=>r.json()).then(d=>{
    const c=document.getElementById('psResults');
    if(!d.matches||!d.matches.length){c.innerHTML='<div class="empty"><i class="fas fa-shield-check"></i><h4>Kötü Amaçlı Kalıp Bulunamadı</h4></div>';return;}
    c.innerHTML=`<div class="sh"><h3><i class="fas fa-triangle-exclamation" style="color:var(--red)"></i> ${d.matches.length} Şüpheli Kalıp (${d.total_scanned||0} satır tarandı)</h3></div>`;
    d.matches.forEach(m=>{c.innerHTML+=`<div class="ps-match"><div class="ps-match-pat"><i class="fas fa-exclamation-triangle"></i> ${esc(m.pattern)}</div><div class="ps-match-ctx">${esc(m.context)}</div><div style="font-size:.65rem;color:var(--muted);margin-top:2px;font-family:'JetBrains Mono',monospace">Kaynak: ${esc(m.source)}  ·  Satır ${m.line}</div></div>`;});
  });
}

// ── Log viewer ─────────────────────────────────────────────────────────────
function viewLog(path){
  fetch('/api/log_content?path='+encodeURIComponent(path)).then(r=>r.json()).then(j=>{
    if(j.error){alert(j.error);return;}
    document.getElementById('logPreviewName').textContent=path.split(/[\\/]/).pop();
    const c=document.getElementById('logContent');
    if(path.endsWith('.json')){try{c.textContent=JSON.stringify(JSON.parse(j.content),null,2);}catch{c.textContent=j.content||'(boş)';}}
    else{c.textContent=j.content||'(boş)';}
    document.getElementById('logPreview').style.display='block';
    document.getElementById('logPreview').scrollIntoView({behavior:'smooth'});
  });
}
</script>
</body>
</html>
"""

# ═══════════════════════════════════════════════════════════════════════════════
#  RENDER HELPER
# ═══════════════════════════════════════════════════════════════════════════════
def render(page, **kw):
    ctx = dict(
        page=page,
        stats=get_stats(),
        yara_rules=load_yara_rules(),
        all_logs=load_all_logs(),
        behavior_findings=load_behavior_findings(),
        net_files=load_network_findings(),
        yara_matches=load_yara_findings(),
        db_date=datetime.now().strftime("%d.%m.%Y"),
        now=datetime.now().strftime("%d.%m.%Y %H:%M:%S"),
        malicious_patterns=list(enumerate(MALICIOUS_PS_PATTERNS)),
    )
    ctx.update(kw)
    return render_template_string(HTML, **ctx)

# ═══════════════════════════════════════════════════════════════════════════════
#  PAGE ROUTES
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

@app.route("/scan/full")
def scan_full(): return render("full")

@app.route("/scan/yara")
def scan_yara(): return render("yara")

@app.route("/scan/network")
def scan_network(): return render("network")

@app.route("/results/network")
def results_network(): return render("network_results")

@app.route("/results/yara")
def results_yara(): return render("yara_results")

@app.route("/static/<path:fn>")
def static_files(fn): return send_from_directory("static", fn)

# ═══════════════════════════════════════════════════════════════════════════════
#  API: RUN SCAN
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/run/<action>", methods=["POST"])
def api_run(action: str):
    script_name = ALLOWED_SCRIPTS.get(action)
    if not script_name:
        return jsonify(success=False, error="Geçersiz aksiyon")

    script_path = os.path.abspath(os.path.join(BASE_DIR, script_name))
    if not os.path.exists(script_path):
        return jsonify(success=False, error=f"Script bulunamadı: {script_name}")

    body = request.get_json(force=True, silent=True) or {}

    # Build PowerShell arguments matching each script's actual params
    ps_args = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script_path]

    if action == "scan_network":
        min_score = body.get("min_score", 25)
        deep = body.get("deep", "")
        ps_args += ["-OutputDir", TELEMETRY_PATH, "-MinScore", str(min_score)]
        if deep == "-DeepEntropy":
            ps_args.append("-DeepEntropy")

    elif action == "scan_yara":
        target = body.get("target", "C:\\Users")
        ps_args.append(target)   # YaraScan.ps1 param($TargetPath)

    elif action in ("quick_scan", "full_scan"):
        threshold = body.get("threshold", 0.3)
        # QuickScan / FullScan don't have mandatory params — they self-configure

    job_id    = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file  = os.path.join(LOGS_PATH, f"{action}_{timestamp}_{job_id[:8]}.log")

    try:
        with open(log_file, "wb") as lf:
            proc = subprocess.Popen(ps_args, stdout=lf, stderr=subprocess.STDOUT, shell=False)
        processes[job_id] = dict(proc=proc, script=script_name, start=time.time(),
                                  log=log_file, scan_type=action)
        return jsonify(success=True, job_id=job_id, script=script_name,
                       estimated=SCAN_DURATIONS.get(action, 60))
    except Exception as e:
        return jsonify(success=False, error=str(e))

# ═══════════════════════════════════════════════════════════════════════════════
#  API: JOB STATUS
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/status/<job_id>")
def api_status(job_id: str):
    info = processes.get(job_id)
    if not info:
        return jsonify(running=False, msg="Tamamlandı", pct=100, exit_code=0)

    proc    = info["proc"]
    ret     = proc.poll()
    running = ret is None
    elapsed = time.time() - info["start"]
    msg     = f"Çalışıyor — {int(elapsed)}s" if running else f"Tamamlandı (çıkış: {ret})"

    log_tail = []
    try:
        with open(info["log"], "r", encoding="utf-8", errors="replace") as f:
            log_tail = [l.rstrip() for l in f.readlines()[-10:]]
    except Exception:
        pass

    # Try to extract YARA current rule from log
    current_rule = None
    if info["scan_type"] == "scan_yara" and log_tail:
        for line in reversed(log_tail):
            m = re.search(r"\[YARA\]\s+.*?(\w+\.yar)", line, re.IGNORECASE)
            if m:
                current_rule = m.group(1)
                break

    # Try to extract connection count from network log
    conn_count = None
    if info["scan_type"] == "scan_network" and log_tail:
        for line in reversed(log_tail):
            m = re.search(r"(\d+)\s+bağlantı", line)
            if m:
                conn_count = m.group(1)
                break

    if not running:
        try: del processes[job_id]
        except KeyError: pass

    return jsonify(running=running, msg=msg, exit_code=ret,
                   log_tail=log_tail, current_rule=current_rule, conn_count=conn_count)

# ═══════════════════════════════════════════════════════════════════════════════
#  API: RESULTS
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/network_results")
def api_network_results():
    """network(2).ps1 JSON çıktısını okur"""
    files = sorted(glob.glob(os.path.join(TELEMETRY_PATH, "network_*.json")), reverse=True)
    if not files:
        return jsonify(findings=[], total_connections=0, scan_time="—")
    try:
        with open(files[0], encoding="utf-8") as f:
            data = json.load(f)
        findings = data.get("findings", [])
        meta     = data.get("meta", {})
        summary  = data.get("summary", {})
        return jsonify(
            findings=findings,
            total_connections=meta.get("total_connections", 0),
            scan_time=meta.get("generated_at", "—"),
            summary=summary,
        )
    except Exception as e:
        return jsonify(findings=[], error=str(e))

@app.route("/api/yara_results")
def api_yara_results():
    """YaraScan.ps1 ruleout JSON çıktısını okur"""
    return jsonify(matches=load_yara_findings())

@app.route("/api/behavior_results")
def api_behavior_results():
    """QuickScan / FullScan APPDATA Log JSON çıktısını okur"""
    return jsonify(findings=load_behavior_findings())

# ═══════════════════════════════════════════════════════════════════════════════
#  API: WINDOWS EVENT LOGS
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/winlogs")
def api_winlogs():
    source = request.args.get("source", "System")
    allowed = ["System","Security","Application","Microsoft-Windows-PowerShell/Operational"]
    if source not in allowed:
        return jsonify(logs=[], error="Geçersiz kaynak")

    ps_cmd = f"""
Get-WinEvent -LogName '{source}' -MaxEvents 150 -ErrorAction SilentlyContinue |
ForEach-Object {{
    $lv = switch($_.Level){{1{{'crit'}}; 2{{'crit'}}; 3{{'warn'}}; default{{'info'}}}}
    [PSCustomObject]@{{
        event_id = $_.Id
        time     = $_.TimeCreated.ToString('dd.MM.yyyy HH:mm:ss')
        level    = $lv
        source   = $_.ProviderName
        message  = ($_.Message -replace '\\r?\\n',' ').Substring(0,[Math]::Min(200,($_.Message).Length))
    }}
}} | ConvertTo-Json -Depth 2
""".strip()
    try:
        r = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_cmd],
            capture_output=True, text=True, timeout=20
        )
        raw = r.stdout.strip()
        if not raw: return jsonify(logs=[], error="Çıktı boş")
        data = json.loads(raw)
        if isinstance(data, dict): data = [data]
        return jsonify(logs=[{
            "event_id": i.get("event_id",""), "time": i.get("time",""),
            "level": i.get("level","info"), "source": i.get("source",""),
            "message": i.get("message","")
        } for i in data])
    except subprocess.TimeoutExpired:
        return jsonify(logs=[], error="Zaman aşımı")
    except Exception as e:
        return jsonify(logs=[], error=str(e))

# ═══════════════════════════════════════════════════════════════════════════════
#  API: PS LOG ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/ps_analyze")
def api_ps_analyze():
    source = request.args.get("source", "both")
    count  = min(int(request.args.get("count", 500)), 5000)
    lines  = []

    if source in ("logfiles","both"):
        for fp in glob.glob(os.path.join(LOGS_PATH, "*.log")):
            try:
                with open(fp, "r", encoding="utf-8", errors="replace") as f:
                    for i, line in enumerate(f):
                        lines.append({"text": line.strip(), "source": os.path.basename(fp), "line": i+1})
            except Exception:
                pass

    if source in ("eventlog","both"):
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

    matches = []
    for entry in lines:
        for pat in MALICIOUS_PS_PATTERNS:
            if re.search(pat, entry["text"], re.IGNORECASE):
                matches.append({"pattern": pat, "context": entry["text"][:200],
                                 "source": entry["source"], "line": entry["line"]})
    return jsonify(matches=matches, total_scanned=len(lines))

# ═══════════════════════════════════════════════════════════════════════════════
#  API: LOG CONTENT
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/log_content")
def api_log_content():
    path = os.path.abspath(request.args.get("path", ""))
    # Güvenli yol kontrolü — sadece bilinen çıktı klasörlerinden
    allowed_bases = [
        os.path.abspath(LOGS_PATH),
        os.path.abspath(AS_LOG_DIR),
        os.path.abspath(YARA_OUT_DIR),
        os.path.abspath(TELEMETRY_PATH),
    ]
    if not any(path.startswith(b) for b in allowed_bases):
        return jsonify(error="Geçersiz yol"), 400
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(100 * 1024)
        return jsonify(content=content)
    except Exception as e:
        return jsonify(error=str(e)), 500

# ═══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000, use_reloader=False)
